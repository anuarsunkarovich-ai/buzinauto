export type PrefetchedCalculation = {
  totalRub?: number
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
