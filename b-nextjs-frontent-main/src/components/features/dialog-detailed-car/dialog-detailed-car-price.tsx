import { CITY_ALL } from '@/constants/city'
import { useCarFeeFuncEnum } from '@/hooks/use-car-fee-calc'
import { useCity } from '@/hooks/use-city'
import { EngineType } from '@/lib/calculator/car-fee-import-calc.type'
import * as React from 'react'
import { Button } from '../../ui/button'
import { Card, CardHeader } from '../../ui/card'
import { Combobox } from '../../ui/combobox/combobox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Money } from '../../ui/money'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import { Text } from '../../ui/text'
import { DialogOrderCar } from '../dialog-order-car'
import { DialogDetailedCarTooltip } from './dialog-detailed-car-tooltip'

export type DialogDetailedCarPricePropsTypes = {
  carPrice: number
  currency: string
  engineType: EngineType
  enginePower: number
  horsepower: number
  carAge: number
  deliveryCity?: string
  renderTrigger?: () => React.ReactNode
} & Partial<React.ReactPortal>

export const DialogDetailedCarPrice: React.FC<DialogDetailedCarPricePropsTypes> = ({
  carPrice,
  currency,
  engineType,
  enginePower,
  carAge,
  renderTrigger,
  horsepower,
  deliveryCity: defaultDeliveryCity,
}) => {
  const [open, setOpen] = React.useState(false)
  const { currentCity } = useCity()
  const [deliveryCity, setDeliveryCity] = React.useState<string | undefined>(
    defaultDeliveryCity ?? currentCity?.id,
  )

  const {
    totalRubAmount,
    calculator,
    currencyPriceList,
    commercialRate,
    buyAndDeliveryJpy,
    rateDate,
  } = useCarFeeFuncEnum(carPrice, currency, engineType, enginePower, horsepower, carAge, 'private')

  const { setCurrentCity, currentCity: userCity } = useCity()

  const selectCity = React.useMemo(() => {
    return userCity?.id || deliveryCity
  }, [deliveryCity, userCity])

  const handlerSelection = React.useCallback(
    (value?: string) => {
      const city = CITY_ALL.find((e) => e.id === value)
      if (!city) return
      setDeliveryCity(value)
      setCurrentCity(city)
    },
    [setCurrentCity],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger ? (
          renderTrigger()
        ) : (
          <Button variant={'outline'} className="max-w-fit cursor-pointer !border-primary">
            Расшифровка цены
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`
          mt-5
          sm:max-w-3xl
        `}
      >
        <DialogHeader>
          <DialogTitle>Подробный расчет</DialogTitle>
        </DialogHeader>
        <Card className="w-full">
          <CardHeader
            className={`
              flex flex-col items-start justify-between gap-3
              md:flex-row md:items-center
            `}
          >
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <Text as="small" className="text-muted-foreground">
                Итого
              </Text>
              <Text as="span" className="mt-1 block text-lg font-semibold">
                <Money amount={totalRubAmount()} />
              </Text>
            </div>
            <div className="flex items-center space-x-3">
              <Text as="small" className="text-muted-foreground">
                Город доставки
              </Text>
              <Combobox
                options={CITY_ALL}
                valueKey="id"
                labelKey="alias"
                placeholder="Владивосток..."
                searchPlaceholder="Найти город..."
                emptyMessage="Упс... Ничего не найдено"
                value={selectCity}
                onChange={handlerSelection}
              />
            </div>
          </CardHeader>
        </Card>
        <Table
          container={{
            className: 'overflow-auto max-h-fit scrollbar-primary',
            style: {
              height: 'calc(100vh - 22rem)',
            },
          }}
        >
          <TableCaption>
            Окончательные суммы могут отличаться в зависимости от курса валют и дополнительных
            условий. Для точного расчета оставьте заявку на сайте. Консультация бесплатная.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-max">Расход</TableHead>
              <TableHead
                className={`
                  max-w-24 text-center
                  md:max-w-full
                `}
              >
                Цена
              </TableHead>
              <TableHead
                className={`
                  max-w-10 overflow-hidden text-right text-ellipsis whitespace-nowrap
                  sm:max-w-20
                `}
              >
                Подробнее
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencyPriceList.map((row, i) => {
              const moneyRub = calculator(row)
              if (!moneyRub) return
              const isAuctionPriceRow = row.callToMoney === 'AUCTION_PRICE'
              const isJapanExpensesRow = row.callToMoney === 'AUCTION_DELIVERY'

              return (
                <TableRow key={i}>
                  <TableCell
                    className={`
                      w-max font-medium whitespace-normal
                      md:whitespace-nowrap
                    `}
                  >
                    {row.title}
                  </TableCell>
                  <TableCell
                    className={`
                      max-w-24 text-center
                      md:max-w-full
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Money amount={moneyRub} />
                      {isAuctionPriceRow && carPrice > 0 && (
                        <>
                          <Text as="small" className="text-muted-foreground">
                            {carPrice.toLocaleString('ru-RU')} ¥
                          </Text>
                          {commercialRate && (
                            <Text as="small" className="text-center text-muted-foreground">
                              Актуальный коммерческий курс йены банка АТБ
                              {rateDate ? ` на ${rateDate}` : ''} составляет: {commercialRate}
                            </Text>
                          )}
                        </>
                      )}
                      {isJapanExpensesRow && (buyAndDeliveryJpy || 0) > 0 && (
                        <Text as="small" className="text-muted-foreground">
                          {Number(buyAndDeliveryJpy).toLocaleString('ru-RU')} Â¥
                        </Text>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.tip ? <DialogDetailedCarTooltip tip={row.tip} /> : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Итого</TableCell>
              <TableCell colSpan={2} className="text-right">
                <Money amount={totalRubAmount()} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <div className="flex justify-end">
          <DialogOrderCar />
        </div>
      </DialogContent>
    </Dialog>
  )
}
