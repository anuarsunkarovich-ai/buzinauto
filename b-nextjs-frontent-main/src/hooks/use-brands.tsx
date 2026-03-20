import React from 'react'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

type Brand = {
  brand: string
  brandName: string
}

type FastApiBrandResponse = {
  results?: Array<{
    id?: string
    name?: string
  }>
  brands?: Array<{
    id?: string
    name?: string
  }>
}

const cache = new Map<string, { data: Brand[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: Brand[]) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const filterBrands = (items: Brand[], query: string) => {
  if (!query) return items
  const normalized = query.trim().toLowerCase()
  return items.filter(
    (item) =>
      item.brand.toLowerCase().includes(normalized) ||
      item.brandName.toLowerCase().includes(normalized),
  )
}

export const useBrands = (
  searchQuery: string = '',
  saleCountry: string = '',
  enabled: boolean = true,
) => {
  const [allBrands, setAllBrands] = React.useState<Brand[]>([])
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasNext, setHasNext] = React.useState(false)
  const [page, setPage] = React.useState(1)

  const loadBrands = React.useCallback(
    async (query: string = '', country: string = '', pageNum: number = 1) => {
      if (!enabled) return

      const cacheKey = `brands-${country}-${pageNum}`
      const cached = getCachedData(cacheKey)
      if (cached) {
        setAllBrands(cached)
        setBrands(filterBrands(cached, query))
        setHasNext(false)
        return
      }

      setLoading(true)
      try {
        const baseUrl = getRuntimeBackendApiUrl()
        if (!baseUrl) {
          throw new Error('Backend API URL is not configured')
        }

        const url = `${baseUrl}/auction/filters`
        const response = await fetch(url, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        })
        const data = (await response.json()) as FastApiBrandResponse
        const results = (data.results || data.brands || []).map((item) => ({
          brand: String(item.id || item.name || ''),
          brandName: String(item.name || item.id || ''),
        }))

        if (response.ok) {
          setCachedData(cacheKey, results)
          setAllBrands(results)
          setBrands(filterBrands(results, query))
          setHasNext(false)
          setPage(pageNum)
        }
      } finally {
        setLoading(false)
      }
    },
    [enabled],
  )

  React.useEffect(() => {
    loadBrands(searchQuery, saleCountry, 1)
  }, [searchQuery, saleCountry, loadBrands])

  React.useEffect(() => {
    setBrands(filterBrands(allBrands, searchQuery))
  }, [allBrands, searchQuery])

  return { brands, loading, hasNext, loadMore: () => undefined }
}
