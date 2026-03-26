import { getConfiguredBackendApiUrl } from '@/lib/api/backend-url'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD'])

const buildTargetUrl = (baseUrl: string, path: string[], search: string) => {
  const normalizedPath = path.map(encodeURIComponent).join('/')
  return `${baseUrl}/${normalizedPath}${search}`
}

const createForwardHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.set('ngrok-skip-browser-warning', 'true')
  return headers
}

const createResponse = (response: Response) => {
  const headers = new Headers()
  const contentType = response.headers.get('content-type')
  const cacheControl = response.headers.get('cache-control')

  if (contentType) {
    headers.set('content-type', contentType)
  }

  if (cacheControl) {
    headers.set('cache-control', cacheControl)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}

const handleRequest = async (request: NextRequest, { params }: RouteContext) => {
  const baseUrl = getConfiguredBackendApiUrl()

  if (!baseUrl) {
    return NextResponse.json(
      { message: 'API_URL is not configured on the frontend server.' },
      { status: 500 },
    )
  }

  const { path } = await params
  const targetUrl = buildTargetUrl(baseUrl, path, request.nextUrl.search)
  const requestBody = METHODS_WITHOUT_BODY.has(request.method)
    ? undefined
    : await request.arrayBuffer()

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: createForwardHeaders(request),
      body: requestBody,
      cache: 'no-store',
    })

    return createResponse(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream fetch error'

    return NextResponse.json(
      {
        message: 'Backend upstream request failed.',
        targetUrl,
        error: message,
      },
      { status: 502 },
    )
  }
}

export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
export const OPTIONS = handleRequest
