import { createSearchRegex } from '@/lib/transliteration'
import configPromise from '@payload-config'
import { PipelineStage } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ brand: string; model: string }>
  },
) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    const saleCountry = searchParams.get('country')
    const { brand, model } = await params

    const brandName = decodeURIComponent(brand)
    const modelName = decodeURIComponent(model)
    const brandRegexes = createSearchRegex(brandName)
    const modelRegexes = createSearchRegex(modelName)

    const schema = payload.db.collections['catalog-car']

    const pipeline: PipelineStage[] = [
      {
        $group: {
          _id: '$body',
          body: { $first: '$body' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1, body: 1 },
      },
    ]

    const matchStage: PipelineStage.Match['$match'] = {
      brand: { $in: brandRegexes },
      isFinish: true,
      body: {
        $exists: true,
        $nin: ['', null],
      },
      $or: [
        { model: { $in: modelRegexes } },
        { modelDisplay: { $in: modelRegexes } },
        { modelSlug: { $in: modelRegexes } },
      ],
    }

    if (saleCountry) {
      matchStage.saleCountry = saleCountry
    }

    pipeline.unshift({ $match: matchStage })

    const result = await schema.aggregate(pipeline as [])

    return NextResponse.json({
      bodies: result.map((item) => ({
        body: item.body,
        count: item.count,
      })),
      brand: brandName,
      model: modelName,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch body types for model' }, { status: 500 })
  }
}
