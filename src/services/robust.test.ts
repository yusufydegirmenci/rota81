import { describe, expect, it } from 'vitest'
import { PROVINCES } from '../data/provinces'
import { createApi } from './api'
import { Store } from './store'
import { findBoarding, planIntercity, processIntercity } from './cardflow'

/** Rota hangi yöne kurulursa kurulsun uygulama çökmemeli: verisi olmayan yerde güvenli "veri yok" sonucu dönmeli. */
describe('rota dayanıklılığı', () => {
  const store = new Store({ now: () => new Date('2026-03-01T10:00:00Z') }, false)
  const api = createApi(store)
  const s = api.auth.login('ayse.gur@example.com', 'demo1234')

  it('her ilde en yakın durak aranırken hata atılmaz', () => {
    for (const p of PROVINCES) expect(() => findBoarding(api, p.id, 39, 35, ['bus', 'tram'])).not.toThrow()
  })
  it('örnek ilçe çiftlerinde iller arası plan ve işlem hata atmaz', () => {
    const ids = PROVINCES.map((p) => p.id)
    for (let i = 0; i < 40; i++) {
      const a = ids[(i * 7) % ids.length], b = ids[(i * 13 + 5) % ids.length]
      if (a === b) continue
      expect(() => planIntercity(a, b)).not.toThrow()
      const r = processIntercity(api, s, a, b, 'full', `rb-${i}`)
      expect(Array.isArray(r.legs)).toBe(true)
      expect(Number.isFinite(r.total)).toBe(true)
    }
  })
})
