export type EngineType = 'gasoline' | 'diesel' | 'electric' | 'hybrid-gasoline' | 'hybrid-diesel'
export type ImporterType = 'individual' | 'legal'
type ExciseEngineRate = '90-150' | '150-200' | '200-300' | '300-400' | '400-500'
export type DutyEngineRate =
  | '<=1000'
  | '1000-1500'
  | '1500-1800'
  | '1800-2300'
  | '2300-3000'
  | '>3000'

export interface CarFeeImportConfig {
  baseClearanceFee: number
  baseUtilFee: number
  exciseRates: Record<EngineType, Record<ExciseEngineRate, number>>
  recyclingFactorsIndividual: {
    new: number // до 3 лет
    used: number // старше 3 лет
  }
  recyclingFactorsLegal: {
    new: {
      '<=1000': number
      '1000-2000': number
      '2000-3000': number
      '>3000': number
      electric: number
    }
    used: {
      '<=1000': number
      '1000-2000': number
      '2000-3000': number
      '>3000': number
      electric: number
    }
  }
  // Пошлины для новых автомобилей (до 3 лет) по стоимости в евро
  dutyRatesNew: {
    '0-8500': { percent: number; minRate: number } // до 8500 EUR
    '8500-16700': { percent: number; minRate: number } // 8500-16700 EUR
    '16700-42300': { percent: number; minRate: number } // 16700-42300 EUR
    '42300-84500': { percent: number; minRate: number } // 42300-84500 EUR
    '84500-169000': { percent: number; minRate: number } // 84500-169000 EUR
    '169000+': { percent: number; minRate: number } // более 169000 EUR
  }
  // Пошлины для автомобилей 3-5 лет по объему двигателя
  dutyRates3to5: Record<DutyEngineRate, number>
  dutyRates5plus: Record<DutyEngineRate, number>
  delivery: {
    '<1000000': number
    '1000000-1500000': number
    '1500000-2500000': number
    '>2500000': number
  }
}
