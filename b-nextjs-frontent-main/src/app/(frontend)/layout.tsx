import { CityProvider } from '@/components/contexts/city-context'
import { CurrencyRate } from '@/components/layout/currency-rate'
import { AppSidebar } from '@/components/layout/sidebar/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { Metadata } from 'next'
import { YandexMetricaProvider } from 'next-yandex-metrica'
import React from 'react'
import './global.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: {
    canonical: process.env.PAYLOAD_URL,
  },
  robots: {
    index: false,
    follow: false,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const tagId = +process.env.YANDEX_METRICA_ID!

  return (
    <html lang="ru" data-theme="dark" className="dark">
      <link rel="icon" type="image/png" href="/icon1.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
      <meta name="apple-mobile-web-app-title" content="Buzinavto" />
      <link rel="manifest" href="/manifest.json" />
      <body>
        <CityProvider>
          <CurrencyRate>
            <SidebarProvider defaultOpen={false}>
              <YandexMetricaProvider
                tagID={Number.isNaN(tagId) ? 104054566 : tagId}
                initParameters={{
                  clickmap: true,
                  trackLinks: true,
                  accurateTrackBounce: true,
                  ecommerce: 'dataLayer',
                  webvisor: false,
                }}
                router="app"
              >
                <SidebarInset>{children}</SidebarInset>
              </YandexMetricaProvider>
              <AppSidebar />
            </SidebarProvider>
          </CurrencyRate>
        </CityProvider>
        <Toaster />
      </body>
    </html>
  )
}
