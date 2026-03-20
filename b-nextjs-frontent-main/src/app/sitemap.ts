import {
  CHINA_CATALOG_BREADCRUMB,
  JAPAN_CAR_BREADCRUMB,
  SITEMAP_HTML_CONTACT,
} from '@/constants/breadcrumb'
import { Country, CountryPathname } from '@/constants/country'
import { HEADER_MENU } from '@/constants/header-menu'
import { getManyModels } from '@/lib/query/get-many-models'
import { toUrlSlug } from '@/lib/transform'
import type { MetadataRoute } from 'next'

const baseUrl = process.env.PAYLOAD_URL as string

const common: MetadataRoute.Sitemap = [
  {
    url: baseUrl,
    lastModified: new Date(2025, 7, 20),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: baseUrl + '/japan',
    lastModified: new Date(2025, 10, 4),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: baseUrl + '/japan/car/sitemap.xml',
    lastModified: new Date(2025, 8, 26),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: baseUrl + '/kitai/car/sitemap.xml',
    lastModified: new Date(2025, 8, 26),
    changeFrequency: 'weekly',
    priority: 1,
  },
  ...CountryPathname.map((path) => ({
    url: baseUrl + SITEMAP_HTML_CONTACT.path + path.pathname,
    lastModified: new Date(2025, 8, 20),
    changeFrequency: 'weekly' as const,
    priority: 1,
  })),
]

const menus: MetadataRoute.Sitemap = HEADER_MENU.reduce((a, b): string[] => {
  if (b.url) {
    return a.concat(b.url)
  } else if (b.dropdowns) {
    const urls = b.dropdowns.map((dropdown) => dropdown.url)
    return a.concat(urls)
  }
  return a
}, [] as string[]).map((url) => ({
  url: process.env.PAYLOAD_URL + url,
  lastModified: new Date(2025, 8, 17),
  changeFrequency: 'weekly',
  priority: 0.8,
}))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [japanModels, chinaModels] = await Promise.all([
    getManyModels(1, 5000, Country.JAPAN),
    getManyModels(1, 5000, Country.CHINA),
  ])

  const japanCatalog: MetadataRoute.Sitemap = japanModels.models.map((model) => {
    const url = {
      url: `${process.env.PAYLOAD_URL}${JAPAN_CAR_BREADCRUMB.path}/${toUrlSlug(model.brand)}/${model.modelSlug}`,
      lastModified: new Date(2025, 7, 20),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
    return url
  })

  const chinaCatalog: MetadataRoute.Sitemap = chinaModels.models.map((model) => {
    const url = {
      url: `${process.env.PAYLOAD_URL}${CHINA_CATALOG_BREADCRUMB.path}/${toUrlSlug(model.brand)}/${model.modelSlug}`,
      lastModified: new Date(2025, 8, 17),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
    return url
  })

  return [...common, ...menus, ...japanCatalog, ...chinaCatalog].filter((e) => {
    try {
      const url = new URL(e.url)
      if (e.url.split('https').length >= 3) return false

      return true && url.hash === ''
    } catch {
      return false
    }
  })
}
