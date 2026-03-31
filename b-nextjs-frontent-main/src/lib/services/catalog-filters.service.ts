import { Country } from '@/constants/country'
import { fetchBackendJson } from '@/lib/api/backend-fetch'
import { toUrlSlug } from '@/lib/transform'

export type CatalogBrandOption = {
  brand: string
  brandName: string
}

export type CatalogModelOption = {
  brand: string
  model: string
  modelDisplay: string
  modelSlug: string
}

export type CatalogBodyOption = {
  body: string
  label?: string
  count?: number
}

type UnknownRecord = Record<string, unknown>

const LOCAL_PAGE_LIMIT = 5000
const ALEADO_FALLBACK_BRANDS = new Set(['toyota', 'honda', 'nissan', 'mazda', 'subaru'])
const ALEADO_FALLBACK_MODELS = new Set(['n-box', 'fit', 'stepwgn'])

const normalizeText = (value: unknown) => String(value || '').trim()
const normalizeIdentifier = (value: unknown) =>
  normalizeText(value).replace(/\\/g, '').replace(/^['"]+|['"]+$/g, '')
const normalizeToken = (value: unknown) =>
  normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')

const BODY_STYLE_KEYWORDS = [
  'SEDAN',
  'HATCHBACK',
  'WAGON',
  'COUPE',
  'SUV',
  'VAN',
  'MINIVAN',
  'CROSSOVER',
  'LIFTBACK',
  'FASTBACK',
  'ROADSTER',
  'PICKUP',
  'CABRIO',
  'CABRIOLET',
  'ESTATE',
  'HARDTOP',
]

const TRIM_KEYWORDS = [
  'SENSING',
  'PACKAGE',
  'PKG',
  'LIMITED',
  'EDITION',
  'STANDARD',
  'PREMIUM',
  'LUXURY',
  'SPORT',
  'STYLE',
  'BLACK',
  'WHITE',
  'EURO',
  'TYPE',
  'HEV',
  'EHEV',
]

const looksLikeModelCode = (value: string) => {
  const normalized = normalizeToken(value)
  if (!normalized) {
    return false
  }

  return /[0-9]/.test(normalized) && /[A-Z]/.test(normalized)
}

const looksLikeBodyStyle = (value: string) => {
  const upper = normalizeText(value).toUpperCase()
  if (!upper) {
    return false
  }

  if (TRIM_KEYWORDS.some((keyword) => upper.includes(keyword))) {
    return false
  }

  return BODY_STYLE_KEYWORDS.some((keyword) => upper.includes(keyword))
}

const normalizeBodyOptionFromSearchResult = (item: unknown): CatalogBodyOption | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as UnknownRecord
  const modelCode = normalizeIdentifier(record.model_code)
  const bodyText = normalizeText(record.body)

  const normalizedModelCode = normalizeToken(modelCode)
  const normalizedBodyText = normalizeToken(bodyText)

  if (looksLikeModelCode(modelCode)) {
    return {
      body: modelCode,
      label:
        looksLikeBodyStyle(bodyText) && normalizedBodyText !== normalizedModelCode
          ? `${modelCode} ${bodyText}`.trim()
          : modelCode,
    }
  }

  if (looksLikeBodyStyle(bodyText)) {
    return {
      body: bodyText,
      label: bodyText,
    }
  }

  return null
}

const normalizeCountry = (country?: string) => {
  const value = normalizeText(country).toUpperCase()
  return value === Country.CHINA || value === Country.JAPAN ? value : undefined
}

const buildLocalUrl = (pathname: string, searchParams?: URLSearchParams) => {
  const query = searchParams?.toString()
  return query ? `${pathname}?${query}` : pathname
}

const parseJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as UnknownRecord
}

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  })

  return parseJson(response)
}

const normalizeBrandEntry = (item: unknown): CatalogBrandOption | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as UnknownRecord
  const brand = normalizeIdentifier(record.brand ?? record.id ?? record.name)
  const brandName = normalizeText(record.brandName ?? record.name ?? record.brand ?? record.id)

  if (!brand || !brandName) {
    return null
  }

  return { brand, brandName }
}

const normalizeModelEntry = (item: unknown, fallbackBrand = ''): CatalogModelOption | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as UnknownRecord
  const brand = normalizeIdentifier(record.brand ?? fallbackBrand)
  const model = normalizeIdentifier(record.model ?? record.id ?? record.name)
  const modelDisplay = normalizeText(record.modelDisplay ?? record.name ?? record.model ?? record.id)
  const modelSlug = normalizeText(record.modelSlug ?? toUrlSlug(modelDisplay || model))

  if (!brand || !model || !modelDisplay || !modelSlug) {
    return null
  }

  return { brand, model, modelDisplay, modelSlug }
}

const normalizeBodyEntry = (item: unknown): CatalogBodyOption | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as UnknownRecord
  const body = normalizeText(record.body ?? record.name ?? record.id)
  if (!body || body.startsWith('---')) {
    return null
  }

  const count = Number(record.count)
  const label = normalizeText(record.label ?? record.display ?? body)
  return {
    body,
    label: label || body,
    count: Number.isFinite(count) && count > 0 ? count : undefined,
  }
}

const buildSearchFallbackBodies = (payload: unknown): CatalogBodyOption[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as UnknownRecord
  const results = Array.isArray(record.results) ? record.results : []
  const grouped = new Map<string, CatalogBodyOption>()

  for (const item of results) {
    const normalizedOption = normalizeBodyOptionFromSearchResult(item)
    if (!normalizedOption) {
      continue
    }

    const key = toUrlSlug(normalizedOption.body)
    const existing = grouped.get(key)

    if (existing) {
      existing.count = (existing.count || 0) + 1
      continue
    }

    grouped.set(key, {
      body: normalizedOption.body,
      label: normalizedOption.label || normalizedOption.body,
      count: 1,
    })
  }

  return Array.from(grouped.values()).sort((left, right) => {
    const countDiff = (right.count || 0) - (left.count || 0)
    if (countDiff !== 0) {
      return countDiff
    }

    return left.label?.localeCompare(right.label || '', 'ru') || 0
  })
}

const dedupeBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const isSuspiciousBackendBrandOptions = (items: CatalogBrandOption[]) =>
  items.length > 0 &&
  items.length <= ALEADO_FALLBACK_BRANDS.size &&
  items.every((item) => {
    const brandToken = toUrlSlug(item.brandName || item.brand)
    return ALEADO_FALLBACK_BRANDS.has(brandToken)
  })

export const isSuspiciousBackendModelOptions = (items: CatalogModelOption[]) =>
  items.length > 0 &&
  items.length <= ALEADO_FALLBACK_MODELS.size &&
  items.every((item) => {
    const modelToken = toUrlSlug(item.modelSlug || item.modelDisplay || item.model)
    return ALEADO_FALLBACK_MODELS.has(modelToken)
  })

export const normalizeBrandResponse = (payload: unknown): CatalogBrandOption[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as UnknownRecord
  const source = Array.isArray(record.brands)
    ? record.brands
    : Array.isArray(record.results)
      ? record.results
      : Array.isArray(record.data)
        ? record.data
        : []

  return dedupeBy(
    source
      .map((item) => normalizeBrandEntry(item))
      .filter((item): item is CatalogBrandOption => item !== null),
    (item) => `${toUrlSlug(item.brand)}::${toUrlSlug(item.brandName)}`,
  )
}

export const normalizeModelResponse = (
  payload: unknown,
  fallbackBrand = '',
): CatalogModelOption[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as UnknownRecord
  const source = Array.isArray(record.models)
    ? record.models
    : Array.isArray(record.results)
      ? record.results
      : Array.isArray(record.data)
        ? record.data
        : []

  const dedupedModels = dedupeBy(
    source
      .map((item) => normalizeModelEntry(item, fallbackBrand))
      .filter((item): item is CatalogModelOption => item !== null)
      .filter((item) => item.model !== '-1'),
    (item) => `${toUrlSlug(item.brand)}::${toUrlSlug(item.modelSlug)}`,
  )

  return dedupedModels
}

export const normalizeBodyResponse = (payload: unknown): CatalogBodyOption[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as UnknownRecord
  const source = Array.isArray(record.bodies)
    ? record.bodies
    : Array.isArray(record.results)
      ? record.results
      : Array.isArray(record.data)
        ? record.data
        : []

  return dedupeBy(
    source
      .map((item) => normalizeBodyEntry(item))
      .filter((item): item is CatalogBodyOption => item !== null),
    (item) => toUrlSlug(item.body),
  )
}

export const fetchCatalogBrands = async (country?: string) => {
  let backendBrands: CatalogBrandOption[] = []

  try {
    const payload = await fetchBackendJson<UnknownRecord>('auction/filters')
    const brands = normalizeBrandResponse(payload)
    if (brands.length > 0 && !isSuspiciousBackendBrandOptions(brands)) {
      return brands
    }
    backendBrands = brands
  } catch (error) {
    console.error('fetchCatalogBrands backend error:', error)
  }

  const searchParams = new URLSearchParams({
    page: '1',
    limit: String(LOCAL_PAGE_LIMIT),
  })
  const normalizedCountry = normalizeCountry(country)
  if (normalizedCountry) {
    searchParams.set('country', normalizedCountry)
  }

  try {
    const payload = await fetchJson(buildLocalUrl('/api/brands', searchParams))
    const brands = normalizeBrandResponse(payload)
    if (brands.length > 0) {
      return brands
    }
  } catch (error) {
    console.error('fetchCatalogBrands local fallback error:', error)
  }

  return backendBrands
}

export const fetchCatalogModels = async (brand: string, country?: string) => {
  if (!brand) {
    return []
  }

  let backendModels: CatalogModelOption[] = []

  try {
    const payload = await fetchBackendJson<UnknownRecord>('auction/filters', {
      query: {
        brand_id: brand,
      },
    })
    const models = normalizeModelResponse(payload, brand)
    if (models.length > 0 && !isSuspiciousBackendModelOptions(models)) {
      return models
    }
    backendModels = models
  } catch (error) {
    console.error('fetchCatalogModels backend error:', error)
  }

  const searchParams = new URLSearchParams({
    page: '1',
    limit: String(LOCAL_PAGE_LIMIT),
  })
  const normalizedCountry = normalizeCountry(country)
  if (normalizedCountry) {
    searchParams.set('country', normalizedCountry)
  }

  try {
    const payload = await fetchJson(
      buildLocalUrl(`/api/brands/${encodeURIComponent(brand)}/models`, searchParams),
    )
    const models = normalizeModelResponse(payload, brand)
    if (models.length > 0) {
      return models
    }
  } catch (error) {
    console.error('fetchCatalogModels local fallback error:', error)
  }

  return backendModels
}

export const fetchCatalogBodies = async (
  brand: string,
  model: string,
  country?: string,
) => {
  if (!brand || !model) {
    return []
  }

  try {
    const payload = await fetchBackendJson<UnknownRecord>('search', {
      query: {
        brand,
        model,
        limit: 200,
      },
      cache: 'no-store',
    })
    const bodies = buildSearchFallbackBodies(payload)
    if (bodies.length > 0) {
      return bodies
    }
  } catch (error) {
    console.error('fetchCatalogBodies backend search error:', error)
  }

  try {
    const filtersPayload = await fetchBackendJson<UnknownRecord>('auction/filters', {
      query: {
        brand_id: brand,
        model_id: model,
      },
    })
    const directBodies = normalizeBodyResponse(filtersPayload).filter(
      (item) => looksLikeModelCode(item.body) || looksLikeBodyStyle(item.body),
    )
    if (directBodies.length > 0) {
      return directBodies
    }
  } catch (error) {
    console.error('fetchCatalogBodies backend filters error:', error)
  }

  const searchParams = new URLSearchParams()
  const normalizedCountry = normalizeCountry(country)
  if (normalizedCountry) {
    searchParams.set('country', normalizedCountry)
  }

  try {
    const payload = await fetchJson(
      buildLocalUrl(
        `/api/brands/${encodeURIComponent(brand)}/models/${encodeURIComponent(model)}/bodies`,
        searchParams,
      ),
    )
    const bodies = normalizeBodyResponse(payload)
    if (bodies.length > 0) {
      return bodies
    }
  } catch (error) {
    console.error('fetchCatalogBodies local fallback error:', error)
  }

  return []
}
