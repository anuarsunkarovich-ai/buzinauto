import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

export type SearchCarsParams = {
  brand: string
  model?: string
  body?: string
  auctionDate?: string
  minGrade?: string
  maxGrade?: string
  rating?: string
  minYear?: number
  maxYear?: number
  minMileageKm?: number
  maxMileageKm?: number
  minEnginePower?: number
  maxEnginePower?: number
  minPrice?: number
  maxPrice?: number
  limit?: number
}

export type FastApiSearchCar = {
  lot?: string
  auction_name?: string
  year?: string | number
  engine_cc?: string | number
  horsepower?: string | number
  mileage?: string | number
  auction_date?: string
  price_jpy?: string | number
  average_price_jpy?: string | number
  calculation_price_jpy?: string | number
  price_source?: string
  image_url?: string
  image_urls?: string[]
  auction_sheet_url?: string
  detail_link?: string
  price_details?: {
    car_price_rub?: number
    car_price_jpy?: number
    lot_price_jpy?: number
    average_price_jpy?: number
    buy_and_delivery_rub?: number
    customs_broker_rub?: number
    customs_duty_rub?: number
    customs_processing_fee_rub?: number
    excise_rub?: number
    util_fee_rub?: number
    svh_transport_rub?: number
    company_commission?: number
    exchange_rate?: number
    rate_source?: string
    bank_buy_rate?: number
    bank_sell_rate?: number
    duty_exchange_rate?: number
    duty_rate_source?: string
    usage_type?: string
    user_type?: string
    forced_commercial?: boolean
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
  sale_status?: string
}

type FastApiSearchResponse = {
  results: FastApiSearchCar[]
  exchange_rate?: number
  rate_source?: string
  rate_date?: string
  duty_exchange_rate?: number
  duty_rate_source?: string
}

type FastApiSearchPayload = FastApiSearchResponse | FastApiSearchCar[]

type SearchCarsResponse = {
  results: FastApiSearchCar[]
  exchange_rate?: number
  rate_source?: string
  rate_date?: string
  duty_exchange_rate?: number
  duty_rate_source?: string
}

const normalizeSearchValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const tokenizeSearchValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)

const matchesBodyQuery = (car: FastApiSearchCar, bodyQuery: string) => {
  const normalizedQuery = normalizeSearchValue(bodyQuery)

  if (!normalizedQuery) {
    return true
  }

  const queryTokens = tokenizeSearchValue(bodyQuery)
  const candidates = [car.body, car.model_code, car.modification]

  return candidates.some((candidate) => {
    const candidateText = String(candidate || '')
    const normalizedCandidate = normalizeSearchValue(candidateText)
    if (!normalizedCandidate) {
      return false
    }

    if (normalizedCandidate === normalizedQuery) {
      return true
    }

    const candidateTokens = tokenizeSearchValue(candidateText)
    return queryTokens.length > 0 && queryTokens.every((token) => candidateTokens.includes(token))
  })
}

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
    body,
    auctionDate,
    minGrade,
    maxGrade,
    rating,
    minYear,
    maxYear,
    minMileageKm,
    maxMileageKm,
    minEnginePower,
    maxEnginePower,
    minPrice,
    maxPrice,
    limit,
  }: SearchCarsParams,
) => {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/search`)
  url.searchParams.set('brand', brand)
  if (model) {
    url.searchParams.set('model', model)
  }
  if (body) {
    url.searchParams.set('body', body)
  }
  if (limit) {
    url.searchParams.set('limit', String(limit))
  }
  if (auctionDate) {
    url.searchParams.set('auction_date', auctionDate)
  }
  if (minGrade) {
    url.searchParams.set('min_grade', minGrade)
  }
  if (maxGrade) {
    url.searchParams.set('max_grade', maxGrade)
  }
  if (rating) {
    url.searchParams.set('rating', rating)
  }
  if (typeof minYear === 'number') {
    url.searchParams.set('min_year', String(minYear))
  }
  if (typeof maxYear === 'number') {
    url.searchParams.set('max_year', String(maxYear))
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

export const searchCars = async ({
  brand,
  model,
  body,
  auctionDate,
  minGrade,
  maxGrade,
  rating,
  minYear,
  maxYear,
  minMileageKm,
  maxMileageKm,
  minEnginePower,
  maxEnginePower,
  minPrice,
  maxPrice,
  limit,
}: SearchCarsParams): Promise<SearchCarsResponse> => {
  const baseUrl = getRuntimeBackendApiUrl()

  if (!baseUrl) {
    throw new Error('Backend API URL is not configured')
  }

  const response = await fetch(
    buildSearchUrl(baseUrl, {
      brand,
      model,
      body,
      auctionDate,
      minGrade,
      maxGrade,
      rating,
      minYear,
      maxYear,
      minMileageKm,
      maxMileageKm,
      minEnginePower,
      maxEnginePower,
      minPrice,
      maxPrice,
      limit,
    }).toString(),
    {
      cache: 'no-store',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`FastAPI search failed with status ${response.status}`)
  }

  const payload = (await response.json()) as FastApiSearchPayload
  const responseMeta = Array.isArray(payload) ? undefined : payload
  const rawResults = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.results)
      ? payload.results
      : []
  const filteredResults = rawResults
    .filter((car) => (model ? matchesModelQuery(car, model) : true))
    .filter((car) => (body ? matchesBodyQuery(car, body) : true))
  const normalizedResults =
    filteredResults.length > 0 || (!model && !body) ? filteredResults : rawResults

  return {
    results: normalizedResults,
    exchange_rate: responseMeta?.exchange_rate,
    rate_source: responseMeta?.rate_source,
    rate_date: responseMeta?.rate_date,
    duty_exchange_rate: responseMeta?.duty_exchange_rate,
    duty_rate_source: responseMeta?.duty_rate_source,
  }
}
