import configPromise from '@payload-config'
import { PipelineStage } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const saleCountry = searchParams.get('country')
    const skip = (page - 1) * limit

    const schema = payload.db.collections['catalog-car']

    const pipeline: PipelineStage[] = [
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
          isFinish: true,
        },
      })
    } else {
      pipeline.unshift({
        $match: {
          isFinish: true,
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
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
