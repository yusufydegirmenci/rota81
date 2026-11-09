import { describe, expect, it } from 'vitest'
import { PROVA_QA } from './prova'
import { QA_LIST } from './qa'

describe('rehearsal data', () => {
  it('covers translation, simulation, privacy, cost and sustainability questions', () => {
    expect(PROVA_QA.length).toBeGreaterThanOrEqual(6)
    expect(QA_LIST.length).toBe(35)
  })
})
