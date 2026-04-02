import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { SlugCollectionAlias } from './lib/dictionaries/slug-collection.dictionary'
import { CollectionsService } from './lib/services/collections.service'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const parseOriginList = (...values: Array<string | undefined>) =>
  Array.from(
    new Set(
      values
        .flatMap((value) => (value || '').split(','))
        .map((value) => trimTrailingSlash(value.trim()))
        .filter(Boolean),
    ),
  )

const payloadUrl =
  process.env.PAYLOAD_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '')

const allowedOrigins = parseOriginList(
  payloadUrl,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.PAYLOAD_EXTRA_ALLOWED_ORIGINS,
)

const securityConfig = allowedOrigins.length
  ? {
      cors: allowedOrigins,
      csrf: allowedOrigins,
    }
  : {}

const s3Enabled = Boolean(
  process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
)

const plugins = s3Enabled
  ? [
      s3Storage({
        collections: {
          [SlugCollectionAlias.AUCTION_MEDIA]: true,
        },
        bucket: process.env.S3_BUCKET || '',
        config: {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          region: process.env.S3_REGION || '',
        },
      }),
    ]
  : []

export default buildConfig({
  admin: {
    user: SlugCollectionAlias.USER_PROFILE,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  ...securityConfig,
  collections: CollectionsService.getAll(),
  editor: lexicalEditor(),
  plugins,
  serverURL: payloadUrl || undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
})
