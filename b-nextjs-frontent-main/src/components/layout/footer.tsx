'use client'

import { CountryPathname, mapToDisplayCountry } from '@/constants/country'
import { FooterData } from '@/constants/footer'
import { PhoneIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Button } from '../ui/button'
import { Href } from '../ui/href'
import { TelegramIcon } from '../ui/icons'
import { InstagramIcon } from '../ui/icons/instagram-icon'
import { VkIcon } from '../ui/icons/vk-icon'
import { YouTubeIcon } from '../ui/icons/youtube-icon'
import { Separator } from '../ui/separator'
import { Text } from '../ui/text'
import { Title } from '../ui/title'

export type FooterMockData = {
  title: string
  links: {
    text: string
    link: string
  }[]
}

export type FooterPropsTypes = {} & Partial<React.ReactPortal>

export const Footer: React.FC<FooterPropsTypes> = () => {
  return (
    <div
      className={`
        flex flex-col space-y-5 bg-popover px-8 py-8
        md:px-20
        lg:px-40
      `}
    >
      <div className="flex-col space-y-2">
        <div className="flex space-x-3">
          <Href href={'/'}>
            <Image src={'/icon0.svg'} alt="Logo Buzinavto" width={32} height={32} />
          </Href>
          <Href href={'/'}>
            <Text as="span" className="font-mono text-2xl font-bold uppercase">
              Buzinavto
            </Text>
          </Href>
        </div>
        <Separator />
      </div>

      <div
        className={`
          flex flex-col justify-between space-y-3
          md:flex-row md:space-y-0
        `}
      >
        <div className="mr-3 flex flex-col space-y-4">
          <div className="flex space-x-3">
            <Button variant="secondary" size="icon" className="size-8" asChild>
              <Href
                target="_blank"
                href={'https://t.me/buz03CBJapan'}
                itemProp="sameAs"
                rel="nofollow"
              >
                <TelegramIcon className="size-6" />
              </Href>
            </Button>
            <Button variant="secondary" size="icon" className="size-8" asChild>
              <Href
                target="_blank"
                href={'https://www.instagram.com/buzinavto03'}
                itemProp="sameAs"
                rel="nofollow"
              >
                <InstagramIcon className="size-5" />
              </Href>
            </Button>
            <Button variant="secondary" size="icon" className="size-8" asChild>
              <Href
                target="_blank"
                href={'https://vk.ru/club232094758'}
                itemProp="sameAs"
                rel="nofollow"
              >
                <VkIcon className="size-5" />
              </Href>
            </Button>
            <Button variant="secondary" size="icon" className="size-8" asChild>
              <Href
                target="_blank"
                href={'https://youtube.com/@buzinavto?si=B5yzZ5SDV6l5SXuQ'}
                itemProp="sameAs"
                rel="nofollow"
              >
                <YouTubeIcon className="size-5" />
              </Href>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="icon" className="size-8" asChild>
              <Link href={'tel:+73012391888'} itemProp="telephone">
                <PhoneIcon />
              </Link>
            </Button>
            <Link href={'tel:+73012391888'} itemProp="telephone">
              +7 (3012) 391-888
            </Link>
          </div>
        </div>
        <div
          className={`
            grid grid-cols-2 gap-3
            lg:grid-cols-4
          `}
        >
          {FooterData.map((data, i) => (
            <div className="flex flex-col" key={i}>
              <Title as="span" usingStyleFrom="h4" className="text-muted-foreground uppercase">
                {data.title}
              </Title>
              <div className="flex flex-col space-y-2">
                {data.links.map((link, linkIndex) => (
                  <Href className="text-sm" key={i + linkIndex} href={link.link}>
                    {link.text}
                  </Href>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Accordion
        type="single"
        className={`
          mt-3 w-full self-center
          md:mt-0 md:w-fit
        `}
      >
        <AccordionItem value="item-1" className="border-0">
          <AccordionTrigger className="cursor-pointer space-x-2">
            <Text as="small" className="text-muted-foreground">
              Модели авто
            </Text>
          </AccordionTrigger>
          <AccordionContent className="flex justify-center">
            {CountryPathname.map((item) => (
              <Button
                key={item.country}
                variant="link"
                asChild
                className="justify-start text-white"
              >
                <Href href={`/sitemap/html${item.pathname}`}>
                  {mapToDisplayCountry(item.country)?.label}
                </Href>
              </Button>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
