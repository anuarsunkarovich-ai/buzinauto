'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import type { CarVisibleCardPropsTypes } from '@/components/features/car-carousel/car-visible-card'
import { getAuctionStats } from '@/lib/services/auction-stats.service'
import { toModelDisplay, toUrlSlug } from '@/lib/transform'
import { filterAutoSchema } from '@/components/forms/filter-auto/filter-auto-schema'
import { z } from 'zod'

type SearchValues = z.infer<typeof filterAutoSchema>

interface CatalogBasedStatsProps {
  brand: string
  model?: string
  filters?: {
    min_mileage_km?: number
    max_mileage_km?: number
    min_year?: number
    max_year?: number
    minGrade?: string
    maxGrade?: string
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
        const response = await getAuctionStats(
          brand,
          model,
          {
            min_mileage_km: filters?.min_mileage_km,
            max_mileage_km: filters?.max_mileage_km,
            min_year: filters?.min_year,
            max_year: filters?.max_year,
            rating: filters?.minGrade || filters?.maxGrade ? `${filters?.minGrade || ''}-${filters?.maxGrade || ''}` : undefined,
            body: filters?.body,
          }
        )

        if (!response) {
          setError('Не удалось загрузить статистику')
          return
        }

        const mappedCars = response.recent_lots.map((lot: any) => ({
          id: lot.lot,
          title: `${lot.brand} ${lot.model}`,
          lot: lot.lot,
          brandSlug: brand.toLowerCase(),
          modelSlug: model?.toLowerCase() || '',
          countryPath: '/japan',
          description: `${lot.year} ${lot.grade}`,
          tags: [lot.grade, lot.body].filter(Boolean),
          price: lot.price_jpy,
          currency: 'JPY',
          year: lot.year,
          horsepower: lot.horsepower || 0,
          enginePower: lot.engine_cc || 0,
          engineType: 'gasoline' as const,
          location: lot.auction_name || 'Japan',
          auctionDate: lot.auction_date,
          rating: lot.grade,
          initialTotalRub: lot.price_rub,
          images: lot.image_url ? [{ src: lot.image_url, alt: `${lot.brand} ${lot.model}` }] : [],
        }))
        
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

  // Calculate statistics from the API response
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
