import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { FilterAuto } from '@/components/forms/filter-auto/filter-auto'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, JAPAN_CAR_ROOT } from '@/constants/breadcrumb'
import * as React from 'react'

export const metadata = {
  title: 'Статистика аукционов Японии | BuzinAvto',
  description: 'Аналитика цен и статистика проданных автомобилей на аукционах Японии.',
}

export default async function JapanStatsLandingPage() {
  return (
    <div className="flex flex-col space-y-10">
      <Header />
      <BoxContainer>
        <AppBreadcrumb
          items={[
            HOME_BREADCRUMB,
            JAPAN_CAR_ROOT,
            { path: '/japan/stats', name: 'Статистика' },
          ]}
        />
        <div className="mx-auto max-w-4xl py-12">
          <Title as="h1" className="mb-4 text-center text-4xl font-black tracking-tight uppercase">
            Статистика <span className="text-primary italic">аукционов</span>
          </Title>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Выберите марку и модель для просмотра аналитики цен и завершенных торгов.
          </p>
          <div className="rounded-3xl border border-border/60 bg-card/30 p-8 shadow-2xl backdrop-blur-sm">
            <FilterAuto />
          </div>
        </div>
      </BoxContainer>
      <Footer />
    </div>
  )
}
