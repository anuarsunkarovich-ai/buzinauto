import { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const AuctionImageCollection: CollectionConfig = {
  slug: SlugCollectionAlias.AUCTION_MEDIA,
  admin: {
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
    readVersions: () => true,
  },
  hooks: {
    beforeValidate: [
      (args) => {
        if (args.operation === 'create' && (args?.data?.width === 319 || args?.data?.width === 1)) {
          return 'Invalid'
        }
      },
    ],
  },
  upload: {
    staticDir: './public/uploads',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        position: 'centre',
        generateImageName: (file) => `${file.originalName}-${file.sizeName}.${file.extension}`,
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
