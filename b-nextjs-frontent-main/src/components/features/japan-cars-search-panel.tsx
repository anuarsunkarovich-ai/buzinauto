'use client'

import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { FilterAuto, type FilterAutoPropsTypes } from '@/components/forms/filter-auto/filter-auto'
import { filterAutoSchema } from '@/components/forms/filter-auto/filter-auto-schema'
import { mapFastApiCarToVisibleCard } from '@/lib/mappers/fastapi-car.mapper'
import { searchCars } from '@/lib/services/auction.service'
import { Text } from '@/components/ui/text'
import * as React from 'react'
import { z } from 'zod'

type JapanCarsSearchPanelProps = {
  initialItems: CarVisibleCardPropsTypes[]
  defaultValues?: FilterAutoPropsTypes['defaultValues']
}

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

export const JapanCarsSearchPanel: React.FC<JapanCarsSearchPanelProps> = ({
  initialItems,
  defaultValues,
}) => {
  const [cars, setCars] = React.useState<CarVisibleCardPropsTypes[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const [hasSubmittedSearch, setHasSubmittedSearch] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)
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
    setSearchError(null)
  }, [initialItems])

  const handleSearch = React.useCallback(
    async (values: SearchValues) => {
      setHasSubmittedSearch(true)
      setLoading(true)
      setExchangeRate(null)
      setSearchError(null)

      try {
        const response = await searchCars({
          brand: String(values.make || defaultValues?.make || '9'),
          model: values.model ? String(values.model) : undefined,
          body: values.body ? String(values.body) : undefined,
          auctionDate: values.auctionDate ? String(values.auctionDate) : undefined,
          rating: values.rating ? String(values.rating) : undefined,
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
          limit: 100,
        })

        setCars(response.results.map((car, index) => mapFastApiCarToVisibleCard(car, index)))

        if (response.exchange_rate) {
          setExchangeRate({
            rate: response.exchange_rate,
            source: response.rate_source || 'ATB Bank',
            date: response.rate_date,
          })
        }
      } catch (error) {
        console.error('Japan catalog search failed:', error)
        setCars([])
        setSearchError('Не удалось загрузить лоты. Попробуйте обновить страницу или повторить поиск.')
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

      {searchError && (
        <Text as="small" className="text-destructive">
          {searchError}
        </Text>
      )}

      {!loading && hasSubmittedSearch && cars.length === 0 && (
        <Text as="small" className="text-muted-foreground">
          По текущим фильтрам лоты не найдены. Попробуйте расширить поиск или выбрать другую модель.
        </Text>
      )}
      <CarCarouselOnHover items={cars} />
    </div>
  )
}
