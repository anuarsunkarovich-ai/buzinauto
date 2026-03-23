import * as React from 'react'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'
import { Country } from '@/constants/country'
import { searchCars } from '@/lib/services/auction.service'

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
        // Use the existing search API to get cars and extract body types
        const response = await searchCars({
          brand,
          model,
          // Don't add too many filters to get a good sample of body types
          minYear: 2020, // Recent cars to get relevant data
        })

        // Extract unique body types from the results
        const bodyCounts = new Map<string, number>()
        response.results.forEach((car) => {
          if (car.body && car.body.trim()) {
            const body = car.body.trim()
            bodyCounts.set(body, (bodyCounts.get(body) || 0) + 1)
          }
        })

        // Convert to array and sort by count (most common first)
        const bodyTypesArray = Array.from(bodyCounts.entries())
          .map(([body, count]) => ({ body, count }))
          .sort((a, b) => b.count - a.count)

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
