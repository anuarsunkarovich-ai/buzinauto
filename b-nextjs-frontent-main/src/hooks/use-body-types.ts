import * as React from 'react'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'
import { Country } from '@/constants/country'

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
        if (!baseUrl) {
          throw new Error('Backend API URL is not configured')
        }

        const url = new URL(`${baseUrl.replace(/\/$/, '')}/body-types`)
        url.searchParams.set('brand', brand)
        url.searchParams.set('model', model)
        url.searchParams.set('country', country)

        const response = await fetch(url.toString(), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          next: { revalidate: 300 },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch body types: ${response.status}`)
        }

        const data = await response.json()
        setBodyTypes(data.body_types || [])
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
