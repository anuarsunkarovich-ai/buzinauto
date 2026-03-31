import type { CarCarouselOnHoverCardImagePropsTypes } from '@/components/features/car-carousel/car-carousel-on-hover-card'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import type { CarDescriptionPropsTypes } from '@/components/features/car/car-description'
import type { PrefetchedCalculation } from '@/lib/calculator/prefetched-calculation'
import type { ImageGalleryViewerItems } from '@/components/ui/image/image-gallery-viewer'
import type { FastApiSearchCar } from '@/lib/services/auction.service'
import { toModelDisplay, toUrlSlug } from '@/lib/transform'

const FALLBACK_IMAGE = '/static/img/loading72.gif'

const normalizeMileage = (value: string | number | undefined | null) =>
  Number(String(value ?? 0).replace(/[^\d]/g, '')) || 0

const buildUniqueCarTextParts = (parts: Array<string | number | undefined | null>) => {
  const normalize = (value: string | number | undefined | null) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '')

  return parts.reduce<string[]>((acc, part) => {
    const rawPart = String(part || '').trim()
    if (!rawPart) {
      return acc
    }

    const normalizedPart = normalize(rawPart)
    if (!normalizedPart) {
      return acc
    }

    const isDuplicate = acc.some((existingPart) => {
      const normalizedExisting = normalize(existingPart)
      return (
        normalizedExisting === normalizedPart ||
        normalizedExisting.includes(normalizedPart) ||
        normalizedPart.includes(normalizedExisting)
      )
    })

    if (!isDuplicate) {
      acc.push(rawPart)
    }

    return acc
  }, [])
}

export const getFastApiCarPrimaryImage = (car: FastApiSearchCar) => {
  return car.image_url || car.image_urls?.[0] || FALLBACK_IMAGE
}

export const getFastApiCarImageUrls = (car: FastApiSearchCar) => {
  const sources = car.image_urls?.length ? car.image_urls : [getFastApiCarPrimaryImage(car)]
  const uniqueSources = Array.from(new Set(sources.filter(Boolean)))
  return uniqueSources.length > 0 ? uniqueSources : [FALLBACK_IMAGE]
}

export const buildFastApiCarImages = (
  car: FastApiSearchCar,
  fallbackAlt: string,
): CarCarouselOnHoverCardImagePropsTypes[] => {
  return getFastApiCarImageUrls(car).map((src, index) => ({
    src,
    alt: index === 0 ? fallbackAlt : `${fallbackAlt} ${index + 1}`,
  }))
}

export const buildPrefetchedCalculation = (
  car: FastApiSearchCar,
  initialTotalRub: number,
): PrefetchedCalculation | undefined =>
  car.price_details || initialTotalRub > 0
    ? {
        totalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
        commercialRate:
          car.price_details?.bank_buy_rate ??
          car.price_details?.exchange_rate ??
          car.price_details?.bank_sell_rate,
        bankBuyRate: car.price_details?.bank_buy_rate,
        bankSellRate: car.price_details?.bank_sell_rate,
        rateDate: car.price_details?.rate_date,
        breakdown: car.price_details
          ? {
              buyAndDeliveryRub: car.price_details.buy_and_delivery_rub,
              buyAndDeliveryJpy: car.price_details.buy_and_delivery_jpy,
              customsBrokerRub: car.price_details.customs_broker_rub,
              customsDutyRub: car.price_details.customs_duty_rub,
              utilFeeRub: car.price_details.util_fee_rub,
              companyCommission: car.price_details.company_commission,
            }
          : undefined,
      }
    : undefined

export const mapFastApiCarToVisibleCard = (
  car: FastApiSearchCar,
  index: number,
): CarVisibleCardPropsTypes => {
  const brand = car.brand || 'Japan'
  const model = car.modelDisplay || car.model || car.model_code || 'Model'
  const year = Number(car.year || new Date().getFullYear())
  const priceJpy = Number(car.calculation_price_jpy || car.average_price_jpy || car.price_jpy || 0)
  const enginePower = Number(car.engine_cc || 0)
  const mileageKm = normalizeMileage(car.mileage)
  const initialTotalRub = Number(car.total_rub || car.price_details?.total_rub || 0)
  const prefetchedCalculation = buildPrefetchedCalculation(car, initialTotalRub)
  const titleParts = buildUniqueCarTextParts([model, car.modification, String(year)])
  const imageAlt = [toModelDisplay(brand), model, String(year)].filter(Boolean).join(' ')
  const descriptionParts = buildUniqueCarTextParts([
    car.body,
    car.modification,
    mileageKm ? `${mileageKm} км.` : undefined,
  ])

  return {
    title: titleParts.join(' '),
    lot: car.lot,
    modelSlug: toUrlSlug(car.modelSlug || model),
    id: car.lot || `${index}`,
    brandSlug: toUrlSlug(brand),
    countryPath: '/japan',
    description: descriptionParts.join(', '),
    tags: [
      car.model_code,
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
    rating: car.rating || car.grade || undefined,
    initialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    initialCommercialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    prefetchedCalculation,
    images: buildFastApiCarImages(car, imageAlt),
  }
}

export const mapFastApiCarToDescription = (car: FastApiSearchCar): CarDescriptionPropsTypes => {
  const year = Number(car.year || new Date().getFullYear())
  const enginePower = Number(car.engine_cc || 0)
  const horsepower = Number(car.horsepower || 0)
  const mileageKm = normalizeMileage(car.mileage)
  const initialTotalRub = Number(car.total_rub || car.price_details?.total_rub || 0)

  return {
    price: Number(car.calculation_price_jpy || car.average_price_jpy || car.price_jpy || 0),
    currency: 'JPY',
    year,
    enginePower,
    horsepower,
    horsepowerString: horsepower ? `${horsepower} л.с.` : undefined,
    driveType: undefined,
    color: car.color || undefined,
    lot: car.lot ? String(car.lot) : undefined,
    auctionDate: car.auction_date || undefined,
    auctionSheetUrl: car.auction_sheet_url || undefined,
    mileageKm: mileageKm ? `${mileageKm} км.` : undefined,
    rating: car.rating || car.grade || undefined,
    wheelPosition: undefined,
    engineType: 'gasoline',
    prefetchedCalculation: buildPrefetchedCalculation(car, initialTotalRub),
  }
}

export const mapFastApiCarToGalleryItems = (car: FastApiSearchCar): ImageGalleryViewerItems[] => {
  return getFastApiCarImageUrls(car).map((src, index) => {
    const id = `${car.lot || 'lot'}-${index}`
    const altBase = [toModelDisplay(car.brand || 'Japan'), car.modelDisplay || car.model || '', car.year || '']
      .filter(Boolean)
      .join(' ')

    return {
      id,
      src,
      alt: index === 0 ? altBase : `${altBase} ${index + 1}`,
      width: 1600,
      height: 1200,
      thumbnail: {
        id: `${id}-thumbnail`,
        src,
        alt: index === 0 ? altBase : `${altBase} ${index + 1}`,
        width: 320,
        height: 240,
      },
    }
  })
}
