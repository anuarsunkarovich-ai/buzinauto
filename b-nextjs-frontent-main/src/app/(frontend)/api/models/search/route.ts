/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const brand = searchParams.get('brand')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const saleCountry = searchParams.get('country')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const skip = (page - 1) * limit
    const schema = payload.db.collections['catalog-car']

    const searchRegexes = createSearchRegex(query)

    const matchConditions: any = {
      $or: [
        ...searchRegexes.map((regex) => ({ model: regex })),
        ...searchRegexes.map((regex) => ({ modelDisplay: regex })),
      ],
      isFinish: true,
    }

    if (brand) {
      const brandRegexes = createSearchRegex(brand)
      matchConditions.brand = {
        $in: brandRegexes,
      }
    }

    if (saleCountry) {
      matchConditions.saleCountry = saleCountry
    }

    const pipeline: PipelineStage[] = [
      {
        $match: matchConditions,
      },
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
        $sort: { brand: 1, model: 1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit + 1,
      },
    ]

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
      query,
      brand,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to search models' }, { status: 500 })
  }
}
