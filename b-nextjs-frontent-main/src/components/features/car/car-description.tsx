'use client'

import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { Money } from '@/components/ui/money'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'
import type { PrefetchedCalculation } from '@/lib/calculator/prefetched-calculation'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { DialogDetailedCarPrice } from '../dialog-detailed-car/dialog-detailed-car-price'

export type CarDescriptionPropsTypes = {
  price: number
  currency: string
  year: number
  enginePower: number
  horsepowerString?: string
  horsepower: number
  driveType?: string
  color?: string
  lot?: string
  auctionDate?: string
  auctionSheetUrl?: string
  mileageKm?: string
  rating?: string
  wheelPosition?: string
  engineType?: EngineType
  className?: string
  prefetchedCalculation?: PrefetchedCalculation
}

export const CarDescription: React.FC<CarDescriptionPropsTypes> = ({
  rating,
  mileageKm,
  horsepowerString,
  horsepower,
  currency,
  price,
  driveType,
  color,
  lot,
  auctionDate,
  auctionSheetUrl,
  year,
  enginePower,
  engineType,
  wheelPosition,
  className,
  prefetchedCalculation,
}) => {
  const { dutyPrice, auctionPrice, deliveryPrice, totalRubAmount } = useCarFeeFuncEnum(
    price,
    currency,
    engineType ?? 'gasoline',
    enginePower,
    horsepower,
    new Date().getFullYear() - year,
  )

  const prefetchedAuctionRub = React.useMemo(() => {
    if (!prefetchedCalculation) {
      return undefined
    }

    if ((prefetchedCalculation.carPriceRub || 0) > 0) {
      return Math.round(prefetchedCalculation.carPriceRub || 0)
    }

    return Math.max(
      0,
      Math.round(
        (prefetchedCalculation.totalRub || 0) -
          (prefetchedCalculation.breakdown?.buyAndDeliveryRub || 0) -
          (prefetchedCalculation.breakdown?.customsBrokerRub || 0) -
          (prefetchedCalculation.breakdown?.customsDutyRub || 0) -
          (prefetchedCalculation.breakdown?.utilFeeRub || 0) -
          (prefetchedCalculation.breakdown?.companyCommission || 0),
      ),
    )
  }, [prefetchedCalculation])

  const effectiveAuctionRub = prefetchedAuctionRub ?? auctionPrice()
  const effectiveDutyRub =
    Math.round(prefetchedCalculation?.breakdown?.customsDutyRub || 0) || dutyPrice()
  const effectiveDeliveryRub =
    Math.round(prefetchedCalculation?.breakdown?.buyAndDeliveryRub || 0) || deliveryPrice()
  const effectiveTotalRub =
    Math.round(prefetchedCalculation?.totalRub || 0) || totalRubAmount()

  const formattedAuctionDate = React.useMemo(() => {
    if (!auctionDate) {
      return undefined
    }

    const parsedDate = new Date(auctionDate)
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('ru-RU').format(parsedDate)
    }

    return auctionDate
  }, [auctionDate])

  const carDetails = [
    { label: 'Лот', value: lot ? `№ ${lot}` : undefined },
    { label: 'Год', value: year },
    { label: 'Дата торгов', value: formattedAuctionDate },
    { label: 'Оценка', value: rating },
    { label: 'Пробег', value: mileageKm },
    { label: 'Мощность', value: horsepowerString },
    { label: 'Цвет', value: color },
    { label: 'Привод', value: driveType },
    { label: 'Руль', value: wheelPosition },
  ]

  const carPriceDetails = [
    { label: 'Аукционная стоимость', value: effectiveAuctionRub },
    { label: 'Пошлина', value: effectiveDutyRub },
    { label: 'Доставка до города клиента', value: effectiveDeliveryRub },
  ]

  const renderTriggerPrice = React.useCallback((): React.ReactNode => {
    return (
      <Button variant="outline" className="w-full max-w-full cursor-pointer !border-primary">
        Расшифровка цены
      </Button>
    )
  }, [])

  return (
    <div
      className={cn('space-y-4', className)}
      itemProp="offers"
      itemType="http://schema.org/Offer"
      itemScope
    >
      <div className="flex items-center space-x-4">
        <meta itemProp="availability" content="https://schema.org/PreOrder" />
        <meta itemProp="priceCurrency" content="RUB" />
        <meta itemProp="price" content={`${effectiveTotalRub}`} />
        <Title className="block border-0 p-0" as="span" usingStyleFrom="h2">
          От <Money amount={effectiveTotalRub} />
        </Title>
        <Text as="span" className="inline-block h-6 rounded bg-primary px-2 py-1 text-xs font-bold">
          Под заказ
        </Text>
      </div>
      <div
        className={`
          grid grid-cols-2 items-center gap-2
          sm:grid-cols-[auto_auto_12px_auto_auto]
        `}
      >
        {carDetails.map(({ label, value }, index) => {
          const needsSeparator = index % 2 === 0 && index < carDetails.length - 1
          return (
            <React.Fragment key={label}>
              <Text as="small" className="text-muted-foreground">
                {label}
              </Text>
              <Text as="span">{value ?? '—'}</Text>
              {needsSeparator && (
                <Separator
                  orientation="vertical"
                  className={`
                    mr-3 hidden
                    sm:block
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
      <Separator />
      <div className="grid grid-cols-2 items-center gap-2">
        {carPriceDetails.map(({ label, value }) => {
          return (
            <React.Fragment key={label}>
              <Text as="small" className="text-muted-foreground">
                {label}
              </Text>
              <Text as="span">
                <Money amount={value || 0} />
              </Text>
            </React.Fragment>
          )
        })}
      </div>
      <div
        className={`
          flex w-full flex-col space-y-2
          sm:flex-row sm:space-y-0 sm:space-x-2
        `}
      >
        <DialogDetailedCarPrice
          currency={currency}
          carPrice={price}
          carAge={new Date().getFullYear() - year}
          engineType="gasoline"
          enginePower={enginePower}
          horsepower={horsepower}
          renderTrigger={renderTriggerPrice}
          prefetchedCalculation={prefetchedCalculation}
        />
        {auctionSheetUrl && (
          <Button asChild variant="secondary" className="w-full max-w-full cursor-pointer">
            <Href href={auctionSheetUrl} target="_blank" rel="noreferrer">
              Аукционный лист
            </Href>
          </Button>
        )}
      </div>
    </div>
  )
}
