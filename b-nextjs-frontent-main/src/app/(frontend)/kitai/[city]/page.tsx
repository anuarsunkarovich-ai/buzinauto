import { BoxContainer } from '@/components/common/containers/box-container'
import { FullContainer } from '@/components/common/containers/full-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
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
import { getManyCatalogCarPromise } from '@/lib/query/query-promise'
import { toReadableCity } from '@/lib/transform'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = { params: Promise<{ city: string }> }

export const revalidate = 300

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { city } = await paramsPromise

  return {
    description: generateDescription.beginCity('автомобиль из Китая', toReadableCity(city)),
    title: generateTitle.endChina(` с доставкой в ${toReadableCity(city)}`),
    alternates: {
      canonical: './',
    },
  }
}

export default async function ChinaDeliveryCarsPage({ params: paramsPromise }: Params) {
  const { city } = await paramsPromise

  if (!toReadableCity(city)) return notFound()

  const { docs, ...pagination } = await getManyCatalogCarPromise(1, { country: Country.CHINA })
  if (!docs.length) return notFound()

  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div className={`
      flex flex-col space-y-3
      md:space-y-10
    `}>
      <Header />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            CHINA_BREADCRUMB,
            { path: CHINA_BREADCRUMB.path + `/${city}`, name: toReadableCity(city)! },
          ]}
        />
        <Title as="h1">{generateH1.endChina(`с доставкой в ${toReadableCity(city)}`)}</Title>
        <FilterAuto />
        <CarCarouselOnHover items={items} />
        <PayloadPaginationAuto path="/kitai/cars" {...pagination} />
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
        <FaqConcat categories={FAQChinaData} />
      </BoxContainer>
      <Footer />
    </div>
  )
}
