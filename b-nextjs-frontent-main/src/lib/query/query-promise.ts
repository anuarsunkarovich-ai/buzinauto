import { Country } from '@/constants/country'
import { CatalogCar, ReviewCard } from '@/payload-types'
import { getPayload, PaginatedDocs, Where } from 'payload'
import { EngineType } from '../calculator/car-fee-import-calc.type'
import { isMongoId } from '../utils'

export type CatalogCarPromiseFilter = {
  model: string
  brand: string
  rating?: string
  currency?: string
  brands?: string[]
  minMilage?: number
  maxMilage?: number
  minYear?: number
  maxYear?: number
  minEnginePower?: number
  maxEnginePower?: number
  minPrice?: number
  maxPrice?: number
  engineTypes?: EngineType[]
  wheelPosition?: 'right' | 'left'
  country?: Country
  neIds?: string[]
}

const getPayloadConfig = async () => (await import('@payload-config')).default

const createEmptyPaginatedDocs = <T>(
  page = 1,
  limit = LIMIT_PAGE,
): PaginatedDocs<T> => ({
  docs: [],
  hasNextPage: false,
  hasPrevPage: false,
  limit,
  nextPage: null,
  page,
  pagingCounter: 1,
  prevPage: null,
  totalDocs: 0,
  totalPages: 1,
})

export const getManyReviewCards = async (): Promise<PaginatedDocs<ReviewCard>> => {
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })
    const result = await payload.find({
      collection: 'review-card',
      draft: false,
      disableErrors: true,
    })
    return result
  } catch {
    return createEmptyPaginatedDocs<ReviewCard>(1, LIMIT_PAGE)
  }
}

export const getOneByCatalogCarId = async (id: string): Promise<CatalogCar | null> => {
  if (!isMongoId(id)) return null
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })
    const result = await payload.findByID({
      id,
      collection: 'catalog-car',
      draft: false,
      disableErrors: true,
    })
    return result
  } catch {
    return null
  }
}

export const LIMIT_PAGE = 10

export const getManyCatalogCarPromise = async (
  page = 1,
  filter?: Partial<CatalogCarPromiseFilter>,
): Promise<PaginatedDocs<CatalogCar>> => {
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })

    const and: Where[] = [
      {
        isFinish: {
          equals: true,
        },
      },
    ]

    if (
      typeof filter === 'object' &&
      'neIds' in filter &&
      filter.neIds?.every((id) => isMongoId(id))
    ) {
      and.push({
        id: {
          not_in: filter.neIds || [],
        },
      })
    }

    if (typeof filter === 'object' && 'country' in filter) {
      and.push({
        saleCountry: {
          equals: filter.country,
        },
      })
    }

    if (typeof filter === 'object' && 'wheelPosition' in filter) {
      and.push({
        wheelPosition: {
          equals: filter.wheelPosition,
        },
      })
    }

    if (typeof filter === 'object' && 'engineTypes' in filter) {
      and.push({
        engineType: {
          in: filter.engineTypes,
        },
      })
    }

    if (typeof filter === 'object' && 'maxMilage' in filter && filter.maxMilage) {
      and.push({
        mileageKm: {
          less_than_equal: filter.maxMilage,
        },
      })
    }

    if (typeof filter === 'object' && 'minMilage' in filter && filter.minMilage) {
      and.push({
        mileageKm: {
          greater_than_equal: filter.minMilage,
        },
      })
    }

    if (typeof filter === 'object' && 'minYear' in filter && filter.minYear) {
      and.push({
        year: {
          greater_than_equal: filter.minYear,
        },
      })
    }

    if (typeof filter === 'object' && 'maxYear' in filter && filter.maxYear) {
      and.push({
        year: {
          less_than_equal: filter.maxYear,
        },
      })
    }

    if (typeof filter === 'object' && 'minEnginePower' in filter && filter.minEnginePower) {
      and.push({
        enginePower: {
          greater_than_equal: filter.minEnginePower,
        },
      })
    }

    if (typeof filter === 'object' && 'maxEnginePower' in filter && filter.maxEnginePower) {
      and.push({
        enginePower: {
          less_than_equal: filter.maxEnginePower,
        },
      })
    }

    if (typeof filter === 'object' && 'minPrice' in filter && filter.minPrice) {
      and.push({
        'price.avg': {
          greater_than_equal: filter.minPrice,
        },
      })
    }

    if (typeof filter === 'object' && 'maxPrice' in filter && filter.maxPrice) {
      and.push({
        'price.avg': {
          less_than_equal: filter.maxPrice,
        },
      })
    }

    if (typeof filter === 'object' && 'model' in filter) {
      and.push({
        modelSlug: {
          equals: filter.model,
        },
      })
    }

    if (typeof filter === 'object' && 'rating' in filter && filter.rating) {
      and.push({
        rating: {
          equals: filter.rating,
        },
      })
    }

    if (typeof filter === 'object' && 'brand' in filter) {
      and.push({
        brand: {
          equals: filter.brand,
        },
      })
    }

    if (typeof filter === 'object' && 'brands' in filter) {
      and.push({
        brand: {
          in: filter.brands,
        },
      })
    }

    const result = await payload.find({
      collection: 'catalog-car',
      limit: LIMIT_PAGE,
      page: isNaN(page) ? 1 : page,
      pagination: true,
      where: {
        and: and,
      },
      sort: '-date',
    })

    return result
  } catch {
    return createEmptyPaginatedDocs<CatalogCar>(isNaN(page) ? 1 : page, LIMIT_PAGE)
  }
}
