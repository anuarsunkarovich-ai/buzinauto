import { CollectionConfig } from 'payload'
import { CatalogCarCollectionConfig } from '../collections/catalog-car-collection'
import { ExchangeRateCollection } from '../collections/exchange-rate.collection'
import { AuctionImageCollection } from '../collections/media-collection'
import { ProfileUserCollection } from '../collections/profile-user-collection'
import { GroupCollectionAlias } from '../dictionaries/group-collection.dictionary'
import { UserRequestCollection } from '../collections/user-request-collection'
import { ReviewCardCollection } from '../collections/review-card.collection'

const GroupCollections: Record<keyof typeof GroupCollectionAlias, CollectionConfig[]> = {
  PROFILE: [ProfileUserCollection, UserRequestCollection, ReviewCardCollection],
  CATALOG: [CatalogCarCollectionConfig],
  RATE: [ExchangeRateCollection],
  MEDIA: [AuctionImageCollection],
}

export class CollectionsService {
  public static getAll() {
    const result = Object.entries<CollectionConfig[]>(GroupCollections).map(([key, value]) => {
      return value.map((e) => {
        if ('admin' in e && typeof e.admin !== 'undefined') {
          e.admin.group = key
        } else {
          e = {
            ...e,
            admin: {
              group: key,
            },
          }
        }
        return e
      })
    })
    return result.reduce((a, b) => {
      return a.concat(b)
    }, [])
  }
}
