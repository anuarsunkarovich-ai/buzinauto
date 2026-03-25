import { FastApiSearchCar } from '@/lib/services/auction.service'

export const buildImages = (car: FastApiSearchCar, fallbackAlt: string) => {
  const sources = car.image_urls?.length ? car.image_urls : [car.image_url || '/static/img/loading72.gif']

  return sources
    .filter(Boolean)
    .map((src, index) => ({
      src,
      alt: index === 0 ? fallbackAlt : `${fallbackAlt} ${index + 1}`,
    }))
}
