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

const normalizeText = (value: unknown) => String(value || '').trim()
const normalizeIdentifier = (value: unknown) =>
  normalizeText(value).replace(/\\/g, '').replace(/^['"]+|['"]+$/g, '')

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
    if (!item || typeof item !== 'object') {
      continue
    }

    const entry = item as UnknownRecord
    const body = normalizeText(entry.body)
    const modelCode = normalizeIdentifier(entry.model_code)
    if (!body) {
      continue
    }

    const key = toUrlSlug(body)
    const existing = grouped.get(key)
    const label = [modelCode, body].filter(Boolean).join(' ').trim() || body

    if (existing) {
      existing.count = (existing.count || 0) + 1
      continue
    }

    grouped.set(key, {
      body,
      label,
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

const collapseFamilyModelOptions = (items: CatalogModelOption[]) => {
  const normalizedItems = items.map((item, index) => ({
    item,
    index,
    familyName: normalizeText(item.modelDisplay).replace(/\s+/g, ' ').toUpperCase(),
  }))

  const kept = normalizedItems.filter((entry) => {
    if (!entry.familyName) {
      return true
    }

    return !normalizedItems.some((candidate) => {
      if (candidate.index === entry.index) {
        return false
      }

      if (candidate.item.brand !== entry.item.brand || !candidate.familyName) {
        return false
      }

      return (
        candidate.familyName.length < entry.familyName.length &&
        entry.familyName.startsWith(`${candidate.familyName} `)
      )
    })
  })

  return kept.map((entry) => entry.item)
}

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

  return collapseFamilyModelOptions(dedupedModels)
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
  try {
    const payload = await fetchBackendJson<UnknownRecord>('auction/filters')
    const brands = normalizeBrandResponse(payload)
    if (brands.length > 0) {
      return brands
    }
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

  return []
}

export const fetchCatalogModels = async (brand: string, country?: string) => {
  if (!brand) {
    return []
  }

  try {
    const payload = await fetchBackendJson<UnknownRecord>('auction/filters', {
      query: {
        brand_id: brand,
      },
    })
    const models = normalizeModelResponse(payload, brand)
    if (models.length > 0) {
      return models
    }
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

  return []
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
    const filtersPayload = await fetchBackendJson<UnknownRecord>('auction/filters', {
      query: {
        brand_id: brand,
        model_id: model,
      },
    })
    const directBodies = normalizeBodyResponse(filtersPayload)
    if (directBodies.length > 0) {
      return directBodies
    }
  } catch (error) {
    console.error('fetchCatalogBodies backend filters error:', error)
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
