import { searchCars, type FastApiSearchCar } from '@/lib/services/auction.service'
import { toValidSlug } from '@/lib/transform'

const normalizeLot = (value: string | number | undefined | null) =>
  String(value || '').replace(/[^\d]+/g, '')

export const getLiveAuctionLotByRoute = async (brandSlug: string, modelSlug: string, lotSlug: string) => {
  const normalizedLot = normalizeLot(lotSlug)
  if (!normalizedLot) {
    return {
      current: undefined,
      related: [] as FastApiSearchCar[],
    }
  }

  const response = await searchCars({
    brand: toValidSlug(brandSlug),
    model: modelSlug,
    includeCompleted: true,
  })

  const current = response.results.find((car) => normalizeLot(car.lot) === normalizedLot)
  const related = response.results.filter((car) => normalizeLot(car.lot) !== normalizedLot)

  return {
    current,
    related,
  }
}
