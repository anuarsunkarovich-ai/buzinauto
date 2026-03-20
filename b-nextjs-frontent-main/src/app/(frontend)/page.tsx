import { FullContainer } from '@/components/common/containers/full-container'
import { Advantages } from '@/components/features/advantages/advantages'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import { CarAggregateOffer } from '@/components/features/car/car-aggregate-offer'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { FaqConcat } from '@/components/features/faq'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { YandexCard } from '@/components/features/yandex-card'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { NavButtons } from '@/components/features/nav-buttons/nav-buttons'
import { Footer } from '@/components/layout/footer'
import { Title } from '@/components/ui/title'
import { Country } from '@/constants/country'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise, LIMIT_PAGE } from '@/lib/query/query-promise'
import { Metadata } from 'next'
import { BoxContainer } from '../../components/common/containers/box-container'
import { Header } from '../../components/layout/headers/header'

export const revalidate = 300

export const metadata: Metadata = {
  description: generateDescription.begin('автомобиль с аукционов Японии'),
  title: generateTitle.endAuctionJapan(),
}

export default async function HomePage() {
  const { docs, totalDocs } = await getManyCatalogCarPromise(1, {
    country: Country.JAPAN,
  })

  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div
      className={`
        flex flex-col space-y-3
        md:space-y-10
      `}
    >
      <Header className="mb-0" />
      <BoxContainer>
        <Title as="h1">{generateH1.endAuctionJapan()}</Title>
        <NavButtons />
        <FilterAuto />
        <CarCarouselOnHover items={items} />
        <CarAggregateOffer
          limit={LIMIT_PAGE}
          name={generateH1.endAuctionJapan()}
          totalDocs={totalDocs}
          items={items}
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
      <BoxContainer>
        <Title as="h2" className="text-center">
          Преимущества
        </Title>
        <Advantages />
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
      <BoxContainer>
        <Title as="h2" className="text-center">
          Мы на карте
        </Title>
        <YandexCard />
      </BoxContainer>
      <Footer />
    </div>
  )
}
