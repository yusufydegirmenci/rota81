import { describe, expect, it } from 'vitest'
import { GEO } from '../data/turkiye'
import { createSeed } from '../data/seed'

describe('ilçe kapsamı', () => {
  it('her ilçenin en az bir (örnek) durağı vardır', () => {
    const d = createSeed()
    let total = 0
    for (const [id, g] of Object.entries(GEO)) {
      if (id === '34') continue // İstanbul: gerçek İETT durakları
      const names = d.stops.filter((s) => s.cityId === id).map((s) => s.name)
      for (const [dist] of g.d) {
        total++
        const key = dist === 'Merkez' ? '' : dist
        expect(names.some((n) => n.includes(key)), `${id} ${dist}`).toBe(true)
      }
    }
    expect(total).toBeGreaterThan(900)
    expect(d.stops.filter((s) => s.cityId === '34').length).toBeGreaterThan(10000)
  })
})
