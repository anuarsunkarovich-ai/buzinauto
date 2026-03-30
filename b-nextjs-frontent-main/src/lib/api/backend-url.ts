const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

export const getConfiguredBackendApiUrl = () => {
  const value = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  return trimTrailingSlashes(value)
}

const getBrowserProxyBackendApiUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return trimTrailingSlashes(new URL('/api/backend', window.location.origin).toString())
}

let browserResolvedBackendApiUrl: string | null | undefined
let browserResolvedBackendApiUrlRequest: Promise<string> | null = null

export const getBrowserResolvedBackendApiUrl = async () => {
  if (typeof window === 'undefined') {
    return getConfiguredBackendApiUrl()
  }

  const publicApiUrl = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_URL || '')
  if (publicApiUrl) {
    browserResolvedBackendApiUrl = publicApiUrl
    return publicApiUrl
  }

  if (browserResolvedBackendApiUrl !== undefined) {
    return browserResolvedBackendApiUrl || ''
  }

  if (!browserResolvedBackendApiUrlRequest) {
    browserResolvedBackendApiUrlRequest = fetch('/api/backend-url', {
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          return ''
        }

        const payload = (await response.json()) as { apiUrl?: string }
        return trimTrailingSlashes(payload.apiUrl || '')
      })
      .catch(() => '')
      .then((apiUrl) => {
        browserResolvedBackendApiUrl = apiUrl || null
        browserResolvedBackendApiUrlRequest = null
        return apiUrl
      })
  }

  return browserResolvedBackendApiUrlRequest
}

export const getBackendApiCandidates = async () => {
  if (typeof window === 'undefined') {
    return [getConfiguredBackendApiUrl()].filter(Boolean)
  }

  const candidates = [
    getBrowserProxyBackendApiUrl(),
    await getBrowserResolvedBackendApiUrl(),
  ].filter(Boolean)

  return Array.from(new Set(candidates))
}

export const getRuntimeBackendApiUrl = () => {
  if (typeof window !== 'undefined') {
    return getBrowserProxyBackendApiUrl()
  }

  return getConfiguredBackendApiUrl()
}
