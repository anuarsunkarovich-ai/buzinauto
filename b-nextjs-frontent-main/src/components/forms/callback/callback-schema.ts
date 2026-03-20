import { z } from 'zod'

export const CallbackSchema = z.object({
  name: z.string('Введите имя'),
  phone: z.e164('Введите номер телефона'),
  email: z.email('Введите ваш email').optional(),
  issue: z.string('Введите ваш вопрос').optional(),
  isPrivacyAllowed: z.boolean('Подтвердите согласие с политикой конфиденциальности').optional(),
})
