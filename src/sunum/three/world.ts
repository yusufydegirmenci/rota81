import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { canvasTex, mark, mat, phys, Validator } from './models'
import type { PartId } from './registry'

const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
const rbox = (w: number, h: number, d: number, r: number, m: THREE.Material) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m)
const capsuleGeo = new THREE.CapsuleGeometry(1, 1, 6, 12); const headGeo = new THREE.SphereGeometry(1, 16, 16)

/** A person with its own height, coat and skin, so crowds are not clones. `legs` swing via userData.walk(t, moving). */
export function Person(opts: { coat: number; skin?: number; hair?: number; height?: number; id?: PartId } = { coat: 0x888888 }) {
  const h = opts.height ?? 1; const g = mark(new THREE.Group(), opts.id ?? 'crowd')
  const skin = mat(opts.skin ?? 0xe3b48f, { roughness: 0.75 })
  const body = new THREE.Mesh(capsuleGeo, mat(opts.coat)); body.scale.set(0.2, 0.35, 0.16); body.position.y = 0.95
  const head = new THREE.Mesh(headGeo, skin); head.scale.setScalar(0.15); head.position.y = 1.6
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(opts.hair ?? 0x3b2a20)); hair.scale.setScalar(0.16); hair.position.y = 1.63
  const legs = [-0.08, 0.08].map((x) => { const l = box(0.11, 0.62, 0.13, mat(0x2b3440)); l.geometry.translate(0, -0.31, 0); l.position.set(x, 0.62, 0); return l })
  g.add(body, head, hair, ...legs); g.scale.setScalar(h)
  g.userData.walk = (t: number, moving: boolean) => { const a = moving ? Math.sin(t * 9) * 0.5 : 0; legs[0].rotation.x = a; legs[1].rotation.x = -a; g.children[0].position.y = 0.95 + (moving ? Math.abs(Math.sin(t * 9)) * 0.03 : 0) }
  return g
}

/** Wheelchair with its user, sitting. Marked as wheelchair for inspection. */
export function Wheelchair() {
  const g = mark(new THREE.Group(), 'wheelchair'); const frame = mat(0x2b3138, { metalness: 0.7 })
  for (const x of [-0.28, 0.28]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), frame); w.rotation.y = Math.PI / 2; w.position.set(x, 0.32, 0); g.add(w) }
  const seat = box(0.5, 0.05, 0.5, mat(0x3a4a5a)); seat.position.y = 0.5; const back = box(0.5, 0.5, 0.05, mat(0x3a4a5a)); back.position.set(0, 0.78, -0.25)
  const p = Person({ coat: 0x7a4f9a, height: 0.78, id: 'wheelchair' }); p.position.set(0, 0.12, 0); p.children.slice(3).forEach((c) => { c.visible = false })
  g.add(seat, back, p)
  return g
}

/** Stop shelter: glass cabin, roof, bench, lit arrival display and a tactile strip along the kerb. Screen text is redrawn by userData.draw(text). */
export function Shelter() {
  const g = mark(new THREE.Group(), 'shelter')
  const glass = phys(0xbfe3ee, { roughness: 0.05, transparent: true, opacity: 0.3 })
  const post = mat(0x2b3138, { metalness: 0.6 })
  for (const x of [-1.6, 1.6]) { const p = box(0.08, 2.6, 0.08, post); p.position.set(x, 1.3, 0); g.add(p) }
  const roof = box(3.5, 0.1, 1.4, mat(0x2b3138)); roof.position.y = 2.65
  const back = box(3.2, 2.3, 0.04, glass); back.position.set(0, 1.25, -0.6)
  const bench = box(2.2, 0.08, 0.4, mat(0x8a6a4a)); bench.position.set(0, 0.5, -0.35)
  const scr = canvasTex(256, 128, () => {}); const c = scr?.image as HTMLCanvasElement | undefined
  const screen = mark(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: scr, color: 0xffffff, toneMapped: false })), 'shelter-screen'); screen.position.set(1.0, 1.7, -0.55)
  g.userData.draw = (lines: string[]) => { const x = c?.getContext('2d'); if (!x || !c || !scr) return; x.fillStyle = '#06141c'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#7fe3ff'; x.font = '700 30px sans-serif'; x.fillText(lines[0], 12, 40); x.fillStyle = '#fff'; x.font = '600 24px sans-serif'; lines.slice(1).forEach((l, i) => x.fillText(l, 12, 76 + i * 30)); scr.needsUpdate = true }
  g.userData.draw(['Line 32', 'Next: 3 min', 'Stop 0417'])
  const strip = mark(new THREE.Group(), 'tactile-strip'); for (let i = 0; i < 14; i++) { const r = box(0.06, 0.02, 0.5, mat(0xf2c230)); r.position.set(-1.4 + i * 0.22, 0.15, 1.0); strip.add(r) }
  g.add(roof, back, bench, screen, strip)
  return g
}

export function MetroEntrance() {
  const g = mark(new THREE.Group(), 'metro-entrance')
  const frame = box(3, 0.2, 2.4, mat(0x1f5fa8)); frame.position.y = 2.6
  const hole = box(2.6, 0.05, 2.0, mat(0x05080b)); hole.position.y = 0.06
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(128, 96, (c) => { c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, 128, 96); c.fillStyle = '#fff'; c.font = '800 70px sans-serif'; c.textAlign = 'center'; c.fillText('M', 64, 74) }), toneMapped: false })); sign.position.set(0, 3.3, 1.2)
  for (const x of [-1.4, 1.4]) { const p = box(0.12, 2.6, 0.12, mat(0x1f5fa8)); p.position.set(x, 1.3, 1.1); g.add(p) }
  for (let i = 0; i < 6; i++) { const s = box(2.4, 0.1, 0.35, mat(0x8a9097)); s.position.set(0, -0.05 - i * 0.14, -0.6 + i * 0.3 - 0.9); g.add(s) }
  const gate = Validator(); gate.scale.setScalar(0.7); gate.position.set(1.6, 0, 1.8); gate.traverse((o) => { if (o.userData.part) o.userData.part = 'metro-gate' }); gate.userData.part = 'metro-gate'
  g.add(frame, hole, sign, gate); g.userData.gate = gate
  return g
}

export function Phone() {
  const g = mark(new THREE.Group(), 'phone')
  const body = rbox(0.12, 0.25, 0.012, 0.015, phys(0x15191d, { clearcoat: 0.8 }))
  const tex = canvasTex(256, 512, () => {}); const cv = tex?.image as HTMLCanvasElement | undefined
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.23), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.007
  g.userData.draw = (title: string, rows: string[], color = '#0e7c86') => { const x = cv?.getContext('2d'); if (!x || !cv || !tex) return; x.fillStyle = '#0d2029'; x.fillRect(0, 0, 256, 512); x.fillStyle = color; x.fillRect(0, 0, 256, 70); x.fillStyle = '#fff'; x.font = '700 28px sans-serif'; x.fillText(title, 14, 46); x.font = '600 26px sans-serif'; rows.forEach((r, i) => { x.fillStyle = i === 0 ? '#ffd23a' : '#dfe9ee'; x.fillText(r, 14, 130 + i * 44) }); x.fillStyle = '#9fb3bd'; x.font = '500 20px sans-serif'; x.fillText('SIMULATION · no real money', 14, 480); tex.needsUpdate = true }
  g.add(body, scr)
  return g
}

export function House() {
  const g = new THREE.Group(); const wall = mat(0xe6dccb)
  const floor = box(8, 0.2, 6, mat(0x9a7b5a)); floor.position.y = 0.1
  const back = box(8, 3, 0.2, wall); back.position.set(0, 1.7, -3); const l = box(0.2, 3, 6, wall); l.position.set(-4, 1.7, 0); const r = box(0.2, 3, 6, wall); r.position.set(4, 1.7, 0)
  const bed = mark(new THREE.Group(), 'home-bed'); const frame = box(1.8, 0.35, 1.0, mat(0x6a4a30)); frame.position.y = 0.38; const mattress = box(1.7, 0.2, 0.9, mat(0xdfe6ee)); mattress.position.y = 0.65; const pillow = box(0.4, 0.12, 0.7, mat(0xffffff)); pillow.position.set(-0.6, 0.82, 0); bed.add(frame, mattress, pillow); bed.position.set(-1.8, 0, -2)
  const win = box(1.6, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc98a).multiplyScalar(1.4), toneMapped: false })); win.position.set(1.8, 1.9, -2.88)
  g.add(floor, back, l, r, bed, win)
  return g
}

/** Bus interior (seats, rails, door validator) shown when the shell is cut away. */
export function BusInterior() {
  const g = new THREE.Group()
  const floor = box(8, 0.1, 2.3, mat(0x5a5f66)); floor.position.y = 0.65
  g.add(floor)
  for (let i = 0; i < 4; i++) for (const z of [-0.8, 0.8]) { const s = mark(box(0.6, 0.12, 0.5, mat(0x1f5fa8)), 'bus-seat'); s.position.set(-3 + i * 1.5, 1.1, z); const b = box(0.6, 0.6, 0.1, mat(0x1f5fa8)); b.position.set(-3 + i * 1.5, 1.4, z + (z < 0 ? -0.2 : 0.2)); g.add(s, b) }
  const rail = box(7.6, 0.05, 0.05, mat(0xcfd4d8, { metalness: 0.8 })); rail.position.set(0, 2.5, 0); g.add(rail)
  const v = Validator(); v.position.set(3.2, 0.7, 0.9); v.rotation.y = Math.PI; g.add(v); g.userData.validator = v
  return g
}
