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
    horsepower: number
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

export type AuctionStatsFilters = {
  minMileageKm?: number
  maxMileageKm?: number
  minYear?: number
  maxYear?: number
  minGrade?: string
  maxGrade?: string
  body?: string
}

export const buildAuctionStatsUrl = (
  baseUrl: string,
  brand: string,
  model?: string,
  filters?: AuctionStatsFilters,
) => {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/auction/stats`)
  url.searchParams.set('brand', brand)

  if (model) {
    url.searchParams.set('model', model)
  }
  if (typeof filters?.minMileageKm === 'number') {
    url.searchParams.set('min_mileage_km', String(filters.minMileageKm))
  }
  if (typeof filters?.maxMileageKm === 'number') {
    url.searchParams.set('max_mileage_km', String(filters.maxMileageKm))
  }
  if (typeof filters?.minYear === 'number') {
    url.searchParams.set('min_year', String(filters.minYear))
  }
  if (typeof filters?.maxYear === 'number') {
    url.searchParams.set('max_year', String(filters.maxYear))
  }
  if (filters?.minGrade) {
    url.searchParams.set('min_grade', filters.minGrade)
  }
  if (filters?.maxGrade) {
    url.searchParams.set('max_grade', filters.maxGrade)
  }
  if (filters?.body) {
    url.searchParams.set('body', filters.body)
  }

  return url
}

export const getAuctionStats = async (
  brand: string,
  model?: string,
  filters?: AuctionStatsFilters,
): Promise<AuctionStatsResponse | null> => {
  const baseUrl = getRuntimeBackendApiUrl()
  if (!baseUrl) return null

  try {
    const response = await fetch(buildAuctionStatsUrl(baseUrl, brand, model, filters).toString(), {
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
