import { City } from '@/components/contexts/city-context'

export const CITY_ALL: City[] = [
  {
    id: 'VLD',
    alias: 'Владивосток',
    slug: 'vladivostok',
  },
  {
    id: 'UUD',
    alias: 'Улан-Удэ',
    slug: 'ulan-ude',
  },
  {
    id: 'IRK',
    alias: 'Иркутск',
    slug: 'irkutsk',
  },
  {
    id: 'NSK',
    alias: 'Новосибирск',
    slug: 'novosibirsk',
  },
  {
    id: 'KRD',
    alias: 'Краснодар',
    slug: 'krasnodar',
  },
  {
    id: 'KHB',
    alias: 'Хабаровск',
    slug: 'habarovsk',
  },
  {
    id: 'EKB',
    alias: 'Екатеринбург',
    slug: 'ekaterinburg',
  },
  {
    id: 'OMS',
    alias: 'Омск',
    slug: 'omsk',
  },
  {
    id: 'KRY',
    alias: 'Красноярск',
    slug: 'krasnoyarsk',
  },
  {
    id: 'RU',
    alias: 'Россию',
    slug: 'rossia',
  },
] as const

export const CITY_DELIVERY_CAR = {
  VLD: {
    rub: 0,
  },
  UUD: {
    rub: 85_000,
  },
  IRK: {
    rub: 90_000,
  },
  NSK: {
    rub: 170_000,
  },
  KRD: {
    rub: 200_000,
  },
  KHB: {
    rub: 17_000,
  },
  EKB: {
    rub: 170_000,
  },
  OMS: {
    rub: 110_000,
  },
  KRY: {
    rub: 130_000,
  },
} as Record<string, { rub: number }>
