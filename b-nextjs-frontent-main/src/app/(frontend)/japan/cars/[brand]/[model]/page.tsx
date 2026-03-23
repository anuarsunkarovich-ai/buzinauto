import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { JapanCarsSearchPanel } from '@/components/features/japan-cars-search-panel'
import { FaqConcat } from '@/components/features/faq'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { AuctionAnalyticsBlock } from '@/components/features/auction-analytics/auction-analytics-block'
import { BarChart3 } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise } from '@/lib/query/query-promise'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { Metadata } from 'next'
import * as React from 'react'

export const revalidate = 300

type Params = {
  params: Promise<{ brand: string; model: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand, model } = await paramsPromise

  return {
    description: generateDescription.begin(
      `${toReadableSlug(brand)} ${toReadableSlug(model)} с аукционов Японии`,
    ),
    title: generateTitle.middleAuctionJapan(
      `${toReadableSlug(brand)} ${toReadableSlug(model)}`,
      'Купить',
    ),
    alternates: {
      canonical: './',
    },
  }
}

export default async function JapanCarsPage({ params: paramsPromise, searchParams }: Params) {
  const { brand, model } = await paramsPromise
  const params = await searchParams
  const { docs } = await getManyCatalogCarPromise(1, {
    brand: toValidSlug(brand),
    model,
    country: Country.JAPAN,
    minYear: typeof params['minYear'] === 'string' ? parseInt(params['minYear']) : undefined,
    maxYear: typeof params['maxYear'] === 'string' ? parseInt(params['maxYear']) : undefined,
    minEnginePower:
      typeof params['minEnginePower'] === 'string' ? parseInt(params['minEnginePower']) : undefined,
    maxEnginePower:
      typeof params['maxEnginePower'] === 'string' ? parseInt(params['maxEnginePower']) : undefined,
    minPrice: typeof params['minPrice'] === 'string' ? parseInt(params['minPrice']) : undefined,
    maxPrice: typeof params['maxPrice'] === 'string' ? parseInt(params['maxPrice']) : undefined,
    rating: params['rating'] as string | undefined,
    maxMilage:
      typeof params['maxMileageKm'] === 'string' ? parseInt(params['maxMileageKm']) : undefined,
    minMilage:
      typeof params['minMileageKm'] === 'string' ? parseInt(params['minMileageKm']) : undefined,
  })

  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div className="flex flex-col space-y-3 md:space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            JAPAN_CAR_ROOT,
            JAPAN_CAR_BREADCRUMB,
            { path: JAPAN_CAR_BREADCRUMB.path + `/${brand}`, name: toReadableSlug(brand) },
            {
              path: JAPAN_CAR_BREADCRUMB.path + `/${brand}/${model}`,
              name: toReadableSlug(model),
            },
          ]}
        />
        <Title as="h1">
          {generateH1.middleAuctionJapan('', `${toReadableSlug(brand)} ${toReadableSlug(model)}`)}
        </Title>

        <JapanCarsSearchPanel
          initialItems={items}
          defaultValues={{
            make: toValidSlug(brand),
            model: model,
            minYear: typeof params['minYear'] === 'string' ? params['minYear'] : undefined,
            maxYear: typeof params['maxYear'] === 'string' ? params['maxYear'] : undefined,
            minEnginePower:
              typeof params['minEnginePower'] === 'string' ? params['minEnginePower'] : undefined,
            maxEnginePower:
              typeof params['maxEnginePower'] === 'string' ? params['maxEnginePower'] : undefined,
            minPrice: typeof params['minPrice'] === 'string' ? params['minPrice'] : undefined,
            maxPrice: typeof params['maxPrice'] === 'string' ? params['maxPrice'] : undefined,
            rating: params['rating'] as string | undefined,
            maxMileageKm:
              typeof params['maxMileageKm'] === 'string' ? params['maxMileageKm'] : undefined,
            minMileageKm:
              typeof params['minMileageKm'] === 'string' ? params['minMileageKm'] : undefined,
          }}
        />

        <div className="mt-8 flex justify-center">
            <Href href={`/japan/stats/${brand}/${model}`}>
              <Button variant="link" className="text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Смотреть детальную статистику рынка для {toReadableSlug(brand)} {toReadableSlug(model)}
              </Button>
            </Href>
        </div>
      </BoxContainer>
      <BoxContainer>
        <Title as="h2" className="text-center">
          Популярные бренды
        </Title>
        <CarouselBrand />
      </BoxContainer>
      <BoxContainer>
        <Title as="h2" className="text-center">
          Как купить автомобиль
        </Title>
        <TimelineBuyAuto />
      </BoxContainer>
      <FullContainer>
        <Title as="h2" className="text-center" id="reviews">
          Отзывы покупателей​
        </Title>
        <Reviews />
      </FullContainer>
      <BoxContainer>
        <Title as="h2" className="text-center">
          Частые вопросы
        </Title>
        <FaqConcat categories={FAQJapanData} />
      </BoxContainer>
      <Footer />
    </div>
  )
}

