import { CAMPAIGN_NAME } from '@/constants/common'
import Link from 'next/link'
import * as React from 'react'
import { DialogCallbackCar } from '../features/dialog-callback'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Href } from '../ui/href'
import { TelegramIcon } from '../ui/icons'
import { InstagramIcon } from '../ui/icons/instagram-icon'
import { VkIcon } from '../ui/icons/vk-icon'
import { YouTubeIcon } from '../ui/icons/youtube-icon'
import { Text } from '../ui/text'
import { Title } from '../ui/title'

export type ContactPropsTypes = {} & Partial<React.ReactPortal>

export const Contacts: React.FC<ContactPropsTypes> = () => {
  return (
    <div
      className={`
        grid-col-1 grid max-w-72 gap-2
        md:max-w-full md:grid-cols-3
      `}
      itemScope
      itemType="http://schema.org/Organization"
    >
      <Card>
        <CardContent className="flex flex-col space-y-3 text-center">
          <Title as="h2" usingStyleFrom="h4">
            Телефон
          </Title>
          <Link href={'tel:+79834208307'} itemProp="telephone">
            +7 (983) 420 83 07
          </Link>
          <Text as="small" className="text-muted-foreground">
            По записи с 10:00 до 17:00
          </Text>
          <Text itemProp="name">{CAMPAIGN_NAME}</Text>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col space-y-3 text-center">
          <Title as="h2" usingStyleFrom="h4">
            Адрес
          </Title>
          <Text itemProp="address" itemScope itemType="http://schema.org/PostalAddress">
            <span itemProp="addressLocality">г. Улан-Удэ</span>
            <span itemProp="streetAddress">, ул. Корабельная, 32а/б</span>
          </Text>
          <DialogCallbackCar />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col space-y-2 text-center">
          <Title as="h2" usingStyleFrom="h4">
            Мы в соц. сетях
          </Title>
          <div className="flex justify-center space-x-2">
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
          <Text as="small" className="text-muted-foreground">
            Электронная почта
          </Text>
          <Link href={'mailto:buzin8787@mail.ru'} itemProp="email">
            buzin8787@mail.ru
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
