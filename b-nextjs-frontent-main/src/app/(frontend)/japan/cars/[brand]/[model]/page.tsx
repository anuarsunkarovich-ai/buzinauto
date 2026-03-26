import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { FaqConcat } from '@/components/features/faq'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { searchCatalogCars } from '@/lib/services/catalog-search.service'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { BarChart3 } from 'lucide-react'
import { Metadata } from 'next'

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
  const { items, exchangeRate } = await searchCatalogCars({
    brand: toValidSlug(brand),
    model,
    minYear: typeof params.minYear === 'string' ? parseInt(params.minYear) : undefined,
    maxYear: typeof params.maxYear === 'string' ? parseInt(params.maxYear) : undefined,
    minEnginePower:
      typeof params.minEnginePower === 'string' ? parseInt(params.minEnginePower) : undefined,
    maxEnginePower:
      typeof params.maxEnginePower === 'string' ? parseInt(params.maxEnginePower) : undefined,
    minPrice: typeof params.minPrice === 'string' ? parseInt(params.minPrice) : undefined,
    maxPrice: typeof params.maxPrice === 'string' ? parseInt(params.maxPrice) : undefined,
    minGrade: params.minGrade as string | undefined,
    maxGrade: params.maxGrade as string | undefined,
    minMileageKm:
      typeof params.minMileageKm === 'string' ? parseInt(params.minMileageKm) : undefined,
    maxMileageKm:
      typeof params.maxMileageKm === 'string' ? parseInt(params.maxMileageKm) : undefined,
    body: params.body as string | undefined,
  })

  return (
    <div className="flex flex-col space-y-3 md:space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            JAPAN_CAR_ROOT,
            JAPAN_CAR_BREADCRUMB,
            { path: `${JAPAN_CAR_BREADCRUMB.path}/${brand}`, name: toReadableSlug(brand) },
            {
              path: `${JAPAN_CAR_BREADCRUMB.path}/${brand}/${model}`,
              name: toReadableSlug(model),
            },
          ]}
        />
        <Title as="h1">
          {generateH1.middleAuctionJapan('', `${toReadableSlug(brand)} ${toReadableSlug(model)}`)}
        </Title>

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

        <FilterAuto
          defaultValues={{
            make: toValidSlug(brand),
            model,
            minYear: typeof params.minYear === 'string' ? params.minYear : undefined,
            maxYear: typeof params.maxYear === 'string' ? params.maxYear : undefined,
            minEnginePower:
              typeof params.minEnginePower === 'string' ? params.minEnginePower : undefined,
            maxEnginePower:
              typeof params.maxEnginePower === 'string' ? params.maxEnginePower : undefined,
            minPrice: typeof params.minPrice === 'string' ? params.minPrice : undefined,
            maxPrice: typeof params.maxPrice === 'string' ? params.maxPrice : undefined,
            minGrade: params.minGrade as string | undefined,
            maxGrade: params.maxGrade as string | undefined,
            maxMileageKm:
              typeof params.maxMileageKm === 'string' ? params.maxMileageKm : undefined,
            minMileageKm:
              typeof params.minMileageKm === 'string' ? params.minMileageKm : undefined,
            body: params.body as string | undefined,
          }}
        />
        <CarCarouselOnHover items={items} />

        <div className="mt-8 flex justify-center">
          <Href href={`/japan/stats/${brand}/${model}`}>
            <Button variant="link" className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Смотреть детальную статистику рынка для {toReadableSlug(brand)}{' '}
              {toReadableSlug(model)}
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
          Отзывы покупателей
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
