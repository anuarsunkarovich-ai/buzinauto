import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { YandexCard } from '@/components/features/yandex-card'
import { Contacts } from '@/components/layout/contact'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Title } from '@/components/ui/title'
import { HOME_BREADCRUMB, HOME_CONTACT } from '@/constants/breadcrumb'
import { CAMPAIGN_NAME } from '@/constants/common'
import { Metadata } from 'next'

export const metadata: Metadata = {
  description: `Контакты компании "${CAMPAIGN_NAME}" заказ автомобилей из Японии, Китая, Корее. Заказать авто.`,
  title: `Контакты компании ${CAMPAIGN_NAME}`,
  alternates: {
    canonical: './',
  },
}

export default async function Page() {
  return (
    <div
      className={`
        flex flex-col space-y-3
        md:space-y-10
      `}
    >
      <Header className="mb-0" />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, HOME_CONTACT]} />
        <Title as="h1">Контакты</Title>
      </BoxContainer>
      <BoxContainer className="mb-2 flex flex-row space-x-2 py-3">
        <Contacts />
      </BoxContainer>
      <YandexCard />
      <Footer />
    </div>
  )
}
