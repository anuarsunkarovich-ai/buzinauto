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
    title: `Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° Ð°ÑƒÐºÑ†Ð¸Ð¾Ð½Ð¾Ð² ${toReadableSlug(brand)} | BuzinAvto`,
    description: `Ð ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ñ†ÐµÐ½Ñ‹ Ð¿Ñ€Ð¾Ð´Ð°Ð¶ Ð¸ Ð°Ð½Ð°Ð»Ð¸Ñ‚Ð¸ÐºÐ° Ð¿Ð¾ Ð¼Ð°Ñ€ÐºÐµ ${toReadableSlug(brand)} Ð¸Ð· Ð¯Ð¿Ð¾Ð½Ð¸Ð¸.`,
  }
}

export default async function JapanBrandStatsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Params) {
  const { brand } = await paramsPromise
  const searchParams = await searchParamsPromise

  const filters = {
    min_mileage_km:
      typeof searchParams.minMileageKm === 'string'
        ? parseInt(searchParams.minMileageKm)
        : undefined,
    max_mileage_km:
      typeof searchParams.maxMileageKm === 'string'
        ? parseInt(searchParams.maxMileageKm)
        : undefined,
    min_year: typeof searchParams.minYear === 'string' ? parseInt(searchParams.minYear) : undefined,
    max_year: typeof searchParams.maxYear === 'string' ? parseInt(searchParams.maxYear) : undefined,
    rating: typeof searchParams.rating === 'string' ? searchParams.rating : undefined,
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
            { path: '/japan/stats', name: 'Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°' },
            { path: `/japan/stats/${brand}`, name: toReadableSlug(brand) },
          ]}
        />

        <div className="bg-card/20 p-6 rounded-2xl border border-border/40 mb-10">
          <FilterAuto
            defaultValues={{
              make: toValidSlug(brand),
              body: typeof searchParams.body === 'string' ? searchParams.body : undefined,
              minYear:
                typeof searchParams.minYear === 'string' ? searchParams.minYear : undefined,
              maxYear:
                typeof searchParams.maxYear === 'string' ? searchParams.maxYear : undefined,
              minMileageKm:
                typeof searchParams.minMileageKm === 'string'
                  ? searchParams.minMileageKm
                  : undefined,
              maxMileageKm:
                typeof searchParams.maxMileageKm === 'string'
                  ? searchParams.maxMileageKm
                  : undefined,
              rating: typeof searchParams.rating === 'string' ? searchParams.rating : undefined,
            }}
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Title as="h1" className="text-3xl font-black uppercase tracking-tight">
              Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° <span className="text-primary">{toReadableSlug(brand)}</span>
            </Title>
            <p className="text-muted-foreground mt-2">
              ÐžÐ±Ñ‰Ð°Ñ Ð°Ð½Ð°Ð»Ð¸Ñ‚Ð¸ÐºÐ° Ð¿Ð¾ Ð¼Ð°Ñ€ÐºÐµ. Ð”Ð¾Ð±Ð°Ð²ÑŒÑ‚Ðµ Ð¼Ð¾Ð´ÐµÐ»ÑŒ Ð² Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ðµ, Ñ‡Ñ‚Ð¾Ð±Ñ‹ ÑÑƒÐ·Ð¸Ñ‚ÑŒ Ð²Ñ‹Ð±Ð¾Ñ€ÐºÑƒ.
            </p>
          </div>

          <Href href={`/japan/cars/${brand}`}>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <Search className="w-4 h-4" />
              Ð’ÐµÑ€Ð½ÑƒÑ‚ÑŒÑÑ Ðº Ð¿Ð¾Ð¸ÑÐºÑƒ Ð² ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ðµ
            </Button>
          </Href>
        </div>

        <React.Suspense
          fallback={
            <div className="flex flex-col gap-8 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-card/40 rounded-xl" />
                ))}
              </div>
              <div className="h-64 bg-card/40 rounded-xl" />
            </div>
          }
        >
          <AuctionAnalyticsBlock brand={toValidSlug(brand)} filters={filters} />
        </React.Suspense>
      </BoxContainer>
      <Footer />
    </div>
  )
}
