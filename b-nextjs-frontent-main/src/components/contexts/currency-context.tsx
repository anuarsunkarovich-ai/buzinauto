'use client'

import { createContext, ReactNode, useState } from 'react'

interface CurrencyPair {
  from: string
  to: string
  rate: number
}

interface CurrencyContextType {
  pairs: CurrencyPair[]
  getRate: (from: string, to: string) => number
}

// Создаем контекст
export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({
  pairs,
  children,
}: {
  pairs: CurrencyPair[]
  children: ReactNode
}) {
  const [pairRates] = useState<CurrencyPair[]>(
    pairs.reduce((a, b) => {
      return a.concat([b, { from: b.to, to: b.from, rate: 1 / b.rate }])
    }, [] as CurrencyPair[]),
  )

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1
    const pair = pairRates?.find((p) => p.from === from && p.to === to)
    return pair?.rate || 0
  }

  return (
    <CurrencyContext.Provider
      value={{
        pairs: pairRates,
        getRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}
