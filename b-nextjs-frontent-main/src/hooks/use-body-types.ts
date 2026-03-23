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
        // Use the existing search API to get cars and extract model codes (кузов)
        const response = await searchCars({
          brand,
          model,
          limit: 300, // Increased limit to find more unique body codes
        })

        // Extract unique model codes (кузов) from the results
        const bodyCounts = new Map<string, number>()
        // Improved regex for chassis codes: 1-3 letters followed by a number and 0-3 alphanumeric chars
        const codeRegex = /\b[A-Z]{1,3}[0-9][A-Z0-9]{0,3}\b/g 

        response.results.forEach((car) => {
          const possibleCodes = new Set<string>()
          
          // 1. Check model_code field (primary source)
          if (car.model_code) {
            const code = car.model_code.toUpperCase().trim()
            if (code.match(codeRegex)) {
              possibleCodes.add(code)
            } else {
              // Try finding partial matches if the whole string isn't a code
              const matches = code.match(codeRegex)
              matches?.forEach(m => possibleCodes.add(m))
            }
          }
          
          // 2. Check model/modification fields
          const textToSearch = `${car.model || ''} ${car.modification || ''}`.toUpperCase()
          const matches = textToSearch.match(codeRegex)
          matches?.forEach(m => possibleCodes.add(m))

          possibleCodes.forEach(code => {
            // Filter out obviously wrong codes (like year or common words)
            if (code.length >= 3 && !/^(20[0-2][0-9]|19[8-9][0-9])$/.test(code)) {
              bodyCounts.set(code, (bodyCounts.get(code) || 0) + 1)
            }
          })
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
