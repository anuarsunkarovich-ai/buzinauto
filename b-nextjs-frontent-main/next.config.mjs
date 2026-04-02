import { withPayload } from '@payloadcms/next/withPayload'

const getUploadsRemotePattern = () => {
  const value = process.env.UPLOADS_PUBLIC_URL

  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)
    const normalizedPath = parsed.pathname.replace(/\/+$/, '')

    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: `${normalizedPath || ''}/**`,
    }
  } catch {
    return null
  }
}

const uploadsRemotePattern = getUploadsRemotePattern()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.aleado.ru',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'auctions.aleado.ru',
        pathname: '/**',
      },
      ...(uploadsRemotePattern ? [uploadsRemotePattern] : []),
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
