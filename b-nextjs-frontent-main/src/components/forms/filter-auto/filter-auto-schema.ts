import { Country } from '@/constants/country'
import { z } from 'zod'

export const filterAutoSchema = z.object({
  model: z.string('Выберите модель автомобиля').optional(),
  make: z.string('Выберите марку автомобиля').optional(),
  minGrade: z.string().optional(),
  maxGrade: z.string().optional(),
  auctionDate: z.string().optional(),
  minYear: z.coerce
    .number()
    .min(1900, 'Минимальный год 1900')
    .max(new Date().getFullYear(), 'Максимальный год текущий')
    .optional(),
  maxYear: z.coerce
    .number()
    .min(1900, 'Минимальный год 1900')
    .max(new Date().getFullYear(), 'Максимальный год текущий')
    .optional(),
  minMileageKm: z.coerce.number().min(0, 'Минимальный пробег 0').optional(),
  maxMileageKm: z.coerce.number().min(0, 'Минимальный пробег 0').optional(),
  minEnginePower: z.coerce
    .number()
    .min(0, 'Минимальный объём двигателя 0')
    .optional(),
  maxEnginePower: z.coerce
    .number()
    .min(0, 'Минимальный объём двигателя 0')
    .optional(),
  body: z.string().optional(),
  minPrice: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректную цену'),
  maxPrice: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректную цену'),
  saleCountry: z.enum(Object.values(Country) as [string, ...string[]]).optional(),
})
