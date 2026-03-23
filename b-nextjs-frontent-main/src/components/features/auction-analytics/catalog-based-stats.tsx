'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { searchCars } from '@/lib/services/auction.service'
import { toModelDisplay, toUrlSlug } from '@/lib/transform'
import { filterAutoSchema } from '@/components/forms/filter-auto/filter-auto-schema'
import { z } from 'zod'

type FastApiSearchCar = Awaited<ReturnType<typeof searchCars>>['results'][number]
type SearchValues = z.infer<typeof filterAutoSchema>

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

    if (acc.some((accPart) => normalizeCarText(accPart) === normalizedPart)) {
      return acc
    }

    acc.push(rawPart)
    return acc
  }, [])
}

const mapToCarVisibleCard = (car: FastApiSearchCar): CarVisibleCardPropsTypes => {
  const year = Number(car.year || 0)
  const enginePower = Number(car.engine_cc || 0)
  const priceJpy = Number(car.price_jpy || 0)
  const horsepower = Number(car.horsepower || 0)
  
  const initialTotalRub = car.total_rub || car.price_details?.total_rub || 0
  
  const imageAlt = buildUniqueCarTextParts([
    car.brand,
    car.modelDisplay || car.model,
    car.modification,
    car.body,
    year,
    enginePower ? `${enginePower} cc` : undefined,
  ]).join(' ') || 'Автомобиль'

  return {
    id: String(car.lot || Math.random()),
    title: `${toModelDisplay(car.brand || '')} ${toModelDisplay(car.modelDisplay || car.model || '')}`,
    lot: car.lot,
    brandSlug: toUrlSlug(car.brand || ''),
    modelSlug: toUrlSlug(car.modelDisplay || car.model || ''),
    countryPath: '/japan',
    description: buildUniqueCarTextParts([
      car.grade,
      car.model_code,
      car.color,
      car.transmission,
      car.grade,
      enginePower ? `${enginePower} cc` : undefined,
    ]).join(' '),
    tags: buildUniqueCarTextParts([
      car.transmission,
      car.grade,
      car.body,
    ]),
    price: priceJpy,
    currency: 'JPY',
    year,
    horsepower,
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

interface CatalogBasedStatsProps {
  brand: string
  model?: string
  filters?: {
    min_mileage_km?: number
    max_mileage_km?: number
    min_year?: number
    max_year?: number
    rating?: string
    body?: string
  }
}

export const CatalogBasedStats: React.FC<CatalogBasedStatsProps> = ({
  brand,
  model,
  filters,
}: CatalogBasedStatsProps) => {
  const [cars, setCars] = React.useState<CarVisibleCardPropsTypes[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await searchCars({
          brand,
          model,
          auctionDate: undefined,
          rating: filters?.rating,
          minYear: filters?.min_year,
          maxYear: filters?.max_year,
          minMileageKm: filters?.min_mileage_km,
          maxMileageKm: filters?.max_mileage_km,
          minEnginePower: undefined,
          maxEnginePower: undefined,
          minPrice: undefined,
          maxPrice: undefined,
        })

        // Filter by model_code (код кузова) if specified
        let filteredResults = response.results
        if (filters?.body) {
          const selectedCode = filters.body.toUpperCase()
          filteredResults = response.results.filter((car: FastApiSearchCar) => {
            const carText = `${car.model_code || ''} ${car.model || ''} ${car.modification || ''}`.toUpperCase()
            return carText.includes(selectedCode)
          })
        }

        const mappedCars = filteredResults.map((car: FastApiSearchCar) => mapToCarVisibleCard(car))
        setCars(mappedCars)

        if (mappedCars.length === 0) {
          setError('Нет данных для указанных фильтров')
        }
      } catch (err) {
        console.error('CatalogBasedStats error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
        setCars([])
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [brand, model, filters])

  // Calculate statistics from the cars data
  const stats = React.useMemo(() => {
    if (cars.length === 0) return null

    const prices = cars.map((car: CarVisibleCardPropsTypes) => car.price).filter((p: number) => p > 0)
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    const recentCars = cars.slice(0, 10) // Show 10 most recent cars

    return {
      totalCars: cars.length,
      avgPrice: Math.round(avgPrice),
      minPrice,
      maxPrice,
      recentCars,
    }
  }, [cars])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Text>Загрузка статистики...</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center py-8">
        <Text className="text-red-500">{error}</Text>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-8">
        <Text>Нет данных для отображения</Text>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Всего авто</Text>
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-bold">{stats.totalCars.toLocaleString('ru-RU')}</Text>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Средняя цена</Text>
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-bold">{stats.avgPrice.toLocaleString('ru-RU')} ¥</Text>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Мин. цена</Text>
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-bold">{stats.minPrice.toLocaleString('ru-RU')} ¥</Text>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Макс. цена</Text>
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-bold">{stats.maxPrice.toLocaleString('ru-RU')} ¥</Text>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cars */}
      {stats.recentCars.length > 0 && (
        <div className="space-y-4">
          <Text className="text-lg font-semibold">Последние автомобили</Text>
          <CarCarouselOnHover items={stats.recentCars} />
        </div>
      )}
    </div>
  )
}
