import { searchCars } from './auction.service'
import { mapFastApiCarToVisibleCard } from '../mappers/fastapi-car.mapper'
import { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'

interface CatalogSearchParams {
  brand?: string
  model?: string
  body?: string
  minYear?: number
  maxYear?: number
  minEnginePower?: number
  maxEnginePower?: number
  minPrice?: number
  maxPrice?: number
  minGrade?: string
  maxGrade?: string
  minMileageKm?: number
  maxMileageKm?: number
}

export const searchCatalogCars = async (
  params: CatalogSearchParams
): Promise<{ items: CarVisibleCardPropsTypes[]; exchangeRate?: { rate: number; source: string; date?: string } }> => {
  const response = await searchCars({
    brand: params.brand || '9',
    model: params.model,
    enrichDetails: true,
    body: params.body,
    limit: 100,
    minYear: params.minYear,
    maxYear: params.maxYear,
    minEnginePower: params.minEnginePower,
    maxEnginePower: params.maxEnginePower,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minGrade: params.minGrade,
    maxGrade: params.maxGrade,
    minMileageKm: params.minMileageKm,
    maxMileageKm: params.maxMileageKm,
  })

  const items = response.results.map((car, index) => mapFastApiCarToVisibleCard(car, index))

  const exchangeRate = response.exchange_rate && response.rate_source
    ? { rate: response.exchange_rate, source: response.rate_source, date: response.rate_date }
    : undefined

  return { items, exchangeRate }
}
