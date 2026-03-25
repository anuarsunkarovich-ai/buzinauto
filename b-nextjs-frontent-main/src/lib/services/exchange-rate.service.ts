import { getPayload } from 'payload'
import { ExchangeRate } from '@/payload-types'
import { getPayloadConfig } from '../utils/payload-config'

export interface ExchangeRateInfo {
  rate: number
  source: string
  date?: string
}

export const getLatestExchangeRate = async (): Promise<ExchangeRateInfo | null> => {
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })
    
    const { docs } = await payload.find({
      collection: 'exchange-rate',
      where: {
        fromCurrency: {
          equals: 'JPY'
        },
        toCurrency: {
          equals: 'RUB'
        }
      },
      sort: '-createdAt',
      limit: 1
    })

    if (docs.length === 0) {
      return null
    }

    const rate = docs[0] as ExchangeRate & { rate: number }
    
    return {
      rate: rate.rate,
      source: 'ATB Bank'
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error)
    return null
  }
}
