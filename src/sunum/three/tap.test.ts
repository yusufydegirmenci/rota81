import { describe, expect, it } from 'vitest'
import { TAP_STEPS } from './tap'

describe('tap steps', () => {
  it('every step has a shot, text and explanation; lanes are valid and unique per kind order', () => {
    expect(TAP_STEPS.length).toBeGreaterThanOrEqual(10)
    for (const s of TAP_STEPS) { expect(s.title && s.text && s.deep).toBeTruthy(); expect(s.pos).toHaveLength(3); expect(s.look).toHaveLength(3) }
  })
  it('radio is shown only while the field is on (radio ends at the validator)', () => {
    for (const s of TAP_STEPS) if (s.lanes.includes('radio')) expect(s.field).toBe(true)
    expect(TAP_STEPS.filter((s) => s.lanes.includes('radio'))).toHaveLength(1)
  })
  it('software data, fare validation, authorisation and settlement never share a step with radio', () => {
    for (const s of TAP_STEPS) if (s.lanes.includes('radio')) expect(s.lanes).toEqual(['radio'])
    expect(TAP_STEPS.some((s) => s.lanes.includes('fee'))).toBe(true)
    expect(TAP_STEPS.some((s) => s.lanes.includes('auth') && s.lanes.includes('settle'))).toBe(true)
  })
  it('the result and the return lane appear only after the backend steps', () => {
    const i = TAP_STEPS.findIndex((s) => s.result); const fee = TAP_STEPS.findIndex((s) => s.lanes.includes('fee'))
    expect(i).toBeGreaterThan(fee); expect(TAP_STEPS[i].reverse).toBe(true)
  })
})
