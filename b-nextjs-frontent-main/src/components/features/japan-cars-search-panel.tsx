'use client'

import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { FilterAuto, type FilterAutoPropsTypes } from '@/components/forms/filter-auto/filter-auto'
import { filterAutoSchema } from '@/components/forms/filter-auto/filter-auto-schema'
import { Text } from '@/components/ui/text'
import { searchCars } from '@/lib/services/auction.service'
import { toModelDisplay, toUrlSlug } from '@/lib/transform'
import * as React from 'react'
import { z } from 'zod'

type JapanCarsSearchPanelProps = {
  initialItems: CarVisibleCardPropsTypes[]
  defaultValues?: FilterAutoPropsTypes['defaultValues']
}

type FastApiSearchCar = Awaited<ReturnType<typeof searchCars>>['results'][number]
type SearchValues = z.infer<typeof filterAutoSchema>

const hasDefaultSearchValues = (defaultValues?: FilterAutoPropsTypes['defaultValues']) =>
  Boolean(
    defaultValues?.make ||
      defaultValues?.model ||
      defaultValues?.body ||
      defaultValues?.auctionDate ||
      defaultValues?.rating ||
      defaultValues?.minGrade ||
      defaultValues?.maxGrade ||
      defaultValues?.minYear ||
      defaultValues?.maxYear ||
      defaultValues?.minMileageKm ||
      defaultValues?.maxMileageKm ||
      defaultValues?.minEnginePower ||
      defaultValues?.maxEnginePower ||
      defaultValues?.minPrice ||
      defaultValues?.maxPrice,
  )

const toNumber = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const defaultValuesToSearchValues = (
  defaultValues?: FilterAutoPropsTypes['defaultValues'],
): SearchValues => ({
  make: defaultValues?.make,
  model: defaultValues?.model,
  body: defaultValues?.body,
  auctionDate: defaultValues?.auctionDate,
  rating: defaultValues?.rating,
  minGrade: defaultValues?.minGrade,
  maxGrade: defaultValues?.maxGrade,
  minYear: toNumber(defaultValues?.minYear),
  maxYear: toNumber(defaultValues?.maxYear),
  minMileageKm: toNumber(defaultValues?.minMileageKm),
  maxMileageKm: toNumber(defaultValues?.maxMileageKm),
  minEnginePower: toNumber(defaultValues?.minEnginePower),
  maxEnginePower: toNumber(defaultValues?.maxEnginePower),
  minPrice: toNumber(defaultValues?.minPrice),
  maxPrice: toNumber(defaultValues?.maxPrice),
  saleCountry: defaultValues?.saleCountry,
})

const pickImage = (car: FastApiSearchCar) => {
  return car.image_url || car.image_urls?.[0] || '/static/img/loading72.gif'
}

const buildImages = (car: FastApiSearchCar, fallbackAlt: string) => {
  const sources = car.image_urls?.length ? car.image_urls : [pickImage(car)]

  return sources
    .filter(Boolean)
    .map((src, index) => ({
      src,
      alt: index === 0 ? fallbackAlt : `${fallbackAlt} ${index + 1}`,
    }))
}

const normalizeCarText = (value: string | number | undefined | null) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '')

const buildUniqueCarTextParts = (parts: Array<string | number | undefined | null>) => {
  return parts.reduce<string[]>((acc, part) => {
    const rawPart = String(part || '').trim()
    if (!rawPart) {
      return acc
    }

    const normalizedPart = normalizeCarText(rawPart)
    if (!normalizedPart) {
      return acc
    }

    const isDuplicate = acc.some((existingPart) => {
      const normalizedExisting = normalizeCarText(existingPart)
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

const mapFastApiCarToVisibleCard = (
  car: FastApiSearchCar,
  index: number,
): CarVisibleCardPropsTypes => {
  const brand = car.brand || 'Japan'
  const model = car.modelDisplay || car.model || car.model_code || 'Model'
  const year = Number(car.year || new Date().getFullYear())
  const priceJpy = Number(
    car.calculation_price_jpy || car.average_price_jpy || car.price_jpy || 0,
  )
  const enginePower = Number(car.engine_cc || 0)
  const mileageKm = Number(String(car.mileage ?? 0).replace(/[^\d]/g, '')) || 0
  const initialTotalRub = Number(car.total_rub || 0)
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
    rating: car.rating || undefined,
    initialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    initialCommercialTotalRub: initialTotalRub > 0 ? initialTotalRub : undefined,
    images: buildImages(car, imageAlt),
  }
}

export const JapanCarsSearchPanel: React.FC<JapanCarsSearchPanelProps> = ({
  initialItems,
  defaultValues,
}) => {
  const [cars, setCars] = React.useState<CarVisibleCardPropsTypes[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const [hasSubmittedSearch, setHasSubmittedSearch] = React.useState(false)
  const [exchangeRate, setExchangeRate] = React.useState<{
    rate: number
    source: string
    date?: string
  } | null>(null)
  const autoSearchKeyRef = React.useRef('')

  React.useEffect(() => {
    setCars(initialItems)
    setHasSubmittedSearch(false)
    setExchangeRate(null)
  }, [initialItems])

  const handleSearch = React.useCallback(
    async (values: SearchValues) => {
      setHasSubmittedSearch(true)
      setLoading(true)
      setExchangeRate(null)
      try {
        const response = await searchCars({
          brand: String(values.make || defaultValues?.make || '9'),
          model: values.model ? String(values.model) : undefined,
          body: values.body ? String(values.body) : undefined,
          auctionDate: values.auctionDate ? String(values.auctionDate) : undefined,
          minGrade: values.minGrade ? String(values.minGrade) : undefined,
          maxGrade: values.maxGrade ? String(values.maxGrade) : undefined,
          minYear: typeof values.minYear === 'number' ? values.minYear : undefined,
          maxYear: typeof values.maxYear === 'number' ? values.maxYear : undefined,
          minMileageKm: typeof values.minMileageKm === 'number' ? values.minMileageKm : undefined,
          maxMileageKm: typeof values.maxMileageKm === 'number' ? values.maxMileageKm : undefined,
          minEnginePower:
            typeof values.minEnginePower === 'number' ? values.minEnginePower : undefined,
          maxEnginePower:
            typeof values.maxEnginePower === 'number' ? values.maxEnginePower : undefined,
          minPrice: typeof values.minPrice === 'number' ? values.minPrice : undefined,
          maxPrice: typeof values.maxPrice === 'number' ? values.maxPrice : undefined,
        })

        setCars(response.results.map((car, index) => mapFastApiCarToVisibleCard(car, index)))
        if (response.exchange_rate) {
          setExchangeRate({
            rate: response.exchange_rate,
            source: response.rate_source || 'ATB Bank',
            date: response.rate_date,
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [defaultValues?.make],
  )

  React.useEffect(() => {
    if (!hasDefaultSearchValues(defaultValues)) {
      autoSearchKeyRef.current = ''
      return
    }

    const serializedDefaultValues = JSON.stringify(defaultValues)
    if (autoSearchKeyRef.current === serializedDefaultValues) {
      return
    }

    autoSearchKeyRef.current = serializedDefaultValues
    void handleSearch(defaultValuesToSearchValues(defaultValues))
  }, [defaultValues, handleSearch])

  return (
    <div className="flex flex-col space-y-6">
      <FilterAuto defaultValues={defaultValues} onSearch={handleSearch} />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {exchangeRate && (
          <Text
            as="small"
            className="rounded-lg border border-border/50 bg-secondary/10 px-3 py-1.5 text-muted-foreground"
          >
            Курс: <span className="font-bold text-foreground">{exchangeRate.rate} ₽/¥</span> (
            {exchangeRate.source})
            {exchangeRate.date && (
              <span className="ml-2">
                Актуальный курс иены банка АТБ на {exchangeRate.date}: {exchangeRate.rate}
              </span>
            )}
          </Text>
        )}

        {loading && (
          <Text as="small" className="animate-pulse text-muted-foreground">
            Загрузка свежих лотов...
          </Text>
        )}
      </div>

      {!loading && hasSubmittedSearch && cars.length === 0 && (
        <Text as="small" className="text-muted-foreground">
          No live lots match the current filters. Try broadening the filters or choosing another model.
        </Text>
      )}
      <CarCarouselOnHover items={cars} />
    </div>
  )
}
