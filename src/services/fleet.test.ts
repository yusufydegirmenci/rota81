import { describe, expect, it } from 'vitest'
import { createSeed } from '../data/seed'
import { arrivalsAt, crowdOf, demandAt, vehiclesOn } from './fleet'

const at = (h: number, m = 0) => new Date(2026, 10, 9, h, m, 0)
describe('araç doluluk simülasyonu', () => {
  const data = createSeed(() => at(12))
  const route = data.routes.find((r) => r.cityId === '06' && r.mode === 'metro')!
  it('tepe saatinde talep öğlen ve geceden yüksektir', () => {
    expect(demandAt(8 * 60)).toBeGreaterThan(demandAt(13 * 60))
    expect(demandAt(13 * 60)).toBeGreaterThan(demandAt(23 * 60 + 30))
  })
  it('gece seferi yoktur, gündüz araç vardır', () => {
    expect(vehiclesOn(route, at(3))).toHaveLength(0)
    expect(vehiclesOn(route, at(9)).length).toBeGreaterThan(0)
  })
  it('doluluk 0-100 arasında, konumlar geçerli ve sonuç deterministik', () => {
    const a = vehiclesOn(route, at(8, 10)), b = vehiclesOn(route, at(8, 10))
    expect(a).toEqual(b)
    for (const v of a) {
      expect(v.pct).toBeGreaterThanOrEqual(0); expect(v.pct).toBeLessThanOrEqual(100)
      expect(v.stopIndex).toBeGreaterThanOrEqual(0); expect(v.stopIndex).toBeLessThan(route.stopIds.length)
    }
  })
  it('tepe saatinde ortalama doluluk öğleden fazladır', () => {
    const avg = (d: Date) => { const v = vehiclesOn(route, d); return v.reduce((s, x) => s + x.pct, 0) / Math.max(1, v.length) }
    expect(avg(at(8))).toBeGreaterThan(avg(at(14, 30)))
  })
  it('durak panosu yaklaşan araçları sıralı verir', () => {
    const routes = data.routes.filter((r) => r.cityId === '06')
    const stop = route.stopIds[1]
    const arr = arrivalsAt(stop, routes, at(9))
    expect(arr.length).toBeGreaterThan(0)
    for (let i = 1; i < arr.length; i++) expect(arr[i].etaMin).toBeGreaterThanOrEqual(arr[i - 1].etaMin)
  })
  it('uç durakta her iki yönde de gelen araç bulunur', () => {
    const first = route.stopIds[0]
    const arr = arrivalsAt(first, [route], at(9))
    expect(arr.some((a) => a.vehicle.dir === 1)).toBe(true)
  })
  it('doluluk seviyeleri', () => { expect(crowdOf(10)).toBe('low'); expect(crowdOf(50)).toBe('mid'); expect(crowdOf(80)).toBe('high'); expect(crowdOf(95)).toBe('full') })
})
