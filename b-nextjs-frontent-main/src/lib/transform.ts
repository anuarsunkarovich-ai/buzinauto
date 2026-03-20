import { CITY_ALL } from '@/constants/city'

export const stringToNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value
}

export const stringToFirstCapitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function toCarModelSlug(text: string): string {
  return text
    .trimEnd()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toModelDisplay(model: string): string {
  const lowercaseWords = ['series']
  const uppercaseWords = ['tf', 'ut', 'mio', 'van', 'max', 'low']

  return model
    .trim()
    .replace(/[\-\_]+/g, ' ')
    .toLowerCase()
    .split(/\s+/) // Разбиваем по любым пробелам
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      if (lowercaseWords.includes(word)) {
        return word
      }

      if (uppercaseWords.includes(word)) {
        return word.toUpperCase()
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function existItemOfArray<T extends string | number | null | undefined>(array: T[]) {
  return array.filter((e): e is (T & string) | (T & number) | T => {
    if (typeof e === 'string' && e.trim().length > 0) return true
    if (typeof e === 'number') return true
    if (typeof e === 'object') return true
    return false
  })
}

export const toMoney = (amount: number, currency = 'руб.') => {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return `0 ${currency}`
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num)) {
    return `0 ${currency}`
  }

  const formatted = Math.abs(num).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return `${num < 0 ? '-' : ''}${formatted} ${currency}`
}

export const toUrlSlug = (slug: string) => {
  return slug.replace(/[\_]+/, '-').toLowerCase()
}

export const toValidSlug = (slug: string) => {
  return decodeURI(slug).replace(/[\-]+/, '_').toUpperCase()
}

export const toCityPrefix = (slug: string) => {
  return slug === 'vladivostok' ? 'во' : 'в'
}

export const toReadableCity = (slug: string) => {
  return CITY_ALL.find((e) => e.slug === slug)?.alias as string
}

export const toReadableSlug = (model: string) => {
  const lowercaseWords = ['series']
  const uppercaseWords = ['tf', 'ut', 'mio', 'van', 'max', 'low']

  return model
    .trim()
    .replace(/[\-]+/g, ' ')
    .toLowerCase()
    .split(/\s+/) // Разбиваем по любым пробелам
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      if (lowercaseWords.includes(word)) {
        return word
      }

      if (uppercaseWords.includes(word)) {
        return word.toUpperCase()
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
