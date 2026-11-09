import { describe, expect, it } from 'vitest'
import { buildTrace, EDGES, FAULTS, type Fault, type NodeId } from './replay'

const NODES: NodeId[] = ['reader', 'gateway', 'auth', 'fare', 'nosql', 'sql', 'queue', 'notify', 'storage']
const ledger = (f: Fault) => buildTrace(f).filter((s) => s.ledgerCommit).length

describe('transaction replay traces', () => {
  it('every trace is non-empty, uses valid nodes and edges, and has text for each step', () => {
    for (const { id } of FAULTS) for (const s of buildTrace(id)) {
      expect(s.title && s.text && s.deep).toBeTruthy(); s.active.forEach((n) => expect(NODES).toContain(n))
      if (s.edge) expect(EDGES.some(([a, b]) => (a === s.edge![0] && b === s.edge![1]) || (a === s.edge![1] && b === s.edge![0]))).toBe(true)
    }
  })
  it('a normal tap commits the ledger exactly once and ends green', () => {
    const t = buildTrace('none'); expect(ledger('none')).toBe(1); expect(t[t.length - 1].result).toBe('ok'); expect(t.some((s) => s.status === 'fail')).toBe(false)
  })
  it('low balance and blocked card never write the ledger and end red', () => {
    for (const f of ['low-balance', 'blacklist'] as Fault[]) { expect(ledger(f)).toBe(0); expect(buildTrace(f).some((s) => s.result === 'bad')).toBe(true) }
  })
  it('a blocked card is refused before any network step', () => {
    const t = buildTrace('blacklist'); expect(t.flatMap((s) => s.active)).not.toContain('gateway')
  })
  it('offline accepts locally, then forwards later; the ledger is committed once', () => {
    const t = buildTrace('offline'); expect(t.some((s) => s.status === 'fail')).toBe(true); expect(t.some((s) => /local rules/i.test(s.title))).toBe(true); expect(t.some((s) => /store and forward/i.test(s.title))).toBe(true); expect(ledger('offline')).toBe(1)
  })
  it('timeout retries with the same key and still charges once', () => {
    const t = buildTrace('timeout'); expect(t.some((s) => /same key/i.test(s.title))).toBe(true); expect(ledger('timeout')).toBe(1)
  })
})
