export type PrefetchedCalculation = {
  totalRub?: number
  carPriceRub?: number
  carPriceJpy?: number
  lotPriceJpy?: number
  averagePriceJpy?: number
  priceSource?: string
  commercialRate?: number
  bankBuyRate?: number
  bankSellRate?: number
  rateDate?: string
  breakdown?: {
    buyAndDeliveryRub?: number
    buyAndDeliveryJpy?: number
    customsBrokerRub?: number
    customsDutyRub?: number
    utilFeeRub?: number
    companyCommission?: number
  }
}
