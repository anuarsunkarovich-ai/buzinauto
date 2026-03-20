import { CurrencyContext } from '@/components/contexts/currency-context'
import { useContext } from 'react'

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrencyRate must be used within a CurrencyProvider')
  }

  return {
    paris: context.pairs,
    getRate: context.getRate,
    convert: (from: string, to: string, value: number, decimals: number = 2) => {
      return +(context.getRate(from, to) * value).toFixed(decimals)
    },
  }
}
