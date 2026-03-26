import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'
import { searchCars, type FastApiSearchCar } from '@/lib/services/auction.service'

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

const toNumber = (value: string | number | undefined | null) => {
  const numeric = Number(String(value ?? '').replace(/[^\d.]+/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

const toTokyoDateTimeKey = (value: Date) => {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(value)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value
      }
      return acc
    }, {})

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

const normalizeAuctionDateKey = (value: string | undefined | null) => {
  const text = String(value || '').trim()
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2}))?/)
  if (!match) {
    return ''
  }

  return `${match[1]} ${match[2] || '00'}:${match[3] || '00'}`
}

const isCompletedAuctionDate = (value: string | undefined | null) => {
  const normalizedAuctionDate = normalizeAuctionDateKey(value)
  if (!normalizedAuctionDate) {
    return false
  }

  return normalizedAuctionDate <= toTokyoDateTimeKey(new Date())
}

const pickPriceJpy = (car: FastApiSearchCar) =>
  toNumber(car.calculation_price_jpy ?? car.average_price_jpy ?? car.price_jpy)

const pickPriceRub = (car: FastApiSearchCar, exchangeRate: number) =>
  toNumber(car.total_rub ?? car.price_details?.total_rub) || Math.round(pickPriceJpy(car) * exchangeRate)

export const buildAuctionStatsFallbackFromSearchResults = (
  cars: FastApiSearchCar[],
  brand: string,
  model?: string,
  exchangeRate = 0,
): AuctionStatsResponse | null => {
  const priced = cars
    .filter((car) => isCompletedAuctionDate(car.auction_date))
    .map((car) => ({
      car,
      priceJpy: pickPriceJpy(car),
      priceRub: pickPriceRub(car, exchangeRate),
    }))
    .filter((entry) => entry.priceJpy > 0)

  if (priced.length === 0) {
    return null
  }

  const pricesJpy = priced.map((entry) => entry.priceJpy)
  const pricesRub = priced.map((entry) => entry.priceRub)
  const gradeDistribution = priced.reduce<Record<string, number>>((acc, entry) => {
    const grade = String(entry.car.grade || entry.car.rating || '').trim()
    if (grade) {
      acc[grade] = (acc[grade] || 0) + 1
    }
    return acc
  }, {})

  const modificationCounts = priced.reduce<Record<string, number>>((acc, entry) => {
    const modification = String(entry.car.modification || entry.car.model_code || '').trim()
    if (modification) {
      acc[modification] = (acc[modification] || 0) + 1
    }
    return acc
  }, {})

  const popularModification =
    Object.entries(modificationCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || ''

  const recentLots = priced
    .slice()
    .sort((left, right) => String(right.car.auction_date || '').localeCompare(String(left.car.auction_date || '')))
    .slice(0, 20)
    .map(({ car, priceJpy, priceRub }) => ({
      lot: String(car.lot || ''),
      brand: String(car.brand || brand).trim(),
      model: String(car.model || model || '').trim(),
      year: String(car.year || ''),
      engine_cc: String(car.engine_cc || ''),
      horsepower: toNumber(car.horsepower),
      mileage: String(car.mileage || ''),
      grade: String(car.grade || car.rating || '').trim(),
      price_jpy: priceJpy,
      price_rub: priceRub,
      image_url: String(car.image_url || car.image_urls?.[0] || ''),
      auction_date: String(car.auction_date || ''),
      color: String(car.color || ''),
      transmission: String(car.transmission || ''),
      body: String(car.body || car.model_code || ''),
    }))

  const firstCar = priced[0]?.car

  return {
    status: 'success',
    brand: String(firstCar?.brand || brand).trim(),
    model: String(firstCar?.model || model || '').trim(),
    total_lots: priced.length,
    avg_price_jpy: Math.round(pricesJpy.reduce((sum, value) => sum + value, 0) / priced.length),
    avg_price_rub: Number(
      (pricesRub.reduce((sum, value) => sum + value, 0) / priced.length).toFixed(2),
    ),
    price_range: {
      min_jpy: Math.min(...pricesJpy),
      max_jpy: Math.max(...pricesJpy),
      min_rub: Number(Math.min(...pricesRub).toFixed(2)),
      max_rub: Number(Math.max(...pricesRub).toFixed(2)),
    },
    grade_distribution: gradeDistribution,
    popular_modification: popularModification,
    recent_lots: recentLots,
    exchange_rate: exchangeRate,
    cached: false,
  }
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
    if (response.ok) {
      const stats = (await response.json()) as AuctionStatsResponse
      if (stats.total_lots > 0) {
        return stats
      }
    }

    const searchResponse = await searchCars({
      brand,
      model,
      body: filters?.body,
      minGrade: filters?.minGrade,
      maxGrade: filters?.maxGrade,
      minYear: filters?.minYear,
      maxYear: filters?.maxYear,
      minMileageKm: filters?.minMileageKm,
      maxMileageKm: filters?.maxMileageKm,
      limit: 200,
    })

    return buildAuctionStatsFallbackFromSearchResults(
      searchResponse.results,
      brand,
      model,
      searchResponse.exchange_rate || 0,
    )
  } catch (error) {
    console.error('getAuctionStats error:', error)
    return null
  }
}
