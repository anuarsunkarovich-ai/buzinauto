import { getConfiguredBackendApiUrl } from '@/lib/api/backend-url'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isPublicHttpUrl = (value: string) => /^https?:\/\//i.test(value)

export async function GET() {
  const apiUrl = getConfiguredBackendApiUrl()

  return NextResponse.json({
    apiUrl: isPublicHttpUrl(apiUrl) ? apiUrl : '',
  })
}
