import { CarCarouselOnHoverCardImagePropsTypes } from '@/components/features/car-carousel/car-carousel-on-hover-card'
import { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { CarDescriptionPropsTypes } from '@/components/features/car/car-description'
import { CountryPathname } from '@/constants/country'
import { CatalogCar } from '@/payload-types'
import { existItemOfArray, stringToFirstCapitalize, toModelDisplay, toUrlSlug } from '../transform'

export const mapperToCar = (car: CatalogCar): CarVisibleCardPropsTypes | null => {
  if (!car.brand || !car.modelDisplay || !car.year) return null

  const brand = toModelDisplay(car.brand)
  const mileageKm = car.mileageKm ? `${car.mileageKm} км.` : undefined
  const horsepower = car.horsepower ? `${car.horsepower} л.с.` : undefined
  const enginePower = car?.enginePower ? `${(car?.enginePower / 1000).toFixed(1)} л.` : undefined

  const images = car.images?.length
    ? car.images.slice(0, 5).map((e): CarCarouselOnHoverCardImagePropsTypes => {
        if (typeof e === 'string' || !e.url) return undefined!
        return {
          src: e.thumbnailURL ?? e.url,
          alt: e.alt!,
        }
      })
    : []

  return {
    title: `${brand} ${car.modelDisplay}, ${car.year}`,
    description: existItemOfArray([car.body, mileageKm, horsepower]).join(', '),
    tags:
      existItemOfArray<string>([
        car.color as string,
        enginePower as string,
        car.driveType as string,
      ]).map(stringToFirstCapitalize) || [],
    id: car.id,
    modelSlug: car.modelSlug,
    brandSlug: toUrlSlug(car.brand),
    images: images.filter((e) => !!e),
    location: car?.auction || 'Japan',
    price: car.price.avg || car.price.final || car.price.start || 0,
    currency: car.price.currency || 'JPY',
    rating: car.rating && /[[a-zA-Z\d]+/.test(car.rating) ? car.rating : undefined,
    year: car.year || 2025,
    auctionDate: car.date,
    countryPath: CountryPathname.find((e) => e.country === car.saleCountry)?.pathname || '/japan',
    enginePower: car?.enginePower || 1000,
    engineType: car?.engineType || undefined,
    horsepower: car.horsepower || 0,
  }
}

export const mapperToCarDescription = (car: CatalogCar): CarDescriptionPropsTypes | null => {
  if (!car.brand || !car.modelDisplay || !car.year) return null

  const mileageKm = car.mileageKm ? `${car.mileageKm} км.` : undefined
  const horsepowerString = car.horsepower ? `${car.horsepower} л.с.` : undefined

  return {
    price: car.price.avg || car.price.final || car.price.start || 0,
    currency: car.price.currency || 'JPY',
    rating: car.rating && /[[a-zA-Z\d]+/.test(car.rating) ? car.rating : undefined,
    year: car.year || 2025,
    enginePower: car?.enginePower || 1000,
    engineType: car?.engineType || undefined,
    mileageKm,
    horsepowerString: horsepowerString,
    horsepower: car.horsepower || 0,
    color: car.color ? stringToFirstCapitalize(car.color) : undefined,
    lot: car.lot ? String(car.lot) : undefined,
    auctionDate: car.date,
    auctionSheetUrl:
      typeof car.auctionList === 'object' && car.auctionList?.url ? car.auctionList.url : undefined,
    driveType: car.driveType
      ? stringToFirstCapitalize(car.driveType?.replace?.('привод', ''))
      : undefined,
    wheelPosition: car.wheelPosition
      ? car.wheelPosition === 'left'
        ? 'Левый'
        : 'Правый'
      : undefined,
  }
}
