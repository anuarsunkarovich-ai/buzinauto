import { FastApiSearchCar } from '@/lib/services/auction.service'
import { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'

const buildImages = (car: FastApiSearchCar, fallbackAlt: string) => {
  const sources = car.image_urls?.length ? car.image_urls : [car.image_url || '/static/img/loading72.gif']

  return sources
    .filter(Boolean)
    .map((src, index) => ({
      src,
      alt: index === 0 ? fallbackAlt : `${fallbackAlt} ${index + 1}`,
    }))
}

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
    title: `${brand} ${model}`,
    id: `${car.lot}-${index}`,
    modelSlug: car.modelSlug || car.model_code || model.toLowerCase().replace(/\s+/g, '-'),
    brandSlug: brand.toLowerCase(),
    countryPath: '/japan',
    description: `${year} ${enginePower}cc ${car.transmission || ''}`.trim(),
    tags: [
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
    engineType: 'gasoline' as const,
    location: [car.auction_name, car.auction].filter(Boolean).join(' ') || 'Japan',
    auctionDate: car.auction_date,
    lot: car.lot,
    rating: car.rating || undefined,
    initialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    initialCommercialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    images: buildImages(car, imageAlt),
  }
}
