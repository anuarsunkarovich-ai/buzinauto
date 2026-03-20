import type { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const ProfileUserCollection: CollectionConfig = {
  slug: SlugCollectionAlias.USER_PROFILE,
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      hasMany: false,
    },
  ],
}
