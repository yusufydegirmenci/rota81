import { describe, expect, it } from 'vitest'
import { quote, TARIFF, RENTAL_COPY } from './rental'

describe('rental fee and hold', () => {
  it('unlock fee plus per-minute, rounded to cents, minutes rounded up', () => {
    expect(quote(35).fee).toBe(13.25); expect(quote(0).fee).toBe(1); expect(quote(10.2).fee).toBe(1 + 0.35 * 11)
  })
  it('the hold is released by the unused part; no extra authorisation below the hold', () => {
    const q = quote(35); expect(q.release).toBe(36.75); expect(q.extra).toBe(0); expect(q.fee + q.release).toBe(TARIFF.hold)
  })
  it('the daily cap applies and a fee above the hold asks for an extra authorisation', () => {
    const q = quote(500); expect(q.capped).toBe(true); expect(q.fee).toBe(TARIFF.dailyCap); expect(q.extra).toBe(10); expect(q.release).toBe(0)
  })
  it('fee never goes down as minutes go up, and negative input is rejected', () => {
    let last = 0; for (let m = 0; m <= 400; m += 7) { const f = quote(m).fee; expect(f).toBeGreaterThanOrEqual(last); last = f }
    expect(() => quote(-1)).toThrow()
  })
  it('copy: every step is explained, generic operator only, and money is labelled simulation', () => {
    for (const s of RENTAL_COPY) expect(s.title && s.text && s.deep).toBeTruthy()
    expect(TARIFF.operator).toBe('Rental Operator A'); expect(RENTAL_COPY.map((s) => s.text).join(' ')).toMatch(/SIMULATION/)
  })
})
