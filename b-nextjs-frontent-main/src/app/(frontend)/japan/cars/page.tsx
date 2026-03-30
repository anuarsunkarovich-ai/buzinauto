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

export const revalidate = 300

export const metadata = {
  description: generateDescription.begin('автомобилей с аукционов Японии', 'Каталог'),
  title: generateTitle.middleAuctionJapan('авто', 'Каталог'),
  alternates: {
    canonical: './',
  },
}

export default async function JapanCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col space-y-3 md:space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, JAPAN_CAR_ROOT, JAPAN_CAR_BREADCRUMB]} />
        <Title as="h1">{generateH1.middleAuctionJapan('автомобилей', 'Каталог')}</Title>
        <JapanCarsSearchPanel
          initialItems={[]}
          defaultValues={{
            make: typeof params.make === 'string' ? params.make : undefined,
            model: typeof params.model === 'string' ? params.model : undefined,
            minYear: typeof params.minYear === 'string' ? params.minYear : undefined,
            maxYear: typeof params.maxYear === 'string' ? params.maxYear : undefined,
            minEnginePower:
              typeof params.minEnginePower === 'string' ? params.minEnginePower : undefined,
            maxEnginePower:
              typeof params.maxEnginePower === 'string' ? params.maxEnginePower : undefined,
            minPrice: typeof params.minPrice === 'string' ? params.minPrice : undefined,
            maxPrice: typeof params.maxPrice === 'string' ? params.maxPrice : undefined,
            rating: typeof params.rating === 'string' ? params.rating : undefined,
            minGrade: typeof params.minGrade === 'string' ? params.minGrade : undefined,
            maxGrade: typeof params.maxGrade === 'string' ? params.maxGrade : undefined,
            maxMileageKm:
              typeof params.maxMileageKm === 'string' ? params.maxMileageKm : undefined,
            minMileageKm:
              typeof params.minMileageKm === 'string' ? params.minMileageKm : undefined,
            auctionDate:
              typeof params.auctionDate === 'string' ? params.auctionDate : undefined,
            body: typeof params.body === 'string' ? params.body : undefined,
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
