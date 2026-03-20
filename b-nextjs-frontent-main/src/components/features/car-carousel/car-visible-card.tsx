'use client'

import { Href } from '@/components/ui/href'
import { Money } from '@/components/ui/money'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { DialogDetailedCarPrice } from '../dialog-detailed-car/dialog-detailed-car-price'
import { CarCarouselOnHoverCardPropsTypes } from './car-carousel-on-hover-card'

export type CarVisibleCardPropsTypes = {
  title: string
  lot?: string
  modelSlug: string
  id: string
  brandSlug: string
  countryPath: string
  description: string
  tags: string[]
  price: number
  currency: string
  year: number
  horsepower: number
  enginePower: number
  engineType?: EngineType
  location: string
  orientation?: 'vertical' | 'horizontal'
  isDetailed?: boolean
  initialTotalRub?: number
  initialCommercialTotalRub?: number
} & CarCarouselOnHoverCardPropsTypes

export const CarVisibleCard: React.FC<CarVisibleCardPropsTypes> = ({
  title,
  lot,
  tags,
  modelSlug,
  brandSlug,
  id,
  description,
  countryPath,
  location,
  price,
  currency,
  enginePower,
  engineType,
  year,
  horsepower,
  orientation = 'horizontal',
  isDetailed = true,
  initialTotalRub,
  initialCommercialTotalRub,
}) => {
  const router = useRouter()
  const carAge = new Date().getFullYear() - year
  const isJapanCard = countryPath.includes('japan')
  const finalTotalFromSearch = initialTotalRub ?? initialCommercialTotalRub

  const { totalRubAmount: finalHookTotalRub } = useCarFeeFuncEnum(
    finalTotalFromSearch ? 0 : price,
    currency,
    engineType ?? 'gasoline',
    enginePower,
    horsepower,
    carAge,
    'private',
  )

  const finalTotalRub = React.useCallback(() => {
    if (finalTotalFromSearch && finalTotalFromSearch > 0) {
      return finalTotalFromSearch
    }

    return finalHookTotalRub()
  }, [finalHookTotalRub, finalTotalFromSearch])

  const url = React.useMemo(() => {
    return `${countryPath}/car/${brandSlug}/${modelSlug}/${id}`
  }, [countryPath, brandSlug, modelSlug, id])

  const navigateToCard = React.useCallback(() => {
    return router.push(url)
  }, [router, url])

  return (
    <div
      className={cn(
        `
          flex h-auto flex-col space-y-4 p-2
          md:justify-between
        `,
        orientation === 'horizontal'
          ? `
            w-full
            md:max-w-2/3 md:flex-row md:space-y-0 md:p-4
          `
          : 'min-h-48 justify-between',
      )}
    >
      <div className="flex flex-col justify-between">
        <div className="flex flex-col">
          <Href href={url} className="cursor-pointer">
            <Title as="span" usingStyleFrom="h4" className="mb-1">
              {title}
            </Title>
          </Href>
          {lot && (
            <Text as="small" className="text-muted-foreground">
              Лот № {lot}
            </Text>
          )}
          <Text
            as="small"
            className="cursor-pointer text-muted-foreground"
            onClick={navigateToCard}
          >
            {description}
          </Text>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Text
            as="span"
            className="inline-block cursor-pointer rounded bg-primary px-2 py-1 text-xs font-bold"
            onClick={navigateToCard}
          >
            Под заказ
          </Text>
          {tags.map((tag, i) => {
            return (
              <Text
                key={`${i}`}
                as="span"
                className={`
                  inline-block cursor-pointer rounded bg-secondary-foreground px-2 py-1 text-xs
                  text-secondary
                `}
                onClick={navigateToCard}
              >
                {tag}
              </Text>
            )
          })}
        </div>
      </div>
      <div
        className={cn(
          'flex flex-col justify-between space-y-2',
          orientation === 'horizontal' ? 'md:w-1/3 md:space-y-0' : '',
        )}
      >
        <div className="flex flex-col">
          {isJapanCard && (
            <Text as="small" className="text-xs text-muted-foreground">
              Цена на аукционе
            </Text>
          )}
          {isJapanCard ? (
            <Text
              as="span"
              className="mt-1 cursor-pointer text-sm font-semibold leading-snug"
              onClick={navigateToCard}
            >
              Итого: <Money amount={finalTotalRub()} />
            </Text>
          ) : (
            <Text as="span" className="cursor-pointer text-xl font-bold" onClick={navigateToCard}>
              От <Money amount={finalTotalRub()} />
            </Text>
          )}
        </div>
        <div className="flex flex-col space-y-4">
          {isDetailed && (
            <DialogDetailedCarPrice
              currency={currency}
              carPrice={price}
              carAge={carAge}
              engineType="gasoline"
              horsepower={horsepower}
              enginePower={enginePower}
            />
          )}
          <Text
            as="small"
            className="cursor-pointer text-sm text-muted-foreground"
            onClick={navigateToCard}
          >
            {location}
          </Text>
        </div>
      </div>
    </div>
  )
}
