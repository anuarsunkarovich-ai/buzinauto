import { searchCars } from './auction.service'
import { mapFastApiCarToVisibleCard } from '../mappers/fastapi-car.mapper'
import { CarVisibleCardPropsTypes } from '@/types/car-visible-card.types'

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
): Promise<{ items: CarVisibleCardPropsTypes[]; exchangeRate?: { rate: number; source: string } }> => {
  const response = await searchCars({
    brand: params.brand,
    model: params.model,
    body: params.body,
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
    ? { rate: response.exchange_rate, source: response.rate_source }
    : undefined

  return { items, exchangeRate }
}
