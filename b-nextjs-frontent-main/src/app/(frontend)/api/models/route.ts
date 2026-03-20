import { getManyModels } from '@/lib/query/get-many-models'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const saleCountry = searchParams.get('country')

    return NextResponse.json(await getManyModels(page, limit, saleCountry))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
