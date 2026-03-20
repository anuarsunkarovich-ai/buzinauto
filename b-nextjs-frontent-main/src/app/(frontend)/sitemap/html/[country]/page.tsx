import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, SITEMAP_HTML_CONTACT } from '@/constants/breadcrumb'
import { mapToDisplayCountry, mapToValidCountry } from '@/constants/country'
import { getManyModels, GetManyModelsResponse } from '@/lib/query/get-many-models'
import { toModelDisplay, toReadableSlug, toUrlSlug } from '@/lib/transform'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 300

type Params = { params: Promise<{ country: string }> }

export async function generateMetadata({ params: paramsPromise }: Params): Promise<Metadata> {
  const { country } = await paramsPromise

  return {
    title: `Модели авто из ${mapToDisplayCountry(country)?.genitiveLabel}`,
    alternates: {
      canonical: './',
    },
  }
}

export default async function Page({ params: paramsPromise }: Params) {
  const { country } = await paramsPromise

  const models = await getManyModels(1, 5000, mapToValidCountry(country))

  if (!models.models.length) {
    return notFound()
  }

  const groupModels = models.models.reduce(
    (a, b) => {
      const brand = b.brand
      if (brand in a) {
        return {
          ...a,
          [brand]: a[brand].concat(b),
        }
      }
      return {
        ...a,
        [brand]: [b],
      }
    },
    {} as Record<string, GetManyModelsResponse['models']>,
  )

  return (
    <div className={`
      flex flex-col space-y-3
      md:space-y-10
    `}>
      <Header className="mb-0" />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            {
              path: SITEMAP_HTML_CONTACT.path + `/${country}`,
              name: mapToDisplayCountry(country)?.label || country,
            },
          ]}
        />
        <Title as="h1">Модели авто из {mapToDisplayCountry(country)?.genitiveLabel}</Title>
      </BoxContainer>
      <BoxContainer>
        <div className="flex w-full flex-col justify-center space-y-4">
          {Object.entries(groupModels).map(([brand, items]) => {
            return (
              <div className="space-y-2" key={brand}>
                <div className={`
                  grid grid-cols-1 justify-items-center
                  sm:grid-cols-2
                  md:grid-cols-3 md:justify-items-start
                `}>
                  {items.map((item) => (
                    <Button
                      key={brand + item.model}
                      variant="link"
                      asChild
                      className="justify-start text-white"
                    >
                      <Href href={`/${country}/cars/` + toUrlSlug(brand) + '/' + item.modelSlug}>
                        {toModelDisplay(item.brand)} {toReadableSlug(item.model)}
                      </Href>
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </BoxContainer>
      <Footer />
    </div>
  )
}
