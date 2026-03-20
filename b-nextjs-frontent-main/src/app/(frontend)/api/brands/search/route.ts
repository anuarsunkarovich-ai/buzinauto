import { createSearchRegex } from '@/lib/transliteration'
import configPromise from '@payload-config'
import { PipelineStage } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const saleCountry = searchParams.get('country')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const skip = (page - 1) * limit
    const schema = payload.db.collections['catalog-car']

    const searchRegexes = createSearchRegex(query)

    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: searchRegexes.map((regex) => ({ brand: regex })),
          isFinish: true,
        },
      },
      {
        $group: {
          _id: '$brand',
          brand: { $first: '$brand' },
        },
      },
      {
        $sort: { brand: 1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit + 1,
      },
    ]

    if (saleCountry) {
      pipeline.unshift({
        $match: {
          saleCountry,
        },
      })
    }

    const result = await schema.aggregate(pipeline)

    const hasNext = result.length > limit
    const brands = hasNext ? result.slice(0, -1) : result

    return NextResponse.json({
      brands: brands.map((item) => ({ brand: item.brand })),
      hasNext,
      page,
      query,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to search brands' }, { status: 500 })
  }
}
