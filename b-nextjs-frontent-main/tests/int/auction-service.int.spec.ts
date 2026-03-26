import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/backend-url', () => ({
  getRuntimeBackendApiUrl: () => 'https://example.com/api/v1',
}))

import { searchCars } from '@/lib/services/auction.service'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('auction body filtering', () => {
  it('keeps exact multi-token body matches without widening to partial variants', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { lot: '1', body: 'HATCHBACK HONDA SENSING', model: 'CIVIC', model_code: 'FK7' },
            { lot: '2', body: 'HONDA SENSING', model: 'CIVIC', model_code: 'FK7' },
            { lot: '3', body: 'HATCHBACK', model: 'CIVIC', model_code: 'FK7' },
          ],
        }),
      }),
    )

    const result = await searchCars({
      brand: 'honda',
      model: 'civic',
      body: 'HATCHBACK HONDA SENSING',
      limit: 50,
    })

    expect(result.results.map((car) => car.lot)).toEqual(['1'])
  })

  it('still matches body/model code combinations for short code filters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { lot: '1', body: 'HATCHBACK HONDA SENSING', modification: 'FK7 HATCHBACK HONDA SENSING' },
            { lot: '2', body: 'TYPE R', modification: 'FL5 TYPE R' },
          ],
        }),
      }),
    )

    const result = await searchCars({
      brand: 'honda',
      model: 'civic',
      body: 'FK7',
      limit: 50,
    })

    expect(result.results.map((car) => car.lot)).toEqual(['1'])
  })
})
