import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Etiket, Sokak, SmartCard, VeriAkisi, canvasTex, mark, mat, phys } from './models'
import { Person } from './world'
import { skyTex } from './sky'
import { RENTAL_COPY, TARIFF, fmt, quote } from './rental'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Phase 7: car rental by card. Same separation as before: radio at the reader, software data to the operator, authorisation (hold) with the issuer, settlement later. */
interface Cfg { lanes: ('radio' | 'data' | 'auth' | 'settle')[]; reverse?: boolean; hero: [number, number] | null; tap?: boolean; hud?: 'price' | 'meter' | 'final'; flash?: boolean; lab: [string, [number, number, number]] }
const CFG: Cfg[] = [
  { lanes: [], hero: [-14, -3.6], lab: ['Operator bay', [-7, 3.2, -1]] },
  { lanes: [], hero: [-11, -3.4], hud: 'price', lab: ['Price list', [-9.5, 3.6, -0.2]] },
  { lanes: ['radio'], hero: [-9.5, -2.3], tap: true, lab: ['Door reader (radio ends here)', [-9.2, 2.2, -1.2]] },
  { lanes: ['data', 'auth'], hero: [-9.5, -2.3], lab: ['Operator platform + issuer (hold 50.00)', [-3, 7, 14]] },
  { lanes: [], hero: [-9.5, -2.3], flash: true, lab: ['Unlocked', [-9.5, 2.6, -0.2]] },
  { lanes: [], hero: null, hud: 'meter', lab: ['Meter = display only', [0, 5, 4]] },
  { lanes: ['radio'], hero: [-9.5, -2.3], tap: true, lab: ['Tap to end trip', [-9.2, 2.2, -1.2]] },
  { lanes: ['data', 'auth'], reverse: true, hero: [-9.5, -2.3], hud: 'final', lab: ['Capture fee, release the rest', [-3, 7, 14]] },
  { lanes: ['settle'], hero: [-9.5, -2.3], lab: ['Settlement later', [-3, 7, 14]] },
]
const CAMS: [[number, number, number], [number, number, number]][] = [
  [[-8, 14, 12], [-8, 0, -1]], [[-12, 2.6, 5.5], [-9.5, 0.8, -0.2]], [[-8, 1.6, -5.2], [-9.5, 1.0, -1.6]], [[-22, 9, 26], [-6, 2, 6]], [[-13, 1.8, -4], [-9.5, 0.9, -0.2]],
  [[0, 12, 16], [2, 0, 3]], [[-8, 1.7, -5], [-9.5, 1.0, -1.6]], [[-22, 9, 26], [-6, 2, 6]], [[-22, 9, 26], [-4, 2, 8]],
]
export const RENTAL_STEPS: StepDef[] = RENTAL_COPY.map((c, i) => ({ pos: CAMS[i][0], look: CAMS[i][1], ...c }))

const SLOTS = [-14, -9.5, -5, -0.5]; const SEL = 1; const COLORS = [0x2f9e6b, 0x1f6fd0, 0xe0b020, 0xc0392b]
function Car(color: number) {
  const g = mark(new THREE.Group(), 'car-body')
  const body = new THREE.Mesh(new RoundedBoxGeometry(4.2, 0.75, 1.9, 4, 0.25), phys(color, { roughness: 0.25, metalness: 0.5, clearcoat: 1 })); body.position.y = 0.7
  const cab = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.7, 1.7, 4, 0.25), phys(0x9fc4d6, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.8 })); cab.position.set(-0.2, 1.3, 0)
  g.add(body, cab)
  for (const x of [-1.3, 1.3]) for (const z of [-0.9, 0.9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 20), mat(0x15191d)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.38, z); g.add(w) }
  const lights: THREE.Mesh[] = []
  for (const z of [-0.6, 0.6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.35), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2c0).multiplyScalar(0.8), toneMapped: false })); l.position.set(2.1, 0.85, z); g.add(l); lights.push(l) }
  const rd = mark(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), phys(0x0b0d10, { clearcoat: 0.6 })), 'car-reader'); rd.position.set(0.2, 1.0, -0.97)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0x4488ff, toneMapped: false })); led.position.set(0.2, 0.88, -1.0)
  g.add(rd, led); g.userData.lights = lights; g.userData.led = led
  return g
}
const hudTex = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; return c }

export const buildRental: SceneBuilder = (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  m.scene.add(Sokak(10))
  const cars = SLOTS.map((x, i) => { const c = Car(COLORS[i]); c.position.set(x, 0, -0.2); m.scene.add(c); return c })
  const car = cars[SEL]
  const sign = mark(new THREE.Group(), 'car-hud'); void sign
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 0.1), mat(0x2b3138)); pole.position.set(-16.5, 1.5, -2.4); m.scene.add(pole)
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(256, 100, (c) => { c.fillStyle = '#0e7c86'; c.fillRect(0, 0, 256, 100); c.fillStyle = '#fff'; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText(TARIFF.operator, 128, 44); c.font = '500 22px sans-serif'; c.fillText('Cars · tap to unlock', 128, 78) }), toneMapped: false })); board.position.set(-16.5, 3.2, -2.3); m.scene.add(board)
  const hero = Person({ coat: 0x1f6f8b, id: 'character', hair: 0x2a1a12 }); hero.position.set(-14, 0, -3.6); m.scene.add(hero)
  const card = SmartCard(); card.scale.setScalar(0.5); card.visible = false; m.scene.add(card)
  // HUD sprite above the selected car, redrawn when its text changes
  const cv = hudTex(); const ht = new THREE.CanvasTexture(cv); ht.colorSpace = THREE.SRGBColorSpace
  const hud = mark(new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, depthTest: false, toneMapped: false })), 'car-hud'); hud.scale.set(3.2, 1.6, 1); hud.renderOrder = 10; m.scene.add(hud)
  let lastTxt = ''; const drawHud = (lines: string[]) => { const t = lines.join('|'); if (t === lastTxt) return; lastTxt = t; const x = cv.getContext('2d'); if (!x) return; x.fillStyle = 'rgba(13,32,41,.9)'; x.beginPath(); x.roundRect(6, 6, 500, 244, 24); x.fill(); x.fillStyle = '#7fe3ff'; x.font = '700 38px sans-serif'; x.fillText(lines[0], 24, 58); x.fillStyle = '#fff'; x.font = '600 34px sans-serif'; lines.slice(1).forEach((l, i) => x.fillText(l, 24, 112 + i * 48)); x.fillStyle = '#ffd23a'; x.font = '500 22px sans-serif'; x.fillText('SIMULATION · demo tariff', 24, 236); ht.needsUpdate = true }
  const P = THREE.Vector3
  for (const [x, id, col] of [[-8, 'rental-operator', 0x0e7c86], [2, 'pay-issuer', 0x7b5cc4]] as const) { const b = mark(new THREE.Mesh(new RoundedBoxGeometry(3, 4, 3, 4, 0.25), phys(0x101c2e, { roughness: 0.25, metalness: 0.5, clearcoat: 1, emissive: col, emissiveIntensity: 0.2 })), id); b.position.set(x, 2, 14); m.scene.add(b) }
  const slot = new P(SLOTS[SEL], 0, -0.2)
  const path = new THREE.CatmullRomCurve3([slot.clone(), new P(-6, 0, 2.6), new P(2, 0, 3.8), new P(16, 0, 3.8), new P(22, 0, 7), new P(10, 0, 9), new P(-4, 0, 6.5), new P(-9.5, 0, 2.4), slot.clone().add(new P(0, 0, 0.01))])
  const flow = VeriAkisi({
    radio: [new P(-9.3, 1.0, -1.4), new P(-9.3, 1.0, -1.7), new P(-9.3, 1.0, -2.0)],
    data: [new P(-9.5, 1.9, -0.2), new P(-9, 9, 6), new P(-8, 4.2, 13)],
    auth: [new P(-8, 4.4, 14), new P(-3, 5, 14), new P(2, 4.4, 14)],
    settle: [new P(2, 4.6, 14.5), new P(-3, 7.2, 14.5), new P(-8, 4.6, 14.5)],
  })
  m.scene.add(flow.group)
  const labels = CFG.map((c) => { const l = Etiket(c.lab[0], 1.2); l.position.set(...c.lab[1]); l.visible = false; m.scene.add(l); return l })
  const rings = Array.from({ length: 3 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.01, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2fd0ff).multiplyScalar(2), toneMapped: false, transparent: true })); m.scene.add(r); return r })
  const sun2 = new THREE.PointLight(0xbfe3ff, 14, 14); sun2.position.set(-8, 4, 2); m.scene.add(sun2); const g2 = new THREE.PointLight(0x6aa8ff, 25, 30); g2.position.set(-3, 8, 16); m.scene.add(g2)
  m.prepare()
  const led = car.userData.led as THREE.Mesh, lights = car.userData.lights as THREE.Mesh[]
  let last = -1, t5 = 0
  const tmp = new P(), nxt = new P()
  return (t, step, tech) => {
    const c = CFG[step]
    if (step !== last) { if (step === 5) t5 = t; last = step }
    // car: parked, or driving the loop (ends exactly at its slot), never jumping
    const prog = step === 5 ? Math.min(1, (t - t5) / 14) : step > 5 ? 1 : 0
    path.getPointAt(prog, tmp); path.getPointAt(Math.min(1, prog + 0.01), nxt)
    car.position.lerp(tmp, 0.12)
    if (prog > 0 && prog < 1) car.rotation.y += (Math.atan2(-(nxt.z - tmp.z), nxt.x - tmp.x) - car.rotation.y) * 0.1; else car.rotation.y += (0 - car.rotation.y) * 0.1
    const unlocked = step >= 4 && step <= 5
    ;(led.material as THREE.MeshBasicMaterial).color.set(unlocked ? 0x35d07f : step === 2 || step === 6 ? 0x4488ff : 0xff5050).multiplyScalar(2)
    lights.forEach((l) => (l.material as THREE.MeshBasicMaterial).color.set(c.flash ? (Math.sin(t * 14) > 0 ? 0xffffff : 0x333333) : 0xfff2c0).multiplyScalar(c.flash ? 3 : 0.8))
    // hero
    hero.visible = !!c.hero
    if (c.hero) { const d = Math.hypot(c.hero[0] - hero.position.x, c.hero[1] - hero.position.z); hero.position.x += (c.hero[0] - hero.position.x) * 0.04; hero.position.z += (c.hero[1] - hero.position.z) * 0.04; (hero.userData.walk as (t: number, m: boolean) => void)(t, d > 0.1) }
    card.visible = !!c.tap; card.position.set(car.position.x + 0.2, 1.0, car.position.z - 1.5); card.rotation.y = 0; card.userData.xray(false)
    rings.forEach((r, i) => { r.visible = !!c.tap; r.position.set(car.position.x + 0.2, 1.0, car.position.z - 1.05); const p = (t * 0.7 + i / 3) % 1; r.scale.setScalar(1 + p * 4); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8 })
    // HUD
    hud.visible = !!c.hud; hud.position.set(car.position.x, 3.1, car.position.z)
    if (c.hud === 'price') drawHud(['Compact EV', `Unlock ${TARIFF.unlock.toFixed(2)} TRY`, `${TARIFF.perMinute.toFixed(2)} TRY / min`, `Daily cap ${TARIFF.dailyCap} TRY`])
    if (c.hud === 'meter') { const min = Math.round(prog * 35); const q = quote(min); drawHud(['Trip meter', `${String(min).padStart(2, '0')} min`, fmt(q.fee), `Hold ${fmt(TARIFF.hold)}`]) }
    if (c.hud === 'final') { const q = quote(35); drawHud(['Final charge', `35 min  ${fmt(q.fee)}`, `Released ${fmt(q.release)}`, 'Ledger: captured']) }
    flow.show(c.lanes, !!c.reverse); flow.update(t)
    labels.forEach((l, i) => { l.visible = tech && i === step })
  }
}
