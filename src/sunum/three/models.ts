import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { isPartId, type PartId } from './registry'

export const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1, ...o })
export const phys = (c: number, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, metalness: 0.1, ...o })
const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
const rbox = (w: number, h: number, d: number, r: number, m: THREE.Material) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m)

/** Canvas texture; returns undefined when no canvas exists (unit tests / very old browsers) so models still build. */
export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture | undefined {
  try { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); if (!g) return undefined; draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t } catch { return undefined }
}
/** Contactless wave symbol (four arcs), optional ring. */
function waves(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  g.strokeStyle = color; g.lineWidth = s * 0.09; g.lineCap = 'round'
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx - s * 0.35, cy, s * (0.2 + i * 0.17), -0.9, 0.9); g.stroke() }
}
export const woodTexture = () => canvasTex(512, 512, (g) => {
  g.fillStyle = '#4b2e1c'; g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${20 + (i * 7) % 40},${10 + (i * 3) % 20},5,${0.12 + (i % 5) * 0.05})`; g.lineWidth = 1 + (i % 4); g.beginPath(); const y = (i * 37) % 512; g.moveTo(0, y); g.bezierCurveTo(150, y + ((i * 13) % 30) - 15, 330, y - ((i * 7) % 30) + 15, 512, y + ((i * 11) % 20) - 10); g.stroke() }
})

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

const GOLD = () => phys(0xe8c27a, { metalness: 0.9, roughness: 0.28 })

/** Smart card: blue metallic rounded body with clear-coat, printed contactless mark; inside (visible in X-ray / exploded view) an antenna coil and a gold chip pad.
 *  userData.xray(on) makes the body glassy so the inside shows; userData.layers gives the three layers for the exploded view. */
export function SmartCard() {
  const g = new THREE.Group()
  const body = mark(rbox(0.856, 0.54, 0.02, 0.035, phys(0x2f5fb3, { metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 })), 'card-body')
  const icon = mark(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c) => waves(c, 128, 128, 200, 'rgba(235,242,255,.85)')), transparent: true, depthWrite: false })), 'card-wave-icon')
  icon.position.set(0.14, 0, 0.0105)
  const coil = mark(new THREE.Group(), 'card-antenna')
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.04, 0.014, 8, 48), phys(0xd9812f, { metalness: 0.85, roughness: 0.3, emissive: 0x000000 })); t.scale.set(1.45, 1, 1); coil.add(t) }
  coil.position.set(0.1, 0, 0)
  const chip = mark(rbox(0.13, 0.1, 0.012, 0.012, GOLD()), 'card-chip'); chip.position.set(-0.28, 0, 0.002)
  coil.visible = chip.visible = false
  g.add(body, icon, coil, chip)
  g.userData.layers = { body, coil, chip }
  g.userData.xray = (on: boolean) => {
    const m = body.material as THREE.MeshPhysicalMaterial
    // Toggling `transparent` changes the OPAQUE shader define, so the material must be recompiled once per change.
    if (m.transparent !== on) { m.transparent = on; m.needsUpdate = true }
    m.opacity = on ? 0.3 : 1; m.depthWrite = !on; icon.visible = !on; coil.visible = chip.visible = on
  }
  return g
}

/** Stylised hand holding a card between thumb (front) and fingers (back). Skin-coloured capsules; deliberately simple, not a photo. */
export function Hand() {
  const g = mark(new THREE.Group(), 'hand'); const skin = mat(0xe0ac88, { roughness: 0.75 })
  const cap = (r: number, l: number) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), skin)
  const thumb = cap(0.045, 0.2); thumb.position.set(0.36, -0.12, 0.07); thumb.rotation.z = 1.0; thumb.rotation.x = 0.3
  for (let i = 0; i < 4; i++) { const f = cap(0.034, 0.26); f.position.set(0.5, 0.12 - i * 0.075, -0.05); f.rotation.z = Math.PI / 2 - 0.15 + i * 0.04; g.add(f) }
  const palm = rbox(0.3, 0.34, 0.12, 0.05, skin); palm.position.set(0.72, 0, -0.07)
  const wrist = cap(0.09, 0.4); wrist.position.set(1.0, -0.12, -0.07); wrist.rotation.z = 1.2
  g.add(thumb, palm, wrist)
  return g
}

/** Reader/validator: matte black chamfered body, NFC mark with tap circle, result screen, animated RGB LED strip, cable, hidden coil (shown in technical view).
 *  Face points +z. userData.update(tSec, {tech, active, result}) animates LED/screen/coil visibility. */
export function Validator() {
  const g = new THREE.Group()
  const body = mark(rbox(0.8, 1.1, 0.24, 0.05, phys(0x0b0d10, { roughness: 0.32, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.3 })), 'bus-validator'); body.position.y = 0.55
  const icon = mark(new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c) => { c.fillStyle = '#fff'; c.font = '700 38px sans-serif'; c.textAlign = 'center'; c.fillText('NFC', 128, 52); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(128, 150, 70, 0, 7); c.stroke(); waves(c, 128, 150, 100, '#fff') }), transparent: true, toneMapped: false, depthWrite: false })), 'reader-icon'); icon.position.set(0, 0.4, 0.1215)
  const screen = mark(box(0.56, 0.2, 0.01, mat(0x2a3a44, { roughness: 0.2 })), 'reader-screen'); screen.position.set(0, 0.86, 0.12)
  const coil = mark(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 12, 40), GOLD()), 'reader-coil'); coil.position.set(0, 0.4, 0.1); coil.visible = false
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, toneMapped: false })
  const led = mark(new THREE.Group(), 'reader-led')
  const lf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.028, 0.02), ledMat); lf.position.set(0, 0.07, 0.122)
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), ledMat); ll.position.set(-0.39, 0.18, 0.122)
  const lr = ll.clone(); lr.position.x = 0.39
  led.add(lf, ll, lr)
  const cable = mark(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.02, -0.1), new THREE.Vector3(0, -0.2, -0.3), new THREE.Vector3(0, -0.6, -0.1)]), 20, 0.018, 8), mat(0x15191d)), 'reader-cable')
  g.add(body, icon, screen, coil, led, cable)
  const c = new THREE.Color(); const sm = screen.material as THREE.MeshStandardMaterial
  g.userData.screen = screen
  g.userData.update = (t: number, s: { tech?: boolean; active?: boolean; result?: 'ok' | 'bad' | null }) => {
    coil.visible = !!s.tech
    if (s.result === 'ok') c.setRGB(0.1, 1, 0.35).multiplyScalar(2.2)
    else if (s.result === 'bad') c.setRGB(1, 0.1, 0.1).multiplyScalar(2.2)
    else if (s.active) c.setHSL(0.55, 1, 0.5).multiplyScalar(1.6 + 0.8 * Math.sin(t * 8))
    else c.setHSL((t * 0.08) % 1, 1, 0.5).multiplyScalar(1.1)
    ledMat.color.copy(c)
    sm.color.set(s.result === 'ok' ? 0x35d07f : s.result === 'bad' ? 0xd04545 : 0x2a3a44); sm.emissive.set(s.result === 'ok' ? 0x0b5a30 : s.result === 'bad' ? 0x5a0b0b : 0x000000)
  }
  return g
}
/** Desk reader: the same validator laid flat, tap circle facing up. */
export function KartOkuyucu() {
  const g = new THREE.Group(); const v = Validator(); v.rotation.x = -Math.PI / 2; v.position.set(0, 0.12, 0.55); g.add(v)
  g.userData.screen = v.userData.screen; g.userData.update = v.userData.update
  return g
}

/** Bus with doors facing +z; marked door, windows, wheels, computer and modem. */
export function Bus() {
  const g = new THREE.Group()
  const body = mark(rbox(8.2, 2.7, 2.5, 0.12, phys(0xef5f26, { roughness: 0.35, clearcoat: 0.8 })), 'bus-body'); body.position.y = 1.75
  const stripe = box(8.22, 0.35, 2.52, mat(0xc44a18)); stripe.position.y = 0.95
  const roof = box(8.0, 0.1, 2.3, mat(0xd8dde0, { metalness: 0.5 })); roof.position.y = 3.15
  g.add(body, stripe, roof)
  const glass = phys(0x9fd6e0, { roughness: 0.05, metalness: 0.3, transmission: 0.0, transparent: true, opacity: 0.75 })
  for (let i = 0; i < 4; i++) { const w = mark(box(1.3, 0.95, 0.06, glass), 'bus-window'); w.position.set(-2.6 + i * 1.75, 2.0, 1.27); g.add(w) }
  const door = mark(box(1.0, 2.2, 0.06, glass), 'bus-door'); door.position.set(3.4, 1.4, 1.27); g.add(door)
  for (const x of [-2.5, 2.4]) { const wh = mark(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 24), mat(0x14323f)), 'bus-wheel'); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.55, 1.2); g.add(wh) }
  const modem = mark(box(0.5, 0.2, 0.3, mat(0x222a31)), 'bus-modem'); modem.position.set(-1.8, 3.3, 0)
  const pc = mark(box(0.7, 0.45, 0.5, mat(0x2f3d49)), 'bus-computer'); pc.position.set(-1.8, 2.2, 0.5)
  g.add(modem, pc)
  return g
}

/** POS terminal: body, screen, key pad and contactless zone. Phase 5 builds the restaurant around it. */
export function POS() {
  const g = new THREE.Group()
  const body = mark(rbox(0.3, 0.07, 0.55, 0.02, phys(0x1b2f3a, { clearcoat: 0.5 })), 'pos-body'); body.rotation.x = -0.3
  const screen = mark(box(0.22, 0.012, 0.13, mat(0x2a3a44, { roughness: 0.2 })), 'pos-screen'); screen.position.set(0, 0.04, -0.15); screen.rotation.x = -0.3
  for (let i = 0; i < 12; i++) { const k = box(0.045, 0.01, 0.035, mat(0xd0d6da)); k.position.set(-0.07 + (i % 3) * 0.07, 0.045 - (Math.floor(i / 3)) * 0.0, -0.02 + Math.floor(i / 3) * 0.055); k.rotation.x = -0.3; g.add(k) }
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

let facade: { alb?: THREE.CanvasTexture; emi?: THREE.CanvasTexture } | null = null
function facades() {
  if (facade) return facade
  const lit = (i: number, j: number) => ((i * 7 + j * 13 + i * j) % 5) < 2
  const draw = (emit: boolean) => canvasTex(128, 256, (g) => {
    g.fillStyle = emit ? '#000' : '#ffffff'; g.fillRect(0, 0, 128, 256)
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const on = lit(i, j); g.fillStyle = emit ? (on ? '#ffd9a0' : '#000') : on ? '#d9c79a' : '#52616b'; g.fillRect(8 + i * 30, 10 + j * 30, 20, 20) }
  })
  facade = { alb: draw(false), emi: draw(true) }; return facade
}
const treeGeo = { trunk: new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8), crown: new THREE.IcosahedronGeometry(1.0, 1) }

/** Street kit: asphalt with lane marks, pavement + kerb, two rows of textured buildings, trees, street lamps and a stop sign. Deterministic (no random). */
export function Sokak(buildings = 9) {
  const g = new THREE.Group()
  const ground = mark(new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x3e464f, { roughness: 0.9 })), 'road'); ground.rotation.x = -Math.PI / 2
  const walk = mark(box(240, 0.14, 5, mat(0xcfc9ba, { roughness: 0.85 })), 'road'); walk.position.set(0, 0.07, -4.5)
  const kerb = box(240, 0.16, 0.25, mat(0x9aa0a6)); kerb.position.set(0, 0.08, -1.95)
  g.add(ground, walk, kerb)
  for (let i = -20; i < 20; i++) { const l = box(1.4, 0.02, 0.18, mat(0xf4f0e6)); l.position.set(i * 3, 0.011, 5); g.add(l) }
  const f = facades(); const cols = [0xe8d5b5, 0xd9b99b, 0xc9d8d3, 0xecc9a8]
  const wall = (i: number, row: number) => { const h = (row ? 14 : 6) + ((i * 3 + row) % 4) * 2.4; const m = mat(cols[(i + row) % 4], { map: f.alb, emissiveMap: f.emi, emissive: f.emi ? 0xffffff : 0x000000, emissiveIntensity: 0.6 }); m.map?.repeat.set(1, h / 6); if (m.map) m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; return { h, m } }
  for (let i = 0; i < buildings * 2; i++) { const { h, m } = wall(i, 0); const b = mark(box(5.2, h, 5, m), 'building'); b.position.set(-30 + i * 5.6, h / 2, -9); g.add(b) }
  for (let i = 0; i < buildings * 2; i++) { const { h, m } = wall(i, 1); const b = mark(box(6, h, 6, m), 'building'); b.position.set(-34 + i * 6.4, h / 2, -20); g.add(b) }
  for (let i = -6; i < 8; i++) {
    const t = mark(new THREE.Group(), 'tree'); const tr = new THREE.Mesh(treeGeo.trunk, mat(0x5a4030)); tr.position.y = 0.8; const cr = new THREE.Mesh(treeGeo.crown, mat(0x3f7d3a, { roughness: 0.9 })); cr.position.y = 2.4; cr.scale.set(1.1 + (i % 3) * 0.15, 1.2, 1.1); t.add(tr, cr); t.position.set(i * 8 + 3, 0, -3.2); g.add(t)
  }
  for (let i = -5; i < 7; i++) {
    const l = mark(new THREE.Group(), 'street-lamp'); const p = box(0.12, 5, 0.12, mat(0x2b3138, { metalness: 0.6 })); p.position.y = 2.5
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1c8).multiplyScalar(2) })); h.position.set(0.3, 5.05, 0); l.add(p, h); l.position.set(i * 9 - 1, 0, -2.2); g.add(l)
  }
  const sign = mark(new THREE.Group(), 'stop-sign'); const sp = box(0.08, 3, 0.08, mat(0x2b3138)); sp.position.y = 1.5
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (c) => { c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#fff'; c.font = '700 54px sans-serif'; c.textAlign = 'center'; c.fillText('0417', 128, 95) }), color: 0xffffff })); sf.position.set(0, 2.9, 0.05)
  sign.add(sp, sf); sign.position.set(-4.5, 0, -2.2); g.add(sign)
  return g
}

export type LaneKind = 'radio' | 'data' | 'auth' | 'fee' | 'settle'
const LANE: Record<LaneKind, { color: number; part: PartId }> = {
  radio: { color: 0x2fd0ff, part: 'flow-radio' }, data: { color: 0xff7a35, part: 'flow-data' }, auth: { color: 0xa77cff, part: 'flow-auth' },
  fee: { color: 0xffd23a, part: 'flow-fee' }, settle: { color: 0xaab4bd, part: 'flow-settle' },
}
/** Data-flow visualiser: one coloured lane per kind of exchange, so radio, software data, authorisation, fare validation and settlement are never drawn as the same thing. Lane lines are glowing tubes; a bright dot runs along the active lane(s). */
export function VeriAkisi(paths: Partial<Record<LaneKind, THREE.Vector3[]>>) {
  const g = new THREE.Group(); const lanes = new Map<LaneKind, { line: THREE.Mesh; dot: THREE.Mesh; curve: THREE.CatmullRomCurve3 }>()
  for (const kind of Object.keys(paths) as LaneKind[]) {
    const pts = paths[kind]!; if (pts.length < 2) continue
    const { color, part } = LANE[kind]; const hdr = new THREE.Color(color).multiplyScalar(2)
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1)
    const line = mark(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, kind === 'radio' ? 0.012 : 0.035, 6), new THREE.MeshBasicMaterial({ color: hdr, toneMapped: false, transparent: true, opacity: 0.8 })), part)
    const dot = mark(new THREE.Mesh(new THREE.SphereGeometry(kind === 'radio' ? 0.03 : 0.12, 12, 12), new THREE.MeshBasicMaterial({ color: hdr, toneMapped: false })), part)
    line.visible = dot.visible = false; g.add(line, dot); lanes.set(kind, { line, dot, curve })
  }
  let rev = false
  return {
    group: g,
    /** Show one or several lanes (each keeps its own colour); `reverse` runs the dot backwards (the answer coming back). */
    show(kind: LaneKind | LaneKind[] | null, reverse = false) { const on = kind === null ? [] : Array.isArray(kind) ? kind : [kind]; rev = reverse; lanes.forEach((l, k) => { l.line.visible = l.dot.visible = on.includes(k) }) },
    update(tSec: number) { lanes.forEach((l) => { if (l.dot.visible) { const p = (tSec * 0.25) % 1; l.dot.position.copy(l.curve.getPoint(rev ? 1 - p : p)) } }) },
  }
}

/** Text label that always faces the camera. Used in the technical view only. */
export function Etiket(text: string, scale = 1) {
  const map = canvasTex(512, 96, (g) => { g.fillStyle = 'rgba(13,32,41,.85)'; g.beginPath(); g.roundRect(4, 4, 504, 88, 18); g.fill(); g.fillStyle = '#fff'; g.font = '600 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50) })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, toneMapped: false }))
  s.scale.set(2.6 * scale, 0.49 * scale, 1); s.renderOrder = 10
  return s
}
