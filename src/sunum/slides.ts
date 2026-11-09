import type { Slide } from './types'
import { maxSteps } from './scenes'
import { PART1 } from './content1'
import { PART2 } from './content2'
import { PART3 } from './content3'
import { PART4 } from './content4'
import { PART5 } from './content5'

/** Narrative order: journey and tap first, then the physical card, then systems, operations and business. */
const byId = (arr: Slide[]) => Object.fromEntries(arr.map((s) => [s.id, s]))
const all = { ...byId(PART1), ...byId(PART2), ...byId(PART3), ...byId(PART4), ...byId(PART5) }
const ORDER = ['title', 'vision', 'honesty', 'city', 'design-city', 'cast', 'journey', 'tap', 'card-spec', 'card-anatomy', 'nfc-physics', 'chip', 'nfc-rfid', 'five-ok', 'mfg', 'identity', 'lifecycle', 'hardware', 'validator', 'micro', 'idem', 'offline', 'rest-tour', 'rest-pay', 'tours', 'money', 'arch', 'net', 'stakeholders', 'roadmap', 'standards', 'privacy', 'security', 'lab', 'catalogue', 'ops', 'dash', 'business', 'interop', 'usecases', 'conclusion', 'refs']
export const SLIDES: Slide[] = ORDER.map((id) => all[id]).filter(Boolean)

/** Rough speaking time: script length plus a little per interactive step. */
export const estMinutes = (s: Slide) => Math.round((s.script.join(' ').split(/\s+/).length / 140 + 0.3 * Math.max(0, maxSteps(s.scene) - 1) + 0.3) * 10) / 10

const MUST = ['title', 'honesty', 'journey', 'tap', 'nfc-physics', 'offline', 'rest-pay', 'lab', 'conclusion']
function plan(min: number): string[] {
  const chosen = new Set(MUST); let t = SLIDES.filter((s) => chosen.has(s.id)).reduce((a, s) => a + estMinutes(s), 0)
  for (const pass of [true, false]) for (const s of SLIDES) { if (chosen.has(s.id) || !!s.core !== pass) continue; const e = estMinutes(s); if (t + e <= min) { chosen.add(s.id); t += e } }
  return SLIDES.filter((s) => chosen.has(s.id)).map((s) => s.id)
}
export const PLANS: Record<number, string[]> = { 10: plan(10), 15: plan(15), 20: plan(20), 25: plan(25), 30: plan(30) }
