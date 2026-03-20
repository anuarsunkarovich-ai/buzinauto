import { DialogDetailedCarItem } from '@/hooks/use-car-fee-calc'

export const DetailChinaCarPrice: DialogDetailedCarItem[] = [
  {
    title: 'Аукционная стоимость',
    callToMoney: 'AUCTION_PRICE',
    currency: 'RUB',
    tip: 'Средняя цена автомобиля на китайском аукционе.',
  },
  {
    title: 'Расходы на доставку в Китае',
    money: 14000,
    currency: 'CNY',
    tip: 'Включает локальную логистику и подготовку автомобиля к отправке.',
  },
  {
    title: 'Комиссия банка за перевод в Китай',
    callToMoney: 'COMMISSION_CNY',
    currency: 'RUB',
    tip: 'Банковская комиссия за перевод средств поставщику.',
  },
  {
    title: 'Утилизационный сбор',
    callToMoney: 'RECYCLING_FEE',
    currency: 'RUB',
    tip: 'Обязательный платеж при ввозе автомобиля в Россию.',
  },
  {
    title: 'Пошлина',
    callToMoney: 'CUSTOMS_DUTY',
    currency: 'RUB',
    tip: 'Таможенный платеж за ввоз автомобиля.',
  },
  {
    title: 'Доставка до вашего города',
    callToMoney: 'DELIVERY_TO_CITY',
    currency: 'RUB',
    tip: 'Финальная логистика по России после таможенного оформления.',
  },
  {
    title: 'Комиссия',
    money: 140000,
    currency: 'RUB',
    tip: 'Комиссия компании за подбор, сопровождение и оформление сделки.',
  },
]

export const DetailJapanCarPrice: DialogDetailedCarItem[] = [
  {
    title: 'Аукционная стоимость',
    callToMoney: 'AUCTION_PRICE',
    currency: 'RUB',
    tip: 'Цена автомобиля на аукционе в Японии, пересчитанная в рубли по курсу ATB.',
  },
  {
    title: 'Расходы по Японии',
    callToMoney: 'AUCTION_DELIVERY',
    currency: 'RUB',
    tip: 'Фиксированные 162 500 иен: выкуп, локальная логистика и доставка до Владивостока.',
  },
  {
    title: 'Оформление и услуги брокера',
    callToMoney: 'CLEARANCE_FEE',
    currency: 'RUB',
    tip: 'Фиксированное оформление СБКТС/ЭПТС и услуги брокера.',
  },
  {
    title: 'Пошлина',
    callToMoney: 'CUSTOMS_DUTY',
    currency: 'RUB',
    tip: 'Таможенная пошлина и сбор за оформление, рассчитанные по формуле для физлица.',
  },
  {
    title: 'Утилизационный сбор',
    callToMoney: 'RECYCLING_FEE',
    currency: 'RUB',
    tip: 'Льготный утильсбор: 3400 руб. для новых авто и 5200 руб. для авто старше 3 лет.',
  },
]
