import React from 'react'
import { CatalogModelOption, fetchCatalogModels } from '@/lib/services/catalog-filters.service'

const cache = new Map<string, { data: CatalogModelOption[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: CatalogModelOption[]) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const filterModels = (items: CatalogModelOption[], query: string) => {
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
  const [allModels, setAllModels] = React.useState<CatalogModelOption[]>([])
  const [models, setModels] = React.useState<CatalogModelOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasNext, setHasNext] = React.useState(false)

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
        const results = await fetchCatalogModels(brand, country)
        setCachedData(cacheKey, results)
        setAllModels(results)
        setModels(filterModels(results, query))
        setHasNext(false)
      } finally {
        setLoading(false)
      }
    },
    [enabled],
  )

  const loadMore = React.useCallback(() => undefined, [])

  React.useEffect(() => {
    loadModels(selectedBrand, searchQuery, saleCountry, 1)
  }, [selectedBrand, searchQuery, saleCountry, loadModels])

  React.useEffect(() => {
    setModels(filterModels(allModels, searchQuery))
  }, [allModels, searchQuery])

  return { models, loading, hasNext, loadMore }
}
