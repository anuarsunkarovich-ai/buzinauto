import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { AuctionAnalyticsBlock } from '@/components/features/auction-analytics/auction-analytics-block'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { Metadata } from 'next'
import * as React from 'react'
import { Href } from '@/components/ui/href'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'

export const revalidate = 3600

type Params = {
  params: Promise<{ brand: string; model: string }>
}

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand, model } = await paramsPromise
  return {
    title: `Статистика аукционов ${toReadableSlug(brand)} ${toReadableSlug(model)} | BuzinAvto`,
    description: `Реальные цены продаж и аналитика по модели ${toReadableSlug(brand)} ${toReadableSlug(model)} из Японии.`,
  }
}

export default async function JapanModelStatsPage({ 
  params: paramsPromise,
  searchParams: searchParamsPromise 
}: {
  params: Promise<{ brand: string; model: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { brand, model } = await paramsPromise
  const searchParams = await searchParamsPromise

  const filters = {
    min_mileage_km: typeof searchParams.minMileageKm === 'string' ? parseInt(searchParams.minMileageKm) : undefined,
    max_mileage_km: typeof searchParams.maxMileageKm === 'string' ? parseInt(searchParams.maxMileageKm) : undefined,
    min_year: typeof searchParams.minYear === 'string' ? parseInt(searchParams.minYear) : undefined, // Check if FilterAuto uses minYear or minEngine
    rating: typeof searchParams.rating === 'string' ? searchParams.rating : undefined,
  }

  return (
    <div className="flex flex-col space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            JAPAN_CAR_ROOT,
            { path: '/japan/stats', name: 'Статистика' },
            { path: `/japan/stats/${brand}`, name: toReadableSlug(brand) },
            { path: `/japan/stats/${brand}/${model}`, name: toReadableSlug(model) },
          ]}
        />
        
        <div className="bg-card/20 p-6 rounded-2xl border border-border/40 mb-10">
           <FilterAuto 
              defaultValues={{
                make: toValidSlug(brand),
                model: model,
                minMileageKm: typeof searchParams.minMileageKm === 'string' ? searchParams.minMileageKm : undefined,
                maxMileageKm: typeof searchParams.maxMileageKm === 'string' ? searchParams.maxMileageKm : undefined,
                rating: typeof searchParams.rating === 'string' ? searchParams.rating : undefined,
              }}
           />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Title as="h1" className="text-3xl font-black uppercase tracking-tight">
              Статистика <span className="text-primary">{toReadableSlug(brand)} {toReadableSlug(model)}</span>
            </Title>
            <p className="text-muted-foreground mt-2">Анализ рынка с учетом выбранных фильтров</p>
          </div>
          
          <Href href={`/japan/cars/${brand}/${model}`}>
            <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5">
              <Search className="w-4 h-4" />
              Вернуться к поиску в каталоге
            </Button>
          </Href>
        </div>

        <React.Suspense fallback={
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card/40 rounded-xl" />)}
            </div>
            <div className="h-64 bg-card/40 rounded-xl" />
          </div>
        }>
          <AuctionAnalyticsBlock 
            brand={toValidSlug(brand)} 
            model={model} 
            filters={filters}
          />
        </React.Suspense>
      </BoxContainer>
      <Footer />
    </div>
  )
}
