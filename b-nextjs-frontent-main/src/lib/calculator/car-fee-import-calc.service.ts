import axios from 'axios'
import { getRuntimeBackendApiUrl } from '@/lib/api/backend-url'
import {
  CarFeeImportConfig,
  DutyEngineRate,
  EngineType,
  ImporterType,
} from './car-fee-import-calc.type'
import { getRecyclingFeeCoefficient } from './recycling-fee-v2-data'

export interface CarFeeCalculationResponse {
  total_rub: number
  breakdown: {
    customs_duty_rub: number
    buy_and_delivery_rub: number
  }
}

export class CarFeeImportCalcService {
  constructor(private readonly _config: CarFeeImportConfig) {}

  public async calculateFees(params: {
    price: number
    engineCapacity: number
    carAge: number
  }): Promise<CarFeeCalculationResponse> {
    const { price, engineCapacity, carAge } = params
    const response = await axios.post<CarFeeCalculationResponse>(
      `${getRuntimeBackendApiUrl()}/calculate`,
      {
        price_jpy: price,
        engine_cc: engineCapacity,
        power_hp: 150,
        age_category: this._getAgeCategory(carAge),
      },
    )

    return response.data
  }

  public deliveryAmount(carPriceJPY: number) {
    if (carPriceJPY > 1_000_000) {
      return this._config.delivery['1000000-1500000']
    }
    if (carPriceJPY > 1_500_000) {
      return this._config.delivery['1500000-2500000']
    }
    if (carPriceJPY > 2_500_000) {
      return this._config.delivery['>2500000']
    }
    return this._config.delivery['<1000000']
  }

  public calculateCustomsDuty(
    enginePower: number,
    carPiceRub: number,
    carAge: number,
    eurRate: number,
  ) {
    if (carAge <= 3) {
      return this.calculateNewCarDuty(carPiceRub, enginePower, eurRate)
    }

    if (carAge > 3 && carAge <= 5) {
      return this._calculateDutyByVolumeRange(enginePower, this.config.dutyRates3to5, eurRate)
    }

    if (carAge > 5) {
      return this._calculateDutyByVolumeRange(enginePower, this.config.dutyRates5plus, eurRate)
    }

    return 0
  }

  private calculateNewCarDuty(carPriceRub: number, engineVolume: number, eurRate: number) {
    const carValueEur = carPriceRub / eurRate
    let dutyRate

    if (carValueEur <= 8500) {
      dutyRate = this.config.dutyRatesNew['0-8500']
    } else if (carValueEur <= 16700) {
      dutyRate = this.config.dutyRatesNew['8500-16700']
    } else if (carValueEur <= 42300) {
      dutyRate = this.config.dutyRatesNew['16700-42300']
    } else if (carValueEur <= 84500) {
      dutyRate = this.config.dutyRatesNew['42300-84500']
    } else if (carValueEur <= 169000) {
      dutyRate = this.config.dutyRatesNew['84500-169000']
    } else {
      dutyRate = this.config.dutyRatesNew['169000+']
    }

    const percentageDuty = carPriceRub * dutyRate.percent
    const volumeDuty = engineVolume * dutyRate.minRate * eurRate

    return Math.max(percentageDuty, volumeDuty)
  }

  private _calculateDutyByVolumeRange(
    engineVolume: number,
    rates: Record<DutyEngineRate, number>,
    eurRate: number,
  ) {
    let rate

    if (engineVolume <= 1000) {
      rate = rates['<=1000']
    } else if (engineVolume <= 1500) {
      rate = rates['1000-1500']
    } else if (engineVolume <= 1800) {
      rate = rates['1500-1800']
    } else if (engineVolume <= 2300) {
      rate = rates['1800-2300']
    } else if (engineVolume <= 3000) {
      rate = rates['2300-3000']
    } else {
      rate = rates['>3000']
    }

    return engineVolume * rate * eurRate
  }

  // Customs processing fee table effective January 1, 2026.
  public calculateClearanceFee(carPiceRub: number) {
    if (carPiceRub < 200000) return 1231
    if (carPiceRub < 450000) return 2462
    if (carPiceRub < 1200000) return 4924
    if (carPiceRub < 2700000) return 13541
    if (carPiceRub < 4200000) return 18465
    if (carPiceRub < 5500000) return 21344
    if (carPiceRub < 10000000) return 49240
    return 73860
  }

  public calculateRecyclingFee(
    importerType: ImporterType,
    engineType: EngineType,
    engineVolume: number,
    carAge: number,
    enginePowerKw?: number,
  ) {
    const isNew = carAge <= 3

    const coeff = getRecyclingFeeCoefficient({
      importerType,
      engineType,
      engineVolumeCc: engineVolume,
      isNew,
      enginePowerKw,
    })

    return Math.round(this._config.baseUtilFee * coeff)
  }

  public calculateExcise(engineType: EngineType, enginePower: number) {
    if (enginePower < 90) return 0

    const rate = this._getExciseRate(engineType, enginePower)
    return enginePower * rate
  }

  private _getExciseRate(engineType: EngineType, enginePower: number) {
    const rates = this.config.exciseRates[engineType]
    if (!rates) return 0

    if (enginePower >= 400) return rates['400-500']
    if (enginePower >= 300) return rates['300-400']
    if (enginePower >= 200) return rates['200-300']
    if (enginePower >= 150) return rates['150-200']
    return rates['90-150']
  }

  private _getAgeCategory(carAge: number): '0-3' | '3-5' | '5-7' | '7+' {
    if (carAge < 3) return '0-3'
    if (carAge < 5) return '3-5'
    if (carAge < 7) return '5-7'
    return '7+'
  }

  public get config(): CarFeeImportConfig {
    return this._config
  }
}
