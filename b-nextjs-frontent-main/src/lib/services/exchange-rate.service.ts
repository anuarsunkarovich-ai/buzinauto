import { fetchBackendJson } from '@/lib/api/backend-fetch'

export interface ExchangeRateInfo {
  rate: number
  source: string
  date?: string
}

export const getLatestExchangeRate = async (): Promise<ExchangeRateInfo | null> => {
  try {
    return await fetchBackendJson<ExchangeRateInfo>('rate', {
      cache: 'no-store',
    })
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error)
    return null
  }
}
