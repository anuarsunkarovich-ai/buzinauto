import React from 'react'
import { CatalogBrandOption, fetchCatalogBrands } from '@/lib/services/catalog-filters.service'

const cache = new Map<string, { data: CatalogBrandOption[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: CatalogBrandOption[]) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const filterBrands = (items: CatalogBrandOption[], query: string) => {
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
  const [allBrands, setAllBrands] = React.useState<CatalogBrandOption[]>([])
  const [brands, setBrands] = React.useState<CatalogBrandOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasNext, setHasNext] = React.useState(false)

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
        const results = await fetchCatalogBrands(country)
        setCachedData(cacheKey, results)
        setAllBrands(results)
        setBrands(filterBrands(results, query))
        setHasNext(false)
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
