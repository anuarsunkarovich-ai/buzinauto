import { Country } from '@/constants/country'
import { z } from 'zod'

export const filterAutoSchema = z.object({
  model: z.string('Выберите модель автомобиля').optional(),
  make: z.string('Выберите марку автомобиля').optional(),
  rating: z.string('Выберите рейтинг автомобиля').optional(),
  auctionDate: z.string().optional(),
  minYear: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 1900, 'Введите корректный год'),
  maxYear: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 1900, 'Введите корректный год'),
  minMileageKm: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректный пробег'),
  maxMileageKm: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректный пробег'),
  minEnginePower: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректный объём двигателя'),
  maxEnginePower: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректный объём двигателя'),
  body: z.string().optional(),
  minPrice: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректную цену'),
  maxPrice: z.coerce
    .number()
    .optional()
    .refine((e) => e === undefined || e >= 0, 'Введите корректную цену'),
  saleCountry: z.enum(Object.values(Country), 'Выберите страну'),
})
