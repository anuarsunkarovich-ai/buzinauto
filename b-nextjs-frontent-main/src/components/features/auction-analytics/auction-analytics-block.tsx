import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CarCarouselOnHoverCard } from '@/components/features/car-carousel/car-carousel-on-hover-card'
import { CarVisibleCard } from '@/components/features/car-carousel/car-visible-card'
import { getAuctionStats } from '@/lib/services/auction-stats.service'
import { toUrlSlug } from '@/lib/transform'
import { PriceCalculatorFallback } from './price-calculator'
import { SimpleLineChart } from './simple-line-chart'

export const AuctionAnalyticsBlock = async ({
  brand,
  model,
  filters,
}: {
  brand: string
  model?: string
  filters?: {
    minMileageKm?: number
    maxMileageKm?: number
    minYear?: number
    maxYear?: number
    minGrade?: string
    maxGrade?: string
    body?: string
  }
}) => {
  const stats = await getAuctionStats(brand, model, filters)
  if (!stats || stats.total_lots === 0) {
    return (
      <Card className="border-border/60 bg-card/70">
        <CardContent className="py-10 text-center text-muted-foreground">
          No completed auction lots matched the current filters yet. Try broadening the filters or
          opening the live catalog view for the latest offers.
        </CardContent>
      </Card>
    )
  }

  const chartData = stats.recent_lots
    .slice(0, 20)
    .reverse()
    .map((lot) => ({
      label: lot.auction_date,
      value: lot.price_jpy,
    }))

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Средний чек
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {stats.avg_price_jpy.toLocaleString('ru-RU')} ¥
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                <PriceCalculatorFallback
                  priceJpy={stats.avg_price_jpy}
                  priceRub={stats.avg_price_rub}
                />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Мин. цена
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-500">
                {stats.price_range.min_jpy.toLocaleString('ru-RU')} ¥
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                В недавней выборке ({stats.total_lots} шт.)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Популярное
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex h-full flex-col justify-center">
              <span className="line-clamp-2 text-xl leading-tight font-bold break-words">
                {stats.popular_modification || 'Любая комплектация'}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                Частый выбор покупателей
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              Пульс рынка (последние {chartData.length} продаж)
            </span>
            <span className="text-sm text-muted-foreground">Цена в иенах</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          <SimpleLineChart data={chartData} />
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-xl font-bold">Недавно проданы (Архив)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.recent_lots.slice(0, 8).map((lot) => {
            const mileageKm = Number(String(lot.mileage ?? 0).replace(/[^\d]/g, '')) || 0
            const year = Number(lot.year) || new Date().getFullYear()
            const enginePower = Number(lot.engine_cc) || 0
            const titleParts = [lot.model, lot.body, String(year)].filter(Boolean)

            return (
              <div key={lot.lot} className="group relative flex h-full w-full flex-col">
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
                    description={[
                      lot.transmission,
                      mileageKm ? `${mileageKm} км.` : undefined,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    tags={[
                      lot.color,
                      enginePower ? `${enginePower} cc` : undefined,
                      `Sold ${lot.auction_date}`,
                    ].filter(Boolean) as string[]}
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
                <div className="pointer-events-none absolute top-2 left-2 z-10">
                  <div className="rounded-sm border border-white/20 bg-destructive/90 px-3 py-1 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-destructive/20 backdrop-blur-sm">
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
