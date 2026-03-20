import { getPayload } from 'payload'
import { cache } from 'react'
import { CurrencyProvider } from '../contexts/currency-context'

const currencies = ['JPY', 'EUR', 'CNY'] as const

const getPayloadConfig = async () => (await import('@payload-config')).default

const queryRates = cache(async () => {
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })

    return await Promise.all(
      currencies.map(async (toCurrency) => {
        return await payload.find({
          collection: 'exchange-rate',
          limit: 1,
          pagination: false,
          sort: '-createdAt',
          where: {
            fromCurrency: {
              equals: 'RUB',
            },
            toCurrency: {
              equals: toCurrency,
            },
          },
        })
      }),
    )
      .then((results) => results.map((res) => res?.docs?.[0]).filter((e) => !!e))
      .catch(() => [])
  } catch {
    return []
  }
})

export type CurrencyRatePropsTypes = {} & Partial<React.ReactPortal>

export const CurrencyRate: React.FC<CurrencyRatePropsTypes> = async ({ children }) => {
  const docs = await queryRates()

  return (
    <CurrencyProvider
      pairs={docs.map((e) => ({ from: e.fromCurrency, to: e.toCurrency, rate: e.rate }))}
    >
      {children}
    </CurrencyProvider>
  )
}
