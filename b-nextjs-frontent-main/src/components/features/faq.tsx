import { FAQ_BREADCRUMB } from '@/constants/breadcrumb'
import { FAQ, FAQCategory } from '@/constants/faq'
import * as React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Button } from '../ui/button'
import { Href } from '../ui/href'
import { Text } from '../ui/text'

export type FaqPropsTypes = {
  categories: FAQCategory[]
} & Partial<React.ReactPortal>

export const FaqConcat: React.FC<FaqPropsTypes> = ({ categories }) => {
  const faqs = React.useMemo(() => {
    return categories.reduce((a, b) => {
      return a.concat(b.faqs)
    }, [] as FAQ[])
  }, [categories])

  return (
    <React.Fragment>
      <Accordion
        type="single"
        className={`
          grid grid-cols-1 gap-2
          md:grid-cols-2
        `}
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        {faqs.map((faq, index) => {
          return (
            <AccordionItem
              key={index}
              value={'faq' + String(index)}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <AccordionTrigger className="cursor-pointer space-x-2">
                <Text
                  as="small"
                  className="leading-5 whitespace-break-spaces text-muted-foreground"
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
      <Button className="max-w-48 self-center" variant="secondary" asChild>
        <Href href={FAQ_BREADCRUMB.path}>Полная версия FAQ</Href>
      </Button>
    </React.Fragment>
  )
}
