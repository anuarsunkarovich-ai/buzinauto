'use client'

import { fetchBackendJson } from '@/lib/api/backend-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import * as React from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_CITIES = [
  { value: 'Vladivostok', label: 'Владивосток' },
  { value: 'Moscow', label: 'Москва' },
  { value: 'Khabarovsk', label: 'Хабаровск' },
]

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'electric', label: 'Электро' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

const UTIL_FEE_TYPES = [
  { value: 'commercial', label: 'Коммерческий' },
  { value: 'private', label: 'Льготный' },
]

type CalculationResponse = {
  exchange_rate?: number
  bank_buy_rate?: number
  bank_sell_rate?: number
  rate_date?: string
  total_rub?: number
  breakdown?: {
    buy_and_delivery_rub?: number
    buy_and_delivery_jpy?: number
    customs_broker_rub?: number
    customs_duty_rub?: number
    util_fee_rub?: number
    company_commission?: number
  }
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAgeCategory = (carAge: number) => {
  if (carAge < 3) return '0-3'
  if (carAge < 5) return '3-5'
  if (carAge < 7) return '5-7'
  return '7+'
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount) + ' руб.'

// ─── Sub-components ──────────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-white/60 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

function CostRow({
  title,
  amount,
  subItems,
  highlight,
}: {
  title: string
  amount: number
  subItems?: string[]
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-6 py-5 border-b border-white/10',
        highlight && 'border-b-0',
      )}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-semibold text-white/90">{title}</span>
        {subItems && subItems.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {subItems.map((item) => (
              <li key={item} className="text-xs text-white/40 flex items-center gap-1.5">
                <span className="text-white/25">•</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span
        className={cn(
          'text-sm font-bold shrink-0 whitespace-nowrap',
          highlight ? 'text-white text-lg' : 'text-white/80',
        )}
      >
        {formatMoney(amount)}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

// Parse a raw string input into a safe integer (0 if empty/NaN)
const toSafeInt = (s: string) => {
  const n = parseInt(s.replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

export const PriceCalculationModule: React.FC = () => {
  const currentYear = new Date().getFullYear()

  // Keep all form values as strings so inputs are never "NaN"
  const [auctionStr, setAuctionStr] = React.useState('100000')
  const [deliveryCity, setDeliveryCity] = React.useState('Vladivostok')
  const [yearStr, setYearStr] = React.useState(String(currentYear))
  const [engineStr, setEngineStr] = React.useState('1415')
  const [hpStr, setHpStr] = React.useState('150')
  const [fuelType, setFuelType] = React.useState('gasoline')
  const [usageType, setUsageType] = React.useState<'commercial' | 'private'>('private')
  const [result, setResult] = React.useState<CalculationResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Numeric versions used only for API + display
  const auctionPriceJpy = toSafeInt(auctionStr)
  const year = toSafeInt(yearStr) || currentYear
  const engineCc = toSafeInt(engineStr)
  const horsepower = toSafeInt(hpStr) || 150

  const calculate = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchBackendJson<CalculationResponse>('calculate', {
        method: 'POST',
        json: {
          price_jpy: Math.max(0, auctionPriceJpy),
          engine_cc: Math.max(0, engineCc),
          power_hp: Math.max(0, horsepower),
          age_category: getAgeCategory(currentYear - year),
          engine_type: fuelType,
          usage_type: usageType,
        },
      })
      setResult(response)
    } catch (requestError) {
      console.error('FastAPI calculator request failed:', requestError)
      setError('Не удалось получить расчет. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }, [auctionPriceJpy, engineCc, horsepower, year, currentYear, usageType, fuelType])

  // Auto-calculate on mount and input changes
  React.useEffect(() => {
    const id = window.setTimeout(() => void calculate(), 400)
    return () => window.clearTimeout(id)
  }, [calculate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Computed values
  const commercialRate = result?.bank_sell_rate ?? result?.exchange_rate ?? result?.bank_buy_rate ?? 0
  const exchangeRate = commercialRate
  const auctionRub = exchangeRate > 0 ? Math.round(auctionPriceJpy * exchangeRate) : 0
  const japanRub = Math.round(result?.breakdown?.buy_and_delivery_rub || 0)
  const brokerRub = Math.round(result?.breakdown?.customs_broker_rub || 45000)
  const dutyRub = Math.round(result?.breakdown?.customs_duty_rub || 0)
  const utilRub = Math.round(result?.breakdown?.util_fee_rub || 0)
  const totalRub = Math.round(result?.total_rub || 0)

  const selectedCityLabel =
    DELIVERY_CITIES.find((c) => c.value === deliveryCity)?.label ?? deliveryCity

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 rounded-xl overflow-hidden border border-white/10 bg-[#111418]">
      {/* ── LEFT PANEL: Form ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 p-6 border-r border-white/10 bg-[#0e1115]">
        <div>
          <p className="text-xs text-white/40 leading-relaxed">
            Калькулятор расчёта авто из Японии
          </p>
          <p className="text-xs text-white/40 leading-relaxed mt-1">
            Вводите параметры вручную, а справа будет собран живой расчёт.
          </p>
        </div>

        <FormField label="Аукционная стоимость (Йены)">
          <Input
            type="number"
            inputMode="numeric"
            value={auctionStr}
            onChange={(e) => setAuctionStr(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/30"
          />
        </FormField>

        <FormField label="Город доставки">
          <div className="relative flex items-center">
            <select
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="
                w-full h-9 appearance-none rounded-md border border-white/10 bg-white/5
                px-3 py-1 text-sm text-white outline-none cursor-pointer
                focus:border-white/30 transition-colors
              "
            >
              {DELIVERY_CITIES.map((city) => (
                <option key={city.value} value={city.value} className="bg-[#1a1f26] text-white">
                  {city.label}
                </option>
              ))}
            </select>
            {/* Chevron icon */}
            <svg
              className="pointer-events-none absolute right-2.5 text-white/40"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </FormField>

        <FormField label="Год выпуска">
          <Input
            type="number"
            inputMode="numeric"
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
            className="bg-white/5 border-white/10 text-white focus-visible:border-white/30"
          />
        </FormField>

        <FormField label="Объем куб.см.">
          <Input
            type="number"
            inputMode="numeric"
            value={engineStr}
            onChange={(e) => setEngineStr(e.target.value)}
            className="bg-white/5 border-white/10 text-white focus-visible:border-white/30"
          />
        </FormField>

        <FormField label="Мощность л.с.">
          <Input
            type="number"
            inputMode="numeric"
            value={hpStr}
            onChange={(e) => setHpStr(e.target.value)}
            className="bg-white/5 border-white/10 text-white focus-visible:border-white/30"
          />
        </FormField>

        <FormField label="Тип топлива">
          <div className="flex flex-col gap-2 pt-0.5">
            {FUEL_TYPES.map((fuel) => (
              <label
                key={fuel.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                    fuelType === fuel.value
                      ? 'border-primary bg-primary'
                      : 'border-white/30 bg-transparent group-hover:border-white/50',
                  )}
                  onClick={() => setFuelType(fuel.value)}
                >
                  {fuelType === fuel.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    fuelType === fuel.value ? 'text-white' : 'text-white/50',
                  )}
                  onClick={() => setFuelType(fuel.value)}
                >
                  {fuel.label}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Тип утильсбора">
          <div className="flex flex-col gap-2 pt-0.5">
            {UTIL_FEE_TYPES.map((utilFeeType) => (
              <label
                key={utilFeeType.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                    usageType === utilFeeType.value
                      ? 'border-primary bg-primary'
                      : 'border-white/30 bg-transparent group-hover:border-white/50',
                  )}
                  onClick={() =>
                    setUsageType(utilFeeType.value as 'commercial' | 'private')
                  }
                >
                  {usageType === utilFeeType.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    usageType === utilFeeType.value ? 'text-white' : 'text-white/50',
                  )}
                  onClick={() =>
                    setUsageType(utilFeeType.value as 'commercial' | 'private')
                  }
                >
                  {utilFeeType.label}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        <Button
          type="button"
          onClick={() => void calculate()}
          disabled={loading}
          className="mt-auto w-full bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          {loading ? 'Рассчитываем...' : 'Посчитать'}
        </Button>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* ── RIGHT PANEL: Results ──────────────────────────────────────── */}
      <div className="flex flex-col p-6 lg:p-8">
        {/* Header: disclaimer + big total */}
        <div className="flex items-start justify-between gap-6 mb-1">
          <div className="max-w-xs">
            <p className="text-xs text-white/40 leading-relaxed">
              Средняя стоимость автомобиля во Владивостоке, со всеми расходами.
            </p>
            <p className="text-xs text-white/30 leading-relaxed mt-1">
              Расчёт выполняется по текущему курсу JPY/RUB и локальным настройкам страницы.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl lg:text-4xl font-black text-white tabular-nums">
              {loading ? '—' : totalRub > 0 ? formatMoney(totalRub) : '—'}
            </span>
          </div>
        </div>

        <div className="mt-4">
          {/* Auction price row */}
          <div className="flex items-start justify-between gap-6 py-5 border-b border-white/10">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white/90">Стоимость авто на аукционе</span>
              <span className="text-xs text-white/40">
                {auctionPriceJpy > 0 ? auctionPriceJpy.toLocaleString('ru-RU') + ' ¥' : '—'}
              </span>
              {commercialRate > 0 && (
                <span className="text-xs text-white/50 mt-1">
                  Актуальный курс йены банка АТБ{result?.rate_date ? ` на ${result.rate_date}` : ''} составляет: {commercialRate}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-white/80 shrink-0 whitespace-nowrap">
              {auctionRub > 0 ? formatMoney(auctionRub) : '—'}
            </span>
          </div>

          {/* Buy & Delivery */}
          <CostRow
            title="Расходы на покупку и доставку"
            amount={japanRub}
            subItems={[
              'Комиссия аукциона',
              'Комиссия за покупку',
              'Доставка до порта',
              'Доставка до Владивостока',
            ]}
          />

          {/* Customs broker services */}
          <CostRow
            title="Услуги растаможивания и забора авто"
            amount={brokerRub}
            subItems={[
              'Растаможивание авто',
              'Выгрузка с корабля',
              'Хранение 7 дней на СВХ',
              'Услуга брокера',
              'Получение СБКТС',
              'Фото осмотр и приёмка авто',
            ]}
          />

          {/* Duty */}
          <CostRow
            title="Пошлина (На физ. лицо)"
            amount={dutyRub}
            subItems={[
              'Таможенная пошлина на сегодня',
              'Актуальная пошлина рассчитывается ежедневно',
            ]}
          />

          {/* Util fee */}
          <CostRow
            title={usageType === 'commercial' ? 'Коммерческий утильсбор' : 'Льготный утильсбор'}
            amount={utilRub}
            subItems={
              usageType === 'commercial'
                ? ['Рассчитывается по коммерческой сетке', 'Зависит от объёма двигателя и возраста']
                : ['Для личного авто', 'Льготная ставка отображается отдельно']
            }
          />

          {/* Total row */}
          <div className="flex items-center justify-between gap-6 pt-6 mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white/70">Итого</span>
              <span className="text-xs text-white/30">
                Ручной расчёт всегда можно пересчитать в любой момент.
              </span>
            </div>
            <span className="text-2xl font-black text-white whitespace-nowrap tabular-nums">
              {loading ? '—' : totalRub > 0 ? formatMoney(totalRub) : '—'}
            </span>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <Button
              type="button"
              onClick={() => void calculate()}
              className="bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Заказать такое авто
            </Button>
            <span className="text-sm text-white/50">
              Город:{' '}
              <span className="text-white/80 font-medium">{selectedCityLabel}</span>
            </span>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-white/25 leading-relaxed">
            Данные расчёта носят информационный характер и могут меняться в зависимости от курса,
            возраста автомобиля и таможенных правил.
          </p>
        </div>
      </div>
    </div>
  )
}
