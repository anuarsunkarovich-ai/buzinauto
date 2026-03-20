const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

export const getConfiguredBackendApiUrl = () => {
  const value = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  return trimTrailingSlashes(value)
}

export const getRuntimeBackendApiUrl = () => {
  if (typeof window !== 'undefined') {
    return new URL('/api/backend', window.location.origin).toString()
  }

  return getConfiguredBackendApiUrl()
}
