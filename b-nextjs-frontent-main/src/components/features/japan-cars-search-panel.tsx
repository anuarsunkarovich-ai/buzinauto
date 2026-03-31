'use client'

import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { ClientPagination } from '@/components/features/client-pagination'
import { FilterAuto, type FilterAutoPropsTypes } from '@/components/forms/filter-auto/filter-auto'
import { filterAutoSchema } from '@/components/forms/filter-auto/filter-auto-schema'
import { Text } from '@/components/ui/text'
import { mapFastApiCarToVisibleCard } from '@/lib/mappers/fastapi-car.mapper'
import { searchCars, type SearchPagination } from '@/lib/services/auction.service'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { z } from 'zod'

type JapanCarsSearchPanelProps = {
  initialItems: CarVisibleCardPropsTypes[]
  defaultValues?: FilterAutoPropsTypes['defaultValues']
}

type SearchValues = z.infer<typeof filterAutoSchema>

const CATALOG_PAGE_SIZE = 12

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

const parsePage = (value: string | null) => {
  const parsed = Number(value || '1')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export const JapanCarsSearchPanel: React.FC<JapanCarsSearchPanelProps> = ({
  initialItems,
  defaultValues,
}) => {
  const searchParams = useSearchParams()
  const initialPage = React.useMemo(() => parsePage(searchParams.get('page')), [searchParams])

  const [cars, setCars] = React.useState<CarVisibleCardPropsTypes[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const [hasSubmittedSearch, setHasSubmittedSearch] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  const [pagination, setPagination] = React.useState<SearchPagination | null>(null)
  const [lastSearchValues, setLastSearchValues] = React.useState<SearchValues | null>(null)
  const [exchangeRate, setExchangeRate] = React.useState<{
    rate: number
    source: string
    date?: string
  } | null>(null)
  const autoSearchKeyRef = React.useRef('')

  React.useEffect(() => {
    setCars(initialItems)
    setCurrentPage(initialPage)
    setHasSubmittedSearch(false)
    setExchangeRate(null)
    setSearchError(null)
    setPagination(null)
    setLastSearchValues(null)
  }, [initialItems, initialPage])

  const syncPageInUrl = React.useCallback(
    (page: number) => {
      if (typeof window === 'undefined') {
        return
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString())
      if (page > 1) {
        nextSearchParams.set('page', String(page))
      } else {
        nextSearchParams.delete('page')
      }

      const query = nextSearchParams.toString()
      const currentPath = window.location.pathname
      window.history.replaceState(
        window.history.state,
        '',
        query ? `${currentPath}?${query}` : currentPath,
      )
    },
    [searchParams],
  )

  const performSearch = React.useCallback(
    async (values: SearchValues, page: number) => {
      setHasSubmittedSearch(true)
      setLoading(true)
      setExchangeRate(null)
      setSearchError(null)
      setLastSearchValues(values)

      try {
        const response = await searchCars({
          brand: String(values.make || defaultValues?.make || '9'),
          model: values.model ? String(values.model) : undefined,
          enrichDetails: true,
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
          page,
          limit: CATALOG_PAGE_SIZE,
        })

        const nextPagination =
          response.pagination || {
            page,
            limit: CATALOG_PAGE_SIZE,
            total_items: response.results.length,
            total_pages: 1,
            has_next_page: false,
            has_prev_page: false,
          }

        setCars(response.results.map((car, index) => mapFastApiCarToVisibleCard(car, index)))
        setPagination(nextPagination)
        setCurrentPage(nextPagination.page)
        syncPageInUrl(nextPagination.page)

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
        setPagination(null)
        setSearchError('Не удалось загрузить лоты. Попробуйте обновить страницу или повторить поиск.')
      } finally {
        setLoading(false)
      }
    },
    [defaultValues?.make, syncPageInUrl],
  )

  const handleSearch = React.useCallback(
    async (values: SearchValues) => {
      await performSearch(values, 1)
    },
    [performSearch],
  )

  const handlePageChange = React.useCallback(
    async (page: number) => {
      if (!lastSearchValues || loading || page === currentPage) {
        return
      }

      await performSearch(lastSearchValues, page)
    },
    [currentPage, lastSearchValues, loading, performSearch],
  )

  React.useEffect(() => {
    if (!hasDefaultSearchValues(defaultValues)) {
      autoSearchKeyRef.current = ''
      return
    }

    const serializedDefaultValues = JSON.stringify({
      defaultValues,
      page: initialPage,
    })
    if (autoSearchKeyRef.current === serializedDefaultValues) {
      return
    }

    autoSearchKeyRef.current = serializedDefaultValues
    void performSearch(defaultValuesToSearchValues(defaultValues), initialPage)
  }, [defaultValues, initialPage, performSearch])

  const resultRangeLabel = React.useMemo(() => {
    if (!pagination || pagination.total_items === 0) {
      return null
    }

    const start = (pagination.page - 1) * pagination.limit + 1
    const end = Math.min(pagination.total_items, start + cars.length - 1)
    return `Показаны ${start}-${end} из ${pagination.total_items}`
  }, [cars.length, pagination])

  return (
    <div className="flex flex-col space-y-6">
      <FilterAuto defaultValues={defaultValues} onSearch={handleSearch} />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          {exchangeRate && (
            <Text
              as="small"
              className="rounded-lg border border-border/50 bg-secondary/10 px-3 py-1.5 text-muted-foreground"
            >
              Курс: <span className="font-bold text-foreground">{exchangeRate.rate} ₽/¥</span> (
              {exchangeRate.source})
              {exchangeRate.date && (
                <span className="ml-2">Актуальный курс иены на {exchangeRate.date}</span>
              )}
            </Text>
          )}

          {resultRangeLabel && (
            <Text as="small" className="text-muted-foreground">
              {resultRangeLabel}
            </Text>
          )}
        </div>

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
          По текущим фильтрам лоты не найдены. Попробуйте расширить поиск или выбрать другую
          модель.
        </Text>
      )}

      <CarCarouselOnHover items={cars} />

      {pagination && (
        <ClientPagination
          page={currentPage}
          totalPages={pagination.total_pages}
          hasNextPage={pagination.has_next_page}
          hasPrevPage={pagination.has_prev_page}
          onPageChange={handlePageChange}
          disabled={loading}
        />
      )}
    </div>
  )
}
