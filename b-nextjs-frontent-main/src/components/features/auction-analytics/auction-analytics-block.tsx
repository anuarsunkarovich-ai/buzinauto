import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Money } from '@/components/ui/money'
import { getAuctionStats } from '@/lib/services/auction-stats.service'
import { SimpleLineChart } from './simple-line-chart'
import { CarVisibleCard } from '@/components/features/car-carousel/car-visible-card'
import { CarCarouselOnHoverCard } from '@/components/features/car-carousel/car-carousel-on-hover-card'
import { toUrlSlug } from '@/lib/transform'

export const AuctionAnalyticsBlock = async ({ 
  brand, 
  model, 
  filters 
}: { 
  brand: string, 
  model?: string,
  filters?: {
    min_mileage_km?: number
    max_mileage_km?: number
    min_year?: number
    max_year?: number
    rating?: string
    body?: string
  }
}) => {
  const stats = await getAuctionStats(brand, model, filters)
  if (!stats || stats.total_lots === 0) return null

  // Chart Data: reverse recent lots to show chronological order
  const chartData = stats.recent_lots
    .slice(0, 20)
    .reverse()
    .map(lot => ({
      label: lot.auction_date,
      value: lot.price_jpy
    }))

  return (
    <div className="flex flex-col space-y-6">
      {/* Block A: Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Средний чек */}
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Средний чек</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{stats.avg_price_jpy.toLocaleString('ru-RU')} ¥</span>
              <span className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold text-foreground"><Money amount={stats.avg_price_rub} /></span> + расходы
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Самый дешевый лот */}
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Мин. цена</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-500">
                {stats.price_range.min_jpy.toLocaleString('ru-RU')} ¥
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                В недавней выборке ({stats.total_lots} шт.)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Популярная комплектация */}
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Популярное</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-full justify-center">
              <span className="text-xl font-bold leading-tight break-words line-clamp-2">
                {stats.popular_modification || 'Любая комплектация'}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Частый выбор покупателей
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block B: Market Pulse (Chart) */}
      <Card className="bg-card/70 border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Пульс рынка (последние {chartData.length} продаж)</span>
            <span className="text-sm text-muted-foreground">Цена в иенах</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          <SimpleLineChart data={chartData} />
        </CardContent>
      </Card>

      {/* Block C: Sold Grid */}
      <div>
        <h3 className="text-xl font-bold mb-4">Недавно проданы (Архив)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.recent_lots.slice(0, 8).map((lot) => {
            const mileageKm = Number(String(lot.mileage ?? 0).replace(/[^\d]/g, '')) || 0
            const year = Number(lot.year) || new Date().getFullYear()
            const enginePower = Number(lot.engine_cc) || 0
            const titleParts = [lot.model, lot.body, String(year)].filter(Boolean)

            return (
              <div key={lot.lot} className="relative group flex flex-col h-full w-full">
                <CarCarouselOnHoverCard
                  orientation="vertical"
                  images={[{ src: lot.image_url || '/static/img/loading72.gif', alt: lot.model }]}
                  rating={lot.grade}
                  modelSlug={toUrlSlug(lot.model)}
                  brandSlug={toUrlSlug(lot.brand)}
                  id={lot.lot}
                  countryPath="/japan"
                  className="h-full w-full"
                >
                  <CarVisibleCard
                    orientation="vertical"
                    title={titleParts.join(' ')}
                    lot={lot.lot}
                    modelSlug={toUrlSlug(lot.model)}
                    id={lot.lot}
                    brandSlug={toUrlSlug(lot.brand)}
                    countryPath="/japan"
                    description={[lot.transmission, mileageKm ? `${mileageKm} км.` : undefined].filter(Boolean).join(', ')}
                    tags={[lot.color, enginePower ? `${enginePower} cc` : undefined, `Sold ${lot.auction_date}`].filter(Boolean) as string[]}
                    price={lot.price_jpy}
                  currency="JPY"
                  year={year}
                    horsepower={Number(lot.horsepower || 0)}
                    enginePower={enginePower}
                    engineType="gasoline"
                    location={lot.auction_date}
                    rating={lot.grade}
                    images={[{ src: lot.image_url || '/static/img/loading72.gif', alt: lot.model }]}
                    auctionDate={lot.auction_date}
                  />
                </CarCarouselOnHoverCard>
                {/* Sold Badge */}
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <div className="bg-destructive/90 text-white font-bold px-3 py-1 rounded-sm -rotate-6 border border-white/20 shadow-lg text-sm uppercase tracking-widest backdrop-blur-sm shadow-destructive/20">
                    SOLD
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
