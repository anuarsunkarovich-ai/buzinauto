import { BoxContainer } from '@/components/common/containers/box-container'
import { Advantages } from '@/components/features/advantages/advantages'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { CarCarouselSlider } from '@/components/features/car-carousel/car-carousel-slider'
import { CarDescription } from '@/components/features/car/car-description'
import { FaqConcat } from '@/components/features/faq'
import { TimelineBuyAuto } from '@/components/features/timeline-buy-auto'
import { BannerOrderCar } from '@/components/forms/order-car/banner-order-car'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import {
  ImageGalleryViewer,
  ImageGalleryViewerItems,
} from '@/components/ui/image/image-gallery-viewer'
import { Title } from '@/components/ui/title'
import { CHINA_BREADCRUMB, CHINA_CATALOG_BREADCRUMB, HOME_BREADCRUMB } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { FAQChinaData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar, mapperToCarDescription } from '@/lib/mappers/car-catalog.mapper'
import { ImageGalleryMapper } from '@/lib/mappers/image-gallery.mapper'
import { getManyCatalogCarPromise, getOneByCatalogCarId } from '@/lib/query/query-promise'
import { toModelDisplay, toReadableSlug, toUrlSlug, toValidSlug } from '@/lib/transform'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 300

type Params = { params: Promise<{ brand: string; model: string; slug: string }> }

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand, model, slug } = await paramsPromise

  const car = await getOneByCatalogCarId(slug)
  const firstLot = String(car?.lot) || ''

  const lot = firstLot + slug.replace(/\D/g, '').slice(0, 3)

  return {
    description: generateDescription.begin(
      `${toReadableSlug(brand)} ${toReadableSlug(model)}, ${car?.year ? car?.year + ' год' : ''} № ${lot} из Китай`,
      undefined,
    ),
    title: generateTitle.middleChina(
      `${toReadableSlug(brand)} ${toReadableSlug(model)}, ${car?.year ? car?.year + ' год' : ''}`,
      'Заказать',
      `№ ${lot}`,
    ),
    alternates: {
      canonical: './',
    },
  }
}

export default async function ChinaCarsPage({ params: paramsPromise }: Params) {
  const { brand, model, slug } = await paramsPromise
  const [item, { docs: chinaDocs }, { docs: japanDocs }] = await Promise.all([
    getOneByCatalogCarId(slug),
    getManyCatalogCarPromise(1, {
      country: Country.CHINA,
      brand: toValidSlug(brand),
      model: model,
      neIds: [slug],
    }),
    getManyCatalogCarPromise(1, {
      country: Country.JAPAN,
      brand: toValidSlug(brand),
      model: model,
    }),
  ])
  if (!item) return notFound()

  const brandSlug = toUrlSlug(item.brand)
  if (item.modelSlug !== model || brandSlug !== brand) return notFound()
  const car = mapperToCarDescription(item)
  if (!car) return notFound()

  const chinaItems = chinaDocs.map((car) => mapperToCar(car)).filter((e) => !!e)
  const japanItems = japanDocs.map((car) => mapperToCar(car)).filter((e) => !!e)

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
            CHINA_BREADCRUMB,
            CHINA_CATALOG_BREADCRUMB,
            { path: CHINA_CATALOG_BREADCRUMB.path + `/${brand}`, name: toReadableSlug(brand) },
            {
              path: CHINA_CATALOG_BREADCRUMB.path + `/${brand}/${model}`,
              name: toReadableSlug(model),
            },
          ]}
        />
        <Title as="h1">
          {generateH1.middleChina('', `${toReadableSlug(brand)} ${toReadableSlug(model)}`)}
        </Title>
      </BoxContainer>
      <BoxContainer
        className={`
          flex flex-col
          md:flex-row
        `}
        itemType="http://schema.org/Product"
        itemScope
      >
        <meta
          itemProp="name"
          content={`${toModelDisplay(item.brand)} ${item.modelDisplay}, ${item.year} год`}
        />
        <meta
          itemProp="description"
          content={`Комфортный ${toModelDisplay(item.brand)} ${item.modelDisplay} автомобиль - ${item.year} года${item.color ? `, цвет ${item.color}` : ''}`}
        />
        <ImageGalleryViewer
          className={`
            w-full
            md:w-1/2 md:pr-8
          `}
          images={
            item.images
              ?.map((image): ImageGalleryViewerItems | undefined => {
                if (typeof image === 'string') return
                return ImageGalleryMapper.toProps(image)
              })
              .filter((e) => !!e) as ImageGalleryViewerItems[]
          }
        />
        <CarDescription
          className={`
            w-full
            md:w-1/2
          `}
          {...car}
        />
      </BoxContainer>
      <BoxContainer>
        <BannerOrderCar />
      </BoxContainer>
      {chinaItems.length && (
        <BoxContainer>
          <CarCarouselSlider title="Похожие авто" items={chinaItems} />
        </BoxContainer>
      )}
      <BoxContainer>
        <Title as="h2" className="text-center">
          Преимущества​
        </Title>
        <Advantages />
      </BoxContainer>
      {japanItems.length ? (
        <BoxContainer>
          <CarCarouselSlider title="Похожие авто из Японии" items={japanItems} />
        </BoxContainer>
      ) : (
        <></>
      )}
      <BoxContainer>
        <Title as="h2" className="text-center">
          Как купить автомобиль
        </Title>
        <TimelineBuyAuto />
      </BoxContainer>
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
