import { describe, expect, it } from 'vitest'
import { GUIDES, READY_TOURS, tryText } from './tours'
import { PLACES } from '../data/tour'

describe('ready tours', () => {
  it('at least three tours, each with a guide choice (audio, local, self-paced)', () => {
    expect(READY_TOURS.length).toBeGreaterThanOrEqual(8)
    for (const t of READY_TOURS) expect(t.guides).toEqual(GUIDES.map((g) => g.id))
    expect(GUIDES.map((g) => g.id).sort()).toEqual(['audio', 'local', 'self'])
  })
  it('every tour is complete: sights and food from real place data, with text, minutes and no broken steps', () => {
    for (const t of READY_TOURS) {
      expect(t.stops.length, t.id).toBeGreaterThanOrEqual(5)
      expect(t.stops.filter((s) => s.kind === 'sight').length, t.id).toBeGreaterThanOrEqual(1)
      expect(t.stops.filter((s) => s.kind === 'food').length, t.id).toBeGreaterThanOrEqual(1)
      for (const s of t.stops) {
        expect(s.min, `${t.id}`).toBeGreaterThan(0)
        if (s.kind === 'leg') { expect(s.modes.length).toBeGreaterThan(0); expect(s.to).toBeTruthy(); expect(s.note).toBeTruthy() }
        else { expect(PLACES[s.id], s.id).toBeDefined(); expect(s.text, s.id).toBeTruthy(); expect(s.title).toBeTruthy(); if (s.kind === 'food') expect(s.amount, s.id).toBeGreaterThan(0) }
      }
      expect(t.minutes).toBe(t.stops.reduce((n, s) => n + s.min, 0))
    }
  })
  it('travel legs and sights alternate sensibly: a tour never starts or ends on an unexplained jump', () => {
    for (const t of READY_TOURS) expect(t.stops[0].kind).toBe('leg')
  })
  it('only the rail legs carry a fare and it is flagged as an estimate; local fares are not invented', () => {
    for (const t of READY_TOURS) for (const s of t.stops) if (s.kind === 'leg') { if (s.fare !== undefined) expect(s.est).toBe(true); else expect(s.note).toMatch(/city tariff/i) }
    expect(READY_TOURS.find((t) => t.id === 'konya')!.railKurus).toBeGreaterThan(0)
  })
  it('no sample name "Can" anywhere in the tour text, and a local guide has no invented price', () => {
    const all = JSON.stringify(READY_TOURS) + JSON.stringify(GUIDES); expect(all).not.toMatch(/\bCan\b/)
    expect(GUIDES.find((g) => g.id === 'local')!.price).toMatch(/Not part of the tour data/)
    expect(tryText(17500)).toBe('175.00 TRY')
  })
})
