import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          // PayloadCMS админ-панель
          '/admin',
          '/admin/*',

          // Next.js технические директории
          '/api/*',

          // Блокируем все страницы с query параметрами (включая UTM)
          '/*?*',

          // Служебные страницы Next.js
          '/404',
          '/500',
          '/_error',

          // Возможные служебные endpoints PayloadCMS
          '/api/payload/*',
          '/__nextjs_original-stack-frame',

          // Временные и системные файлы
          '/.well-known/*',

          // Если есть авторизация (на всякий случай)
          '/login*',
          '/logout*',
          '/auth/*',
        ],
      },

      // Специальные правила для Google
      {
        userAgent: 'Googlebot',
        allow: [
          // Разрешаем статические ресурсы для правильного рендеринга
          '/*.css',
          '/*.js',
          '/*.png',
          '/*.jpg',
          '/*.jpeg',
          '/*.gif',
          '/*.svg',
          '/*.webp',
          '/*.woff',
          '/*.woff2',
          '/*.ico',

          // Разрешаем Next.js изображения через proxy
          '/_next/image*',
          '/_next/static/*',
        ],
        disallow: [
          // Все равно блокируем query параметры
          '/*?*',
          '/admin/*',
        ],
      },

      // Для Яндекса (если есть российские клиенты)
      {
        userAgent: 'YandexBot',
        allow: [
          '/*.css',
          '/*.js',
          '/*.png',
          '/*.jpg',
          '/*.jpeg',
          '/*.gif',
          '/*.svg',
          '/*.webp',
          '/*.ico',
          '/_next/image*',
          '/_next/static/*',
        ],
        disallow: ['/*?*', '/admin/*'],
      },

      // Блокируем SEO-шпионов и агрессивных ботов
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'DataForSeoBot'],
        disallow: '/',
      },

      // // Ограничиваем частоту сканирования для экономии ресурсов
      // {
      //   userAgent: '*',
      //   crawlDelay: 1, // 1 секунда между запросами
      // },
    ],
    sitemap: `${process.env.PAYLOAD_URL}/sitemap.xml`,
    host: process.env.PAYLOAD_URL,
  }
}
