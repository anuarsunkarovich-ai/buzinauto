import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { FAQ_BREADCRUMB, HOME_BREADCRUMB } from '@/constants/breadcrumb'
import { FAQData } from '@/constants/faq'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  description: 'Частые вопросы при заказе авто с аукционов',
  title: 'Частые вопросы при заказе авто с аукционов',
}

export default async function FAQPage() {
  return (
    <div className={`
      flex flex-col space-y-3
      md:space-y-10
    `}>
      <Header className="mb-0" />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, FAQ_BREADCRUMB]} />
        <Title as="h1">Ответы на частые вопросы</Title>
        <Separator />
      </BoxContainer>
      <BoxContainer itemScope itemType="https://schema.org/FAQPage">
        {FAQData.map(({ category, faqs }) => {
          return (
            <div className="mt-1 space-y-2" key={category}>
              <Title as="h2" usingStyleFrom="h3" className={`
                text-center
                md:text-3xl
              `}>
                {category}
              </Title>
              <Accordion type="single" className={`
                grid grid-cols-1 gap-2
                md:grid-cols-2
              `}>
                {faqs.map((faq, index) => {
                  return (
                    <AccordionItem
                      key={index}
                      value={category + index}
                      itemScope
                      itemProp="mainEntity"
                      itemType="https://schema.org/Question"
                    >
                      <AccordionTrigger className="cursor-pointer space-x-2">
                        <Text
                          as="small"
                          className="w-full leading-5 whitespace-break-spaces text-muted-foreground"
                          itemProp="name"
                        >
                          {faq.question}
                        </Text>
                      </AccordionTrigger>
                      <AccordionContent
                        itemScope
                        itemProp="acceptedAnswer"
                        itemType="https://schema.org/Answer"
                      >
                        <Text className="whitespace-pre-wrap" itemProp="text">
                          {faq.answer}
                        </Text>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          )
        })}
      </BoxContainer>
      <Footer />
    </div>
  )
}
