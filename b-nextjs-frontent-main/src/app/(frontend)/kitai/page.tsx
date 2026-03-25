import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { Advantages } from '@/components/features/advantages/advantages'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import { CarAggregateOffer } from '@/components/features/car/car-aggregate-offer'
import { CarouselBrand } from '@/components/features/carousel-brand'
import { FaqConcat } from '@/components/features/faq'
import { PayloadPaginationAuto } from '@/components/features/payload-pagination'
import { Reviews } from '@/components/features/reviews/reviews'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { CHINA_BREADCRUMB, HOME_BREADCRUMB } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { FAQChinaData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise, LIMIT_PAGE } from '@/lib/query/query-promise'

export const revalidate = 300

export const metadata = {
  description: generateDescription.begin('автомобиль из Китая'),
  title: generateTitle.endChina(),
  alternates: {
    canonical: './',
  },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const { docs, ...pagination } = await getManyCatalogCarPromise(1, {
    country: Country.CHINA,
    minEnginePower:
      typeof params['minEnginePower'] === 'string' ? parseInt(params['minEnginePower']) : undefined,
    maxEnginePower:
      typeof params['maxEnginePower'] === 'string' ? parseInt(params['maxEnginePower']) : undefined,
    minPrice: typeof params['minPrice'] === 'string' ? parseInt(params['minPrice']) : undefined,
    maxPrice: typeof params['maxPrice'] === 'string' ? parseInt(params['maxPrice']) : undefined,
    minGrade: params['minGrade'] as string | undefined,
    maxGrade: params['maxGrade'] as string | undefined,
    maxMilage:
      typeof params['maxMileageKm'] === 'string' ? parseInt(params['maxMileageKm']) : undefined,
    minMilage:
      typeof params['minMileageKm'] === 'string' ? parseInt(params['minMileageKm']) : undefined,
  })

  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div
      className={`
        flex flex-col space-y-3
        md:space-y-10
      `}
    >
      <Header />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, CHINA_BREADCRUMB]} />
        <Title as="h1">{generateH1.endChina()}</Title>
        <FilterAuto
          defaultValues={{
            minEnginePower:
              typeof params['minEnginePower'] === 'string' ? params['minEnginePower'] : undefined,
            maxEnginePower:
              typeof params['maxEnginePower'] === 'string' ? params['maxEnginePower'] : undefined,
            minPrice: typeof params['minPrice'] === 'string' ? params['minPrice'] : undefined,
            maxPrice: typeof params['maxPrice'] === 'string' ? params['maxPrice'] : undefined,
            minGrade: params['minGrade'] as string | undefined,
            maxGrade: params['maxGrade'] as string | undefined,
            maxMileageKm:
              typeof params['maxMileageKm'] === 'string' ? params['maxMileageKm'] : undefined,
            minMileageKm:
              typeof params['minMileageKm'] === 'string' ? params['minMileageKm'] : undefined,
          }}
        />
        <CarCarouselOnHover items={items} />
        <PayloadPaginationAuto path="/kitai/cars" {...pagination} />
        <CarAggregateOffer
          limit={LIMIT_PAGE}
          name={generateH1.endAuctionJapan()}
          totalDocs={pagination.totalDocs}
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
          Преимущества​
        </Title>
        <Advantages />
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
        <FaqConcat categories={FAQChinaData} />
      </BoxContainer>
      <Footer />
    </div>
  )
}
