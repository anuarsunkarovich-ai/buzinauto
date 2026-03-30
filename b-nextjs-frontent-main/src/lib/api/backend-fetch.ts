import { getBackendApiCandidates } from '@/lib/api/backend-url'

type BackendQueryValue = string | number | boolean | undefined | null

type FetchBackendOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, BackendQueryValue>
  json?: unknown
}

const appendQueryParams = (url: URL, query?: Record<string, BackendQueryValue>) => {
  if (!query) {
    return
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    url.searchParams.set(key, String(value))
  }
}

const buildBackendUrl = (baseUrl: string, pathname: string, query?: Record<string, BackendQueryValue>) => {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`)
  appendQueryParams(url, query)
  return url.toString()
}

export const fetchBackend = async (
  pathname: string,
  { query, json, headers, ...init }: FetchBackendOptions = {},
) => {
  const candidates = await getBackendApiCandidates()
  if (candidates.length === 0) {
    throw new Error('Backend API URL is not configured')
  }

  let lastResponse: Response | null = null
  let lastError: unknown = null

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(buildBackendUrl(baseUrl, pathname, query), {
        ...init,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(headers || {}),
        },
        body: json !== undefined ? JSON.stringify(json) : undefined,
      })

      if (response.ok) {
        return response
      }

      lastResponse = response
    } catch (error) {
      lastError = error
    }
  }

  if (lastResponse) {
    return lastResponse
  }

  throw lastError instanceof Error ? lastError : new Error('Backend request failed')
}

export const fetchBackendJson = async <T>(
  pathname: string,
  options?: FetchBackendOptions,
): Promise<T> => {
  const response = await fetchBackend(pathname, options)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
