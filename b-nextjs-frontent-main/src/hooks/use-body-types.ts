import * as React from 'react'
import { Country } from '@/constants/country'
import { fetchCatalogBodies } from '@/lib/services/catalog-filters.service'

export type BodyType = {
  body: string
  label?: string
  count?: number
}

const cache = new Map<string, { data: BodyType[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: BodyType[]) => {
  cache.set(key, { data, timestamp: Date.now() })
}

export const useBodyTypes = (
  brand: string,
  model: string,
  country: Country = Country.JAPAN,
  enabled: boolean = true
) => {
  const [bodyTypes, setBodyTypes] = React.useState<BodyType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!brand || !model || !enabled) {
      setBodyTypes([])
      setError(null)
      return
    }

    const fetchBodyTypes = async () => {
      setLoading(true)
      setError(null)

      try {
        const cacheKey = `${country}:${brand}:${model}`
        const cached = getCachedData(cacheKey)
        if (cached) {
          setBodyTypes(cached)
          return
        }

        const bodyTypesArray = await fetchCatalogBodies(brand, model, country)
        setCachedData(cacheKey, bodyTypesArray)
        setBodyTypes(bodyTypesArray)
      } catch (err) {
        console.error('useBodyTypes error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch body types')
        setBodyTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchBodyTypes()
  }, [brand, model, country, enabled])

  return {
    bodyTypes,
    loading,
    error,
  }
}
