import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { JapanCarsSearchPanel } from '@/components/features/japan-cars-search-panel'
import { FaqConcat } from '@/components/features/faq'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise } from '@/lib/query/query-promise'

export const revalidate = 300

export const metadata = {
  description: generateDescription.begin('автомобилей с аукционов Японии', 'Каталог'),
  title: generateTitle.middleAuctionJapan('авто', 'Каталог'),
  alternates: {
    canonical: './',
  },
}

export default async function JapanCarsPage() {
  const { docs } = await getManyCatalogCarPromise(1, { country: Country.JAPAN })
  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div className="flex flex-col space-y-3 md:space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, JAPAN_CAR_ROOT, JAPAN_CAR_BREADCRUMB]} />
        <Title as="h1">{generateH1.middleAuctionJapan('автомобилей', 'Каталог')}</Title>
        <JapanCarsSearchPanel initialItems={items} />
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

