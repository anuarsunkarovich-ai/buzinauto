import * as React from 'react'
import { Country } from '@/constants/country'
import { fetchCatalogBodies } from '@/lib/services/catalog-filters.service'

export type BodyType = {
  body: string
  count?: number
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
        const bodyTypesArray = await fetchCatalogBodies(brand, model, country)
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
