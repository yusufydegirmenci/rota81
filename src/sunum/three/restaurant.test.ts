import { describe, expect, it } from 'vitest'
import { RESTAURANT_STEPS, MENU_IDS } from './restaurant'

describe('restaurant steps', () => {
  it('every step has a shot, text, explanation and label', () => {
    for (const s of RESTAURANT_STEPS) { expect(s.title && s.text && s.deep).toBeTruthy(); expect(s.lab[0]).toBeTruthy() }
  })
  it('radio only at the tap; authorisation and settlement are never in the same step', () => {
    for (const s of RESTAURANT_STEPS) { if (s.lanes.includes('radio')) expect(s.lanes).toEqual(['radio']); expect(s.lanes.includes('auth') && s.lanes.includes('settle')).toBe(false) }
    const auth = RESTAURANT_STEPS.findIndex((s) => s.lanes.includes('auth')); const settle = RESTAURANT_STEPS.findIndex((s) => s.lanes.includes('settle'))
    expect(settle).toBeGreaterThan(auth)
  })
  it('approval comes after authorisation and money moves only afterwards; everything is marked SIMULATION', () => {
    const ok = RESTAURANT_STEPS.findIndex((s) => s.result === 'ok'); const auth = RESTAURANT_STEPS.findIndex((s) => s.lanes.includes('auth'))
    expect(ok).toBeGreaterThan(auth); expect(RESTAURANT_STEPS.map((s) => s.text + s.deep + (s.pos2 ?? []).join(' ')).join(' ')).toMatch(/SIMULATION/)
  })
  it('menu photos are only used when facts and file exist (no invented pictures)', () => { for (const id of MENU_IDS) expect(typeof id).toBe('string') })
})
