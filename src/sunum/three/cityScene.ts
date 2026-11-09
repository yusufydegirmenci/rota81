import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Bus, Sokak, mat, phys } from './models'
import { Person, Shelter } from './world'
import { skyTex } from './sky'
import { DISTRICTS, evaluate, type DLine, type DStop } from '../citydesign'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Map px (960×440) → world units. */
const W = (x: number, y: number) => new THREE.Vector3((x - 480) / 16, 0, (y - 220) / 16)

export function citySteps(stops: DStop[], lines: DLine[]): StepDef[] {
  const r = evaluate(DISTRICTS, stops, lines)
  const dense = DISTRICTS.reduce((a, d) => (d.pop > a.pop ? d : a)); const dp = W(dense.x, dense.y)
  const cx = stops.length ? stops.reduce((n, s) => n + s.x, 0) / stops.length : 480, cy = stops.length ? stops.reduce((n, s) => n + s.y, 0) / stops.length : 220; const c = W(cx, cy)
  return [
    { pos: [0, 40, 34], look: [0, 0, 0], title: 'Marisa from above', text: `Five districts as blocks: taller means more residents (scenario numbers, about ${Math.round(DISTRICTS.reduce((n, d) => n + d.pop, 0) / 1000)}k in total). Your network covers ${Math.round(r.coverage * 100)}% of them.`, deep: 'Block height is population ÷ 50,000 (SCENARIO input, not a statistic). Coverage counts residents within about 500 m of a stop on a usable line, fading to zero at about 1 km.' },
    { pos: [dp.x + 10, 12, dp.z + 14], look: [dp.x, 1, dp.z], title: `Where most people live: ${dense.n}`, text: `${dense.n} has the most residents in the scenario. ${r.districts.find((d) => d.n === dense.n)!.share > 0.99 ? 'Your lines reach it well.' : 'Your lines do not fully reach it yet.'}`, deep: 'Demand follows people: a good line passes the dense districts first. Check the line loads in the results panel after you move a stop.' },
    { pos: [c.x + 12, 18, c.z + 22], look: [c.x, 0, c.z], title: 'Your lines', text: `${lines.length} line(s), ${r.transferStops} transfer stop(s), ${r.connected ? 'one connected network' : r.components + ' separate networks'}. Small boxes are vehicles; their number follows the headway.`, deep: 'Lines that share a stop form one network where passengers can transfer. Disconnected lines make every trip that needs both impossible.' },
  ]
}

export const buildCity = (stops: DStop[], lines: DLine[]): SceneBuilder => (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), mat(0xb9c4a8, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; m.scene.add(ground)
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), phys(0x4a8fb0, { roughness: 0.15, metalness: 0.2, clearcoat: 1 })); sea.rotation.x = -Math.PI / 2; sea.position.set(22, 0.02, 13); m.scene.add(sea)
  DISTRICTS.forEach((d, di) => {
    const c = W(d.x, d.y); const tile = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.2, 24), mat(new THREE.Color(d.c).getHex(), { roughness: 0.9 })); tile.position.set(c.x, 0.1, c.z); m.scene.add(tile)
    const n = Math.round(d.pop / 25000); const base = d.pop / 50000
    for (let i = 0; i < n; i++) { const a = (i * 2.399 + di) % (Math.PI * 2), r = 1 + ((i * 7 + di * 3) % 50) / 10; const h = base * (0.5 + ((i * 13 + di) % 10) / 10); const b = new THREE.Mesh(new RoundedBoxGeometry(1.1, h, 1.1, 2, 0.1), mat(0xe8e2d4, { roughness: 0.8 })); b.position.set(c.x + Math.cos(a) * r, h / 2 + 0.2, c.z + Math.sin(a) * r); m.scene.add(b) }
  })
  const pos = new Map(stops.map((s) => [s.id, W(s.x, s.y)]))
  stops.forEach((s) => { const p = pos.get(s.id)!; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), mat(0x2b3138)); pole.position.set(p.x, 0.9, p.z); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(1.6), toneMapped: false })); cap.position.set(p.x, 1.8, p.z); m.scene.add(pole, cap) })
  const vehicles: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; off: number; speed: number }[] = []
  lines.forEach((l) => {
    const pts = l.stops.map((id) => pos.get(id)).filter((p): p is THREE.Vector3 => !!p).map((p) => p.clone().setY(0.6)); if (pts.length < 2) return
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1); const col = new THREE.Color(l.color)
    m.scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.12, 6), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.5), toneMapped: false })))
    const nVeh = Math.max(1, Math.min(6, Math.round(30 / Math.max(l.headway, 1) / 2)))
    for (let i = 0; i < nVeh; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.5), mat(col.getHex(), { emissive: col.getHex(), emissiveIntensity: 0.4 })); m.scene.add(v); vehicles.push({ mesh: v, curve, off: i / nVeh, speed: 0.03 }) }
  })
  const sun = new THREE.PointLight(0xffe2b0, 400, 90); sun.position.set(-10, 25, 10); m.scene.add(sun)
  m.prepare()
  const t3 = new THREE.Vector3(), t4 = new THREE.Vector3()
  return (t) => { vehicles.forEach((v) => { const p = (t * v.speed + v.off) % 1; v.curve.getPointAt(p, t3); v.curve.getPointAt(Math.min(1, p + 0.01), t4); v.mesh.position.copy(t3); v.mesh.lookAt(t4) }) }
}

/** Street level: the stop shelter at rush hour; the crowd size follows the modelled riders. */
export const streetSteps = (riders: number, status: string): StepDef[] => [
  { pos: [-9, 2.4, 6], look: [-4, 1.4, -3], title: 'At the stop, rush hour', text: `About ${riders} riders per hour board lines at this stop in the scenario; ${status}. More people wait here when the headway is long.`, deep: 'Street view makes demand human: the same number that fills a bar in the results panel fills the shelter.' },
  { pos: [4, 2.2, -5.5], look: [-4, 1.2, -1], title: 'Boarding', text: 'The bus stops at the kerb beside the tactile strip. Short headways keep the crowd small and the doors fast.', deep: 'Dwell time (how long a vehicle stands at a stop) grows with the number of people boarding and is one reason a crowded line slows down.' },
]
export const buildStreet = (crowd: number): SceneBuilder => (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  m.scene.add(Sokak(10))
  const sh = Shelter(); sh.position.set(-6, 0, -3.4); m.scene.add(sh)
  const bus = Bus(); bus.rotation.y = Math.PI; bus.position.set(0.4, 0, 0); m.scene.add(bus)
  const n = Math.max(1, Math.min(18, crowd)); const pal = [0xc0392b, 0x2e8b57, 0x8e6e53, 0x34495e, 0xd4a017, 0x6c5ce7]
  for (let i = 0; i < n; i++) { const p = Person({ coat: pal[i % 6], height: 0.9 + (i % 4) * 0.06, skin: [0xe8bf9d, 0xc68642, 0x8d5524][i % 3] }); p.position.set(-9 + (i % 9) * 0.7, 0, -2.5 - Math.floor(i / 9) * 0.8); m.scene.add(p) }
  const l = new THREE.PointLight(0xbfe3ff, 14, 10); l.position.set(-6, 3, -2.5); m.scene.add(l); m.prepare()
  return () => {}
}
