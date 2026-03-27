import { Country } from '@/constants/country'
import { z } from 'zod'

const optionalNumberField = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.')
      if (!normalized) {
        return undefined
      }

      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : value
    }

    return value
  }, schema.optional())

export const filterAutoSchema = z.object({
  model: z.string('Выберите модель автомобиля').optional(),
  make: z.string('Выберите марку автомобиля').optional(),
  rating: z.string().optional(),
  minGrade: z.string().optional(),
  maxGrade: z.string().optional(),
  auctionDate: z.string().optional(),
  minYear: optionalNumberField(
    z
      .number()
      .min(1900, 'Минимальный год 1900')
      .max(new Date().getFullYear(), 'Максимальный год текущий'),
  ),
  maxYear: optionalNumberField(
    z
      .number()
      .min(1900, 'Минимальный год 1900')
      .max(new Date().getFullYear(), 'Максимальный год текущий'),
  ),
  minMileageKm: optionalNumberField(z.number().min(0, 'Минимальный пробег 0')),
  maxMileageKm: optionalNumberField(z.number().min(0, 'Минимальный пробег 0')),
  minEnginePower: optionalNumberField(z.number().min(0, 'Минимальный объем двигателя 0')),
  maxEnginePower: optionalNumberField(z.number().min(0, 'Минимальный объем двигателя 0')),
  body: z.string().optional(),
  minPrice: optionalNumberField(z.number()).refine(
    (value) => value === undefined || value >= 0,
    'Введите корректную цену',
  ),
  maxPrice: optionalNumberField(z.number()).refine(
    (value) => value === undefined || value >= 0,
    'Введите корректную цену',
  ),
  saleCountry: z.enum(Object.values(Country) as [string, ...string[]]).optional(),
})
