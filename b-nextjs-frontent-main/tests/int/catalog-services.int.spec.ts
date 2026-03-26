import { describe, expect, it } from 'vitest'

import {
  normalizeBodyResponse,
  normalizeBrandResponse,
  normalizeModelResponse,
} from '@/lib/services/catalog-filters.service'
import { buildAuctionStatsUrl } from '@/lib/services/auction-stats.service'

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
    ).toEqual([{ body: 'ZVW41' }])
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
})
