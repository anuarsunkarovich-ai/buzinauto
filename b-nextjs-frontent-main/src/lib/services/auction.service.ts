import { fetchBackendJson } from '@/lib/api/backend-fetch'

export type SearchCarsParams = {
  brand: string
  model?: string
  page?: number
  lot?: string
  includeCompleted?: boolean
  enrichDetails?: boolean
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

export type SearchPagination = {
  page: number
  limit: number
  total_items: number
  total_pages: number
  has_next_page: boolean
  has_prev_page: boolean
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
    buy_and_delivery_jpy?: number
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
    rate_date?: string
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
  pagination?: SearchPagination
  exchange_rate?: number
  rate_source?: string
  rate_date?: string
  duty_exchange_rate?: number
  duty_rate_source?: string
}

type FastApiSearchPayload = FastApiSearchResponse | FastApiSearchCar[]

type SearchCarsResponse = {
  results: FastApiSearchCar[]
  pagination?: SearchPagination
  exchange_rate?: number
  rate_source?: string
  rate_date?: string
  duty_exchange_rate?: number
  duty_rate_source?: string
}

export const searchCars = async ({
  brand,
  model,
  page,
  lot,
  includeCompleted,
  enrichDetails,
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
  const payload = await fetchBackendJson<FastApiSearchPayload>('search', {
    query: {
      brand,
      model,
      page: typeof page === 'number' ? page : undefined,
      lot,
      include_completed: includeCompleted ? '1' : undefined,
      enrich_details:
        typeof enrichDetails === 'boolean' ? (enrichDetails ? 'true' : 'false') : undefined,
      body,
      auction_date: auctionDate,
      min_grade: minGrade,
      max_grade: maxGrade,
      rating,
      min_year: typeof minYear === 'number' ? minYear : undefined,
      max_year: typeof maxYear === 'number' ? maxYear : undefined,
      min_mileage_km: typeof minMileageKm === 'number' ? minMileageKm : undefined,
      max_mileage_km: typeof maxMileageKm === 'number' ? maxMileageKm : undefined,
      min_engine_volume_l: typeof minEnginePower === 'number' ? minEnginePower : undefined,
      max_engine_volume_l: typeof maxEnginePower === 'number' ? maxEnginePower : undefined,
      min_price_rub: typeof minPrice === 'number' ? minPrice : undefined,
      max_price_rub: typeof maxPrice === 'number' ? maxPrice : undefined,
      limit,
    },
    cache: 'no-store',
  })
  const responseMeta = Array.isArray(payload) ? undefined : payload
  const rawResults = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.results)
      ? payload.results
      : []

  return {
    results: rawResults,
    pagination: responseMeta?.pagination,
    exchange_rate: responseMeta?.exchange_rate,
    rate_source: responseMeta?.rate_source,
    rate_date: responseMeta?.rate_date,
    duty_exchange_rate: responseMeta?.duty_exchange_rate,
    duty_rate_source: responseMeta?.duty_rate_source,
  }
}
