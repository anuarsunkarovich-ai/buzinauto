import { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const UserRequestCollection: CollectionConfig = {
  slug: SlugCollectionAlias.USER_REQUEST,
  admin: {
    useAsTitle: 'name',
  },
  timestamps: true,
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Подбор автомобиля',
          value: 'CAR_SELECTION',
        },
        {
          label: 'Обратный звонок',
          value: 'CALLBACK',
        },
      ],
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'tel',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: false,
        },
        {
          name: 'issue',
          type: 'textarea',
          required: false,
        },
        {
          name: 'car',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
}
