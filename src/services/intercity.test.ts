import { describe, expect, it } from 'vitest'
import { PLACES } from '../data/places'
import { GEO } from '../data/turkiye'
import { distanceKm, intercity } from './intercity'

describe('şehirler arası tahmin ve gezi verisi', () => {
  it('Ankara-İstanbul mesafesi makul (yaklaşık 350 km kuş uçuşu)', () => {
    const d = distanceKm('06', '34'); expect(d).toBeGreaterThan(320); expect(d).toBeLessThan(380)
  })
  it('aynı il için şehirler arası yok, farklı il için süre ve ücret var', () => {
    expect(intercity('06', '06')).toBeNull()
    const x = intercity('06', '35')!; expect(x.minutes).toBeGreaterThan(120); expect(x.fareKurus).toBeGreaterThan(0)
  })
  it('81 ilin hepsinde en az 3 gezilecek yer var ve ilçeleri veri setinde bulunur', () => {
    expect(Object.keys(PLACES)).toHaveLength(81)
    for (const [id, ps] of Object.entries(PLACES)) { expect(ps.length).toBeGreaterThanOrEqual(3); for (const p of ps) expect(GEO[id].d.some((d) => d[0] === p.d)).toBe(true) }
  })
})
