import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselOnHover } from '@/components/features/car-carousel/car-carousel-on-hover'
import { PayloadPaginationAuto } from '@/components/features/payload-pagination'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { generateH1, generatePage, generateTitle } from '@/constants/meta'
import { mapperToCar } from '@/lib/mappers/car-catalog.mapper'
import { getManyCatalogCarPromise } from '@/lib/query/query-promise'
import { toReadableSlug, toValidSlug } from '@/lib/transform'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = { params: Promise<{ brand: string; model: string; page: string }> }

export const revalidate = 300

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand, model, page } = await paramsPromise

  return {
    description:
      generateTitle.middleAuctionJapan(
        `${toReadableSlug(brand)} ${toReadableSlug(model)}`,
        'Купить',
      ) + generatePage.end(page),
    title:
      generateTitle.middleAuctionJapan(
        `${toReadableSlug(brand)} ${toReadableSlug(model)}`,
        'Купить',
      ) + generatePage.end(page),
    alternates: {
      canonical: './',
    },
  }
}

export default async function JapanCarsPage({ params: paramsPromise }: Params) {
  const { brand, model, page } = await paramsPromise
  const { docs, ...pagination } = await getManyCatalogCarPromise(Number(page), {
    brand: toValidSlug(brand),
    model: model,
    country: Country.JAPAN,
  })

  if (!docs.length) return notFound()

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
          {generateH1.middleAuctionJapan('', `${toReadableSlug(brand)} ${toReadableSlug(model)}`) +
            generatePage.end(page)}
        </Title>
        <FilterAuto
          defaultValues={{
            make: toValidSlug(brand),
            model: model,
          }}
        />
        <CarCarouselOnHover items={items} />
        <PayloadPaginationAuto path={`/japan/cars/${brand}/${model}`} {...pagination} />
      </BoxContainer>
      <Footer />
    </div>
  )
}
