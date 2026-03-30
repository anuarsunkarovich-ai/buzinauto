import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { FaqConcat } from '@/components/features/faq'
import { JapanCarsSearchPanel } from '@/components/features/japan-cars-search-panel'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { Metadata } from 'next'

export const revalidate = 300

type Params = {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand } = await paramsPromise

  return {
    description: generateDescription.begin(`${toReadableSlug(brand)} с аукционов Японии`),
    title: generateTitle.middleAuctionJapan(toReadableSlug(brand), 'Купить'),
    alternates: {
      canonical: './',
    },
  }
}

export default async function JapanCarsPage({ params: paramsPromise, searchParams }: Params) {
  const { brand } = await paramsPromise
  const params = await searchParams

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
          ]}
        />
        <Title as="h1">{generateH1.middleAuctionJapan('', toReadableSlug(brand))}</Title>

        <JapanCarsSearchPanel
          initialItems={[]}
          defaultValues={{
            make: toValidSlug(brand),
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
            minMileageKm:
              typeof params.minMileageKm === 'string' ? params.minMileageKm : undefined,
            maxMileageKm:
              typeof params.maxMileageKm === 'string' ? params.maxMileageKm : undefined,
            body: params.body as string | undefined,
            auctionDate: typeof params.auctionDate === 'string' ? params.auctionDate : undefined,
          }}
        />
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
