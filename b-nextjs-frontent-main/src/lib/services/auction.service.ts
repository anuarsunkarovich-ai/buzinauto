import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

export type SearchCarsParams = {
  brand: string
  model?: string
  auctionDate?: string
  rating?: string
  minMileageKm?: number
  maxMileageKm?: number
  minEnginePower?: number
  maxEnginePower?: number
  minPrice?: number
  maxPrice?: number
}

export type FastApiSearchCar = {
  lot?: string
  auction_name?: string
  year?: string | number
  engine_cc?: string | number
  mileage?: string | number
  auction_date?: string
  price_jpy?: string | number
  average_price_jpy?: string | number
  calculation_price_jpy?: string | number
  price_source?: string
  image_url?: string
  image_urls?: string[]
  price_details?: {
    car_price_rub?: number
    car_price_jpy?: number
    lot_price_jpy?: number
    average_price_jpy?: number
    buy_and_delivery_rub?: number
    customs_broker_rub?: number
    customs_duty_rub?: number
    util_fee_rub?: number
    svh_transport_rub?: number
    company_commission?: number
    total_rub?: number
  }
  total_rub?: number
  brand?: string
  model?: string
  modelDisplay?: string
  modelSlug?: string
  saleCountry?: string
  auction?: string
  body?: string
  modification?: string
  rating?: string
  model_code?: string
  color?: string
  transmission?: string
  grade?: string
}

type FastApiSearchResponse = {
  results: FastApiSearchCar[]
}

const normalizeSearchValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const matchesModelQuery = (car: FastApiSearchCar, modelQuery: string) => {
  const normalizedQuery = normalizeSearchValue(modelQuery)

  if (!normalizedQuery) {
    return true
  }

  const candidates = [
    car.model,
    car.modelDisplay,
    car.modelSlug,
    car.model_code,
    car.modification,
    car.body,
  ]

  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeSearchValue(String(candidate || ''))
    return (
      normalizedCandidate === normalizedQuery ||
      normalizedCandidate.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedCandidate)
    )
  })
}

const buildSearchUrl = (
  baseUrl: string,
  {
    brand,
    model,
    auctionDate,
    rating,
    minMileageKm,
    maxMileageKm,
    minEnginePower,
    maxEnginePower,
    minPrice,
    maxPrice,
  }: SearchCarsParams,
) => {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/search`)
  url.searchParams.set('brand', brand)
  if (model) {
    url.searchParams.set('model', model)
  }
  if (auctionDate) {
    url.searchParams.set('auction_date', auctionDate)
  }
  if (rating) {
    url.searchParams.set('rating', rating)
  }
  if (typeof minMileageKm === 'number') {
    url.searchParams.set('min_mileage_km', String(minMileageKm))
  }
  if (typeof maxMileageKm === 'number') {
    url.searchParams.set('max_mileage_km', String(maxMileageKm))
  }
  if (typeof minEnginePower === 'number') {
    url.searchParams.set('min_engine_volume_l', String(minEnginePower))
  }
  if (typeof maxEnginePower === 'number') {
    url.searchParams.set('max_engine_volume_l', String(maxEnginePower))
  }
  if (typeof minPrice === 'number') {
    url.searchParams.set('min_price_rub', String(minPrice))
  }
  if (typeof maxPrice === 'number') {
    url.searchParams.set('max_price_rub', String(maxPrice))
  }

  return url
}

const fetchSearchResults = async (url: URL) => {
  const response = await fetch(url.toString(), {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  })

  if (!response.ok) {
    throw new Error(`FastAPI search failed with status ${response.status}`)
  }

  const data = (await response.json()) as FastApiSearchResponse
  return data.results || []
}

export const searchCars = async ({
  brand,
  model,
  auctionDate,
  rating,
  minMileageKm,
  maxMileageKm,
  minEnginePower,
  maxEnginePower,
  minPrice,
  maxPrice,
}: SearchCarsParams): Promise<{ results: FastApiSearchCar[] }> => {
  const baseUrl = getRuntimeBackendApiUrl()

  if (!baseUrl) {
    throw new Error('Backend API URL is not configured')
  }

  const primaryResults = await fetchSearchResults(
    buildSearchUrl(baseUrl, {
      brand,
      model,
      auctionDate,
      rating,
      minMileageKm,
      maxMileageKm,
      minEnginePower,
      maxEnginePower,
      minPrice,
      maxPrice,
    }),
  )

  if (primaryResults.length > 0 || !model) {
    return { results: primaryResults }
  }

  const fallbackResults = await fetchSearchResults(
    buildSearchUrl(baseUrl, {
      brand,
      auctionDate,
      rating,
      minMileageKm,
      maxMileageKm,
      minEnginePower,
      maxEnginePower,
      minPrice,
      maxPrice,
    }),
  )

  return {
    results: fallbackResults.filter((car) => matchesModelQuery(car, model)),
  }
}
