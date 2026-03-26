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
        const baseUrl = getRuntimeBackendApiUrl()
        if (!baseUrl) return

        const url = new URL(`${baseUrl.replace(/\/$/, '')}/auction/filters`)
        url.searchParams.set('brand_id', brand)
        url.searchParams.set('model_id', model)

        const response = await fetch(url.toString(), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bodies: ${response.status}`)
        }

        const data = await response.json()
        if (data.status === 'success' && Array.isArray(data.results)) {
          const bodyTypesArray: BodyType[] = data.results.map((item: any) => ({
            body: item.name,
            id: item.id
          }))
          setBodyTypes(bodyTypesArray)
        } else {
          throw new Error(data.message || 'Malformed response')
        }
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
