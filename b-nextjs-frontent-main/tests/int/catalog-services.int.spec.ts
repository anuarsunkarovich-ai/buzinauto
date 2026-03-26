import { describe, expect, it } from 'vitest'

import {
  normalizeBodyResponse,
  normalizeBrandResponse,
  normalizeModelResponse,
} from '@/lib/services/catalog-filters.service'
import {
  buildAuctionStatsFallbackFromSearchResults,
  buildAuctionStatsUrl,
} from '@/lib/services/auction-stats.service'

describe('catalog filter helpers', () => {
  it('normalizes local brand payloads', () => {
    expect(
      normalizeBrandResponse({
        brands: [{ brand: 'TOYOTA' }, { brand: 'HONDA' }],
      }),
    ).toEqual([
      { brand: 'TOYOTA', brandName: 'TOYOTA' },
      { brand: 'HONDA', brandName: 'HONDA' },
    ])
  })

  it('normalizes upstream model payloads', () => {
    expect(
      normalizeModelResponse(
        {
          results: [{ id: '\\"718', name: 'Prius Alpha' }],
        },
        'TOYOTA',
      ),
    ).toEqual([
      {
        brand: 'TOYOTA',
        model: '718',
        modelDisplay: 'Prius Alpha',
        modelSlug: 'prius-alpha',
      },
    ])
  })

  it('drops placeholder body values', () => {
    expect(
      normalizeBodyResponse({
        results: [
          { id: '-1', name: '---Все кузова---' },
          { id: '1', name: 'ZVW41' },
        ],
      }),
    ).toEqual([{ body: 'ZVW41', label: 'ZVW41', count: undefined }])
  })
})

describe('auction stats URL builder', () => {
  it('uses the backend parameter names expected by FastAPI', () => {
    const url = buildAuctionStatsUrl('https://example.com/api/v1', 'TOYOTA', 'prius-alpha', {
      minMileageKm: 10000,
      maxMileageKm: 80000,
      minYear: 2018,
      maxYear: 2024,
      minGrade: '4',
      maxGrade: '5',
      body: 'ZVW41',
    })

    expect(url.toString()).toContain('/auction/stats?')
    expect(url.searchParams.get('brand')).toBe('TOYOTA')
    expect(url.searchParams.get('model')).toBe('prius-alpha')
    expect(url.searchParams.get('min_mileage_km')).toBe('10000')
    expect(url.searchParams.get('max_mileage_km')).toBe('80000')
    expect(url.searchParams.get('min_year')).toBe('2018')
    expect(url.searchParams.get('max_year')).toBe('2024')
    expect(url.searchParams.get('min_grade')).toBe('4')
    expect(url.searchParams.get('max_grade')).toBe('5')
    expect(url.searchParams.get('body')).toBe('ZVW41')
    expect(url.searchParams.get('rating')).toBeNull()
  })

  it('builds stats from search results when the stats endpoint is empty', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ')

    const stats = buildAuctionStatsFallbackFromSearchResults(
      [
        {
          lot: '1',
          brand: 'HONDA',
          model: 'CIVIC',
          grade: '4',
          price_jpy: '1200000',
          total_rub: 950000,
          auction_date: '2026-03-26 10:00',
          body: 'TYPE R',
          model_code: 'FL5',
          transmission: 'MT',
          color: 'White',
          year: '2023',
          engine_cc: '2000',
        },
        {
          lot: '2',
          brand: 'HONDA',
          model: 'CIVIC',
          grade: '4.5',
          price_jpy: '1800000',
          total_rub: 1350000,
          auction_date: '2026-03-25 10:00',
          body: 'RS',
          model_code: 'FL1',
          transmission: 'AT',
          color: 'Black',
          year: '2024',
          engine_cc: '1500',
        },
        {
          lot: '3',
          brand: 'HONDA',
          model: 'CIVIC',
          grade: 'S',
          price_jpy: '2500000',
          total_rub: 1800000,
          auction_date: futureDate,
          body: 'TYPE R',
          model_code: 'FL5',
          transmission: 'MT',
          color: 'Red',
          year: '2025',
          engine_cc: '2000',
        },
      ],
      'honda',
      'civic',
      0.49,
    )

    expect(stats).not.toBeNull()
    expect(stats?.total_lots).toBe(2)
    expect(stats?.avg_price_jpy).toBe(1500000)
    expect(stats?.price_range.min_jpy).toBe(1200000)
    expect(stats?.price_range.max_jpy).toBe(1800000)
    expect(stats?.recent_lots[0]?.lot).toBe('1')
    expect(stats?.recent_lots.some((lot) => lot.lot === '3')).toBe(false)
  })
})
