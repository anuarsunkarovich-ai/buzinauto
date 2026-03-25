import { getPayload } from 'payload'

export const getPayloadConfig = async () => (await import('@payload-config')).default
