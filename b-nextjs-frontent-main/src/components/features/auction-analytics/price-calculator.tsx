'use client'

import * as React from 'react'
import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'

interface PriceCalculatorProps {
  priceJpy: number
  engineCc: number
  year: number
  horsepower?: number
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  priceJpy,
  engineCc,
  year,
  horsepower = 150,
}) => {
  const carAge = new Date().getFullYear() - year
  
  const { totalRubAmount } = useCarFeeFuncEnum(
    priceJpy,
    'JPY',
    EngineType.GASOLINE,
    engineCc,
    horsepower,
    carAge,
    'private'
  )

  return (
    <span className="font-semibold text-foreground">
      {new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(totalRubAmount())} + расходы
    </span>
  )
}
