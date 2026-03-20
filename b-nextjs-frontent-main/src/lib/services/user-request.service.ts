'use server'

import { getPayload } from 'payload'
import { sendCallbackTelegramNotification, sendTelegramNotification } from './telegram.service'

const getPayloadConfig = async () => (await import('@payload-config')).default

export const createCallbackUserRequest = async (
  name: string,
  tel: string,
  email?: string,
  issue?: string,
) => {
  const payload = await getPayload({ config: await getPayloadConfig() })
  try {
    await Promise.all([
      sendCallbackTelegramNotification(name, tel, email, issue),
      payload.create({
        collection: 'user-request',
        data: {
          type: 'CALLBACK',
          name,
          tel,
          email,
          issue,
        },
      }),
    ])
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating user request: ${error.message}`, error)
    }
  }
}

export const createUserCarRequest = async (name: string, tel: string, car?: string) => {
  const payload = await getPayload({ config: await getPayloadConfig() })
  try {
    await Promise.all([
      (async () => {
        try {
          return await sendTelegramNotification(name, tel, car)
        } catch {
          return null
        }
      })(),
      payload.create({
        collection: 'user-request',
        data: {
          type: 'CAR_SELECTION',
          name,
          tel,
          car,
        },
      }),
    ])
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating user request: ${error.message}`, error)
    }
  }
}
