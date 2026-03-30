import { searchCars, type FastApiSearchCar } from '@/lib/services/auction.service'
import { toValidSlug } from '@/lib/transform'

const normalizeLot = (value: string | number | undefined | null) =>
  String(value || '').replace(/[^\d]+/g, '')

export const getLiveAuctionLotByRoute = async (
  brandSlug: string,
  modelSlug: string,
  lotSlug: string,
) => {
  const normalizedLot = normalizeLot(lotSlug)
  if (!normalizedLot) {
    return {
      current: undefined,
      related: [] as FastApiSearchCar[],
    }
  }

  const brand = toValidSlug(brandSlug)

  const [currentResponse, relatedResponse] = await Promise.all([
    searchCars({
      brand,
      model: modelSlug,
      lot: normalizedLot,
      enrichDetails: true,
      limit: 1,
    }),
    searchCars({
      brand,
      model: modelSlug,
      limit: 12,
    }),
  ])

  const current = currentResponse.results[0]
  const related = relatedResponse.results
    .filter((car) => normalizeLot(car.lot) !== normalizedLot)
    .slice(0, 10)

  return {
    current,
    related,
  }
}
