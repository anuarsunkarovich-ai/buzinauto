import * as React from 'react'
import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'

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
    'gasoline',
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
