import { z } from 'zod'

export const OrderCarSchema = z.object({
  name: z.string('Введите имя'),
  phone: z.e164('Введите номер телефона'),
  auto: z.string('Введите марку и модель автомобиля').optional(),
  isPrivacyAllowed: z.boolean('Подтвердите согласие с политикой конфиденциальности').optional(),
})
