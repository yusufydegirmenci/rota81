import { describe, expect, it } from 'vitest'
import { JOURNEY_STEPS } from './journey'

describe('journey steps', () => {
  it('every step has a shot, text, explanation and a technical-view label', () => {
    for (const s of JOURNEY_STEPS) { expect(s.title && s.text && s.deep).toBeTruthy(); expect(s.lab?.[0]).toBeTruthy(); expect(s.pos).toHaveLength(3) }
  })
  it('the hero never teleports: consecutive targets stay within a walkable distance on the street', () => {
    for (let i = 1; i < JOURNEY_STEPS.length; i++) { const a = JOURNEY_STEPS[i - 1], b = JOURNEY_STEPS[i]; expect(Math.hypot(a.who[0] - b.who[0], a.who[1] - b.who[1]), `${i - 1}->${i}`).toBeLessThan(40) }
  })
  it('failure comes with recovery: down, then technician, then ok; technician only during repair', () => {
    const down = JOURNEY_STEPS.findIndex((s) => s.fault === 'down'); const ok = JOURNEY_STEPS.findIndex((s, i) => i > down && s.fault === 'ok')
    expect(down).toBeGreaterThan(-1); expect(ok).toBeGreaterThan(down)
    const t = JOURNEY_STEPS.findIndex((s) => s.tech); expect(t).toBeGreaterThan(down); expect(t).toBeLessThanOrEqual(ok)
  })
  it('the bus arrives before anyone boards, and the ramp is out only with the bus at the stop', () => {
    const arrive = JOURNEY_STEPS.findIndex((s) => s.busX !== undefined)
    JOURNEY_STEPS.forEach((s, i) => { if (s.ramp || s.tap) expect(i).toBeGreaterThan(arrive - 1); if (s.ramp) expect(s.busX).toBeDefined() })
  })
  it('demo money is always labelled SIMULATION on the phone', () => {
    JOURNEY_STEPS.forEach((s) => { if (s.phone && /TRY/.test(s.phone[1].join(' '))) expect(s.text + s.deep).toMatch(/SIMULATION/) })
  })
})
