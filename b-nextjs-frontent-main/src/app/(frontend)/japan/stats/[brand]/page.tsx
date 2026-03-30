import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { AuctionAnalyticsBlock } from '@/components/features/auction-analytics/auction-analytics-block'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { Search } from 'lucide-react'
import { Metadata } from 'next'
import * as React from 'react'

export const revalidate = 3600

type Params = {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand } = await paramsPromise

  return {
    title: `Статистика аукционов ${toReadableSlug(brand)} | BuzinAvto`,
    description: `Реальные цены продаж и аналитика по марке ${toReadableSlug(brand)} из Японии.`,
  }
}

export default async function JapanBrandStatsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Params) {
  const { brand } = await paramsPromise
  const searchParams = await searchParamsPromise
  const currentPage =
    typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page) || 1) : 1

  const filters = {
    minMileageKm:
      typeof searchParams.minMileageKm === 'string'
        ? parseInt(searchParams.minMileageKm)
        : undefined,
    maxMileageKm:
      typeof searchParams.maxMileageKm === 'string'
        ? parseInt(searchParams.maxMileageKm)
        : undefined,
    minYear: typeof searchParams.minYear === 'string' ? parseInt(searchParams.minYear) : undefined,
    maxYear: typeof searchParams.maxYear === 'string' ? parseInt(searchParams.maxYear) : undefined,
    minGrade: typeof searchParams.minGrade === 'string' ? searchParams.minGrade : undefined,
    maxGrade: typeof searchParams.maxGrade === 'string' ? searchParams.maxGrade : undefined,
    body: typeof searchParams.body === 'string' ? searchParams.body : undefined,
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
          ]}
        />

        <div className="mb-10 rounded-2xl border border-border/40 bg-card/20 p-6">
          <FilterAuto
            defaultValues={{
              make: toValidSlug(brand),
              body: typeof searchParams.body === 'string' ? searchParams.body : undefined,
              minYear: typeof searchParams.minYear === 'string' ? searchParams.minYear : undefined,
              maxYear: typeof searchParams.maxYear === 'string' ? searchParams.maxYear : undefined,
              minMileageKm:
                typeof searchParams.minMileageKm === 'string'
                  ? searchParams.minMileageKm
                  : undefined,
              maxMileageKm:
                typeof searchParams.maxMileageKm === 'string'
                  ? searchParams.maxMileageKm
                  : undefined,
              minGrade: typeof searchParams.minGrade === 'string' ? searchParams.minGrade : undefined,
              maxGrade: typeof searchParams.maxGrade === 'string' ? searchParams.maxGrade : undefined,
            }}
          />
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Title as="h1" className="text-3xl font-black tracking-tight uppercase">
              Статистика <span className="text-primary">{toReadableSlug(brand)}</span>
            </Title>
            <p className="mt-2 text-muted-foreground">
              Общая аналитика по марке. Добавьте модель в фильтре, чтобы сузить выборку.
            </p>
          </div>

          <Href href={`/japan/cars/${brand}`}>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <Search className="h-4 w-4" />
              Вернуться к поиску в каталоге
            </Button>
          </Href>
        </div>

        <React.Suspense
          fallback={
            <div className="flex animate-pulse flex-col gap-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-card/40" />
                ))}
              </div>
              <div className="h-64 rounded-xl bg-card/40" />
            </div>
          }
        >
          <AuctionAnalyticsBlock
            brand={toValidSlug(brand)}
            filters={filters}
            page={currentPage}
            pathname={`/japan/stats/${brand}`}
            query={searchParams}
          />
        </React.Suspense>
      </BoxContainer>
      <Footer />
    </div>
  )
}
