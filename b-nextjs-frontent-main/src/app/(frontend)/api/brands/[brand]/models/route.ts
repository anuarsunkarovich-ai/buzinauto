import { createSearchRegex } from '@/lib/transliteration'
import configPromise from '@payload-config'
import { PipelineStage } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brand: string }> },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const saleCountry = searchParams.get('country')

    const brandName = decodeURIComponent((await params).brand)
    const brandRegexes = createSearchRegex(brandName)

    const schema = payload.db.collections['catalog-car']

    const pipeline: PipelineStage[] = [
      {
        $group: {
          _id: {
            brand: '$brand',
            model: '$model',
          },
          brand: { $first: '$brand' },
          model: { $first: '$model' },
          modelDisplay: { $first: '$modelDisplay' },
          modelSlug: { $first: '$modelSlug' },
        },
      },
      {
        $sort: { model: 1 },
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
          brand: { $in: brandRegexes },
          saleCountry,
          isFinish: true,
        },
      })
    } else {
      pipeline.unshift({
        $match: {
          brand: { $in: brandRegexes },
          isFinish: true,
        },
      })
    }

    const result = await schema.aggregate(pipeline)

    const hasNext = result.length > limit
    const models = hasNext ? result.slice(0, -1) : result

    return NextResponse.json({
      models: models.map((item) => ({
        brand: item.brand,
        model: item.model,
        modelDisplay: item.modelDisplay,
        modelSlug: item.modelSlug,
      })),
      hasNext,
      page,
      brand: brandName,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch models for brand' }, { status: 500 })
  }
}
