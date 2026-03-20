import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { SlugCollectionAlias } from '@/lib/dictionaries/slug-collection.dictionary'
import { toUrlSlug } from '@/lib/transform'

const baseUrl = process.env.PAYLOAD_URL as string

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      limit: 50000,
      collection: SlugCollectionAlias.CATALOG_CAR,
      pagination: false,
      depth: 0,
      select: {
        modelSlug: true,
        brand: true,
        id: true,
        updatedAt: true,
      },
      where: {
        isFinish: {
          equals: true,
        },
        saleCountry: {
          equals: 'CHINA',
        },
      },
    })

    return docs.map(({ id, modelSlug, brand, updatedAt }) => {
      const brandSlug = toUrlSlug(brand)
      return {
        url: `${baseUrl}/kitai/car/${brandSlug}/${modelSlug}/${id}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      }
    })
  } catch {
    return []
  }
}
