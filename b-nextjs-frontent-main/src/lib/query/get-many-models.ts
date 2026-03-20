import { PipelineStage } from 'mongoose'
import { getPayload } from 'payload'

type GetManyModel = {
  brand: string
  model: string
  modelDisplay: string
  modelSlug: string
}

export type GetManyModelsResponse = {
  models: GetManyModel[]
  hasNext: boolean
  page: number
}

const getPayloadConfig = async () => (await import('@payload-config')).default

export const getManyModels = async (
  page: number,
  limit: number,
  saleCountry?: string | null,
): Promise<GetManyModelsResponse> => {
  try {
    const payload = await getPayload({ config: await getPayloadConfig() })
    const schema = payload.db.collections['catalog-car']

    const skip = (page - 1) * limit

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
        $sort: { brand: 1, model: 1 },
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

    const result = await schema.aggregate(pipeline as [])

    const hasNext = result.length > limit
    const models = hasNext ? result.slice(0, -1) : result
    return {
      models: models.map((item) => ({
        brand: item.brand,
        model: item.model,
        modelDisplay: item.modelDisplay,
        modelSlug: item.modelSlug,
      })),
      hasNext,
      page,
    }
  } catch {
    return {
      models: [],
      hasNext: false,
      page,
    }
  }
}
