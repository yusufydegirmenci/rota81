import { describe, expect, it } from 'vitest'
import { CAPACITY, DISTRICTS, TRIPS_PER_PERSON_PEAK, evaluate, sampleNetwork, type DLine, type DStop } from './citydesign'

const L = (id: number, stops: number[], headway = 6, mode: DLine['mode'] = 'bus'): DLine => ({ id, name: `L${id}`, color: '#000', mode, headway, stops })
const total = DISTRICTS.reduce((n, d) => n + d.pop, 0)

describe('city design engine', () => {
  it('an empty network serves nobody and is not connected', () => {
    const r = evaluate(DISTRICTS, [], []); expect(r.coverage).toBe(0); expect(r.unserved).toBe(total); expect(r.connected).toBe(false)
  })
  it('stops that no line uses do not count; a line needs at least two stops', () => {
    const stops: DStop[] = [{ id: 1, x: 420, y: 200 }, { id: 2, x: 220, y: 110 }]
    expect(evaluate(DISTRICTS, stops, []).coverage).toBe(0)
    expect(evaluate(DISTRICTS, stops, [L(1, [1])]).lines[0].status).toBe('incomplete')
    expect(evaluate(DISTRICTS, stops, [L(1, [1, 2])]).coverage).toBeGreaterThan(0)
  })
  it('coverage is full next to a district centre, falls with distance, and is zero far away', () => {
    const at = (x: number, y: number) => evaluate([DISTRICTS[0]], [{ id: 1, x, y }, { id: 2, x: 0, y: 0 }], [L(1, [1, 2])]).districts[0].share
    expect(at(420, 200)).toBe(1); expect(at(420 + 90, 200)).toBeGreaterThan(0); expect(at(420 + 90, 200)).toBeLessThan(1)
    expect(evaluate([DISTRICTS[0]], [{ id: 1, x: 900, y: 400 }, { id: 2, x: 880, y: 420 }], [L(1, [1, 2])]).districts[0].share).toBe(0)
  })
  it('lines sharing a stop are one connected network; disjoint lines are not', () => {
    const stops: DStop[] = [1, 2, 3, 4, 5].map((i) => ({ id: i, x: i * 100, y: 100 }))
    expect(evaluate(DISTRICTS, stops, [L(1, [1, 2]), L(2, [3, 4])]).components).toBe(2)
    const r = evaluate(DISTRICTS, stops, [L(1, [1, 2, 3]), L(2, [3, 4])]); expect(r.components).toBe(1); expect(r.connected).toBe(true); expect(r.transferStops).toBe(1)
  })
  it('a longer headway cuts capacity and can overload a line; shorter headway fixes it', () => {
    const { stops } = sampleNetwork(); const slow = evaluate(DISTRICTS, stops, [L(1, [1, 2, 3], 60)]).lines[0]; const fast = evaluate(DISTRICTS, stops, [L(1, [1, 2, 3], 2)]).lines[0]
    expect(slow.capacityPerHour).toBe(CAPACITY.bus); expect(fast.capacityPerHour).toBe(30 * CAPACITY.bus); expect(slow.status).toBe('overloaded'); expect(fast.load).toBeLessThan(slow.load)
  })
  it('the sample network covers most of Marisa and is connected; riders never exceed covered residents', () => {
    const { stops, lines } = sampleNetwork(); const r = evaluate(DISTRICTS, stops, lines)
    expect(r.connected).toBe(true); expect(r.coverage).toBeGreaterThan(0.8); expect(r.coveredPop + r.unserved).toBe(total)
    expect(r.lines.reduce((n, l) => n + l.ridersPerHour, 0)).toBeLessThanOrEqual(Math.ceil(r.coveredPop * TRIPS_PER_PERSON_PEAK) + lines.length)
  })
})
