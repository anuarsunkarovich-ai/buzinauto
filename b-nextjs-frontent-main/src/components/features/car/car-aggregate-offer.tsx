/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'
import * as React from 'react'

export type CarAggregateOfferItem = {
  price: number
  currency: string
  year: number
  enginePower: number
  engineType?: EngineType
  horsepower: number
}

export type CarAggregateOfferPropsTypes = {
  name: string
  limit: number
  totalDocs: number
  items: CarAggregateOfferItem[]
}

export const CarAggregateOffer: React.FC<CarAggregateOfferPropsTypes> = ({
  name,
  totalDocs,
  limit,
  items,
}) => {
  const prices = items.map((item) => {
    const { totalRubAmount } = useCarFeeFuncEnum(
      item.price,
      item.currency,
      item.engineType ?? 'gasoline',
      item.enginePower,
      item.horsepower,
      new Date().getFullYear() - item.year,
    )
    return totalRubAmount()
  })

  return (
    <div itemScope itemType="http://schema.org/Product">
      <meta content={name} itemProp="name" />
      <meta content={name} itemProp="description" />
      <div itemType="http://schema.org/AggregateOffer" itemScope itemProp="offers">
        <meta content={String(totalDocs * limit)} itemProp="offerCount" />
        <meta content={String(Math.max(...prices))} itemProp="highPrice" />
        <meta content={String(Math.min(...prices))} itemProp="lowPrice" />
        <meta content="RUB" itemProp="priceCurrency" />
      </div>
    </div>
  )
}
