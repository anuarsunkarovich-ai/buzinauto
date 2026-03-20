import React from 'react'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

interface Model {
  brand: string
  model: string
  modelDisplay: string
  modelSlug: string
}

interface FastApiModelResponse {
  results?: Array<{
    id?: string
    name?: string
  }>
  models?: Array<{
    id?: string
    name?: string
  }>
}

const cache = new Map<string, { data: Model[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: Model[]) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const filterModels = (items: Model[], query: string) => {
  if (!query) return items
  const normalized = query.trim().toLowerCase()
  return items.filter(
    (item) =>
      item.model.toLowerCase().includes(normalized) ||
      item.modelDisplay.toLowerCase().includes(normalized) ||
      item.modelSlug.toLowerCase().includes(normalized),
  )
}

export const useModels = (
  selectedBrand: string = '',
  searchQuery: string = '',
  saleCountry: string = '',
  enabled: boolean = true,
) => {
  const [allModels, setAllModels] = React.useState<Model[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasNext, setHasNext] = React.useState(false)
  const [page, setPage] = React.useState(1)

  const loadModels = React.useCallback(
    async (brand: string, query: string = '', country: string = '', pageNum: number = 1) => {
      if (!enabled || !brand) {
        setAllModels([])
        setModels([])
        setHasNext(false)
        return
      }

      const cacheKey = `models-${brand}-${country}-${pageNum}`
      const cached = getCachedData(cacheKey)
      if (cached) {
        setAllModels(cached)
        setModels(filterModels(cached, query))
        setHasNext(false)
        return
      }

      setLoading(true)
      try {
        const baseUrl = getRuntimeBackendApiUrl()
        if (!baseUrl) {
          throw new Error('Backend API URL is not configured')
        }

        const url = new URL(`${baseUrl}/auction/filters`)
        url.searchParams.set('brand_id', brand)
        const response = await fetch(url.toString(), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        })
        const data = (await response.json()) as FastApiModelResponse
        const results = (data.results || data.models || []).map((item) => ({
          brand,
          model: String(item.id || item.name || ''),
          modelDisplay: String(item.name || item.id || ''),
          modelSlug: String(item.name || item.id || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-'),
        }))

        if (response.ok) {
          setCachedData(cacheKey, results)
          setAllModels(results)
          setModels(filterModels(results, query))
          setHasNext(false)
          setPage(pageNum)
        }
      } finally {
        setLoading(false)
      }
    },
    [enabled],
  )

  const loadMore = React.useCallback(() => undefined, [])

  React.useEffect(() => {
    setPage(1)
    loadModels(selectedBrand, searchQuery, saleCountry, 1)
  }, [selectedBrand, searchQuery, saleCountry, loadModels])

  React.useEffect(() => {
    setModels(filterModels(allModels, searchQuery))
  }, [allModels, searchQuery])

  return { models, loading, hasNext, loadMore }
}
