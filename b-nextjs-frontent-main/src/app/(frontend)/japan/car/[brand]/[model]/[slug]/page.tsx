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
import { HOME_BREADCRUMB, JAPAN_CAR_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import { Country } from '@/constants/country'
import { FAQJapanData } from '@/constants/faq'
import { generateDescription, generateH1, generateTitle } from '@/constants/meta'
import { mapperToCar, mapperToCarDescription } from '@/lib/mappers/car-catalog.mapper'
import {
  mapFastApiCarToDescription,
  mapFastApiCarToGalleryItems,
  mapFastApiCarToVisibleCard,
} from '@/lib/mappers/fastapi-car.mapper'
import { ImageGalleryMapper } from '@/lib/mappers/image-gallery.mapper'
import { getManyCatalogCarPromise, getOneByCatalogCarId } from '@/lib/query/query-promise'
import { getLiveAuctionLotByRoute } from '@/lib/services/live-auction-lot.service'
import { toModelDisplay, toReadableSlug, toUrlSlug, toValidSlug } from '@/lib/transform'
import { isMongoId } from '@/lib/utils'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 300

type Params = { params: Promise<{ brand: string; model: string; slug: string }> }

const fallbackImage = '/static/img/loading72.gif'
const isVisibleCard = <T,>(value: T | null): value is T => Boolean(value)

const getStoredCarPageData = async (brand: string, model: string, slug: string) => {
  const [item, { docs: japanDocs }, { docs: chinaDocs }] = await Promise.all([
    getOneByCatalogCarId(slug),
    getManyCatalogCarPromise(1, {
      country: Country.JAPAN,
      brand: toValidSlug(brand),
      model: model,
      neIds: [slug],
    }),
    getManyCatalogCarPromise(1, {
      country: Country.CHINA,
      brand: toValidSlug(brand),
      model: model,
    }),
  ])

  if (!item) {
    return null
  }

  const brandSlug = toUrlSlug(item.brand)
  if (item.modelSlug !== model || brandSlug !== brand) {
    return null
  }

  const carDescription = mapperToCarDescription(item)
  if (!carDescription) {
    return null
  }

  return {
    titleBrand: toModelDisplay(item.brand),
    titleModel: item.modelDisplay,
    year: item.year,
    lot: item.lot ? String(item.lot) : slug.replace(/\D/g, '').slice(0, 5),
    images:
      (item.images
        ?.map((image): ImageGalleryViewerItems | undefined => {
          if (typeof image === 'string') {
            return undefined
          }
          return ImageGalleryMapper.toProps(image)
        })
        .filter(Boolean) as ImageGalleryViewerItems[]) || [],
    description: carDescription,
    japanItems: japanDocs.map((car) => mapperToCar(car)).filter(isVisibleCard),
    chinaItems: chinaDocs.map((car) => mapperToCar(car)).filter(isVisibleCard),
  }
}

const getLiveCarPageData = async (brand: string, model: string, slug: string) => {
  const [{ current, related }, { docs: chinaDocs }] = await Promise.all([
    getLiveAuctionLotByRoute(brand, model, slug),
    getManyCatalogCarPromise(1, {
      country: Country.CHINA,
      brand: toValidSlug(brand),
      model: model,
    }),
  ])

  if (!current) {
    return null
  }

  const liveBrandSlug = toUrlSlug(current.brand || brand)
  const liveModelSlug = toUrlSlug(current.modelSlug || current.modelDisplay || current.model || model)

  if (liveBrandSlug !== brand || liveModelSlug !== model) {
    return null
  }

  return {
    titleBrand: toModelDisplay(current.brand || brand),
    titleModel: current.modelDisplay || current.model || toReadableSlug(model),
    year: Number(current.year || new Date().getFullYear()),
    lot: String(current.lot || slug),
    images: mapFastApiCarToGalleryItems(current),
    description: mapFastApiCarToDescription(current),
    japanItems: related.slice(0, 10).map((car, index) => mapFastApiCarToVisibleCard(car, index)),
    chinaItems: chinaDocs.map((car) => mapperToCar(car)).filter(isVisibleCard),
  }
}

const getCarPageData = async (brand: string, model: string, slug: string) => {
  if (isMongoId(slug)) {
    return getStoredCarPageData(brand, model, slug)
  }

  return getLiveCarPageData(brand, model, slug)
}

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { brand, model, slug } = await paramsPromise
  const pageData = await getCarPageData(brand, model, slug)

  const lot = pageData?.lot || slug.replace(/\D/g, '').slice(0, 5)
  const year = pageData?.year ? `${pageData.year} год` : ''
  const displayTitle = `${toReadableSlug(brand)} ${toReadableSlug(model)}`

  return {
    description: generateDescription.begin(`${displayTitle}, ${year} № ${lot} из Японии`, undefined),
    title: generateTitle.middleJapan(displayTitle + (year ? `, ${year}` : ''), 'Заказать', `№ ${lot}`),
    alternates: {
      canonical: './',
    },
  }
}

export default async function JapanCarsPage({ params: paramsPromise }: Params) {
  const { brand, model, slug } = await paramsPromise
  const pageData = await getCarPageData(brand, model, slug)

  if (!pageData) {
    return notFound()
  }

  const images =
    pageData.images.length > 0
      ? pageData.images
      : [
          {
            id: `${slug}-fallback`,
            src: fallbackImage,
            alt: `${pageData.titleBrand} ${pageData.titleModel}`,
            width: 800,
            height: 600,
            thumbnail: {
              id: `${slug}-fallback-thumbnail`,
              src: fallbackImage,
              alt: `${pageData.titleBrand} ${pageData.titleModel}`,
              width: 320,
              height: 240,
            },
          },
        ]

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
          {generateH1.middleJapan('', `${pageData.titleBrand} ${pageData.titleModel}`)}
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
          content={`${pageData.titleBrand} ${pageData.titleModel}, ${pageData.year} год`}
        />
        <meta
          itemProp="description"
          content={`Надежный ${pageData.titleBrand} ${pageData.titleModel} автомобиль - ${pageData.year} года`}
        />
        <ImageGalleryViewer
          className={`
            w-full
            md:w-1/2 md:pr-8
          `}
          images={images}
        />
        <CarDescription
          className={`
            w-full
            md:w-1/2
          `}
          {...pageData.description}
        />
      </BoxContainer>
      <BoxContainer>
        <BannerOrderCar />
      </BoxContainer>
      {pageData.japanItems.length > 0 && (
        <BoxContainer>
          <CarCarouselSlider title="Похожие авто" items={pageData.japanItems} />
        </BoxContainer>
      )}
      <BoxContainer>
        <Title as="h2" className="text-center">
          Преимущества
        </Title>
        <Advantages />
      </BoxContainer>
      {pageData.chinaItems.length > 0 && (
        <BoxContainer>
          <CarCarouselSlider title="Похожие авто из Китая" items={pageData.chinaItems} />
        </BoxContainer>
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
        <FaqConcat categories={FAQJapanData} />
      </BoxContainer>
      <Footer />
    </div>
  )
}
