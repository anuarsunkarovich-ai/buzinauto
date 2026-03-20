import { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const ExchangeRateCollection: CollectionConfig = {
  slug: SlugCollectionAlias.EXCHANGE_RATE,
  admin: {
    useAsTitle: 'title',
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            delete siblingData['title']
          },
        ],
        afterRead: [
          ({ data }) => {
            if (!data) return
            return `${data.fromCurrency} - ${data.toCurrency} `
          },
        ],
      },
    },
    {
      name: 'fromCurrency',
      type: 'text',
      required: true,
    },
    {
      name: 'toCurrency',
      type: 'text',
      required: true,
    },
    {
      name: 'rate',
      type: 'number',
      required: true,
    },
  ],
}
