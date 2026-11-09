import * as THREE from 'three'
import { isPartId, type PartId } from './registry'

export const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1, ...o })
const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)

/** Tag an object with its registry id so clicks can be resolved to name + function. Unknown ids fail loudly. */
export function mark<T extends THREE.Object3D>(o: T, id: PartId): T {
  if (!isPartId(id)) throw new Error(`Unknown part id: ${id}`)
  o.userData.part = id
  return o
}
/** Walk up from a hit object to the nearest marked ancestor. */
export function partOf(o: THREE.Object3D | null): PartId | null {
  for (let n: THREE.Object3D | null = o; n; n = n.parent) if (isPartId(n.userData.part)) return n.userData.part
  return null
}

/** Smart card: body, antenna coil (3 turns) and chip, in separate layers so the technical view can explode them. */
export function SmartCard() {
  const g = new THREE.Group()
  const body = mark(box(0.856, 0.54, 0.02, mat(0x0f1f3d)), 'card-body')
  const coil = mark(new THREE.Group(), 'card-antenna')
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.045, 0.008, 8, 48), mat(0xe8c27a, { metalness: 0.8, roughness: 0.3 }))
    t.scale.set(1.45, 1, 1); coil.add(t)
  }
  coil.position.z = 0.014
  const chip = mark(box(0.12, 0.12, 0.02, mat(0x2a2f36, { metalness: 0.7 })), 'card-chip'); chip.position.set(-0.28, 0, 0.022)
  g.add(body, coil, chip)
  g.userData.layers = { body, coil, chip }
  return g
}

/** Reader/validator head with a coil ring and a result screen. `screen` colour is set by the scene. */
export function Validator() {
  const g = new THREE.Group()
  const head = mark(box(0.9, 1.0, 0.35, mat(0x0d2029)), 'bus-validator'); head.position.y = 0.45
  const screen = mark(box(0.65, 0.34, 0.02, mat(0x2a3a44)), 'reader-screen'); screen.position.set(0, 0.75, 0.19)
  const coil = mark(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 12, 40), mat(0xe8c27a, { metalness: 0.6 })), 'reader-coil'); coil.position.set(0, 0.33, 0.2)
  g.add(head, screen, coil)
  g.userData.screen = screen
  return g
}
export function KartOkuyucu() {
  const g = new THREE.Group()
  const body = mark(box(0.5, 0.7, 0.2, mat(0x1b2f3a)), 'reader-body'); body.position.y = 0.35
  const coil = mark(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 12, 40), mat(0xe8c27a, { metalness: 0.6 })), 'reader-coil'); coil.position.set(0, 0.25, 0.11)
  const screen = mark(box(0.34, 0.16, 0.02, mat(0x2a3a44)), 'reader-screen'); screen.position.set(0, 0.55, 0.11)
  g.add(body, coil, screen); g.userData.screen = screen
  return g
}

/** Bus skeleton with the three on-board parts the tap story needs. Doors face +z. */
export function Bus() {
  const g = new THREE.Group()
  const body = mark(box(8.2, 2.7, 2.5, mat(0xef5f26)), 'bus-body'); body.position.y = 1.75
  const stripe = box(8.22, 0.35, 2.52, mat(0xc44a18)); stripe.position.y = 0.95
  g.add(body, stripe)
  for (let i = 0; i < 4; i++) { const w = box(1.3, 0.95, 0.06, mat(0xcfeaee, { roughness: 0.1, metalness: 0.3 })); w.position.set(-2.6 + i * 1.75, 2.0, 1.27); g.add(w) }
  const door = box(1.0, 2.2, 0.06, mat(0xcfeaee, { roughness: 0.1 })); door.position.set(3.4, 1.4, 1.27); g.add(door)
  for (const x of [-2.5, 2.4]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 24), mat(0x14323f)); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.55, 1.2); g.add(wh) }
  const modem = mark(box(0.5, 0.2, 0.3, mat(0x222a31)), 'bus-modem'); modem.position.set(-1.8, 3.2, 0)
  const pc = mark(box(0.7, 0.45, 0.5, mat(0x2f3d49)), 'bus-computer'); pc.position.set(-1.8, 2.2, 0.5)
  g.add(modem, pc)
  return g
}

/** POS terminal skeleton (restaurant counter, Phase 5 fills the scene around it). */
export function POS() {
  const g = new THREE.Group()
  const body = mark(box(0.28, 0.06, 0.5, mat(0x1b2f3a)), 'pos-body'); body.rotation.x = -0.35
  const screen = mark(box(0.22, 0.015, 0.14, mat(0x2a3a44)), 'pos-screen'); screen.position.set(0, 0.035, -0.12); screen.rotation.x = -0.35
  g.add(body, screen); g.userData.screen = screen
  return g
}

/** One consistent character (same look in every scene). Stylised, fictional. */
export function Karakter(coat = 0x1f6f8b) {
  const g = mark(new THREE.Group(), 'character')
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 12), mat(coat)); body.position.y = 0.95
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), mat(0xe3b48f)); head.position.y = 1.62
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x3b2a20)); hair.position.y = 1.65
  for (const x of [-0.09, 0.09]) { const leg = box(0.12, 0.6, 0.14, mat(0x2b3440)); leg.position.set(x, 0.3, 0); g.add(leg) }
  g.add(body, head, hair)
  return g
}

/** Street kit: ground, pavement, and a row of simple buildings. */
export function Sokak(buildings = 9) {
  const g = new THREE.Group()
  const ground = mark(new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(0x4a5560)), 'road'); ground.rotation.x = -Math.PI / 2
  const walk = mark(box(120, 0.12, 5, mat(0xd8d2c4)), 'road'); walk.position.set(0, 0.06, -4.5)
  g.add(ground, walk)
  for (let i = -10; i < 10; i++) { const l = box(1.4, 0.02, 0.18, mat(0xf4f0e6)); l.position.set(i * 3, 0.011, 5); g.add(l) }
  const cols = [0xe8d5b5, 0xd9b99b, 0xc9d8d3, 0xecc9a8]
  for (let i = 0; i < buildings; i++) { const h = 6 + (i % 4) * 2.4; const b = mark(box(5.2, h, 5, mat(cols[i % 4])), 'building'); b.position.set(-20 + i * 5.6, h / 2, -9); g.add(b) }
  return g
}

export type LaneKind = 'radio' | 'data' | 'auth' | 'fee' | 'settle'
const LANE: Record<LaneKind, { color: number; part: PartId }> = {
  radio: { color: 0x0e7c86, part: 'flow-radio' }, data: { color: 0xef5f26, part: 'flow-data' }, auth: { color: 0x7b5cc4, part: 'flow-auth' },
  fee: { color: 0xe8b21a, part: 'flow-fee' }, settle: { color: 0x7d8790, part: 'flow-settle' },
}
/** Data-flow visualiser: one coloured lane per kind of exchange, so radio, software data, authorisation, fare validation and settlement are never drawn as the same thing. Show one lane at a time. */
export function VeriAkisi(paths: Partial<Record<LaneKind, THREE.Vector3[]>>) {
  const g = new THREE.Group(); const lanes = new Map<LaneKind, { line: THREE.Line; dot: THREE.Mesh; curve: THREE.CatmullRomCurve3 }>()
  for (const kind of Object.keys(paths) as LaneKind[]) {
    const pts = paths[kind]!; if (pts.length < 2) continue
    const { color, part } = LANE[kind]
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1)
    const line = mark(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), new THREE.LineBasicMaterial({ color })), part)
    const dot = mark(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color })), part)
    line.visible = dot.visible = false; g.add(line, dot); lanes.set(kind, { line, dot, curve })
  }
  return {
    group: g,
    show(kind: LaneKind | null) { lanes.forEach((l, k) => { l.line.visible = l.dot.visible = k === kind }) },
    update(tSec: number) { lanes.forEach((l) => { if (l.dot.visible) l.dot.position.copy(l.curve.getPoint((tSec * 0.25) % 1)) }) },
  }
}
