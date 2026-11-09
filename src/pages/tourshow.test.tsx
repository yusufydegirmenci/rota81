import { describe, expect, it } from 'vitest'
import { PLACES, TOUR } from '../data/tour'
import { buildScenes } from './TourShow'

describe('tour presentation scenes', () => {
  const sc = buildScenes()
  it('covers every sight and food of the tour, then rental and guide', () => {
    const ids = new Set(sc.map((s) => s.place?.id))
    TOUR.forEach((t) => { if ('place' in t) expect(ids.has(t.place), t.place).toBe(true) })
    expect(sc.at(-2)?.kind).toBe('rental'); expect(sc.at(-1)?.kind).toBe('guide')
  })
  it('has bilingual text everywhere and a restaurant interior once per city', () => {
    sc.forEach((s) => { expect(s.title.en.length).toBeGreaterThan(0); expect(s.title.tr.length).toBeGreaterThan(0); expect(s.text.en.length).toBeGreaterThan(0) })
    const cities = new Set(sc.filter((s) => s.kind === 'pay').map((s) => s.city))
    expect(sc.filter((s) => s.kind === 'dine').length).toBe(cities.size)
    expect(Object.keys(PLACES).length).toBeGreaterThan(10)
  })
})
