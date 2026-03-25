import { FastApiSearchCar } from '@/lib/services/auction.service'
import { CarVisibleCardPropsTypes } from '@/types/car-visible-card.types'
import { buildImages } from '@/lib/utils/build-images'

export const mapFastApiCarToVisibleCard = (
  car: FastApiSearchCar,
  index: number,
): CarVisibleCardPropsTypes => {
  const brand = car.brand || 'Japan'
  const model = car.modelDisplay || car.model || car.model_code || 'Model'
  const imageAlt = `${brand} ${model} - ${car.auction_name} Lot ${car.lot}`
  
  const priceJpy = Number(car.price_jpy) || 0
  const enginePower = Number(car.engine_cc) || 0
  const year = Number(car.year) || new Date().getFullYear()
  const initialTotalRub = Number(car.total_rub) || 0

  return {
    id: `${car.lot}-${index}`,
    slug: car.modelSlug || car.model_code || model.toLowerCase().replace(/\s+/g, '-'),
    path: `/japan/cars/${brand.toLowerCase()}/${car.modelSlug || car.model_code || ''}`,
    brand: car.brand || 'Japan',
    model: car.modelDisplay || car.model || car.model_code || 'Model',
    modification: [
      car.model_code,
      car.body,
      car.color,
      car.transmission,
      car.grade,
      enginePower ? `${enginePower} cc` : undefined,
    ].filter(Boolean) as string[],
    price: priceJpy,
    currency: 'JPY',
    year,
    horsepower: Number(car.horsepower || 0),
    enginePower,
    engineType: 'gasoline',
    location: [car.auction_name, car.auction].filter(Boolean).join(' ') || 'Japan',
    auctionDate: car.auction_date,
    rating: car.rating || undefined,
    initialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    initialCommercialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    images: buildImages(car, imageAlt),
  }
}
