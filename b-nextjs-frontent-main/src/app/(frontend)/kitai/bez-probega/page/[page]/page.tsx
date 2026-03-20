import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import { PayloadPaginationAuto } from '@/components/features/payload-pagination'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { CHINA_BREADCRUMB, CHINA_CAR_BEZ_PROBEGA, HOME_BREADCRUMB } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { generateDescription, generateH1, generatePage, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise } from '@/lib/query/query-promise'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = { params: Promise<{ page: string }> }

export const revalidate = 300

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { page } = await paramsPromise

  return {
    description:
      generateDescription.begin('автомобиль из Китай без пробега') + generatePage.end(page),
    title: generateTitle.endChina('без пробега') + generatePage.end(page),
    alternates: {
      canonical: './',
    },
  }
}

export default async function ChinaCarsPage({ params }: Params) {
  const { page } = await params
  const { docs, ...pagination } = await getManyCatalogCarPromise(Number(page), {
    maxMilage: 5000,
    country: Country.CHINA,
  })
  if (!docs.length) return notFound()

  const items = docs.map((car) => mapperToCar(car)).filter((e) => !!e)

  return (
    <div className={`
      flex flex-col space-y-3
      md:space-y-10
    `}>
      <Header />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, CHINA_BREADCRUMB, CHINA_CAR_BEZ_PROBEGA]} />
        <Title as="h1">{generateH1.endChina('без пробега') + generatePage.end(page)}</Title>
        <FilterAuto />
        <CarCarouselOnHover items={items} />
        <PayloadPaginationAuto path="/kitai/bez-probega" {...pagination} />
      </BoxContainer>
      <Footer />
    </div>
  )
}
