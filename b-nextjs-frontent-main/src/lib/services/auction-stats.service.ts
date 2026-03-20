import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

export type AuctionStatsResponse = {
  status: string
  brand: string
  model: string
  total_lots: number
  avg_price_jpy: number
  avg_price_rub: number
  price_range: {
    min_jpy: number
    max_jpy: number
    min_rub: number
    max_rub: number
  }
  grade_distribution: Record<string, number>
  popular_modification: string
  recent_lots: {
    lot: string
    brand: string
    model: string
    year: string
    engine_cc: string
    mileage: string
    grade: string
    price_jpy: number
    price_rub: number
    image_url: string
    auction_date: string
    color: string
    transmission: string
    body: string
  }[]
  exchange_rate: number
  cached: boolean
}

export const getAuctionStats = async (
  brand: string,
  model?: string,
  filters?: {
    min_mileage_km?: number
    max_mileage_km?: number
    min_year?: number
    rating?: string
  }
): Promise<AuctionStatsResponse | null> => {
  const baseUrl = getRuntimeBackendApiUrl()
  if (!baseUrl) return null

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/auction/stats`)
  url.searchParams.set('brand', brand)
  if (model) {
    url.searchParams.set('model', model)
  }
  if (filters?.min_mileage_km) {
    url.searchParams.set('min_mileage_km', String(filters.min_mileage_km))
  }
  if (filters?.max_mileage_km) {
    url.searchParams.set('max_mileage_km', String(filters.max_mileage_km))
  }
  if (filters?.min_year) {
    url.searchParams.set('min_year', String(filters.min_year))
  }
  if (filters?.rating) {
    url.searchParams.set('rating', filters.rating)
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    return (await response.json()) as AuctionStatsResponse
  } catch (error) {
    console.error('getAuctionStats error:', error)
    return null
  }
}
