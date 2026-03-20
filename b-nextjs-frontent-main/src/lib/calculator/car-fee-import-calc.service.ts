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
    // Для новых автомобилей (до 3 лет) - по новой таблице ставок
    if (carAge <= 3) {
      return this.calculateNewCarDuty(carPiceRub, enginePower, eurRate)
    }

    // Для автомобилей 3-5 лет - только по объему двигателя
    if (carAge > 3 && carAge <= 5) {
      return this._calculateDutyByVolumeRange(enginePower, this.config.dutyRates3to5, eurRate)
    }

    // Для автомобилей старше 5 лет - по объему двигателя
    if (carAge > 5) {
      return this._calculateDutyByVolumeRange(enginePower, this.config.dutyRates5plus, eurRate)
    }

    return 0
  }

  private calculateNewCarDuty(carPriceRub: number, engineVolume: number, eurRate: number) {
    const carValueEur = carPriceRub / eurRate
    let dutyRate

    // Определяем диапазон стоимости и соответствующие ставки
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

    // Рассчитываем пошлину по проценту и по минимальной ставке
    const percentageDuty = carPriceRub * dutyRate.percent
    const volumeDuty = engineVolume * dutyRate.minRate * eurRate

    // Возвращаем большую из двух сумм
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

  /**
   * Обновленные ставки 2025 года в зависимости от стоимости
   * @param carValue
   * @returns
   */
  public calculateClearanceFee(carPiceRub: number) {
    // Обновленные ставки таможенного сбора 2025 года
    if (carPiceRub < 200000) return 1067
    if (carPiceRub < 450000) return 2134
    if (carPiceRub < 1200000) return 4269
    if (carPiceRub < 2700000) return 11746
    if (carPiceRub < 4200000) return 16524
    if (carPiceRub < 5500000) return 21344
    if (carPiceRub < 7000000) return 27540
    if (carPiceRub < 10000000) return 30000
    return 30000 // для авто дороже 10 млн
  }

  /**
   * Утилизационный сбор (обновлённый расчёт с 01.12.2025)
   *
   * С 2025 года коэффициенты зависят от:
   * - типа импортёра (физлицо / юрлицо)
   * - типа двигателя (электро / ДВС)
   * - объёма двигателя (см³)
   * - мощности двигателя (кВт) — опционально, оценивается по объёму
   * - возраста авто (новый ≤3 лет / б/у >3 лет)
   * - года расчёта (автоматическая индексация до 2030+)
   *
   * @param importerType  — «individual» или «legal»
   * @param engineType    — тип двигателя
   * @param engineVolume  — объём двигателя в см³ (0 для электромобилей)
   * @param carAge        — возраст авто в годах
   * @param enginePowerKw — мощность в кВт (опционально; если не указана — оценивается по объёму)
   */
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
