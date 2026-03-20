import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isMongoId = (id: string) => {
  const mongoIdRegex = /^[a-fA-F0-9]{24}$/
  return mongoIdRegex.test(id)
}
