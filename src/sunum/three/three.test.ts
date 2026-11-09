import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { Timeline } from './timeline'
import { CameraRig, ease, type ShotDef } from './camera'
import { PARTS, isPartId } from './registry'
import { Bus, Karakter, KartOkuyucu, mark, partOf, POS, Sokak, SmartCard, Validator, VeriAkisi } from './models'
import { BENCH_STEPS } from './bench'

describe('Timeline', () => {
  it('steps within bounds and pauses on manual stepping', () => {
    const t = new Timeline(3, 100); t.resume(); expect(t.playing).toBe(true)
    t.next(); expect(t.playing).toBe(false); expect(t.step).toBe(1)
    t.next(); t.next(); expect(t.step).toBe(2); t.prev(); t.prev(); t.prev(); expect(t.step).toBe(0)
  })
  it('auto-advances after holdMs, stops at the last step, replays from 0', () => {
    const t = new Timeline(3, 100); t.resume()
    expect(t.tick(99)).toBe(false); expect(t.tick(1)).toBe(true); expect(t.step).toBe(1)
    t.tick(100); expect(t.step).toBe(2); t.tick(100); expect(t.playing).toBe(false); expect(t.step).toBe(2)
    t.replay(); expect(t.step).toBe(0); expect(t.playing).toBe(true)
  })
  it('does not tick while paused; rejects empty timelines', () => {
    const t = new Timeline(2, 10); expect(t.tick(1000)).toBe(false); expect(() => new Timeline(0)).toThrow()
  })
})

describe('CameraRig', () => {
  const a: ShotDef = { pos: [0, 0, 10], look: [0, 0, 0], title: 'a', text: '' }
  const b: ShotDef = { pos: [10, 0, 0], look: [0, 0, 0], title: 'b', text: '' }
  it('eases from the current pose, reaches the target, and restarts mid-flight without a jump', () => {
    const cam = new THREE.PerspectiveCamera(); const rig = new CameraRig(1000)
    rig.snap(cam, a); rig.flyTo(cam, b, 0); rig.update(cam, 0); expect(cam.position.z).toBeCloseTo(10)
    rig.update(cam, 500); const mid = cam.position.clone(); expect(mid.x).toBeGreaterThan(0); expect(mid.x).toBeLessThan(10)
    rig.flyTo(cam, a, 500); rig.update(cam, 500); expect(cam.position.distanceTo(mid)).toBeLessThan(1e-6)
    rig.update(cam, 1500); expect(cam.position.distanceTo(new THREE.Vector3(0, 0, 10))).toBeLessThan(1e-6)
    expect(ease(0)).toBe(0); expect(ease(1)).toBe(1)
  })
})

describe('part registry', () => {
  it('every part has name, function and a valid label', () => {
    for (const [id, p] of Object.entries(PARTS)) { expect(p.name, id).toBeTruthy(); expect(p.fn, id).toBeTruthy(); expect(['PHYSICAL', 'DESIGN', 'SIMULATED']).toContain(p.tag) }
  })
  it('rejects unknown ids', () => { expect(() => mark(new THREE.Group(), 'nope' as never)).toThrow(); expect(isPartId('card-chip')).toBe(true); expect(isPartId('x')).toBe(false) })
  it('every model builds and marks only known parts', () => {
    const roots = [SmartCard(), Validator(), KartOkuyucu(), Bus(), POS(), Karakter(), Sokak(), VeriAkisi({ radio: [new THREE.Vector3(), new THREE.Vector3(1, 0, 0)] }).group]
    for (const r of roots) { let marked = 0; r.traverse((o) => { if (o.userData.part !== undefined) { expect(isPartId(o.userData.part)).toBe(true); marked++ } }); expect(marked).toBeGreaterThan(0) }
  })
  it('resolves a child to its marked ancestor', () => {
    const c = SmartCard(); const coilTurn = (c.userData.layers.coil as THREE.Object3D).children[0]
    expect(partOf(coilTurn)).toBe('card-antenna')
    expect(partOf(null)).toBeNull()
  })
  it('data-flow lanes are separate and only one shows at a time', () => {
    const f = VeriAkisi({ radio: [new THREE.Vector3(), new THREE.Vector3(1, 0, 0)], data: [new THREE.Vector3(), new THREE.Vector3(0, 1, 0)], settle: [new THREE.Vector3(), new THREE.Vector3(0, 0, 1)] })
    f.show('data'); const vis = f.group.children.filter((c) => c.visible); expect(vis.length).toBe(2)
    expect(new Set(vis.map((v) => v.userData.part))).toEqual(new Set(['flow-data']))
    f.show(null); expect(f.group.children.some((c) => c.visible)).toBe(false)
  })
})

describe('bench steps', () => { it('each step has title and text', () => { for (const s of BENCH_STEPS) { expect(s.title).toBeTruthy(); expect(s.text).toBeTruthy() } }) })
