import { describe, expect, it } from 'vitest'
import { createSeed, OSM_INDEX } from '../data/seed'

describe('gerçek veri', () => {
  it('uydurma hat yok: gerçek olmayan hatlar yalnızca elle yazılmış örnek şehirlerde', () => {
    const d = createSeed()
    const fake = d.routes.filter((r) => !r.real)
    expect(new Set(fake.map((r) => r.cityId))).toEqual(new Set(['06', '35', '16', '07', '26']))
  })
  it('İstanbul İETT durakları ve 81 ilin OSM durakları yüklenir', () => {
    const d = createSeed()
    expect(d.stops.filter((s) => s.cityId === '34' && s.real).length).toBeGreaterThan(10000)
    expect(Object.keys(OSM_INDEX.il).length).toBe(81)
    expect(d.stops.filter((s) => s.real).length).toBeGreaterThan(35000)
  })
})
