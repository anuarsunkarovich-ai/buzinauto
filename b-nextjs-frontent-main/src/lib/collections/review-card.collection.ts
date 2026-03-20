import { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const ReviewCardCollection: CollectionConfig = {
  slug: SlugCollectionAlias.REVIEW_CARD,
  labels: {
    plural: 'Карточки отзывов',
    singular: 'Карточка отзыва',
  },
  admin: {
    useAsTitle: 'name',
  },
  timestamps: true,
  fields: [
    {
      label: 'Имя',
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      label: 'Короткий текст отзыва',
      name: 'shortText',
      type: 'text',
      required: true,
      maxLength: 256,
    },
    {
      label: 'Внешняя ссылка',
      name: 'externalLink',
      type: 'text',
      required: true,
      validate: (value: unknown): true | string => {
        if (typeof value !== 'string' || !/^https?:\/\/\S+$/.test(value)) {
          return 'Введите корректную ссылку, начинающуюся с http:// или https://'
        }
        return true
      },
    },
    {
      label: 'Изображение',
      name: 'images',
      type: 'relationship',
      relationTo: SlugCollectionAlias.AUCTION_MEDIA,
      required: true,
    },
    {
      label: 'Количество звезд',
      name: 'countStars',
      type: 'number',
      required: false,
      min: 0,
      max: 5,
      defaultValue: 5,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
