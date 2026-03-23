import axios from 'axios'
import * as React from 'react'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'

import { DetailChinaCarPrice, DetailJapanCarPrice } from '@/constants/detail-car-price'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'

export type DialogDetailedCarItem = {
  title: string
  money?: number
  callToMoney?: string
  currency: string
  tip?: string
}

type FastApiCalculationResponse = {
  exchange_rate?: number
  bank_buy_rate?: number
  total_rub?: number
  breakdown?: {
    buy_and_delivery_rub?: number
    customs_broker_rub?: number
    customs_duty_rub?: number
    util_fee_rub?: number
    svh_transport_rub?: number
    company_commission?: number
    duty_buffer_rub?: number
  }
}

type UsageType = 'commercial' | 'private'

const calculationResponseCache = new Map<string, FastApiCalculationResponse>()
const calculationRequestCache = new Map<string, Promise<FastApiCalculationResponse>>()

const getAgeCategory = (carAge: number) => {
  if (carAge < 3) return '0-3'
  if (carAge < 5) return '3-5'
  if (carAge < 7) return '5-7'
  return '7+'
}

const normalizeNumber = (value: number | undefined | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return value
}

const buildCalculationCacheKey = (
  price: number,
  enginePower: number,
  horsepower: number,
  carAge: number,
  usageType: UsageType,
) =>
  [
    Math.max(0, Math.round(Number(price))),
    Math.max(0, Math.round(Number(enginePower))),
    Math.max(0, Math.round(Number(horsepower || 150))),
    getAgeCategory(carAge),
    usageType,
  ].join(':')

const requestCalculation = async ({
  price,
  enginePower,
  horsepower,
  carAge,
  usageType,
}: {
  price: number
  enginePower: number
  horsepower: number
  carAge: number
  usageType: UsageType
}) => {
  const cacheKey = buildCalculationCacheKey(price, enginePower, horsepower, carAge, usageType)
  const cachedResponse = calculationResponseCache.get(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

  const inFlightRequest = calculationRequestCache.get(cacheKey)
  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = axios
    .post<FastApiCalculationResponse>(
      `${getRuntimeBackendApiUrl()}/calculate`,
      {
        price_jpy: Math.max(0, Math.round(Number(price))),
        engine_cc: Math.max(0, Math.round(Number(enginePower))),
        power_hp: Math.max(0, Math.round(Number(horsepower || 150))),
        age_category: getAgeCategory(carAge),
        usage_type: usageType,
      },
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    )
    .then((response) => {
      calculationResponseCache.set(cacheKey, response.data)
      calculationRequestCache.delete(cacheKey)
      return response.data
    })
    .catch((error) => {
      calculationRequestCache.delete(cacheKey)
      throw error
    })

  calculationRequestCache.set(cacheKey, request)
  return request
}

export const useCarFeeCalc = (car: any, usageType: UsageType = 'private') => {
  const [fees, setFees] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!car || !car.price || !car.enginePower) return

    const fetchRealMath = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiData = await requestCalculation({
          price: Number(car.price.avg || car.price),
          enginePower: Number(car.enginePower),
          horsepower: Number(car.horsepower || 150),
          carAge: new Date().getFullYear() - Number(car.year || 0),
          usageType,
        })
        const mappedFees = {
          buy_and_delivery_rub: apiData.breakdown?.buy_and_delivery_rub || 0,
          customs_broker_rub: apiData.breakdown?.customs_broker_rub || 0,
          customs_duty_rub: apiData.breakdown?.customs_duty_rub || 0,
          util_fee_rub: apiData.breakdown?.util_fee_rub || 0,
          svh_transport_rub: apiData.breakdown?.svh_transport_rub || 0,
          company_commission: apiData.breakdown?.company_commission || 0,
          totalPriceRub: apiData.total_rub || 0,
        }

        setFees(mappedFees)
      } catch (err) {
        console.error('FastAPI Hijack Failed:', err)
        setError('Calculation offline.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRealMath()
  }, [car, usageType])

  return {
    fees,
    isLoading,
    error,
    calculateClearanceFee: () => fees?.customs_broker_rub || 0,
    calculateCustomsDuty: () => fees?.customs_duty_rub || 0,
    calculateRecyclingFee: () => fees?.util_fee_rub || 0,
    deliveryAmount: () => fees?.svh_transport_rub || 0,
  }
}

type CalculatorRow = DialogDetailedCarItem & {
  callToMoney?: string
}

type UseCarFeeFuncEnumResult = {
  totalRubAmount: () => number
  calculator: (row: CalculatorRow) => number
  currencyPriceList: DialogDetailedCarItem[]
  auctionPrice: () => number
  deliveryPrice: () => number
  dutyPrice: () => number
  calculateClearanceFee: () => number
  calculateCustomsDuty: () => number
  calculateRecyclingFee: () => number
  deliveryAmount: () => number
}

export function useCarFeeFuncEnum(
  price: number = 0,
  currency: string = 'JPY',
  engineType: EngineType = 'gasoline',
  enginePower: number = 0,
  horsepower: number = 0,
  carAge: number = 0,
  usageType: UsageType = 'private',
): UseCarFeeFuncEnumResult {
  const [result, setResult] = React.useState<FastApiCalculationResponse | null>(null)

  React.useEffect(() => {
    let mounted = true

    const run = async () => {
      if (!normalizeNumber(price) || !normalizeNumber(enginePower)) {
        setResult(null)
        return
      }

      try {
        const response = await requestCalculation({
          price,
          enginePower,
          horsepower,
          carAge,
          usageType,
        })

        if (mounted) {
          setResult(response)
        }
      } catch (error) {
        console.error('FastAPI calculation request failed:', error)
        if (mounted) {
          setResult(null)
        }
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [price, enginePower, horsepower, carAge, engineType, currency, usageType])

  const exchangeRate = result?.exchange_rate || 1
  const breakdown = result?.breakdown

  const currencyPriceList =
    currency === 'CNY' ? DetailChinaCarPrice : DetailJapanCarPrice

  const calculator = React.useCallback(
    (row: CalculatorRow) => {
      if (typeof row.money === 'number') {
        return row.currency === 'RUB' ? row.money : Math.round(row.money * exchangeRate)
      }

      switch (row.callToMoney) {
        case 'AUCTION_PRICE':
          return Math.round(Number(price || 0) * exchangeRate)
        case 'AUCTION_DELIVERY':
          return Math.round(breakdown?.buy_and_delivery_rub || 0)
        case 'CLEARANCE_FEE':
          return Math.round(breakdown?.customs_broker_rub || 0)
        case 'CUSTOMS_DUTY':
          return Math.round(breakdown?.customs_duty_rub || 0)
        case 'RECYCLING_FEE':
          return Math.round(breakdown?.util_fee_rub || 0)
        case 'DELIVERY_TO_CITY':
          return Math.round(breakdown?.svh_transport_rub || 0)
        case 'COMMISSION_CNY':
        case 'COMMISSION':
          return Math.round(breakdown?.company_commission || 0)
        default:
          return 0
      }
    },
    [breakdown, exchangeRate, price],
  )

  const totalRubAmount = React.useCallback(() => {
    if (result?.total_rub) {
      return Math.round(result.total_rub)
    }

    const auction = Math.round(Number(price || 0) * exchangeRate)
    const delivery = Math.round(breakdown?.buy_and_delivery_rub || 0)
    const broker = Math.round(breakdown?.customs_broker_rub || 0)
    const duty = Math.round(breakdown?.customs_duty_rub || 0)
    const util = Math.round(breakdown?.util_fee_rub || 0)
    const svh = Math.round(breakdown?.svh_transport_rub || 0)
    const commission = Math.round(breakdown?.company_commission || 0)

    return auction + delivery + broker + duty + util + svh + commission
  }, [result, breakdown, exchangeRate, price])

  return {
    totalRubAmount,
    calculator,
    currencyPriceList,
    auctionPrice: () => Math.round(Number(price || 0) * exchangeRate),
    deliveryPrice: () => Math.round(breakdown?.svh_transport_rub || 0),
    dutyPrice: () => Math.round(breakdown?.customs_duty_rub || 0),
    calculateClearanceFee: () => Math.round(breakdown?.customs_broker_rub || 0),
    calculateCustomsDuty: () => Math.round(breakdown?.customs_duty_rub || 0),
    calculateRecyclingFee: () => Math.round(breakdown?.util_fee_rub || 0),
    deliveryAmount: () => Math.round(breakdown?.svh_transport_rub || 0),
  }
}
