import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/backend-url', () => ({
  getRuntimeBackendApiUrl: () => 'https://example.com/api/v1',
  getBackendApiCandidates: async () => ['https://example.com/api/v1'],
}))

import { searchCars } from '@/lib/services/auction.service'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('auction service', () => {
  it('returns backend results without applying a second client-side filter pass', async () => {
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

    expect(result.results.map((car) => car.lot)).toEqual(['1', '2', '3'])
  })

  it('preserves response metadata while returning backend rows as-is', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          pagination: {
            page: 2,
            limit: 12,
            total_items: 24,
            total_pages: 2,
            has_next_page: false,
            has_prev_page: true,
          },
          exchange_rate: 0.498,
          rate_source: 'ATB Bank',
          rate_date: '31.03.2026',
          results: [
            { lot: '1', body: 'TYPE R', modification: 'FL5 TYPE R' },
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
    expect(result.pagination?.page).toBe(2)
    expect(result.exchange_rate).toBe(0.498)
    expect(result.rate_date).toBe('31.03.2026')
  })

  it('sends explicit enrich_details=false when catalog search disables detail scraping', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    await searchCars({
      brand: 'honda',
      enrichDetails: false,
      limit: 12,
    })

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0] || ''))
    expect(requestUrl.searchParams.get('enrich_details')).toBe('false')
  })
})
