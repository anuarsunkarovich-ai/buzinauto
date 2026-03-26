import { Country } from '@/constants/country'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'
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
  count?: number
}

type UnknownRecord = Record<string, unknown>

const LOCAL_PAGE_LIMIT = 5000

const normalizeText = (value: unknown) => String(value || '').trim()

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
  const brand = normalizeText(record.brand ?? record.id ?? record.name)
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
  const brand = normalizeText(record.brand ?? fallbackBrand)
  const model = normalizeText(record.model ?? record.id ?? record.name)
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
  return {
    body,
    count: Number.isFinite(count) && count > 0 ? count : undefined,
  }
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

  return dedupeBy(
    source
      .map((item) => normalizeModelEntry(item, fallbackBrand))
      .filter((item): item is CatalogModelOption => item !== null)
      .filter((item) => item.model !== '-1'),
    (item) => `${toUrlSlug(item.brand)}::${toUrlSlug(item.modelSlug)}`,
  )
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

  const baseUrl = getRuntimeBackendApiUrl()
  if (!baseUrl) {
    return []
  }

  const payload = await fetchJson(`${baseUrl.replace(/\/$/, '')}/auction/filters`)
  return normalizeBrandResponse(payload)
}

export const fetchCatalogModels = async (brand: string, country?: string) => {
  if (!brand) {
    return []
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

  const baseUrl = getRuntimeBackendApiUrl()
  if (!baseUrl) {
    return []
  }

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/auction/filters`)
  url.searchParams.set('brand_id', brand)
  const payload = await fetchJson(url.toString())
  return normalizeModelResponse(payload, brand)
}

export const fetchCatalogBodies = async (
  brand: string,
  model: string,
  country?: string,
) => {
  if (!brand || !model) {
    return []
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

  const baseUrl = getRuntimeBackendApiUrl()
  if (!baseUrl) {
    return []
  }

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/auction/filters`)
  url.searchParams.set('brand_id', brand)
  url.searchParams.set('model_id', model)
  const payload = await fetchJson(url.toString())
  return normalizeBodyResponse(payload)
}
