import * as THREE from 'three'
import { Bus, Etiket, Sokak, Validator, canvasTex, mark, mat } from './models'
import { BusInterior, House, MetroEntrance, Person, Phone, Shelter, Wheelchair } from './world'
import { skyTex } from './sky'
import { addWalker } from './assets'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Phase 4: one continuous journey. The hero is one object that only ever walks (no teleport); every step moves her target, the camera follows a different idea.
 *  Door side of the bus faces the pavement (-z). Coordinates: x along the street, z across it. */
interface JStep extends StepDef {
  who: [number, number]; lie?: boolean; inside?: boolean; busX?: number; ramp?: boolean; phone?: [string, string[]]
  fault?: 'down' | 'ok'; tap?: boolean; tech?: boolean; arrival?: string[]; queue?: boolean; wheel?: [number, number]; lab?: [string, [number, number, number]]
}
const BUS_STOP_X = 0.4, DOOR_X = -3.0
export const JOURNEY_STEPS: JStep[] = [
  { who: [-40.95, -8], lie: true, pos: [-39, 2.8, -1.5], look: [-41.5, 0.8, -8], title: 'Morning: Derya wakes up', text: 'The story starts at home. The same character will be on screen in every later scene, walking from room to street to bus to metro without ever jumping.', deep: 'Spatial continuity is a teaching tool: each camera move follows her, so the audience always knows where the technology sits in a normal day.', lab: ['Derya (main character)', [-41, 1.9, -8]] },
  { who: [-39.4, -7.2], phone: ['FORADAŞ', ['Balance 142.50 TRY', 'Card: active', 'Next: plan route']], pos: [-39.1, 1.3, -5.3], look: [-39.15, 1.2, -6.85], title: 'Phone: the app and the balance', text: 'She opens the app. It shows one balance for one card in every city. The numbers are demo values (SIMULATION).', deep: 'The app is a window onto the account in the backend; the balance is not stored on the phone. Top-ups are authorised by the backend and recorded in the ledger.', lab: ['App = view of the backend account', [-39.1, 2.0, -6.8]] },
  { who: [-39.4, -7.2], phone: ['Route', ['Line 32 → stop 0417', 'Walk 4 min', 'Bus in 11 min']], pos: [-39.1, 1.35, -5.6], look: [-39.15, 1.2, -6.85], title: 'Route: how the app plans', text: 'The route planner picks line 32 and tells her when to leave. Plans use timetables and, where available, live vehicle positions.', deep: 'Routing runs on a stop-and-line graph (shortest path with a transfer penalty). If a stop has no data, the planner says so instead of inventing one.', lab: ['Route planner', [-39.1, 2.0, -6.8]] },
  { who: [-9, -2.6], pos: [-22, 3.5, 7], look: [-24, 1.2, -4], title: 'Neighbourhood: the walk to the stop', text: 'She walks along the pavement past trees and street lamps. Nothing technical happens here, which is the point: the system is invisible until she needs it.', deep: 'Camera purpose: a wide, calm shot lets the audience see the whole walk and the neighbourhood context.', lab: ['Pavement', [-24, 2.4, -4]] },
  { who: [-9, -2.6], arrival: ['Line 32', 'Next: 3 min', 'Stop 0417'], pos: [-8, 2.4, 4.5], look: [-7, 1.5, -3], title: 'The stop', text: 'A lit shelter, a bench, an arrival display and a yellow tactile strip along the kerb. The display shows demo minutes (SIMULATION).', deep: 'The display is fed by the same vehicle positions as the app, so both agree.', lab: ['Arrival display', [-5, 3, -3]] },
  { who: [-9, -2.6], arrival: ['Line 32', 'Next: 1 min', 'Stop 0417'], pos: [-5, 1.8, 2.2], look: [-6, 1.2, -2.6], title: 'People at the stop, and access', text: 'Different heights, clothes and paces: a parent with a child, a backpacker, an older passenger, and a passenger in a wheelchair. The tactile strip guides blind passengers; the ramp is for wheels.', deep: 'Accessibility is a requirement, not a feature: level boarding, a ramp, a clear display, and a reader that also works for people who cannot see its screen (sound and LED).', lab: ['Wheelchair user waits at the ramp point', [-7.4, 1.8, -2.5]] },
  { who: [-9, -2.6], busX: BUS_STOP_X, arrival: ['Line 32', 'Arriving', 'Stop 0417'], pos: [14, 2.5, -6], look: [2, 1.8, -1], title: 'The bus arrives', text: 'An electric bus pulls in. The front display shows the line number; the door stops next to the tactile strip.', deep: 'Door position matters: the validator is mounted beside the door so boarding order and tap order are the same.', lab: ['Route display', [4, 4, -1]] },
  { who: [-9.5, -2.6], busX: BUS_STOP_X, ramp: true, queue: true, wheel: [-3.6, -1.7], pos: [-6, 1.5, -5.8], look: [-3.2, 0.8, -1.5], title: 'Ramp out, people queue', text: 'The ramp folds out and the wheelchair passenger rolls first. Others queue at the door in front of the validator.', deep: 'Wheelchair users usually tap at a validator near the wheelchair space; here the same reader serves everyone to keep the scene readable.', lab: ['Boarding ramp', [-3.4, 1.4, -1.9]] },
  { who: [-2.4, -2.5], busX: BUS_STOP_X, ramp: true, tap: true, fault: 'down', pos: [-1, 1.5, -4.8], look: [-1.8, 1.3, -1.9], title: 'Failure: the validator does not respond', text: 'Derya taps and nothing happens: the LED is red and the screen says "Out of service". The backend is fine; only this device failed. The driver keeps the door open and the queue waits.', deep: 'Failure mode: reader firmware hang. Recovery path: (1) the driver restarts it from the cab, (2) a field technician is called, (3) meanwhile boarding may be allowed and the taps are recovered later from the card trip log.', lab: ['Validator: out of service', [-1.8, 2.7, -1.9]] },
  { who: [-2.4, -2.5], busX: BUS_STOP_X, ramp: true, fault: 'down', tech: true, pos: [-6, 1.8, -5.2], look: [-3.5, 1.2, -2.2], title: 'The technician arrives', text: 'A field technician in an orange vest walks to the validator, checks the power cable and the connection to the vehicle computer, and restarts the device.', deep: 'Typical order of checks: power, cable, vehicle computer link, then restart, then replace. Each check isolates a different layer of the chain.', lab: ['Field technician', [-3.4, 2.2, -2.3]] },
  { who: [-2.4, -2.5], busX: BUS_STOP_X, ramp: true, fault: 'ok', tap: true, tech: true, pos: [-0.2, 1.6, -4.5], look: [-1.8, 1.3, -1.9], title: 'Recovered: the tap works', text: 'The LED turns green after the restart and Derya taps again. The earlier failed attempt did not charge her; the backend only sees the successful one.', deep: 'Idempotency: a request carries a unique key, so even if a tap is retried or recovered later, the fare is charged once.', lab: ['Green = accepted', [-1.8, 2.7, -1.9]] },
  { who: [1.9, -0.8], inside: true, busX: BUS_STOP_X, pos: [2, 3.2, -6], look: [0.4, 1.3, -0.5], title: 'Inside the bus', text: 'The bus shell is cut away so we can follow her inside: seats, a handrail and a second validator by the door for exits and transfers.', deep: 'Camera purpose: entering the vehicle shows where the on-board equipment sits relative to people. Cutaway is a drawing aid.', lab: ['Cutaway: shell hidden for clarity', [0.4, 3.6, -1]] },
  { who: [19.6, -1.5], busX: BUS_STOP_X, tap: true, fault: 'ok', pos: [14, 2.2, 3.2], look: [18.5, 1.2, -2.5], title: 'Transfer: the metro entrance', text: 'She leaves the bus, walks to the metro entrance and taps the same card at the gate. The backend sees two boardings within the transfer window and applies the transfer discount.', deep: 'Transfer logic lives in the fare engine, not in the card: it looks at the trip history in the ledger.', lab: ['Gate reader', [19.6, 2.7, -2]] },
  { who: [19.6, -1.5], busX: BUS_STOP_X, pos: [-12, 12, 20], look: [-8, 1, -2], title: 'Failure and recovery, system by system', text: 'Validator: restart, technician, recover taps later. Vehicle modem: store the request and send when coverage returns. Backend: fall back to local rules and reconcile afterwards. Phone app: the card still works without the phone.', deep: 'Every critical system has a degraded mode that keeps passengers moving and a recovery step that restores correct accounts. See the offline slide for the rule set.', lab: ['Wide shot: the whole journey', [-8, 6, -3]] },
]

const STEP_FRAMES = JOURNEY_STEPS.length

export const buildJourney: SceneBuilder = (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  m.scene.add(Sokak(14))
  const house = House(); house.position.set(-40, 0, -6); m.scene.add(house)
  const shelter = Shelter(); shelter.position.set(-6, 0, -3.4); m.scene.add(shelter)
  const metro = MetroEntrance(); metro.position.set(18, 0, -4.4); m.scene.add(metro)
  const bus = Bus(); bus.rotation.y = Math.PI; bus.position.set(45, 0, 0); m.scene.add(bus)
  const val = Validator(); val.position.set(2.2, 0.9, 1.9); bus.add(val)
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), mat(0x2b3138, { metalness: 0.6 })); pole.position.set(2.2, 0.45, 1.85); bus.add(pole)
  const front = mark(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#ffb347'; c.font = '700 44px sans-serif'; c.fillText('32  Old Town', 10, 48) }), toneMapped: false })), 'bus-front-led'); front.position.set(4.11, 2.7, 0); front.rotation.y = Math.PI / 2; bus.add(front)
  const ramp = mark(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.4), mat(0x8a9097, { metalness: 0.6 })), 'bus-ramp'); ramp.position.set(3.4, 0.35, 1.95); ramp.rotation.x = 0.28; ramp.visible = false; bus.add(ramp)
  const inter = BusInterior(); inter.visible = false; bus.add(inter)
  const shellParts = bus.children.filter((c) => c.userData.part === 'bus-body' || c.userData.part === 'bus-window' || c.userData.part === 'bus-door')
  const hero = Person({ coat: 0x1f6f8b, id: 'character', hair: 0x2a1a12 }); hero.position.set(-40.95, 0.85, -8); hero.rotation.z = Math.PI / 2; m.scene.add(hero)
  const phone = Phone(); phone.scale.setScalar(2.2); phone.position.set(0.25, 1.15, 0.35); hero.add(phone)
  const tech = Person({ coat: 0xff7a1a, height: 1.02, id: 'technician' }); tech.position.set(-18, 0, -2.6); tech.visible = false; m.scene.add(tech)
  const wheel = Wheelchair(); wheel.position.set(-7.4, 0, -2.4); m.scene.add(wheel)
  const palette = [[0xc0392b, 0.62], [0x2e8b57, 1.0], [0x8e6e53, 0.95], [0x34495e, 1.05], [0xd4a017, 0.98], [0x6c5ce7, 0.9]] as const
  const crowd = palette.map(([c, h], i) => { const p = Person({ coat: c, height: h, skin: [0xe8bf9d, 0xc68642, 0x8d5524, 0xf1c27d][i % 4], hair: [0x222222, 0x6b4423, 0xb0b0b0][i % 3] }); p.position.set(-9.2 + i * 0.9, 0, -2.6 - (i % 2) * 0.5); m.scene.add(p); return p })
  const child = crowd[0]
  const labels: THREE.Sprite[] = JOURNEY_STEPS.map((s) => { const l = Etiket(s.lab?.[0] ?? '', 1); l.position.set(...(s.lab?.[1] ?? [0, 0, 0])); l.visible = false; m.scene.add(l); return l })
  const rings = Array.from({ length: 3 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2fd0ff).multiplyScalar(2), toneMapped: false, transparent: true })); m.scene.add(r); return r })
  const house_light = new THREE.PointLight(0xffc98a, 18, 12); house_light.position.set(-40, 2.6, -5); m.scene.add(house_light)
  const stop_light = new THREE.PointLight(0xbfe3ff, 14, 10); stop_light.position.set(-6, 3, -2.5); m.scene.add(stop_light)
  m.prepare()
  const walkers = [addWalker(m, [-12, 0, -2.2], 0.95, Math.PI / 2), addWalker(m, [-1.5, 0, -2.0], 0.9, -Math.PI / 2)]
  const vUpdate = val.userData.update as (t: number, s: { tech?: boolean; active?: boolean; result?: 'ok' | 'bad' | null }) => void
  const gate = metro.userData.gate as THREE.Object3D; const gUpdate = gate.userData.update as typeof vUpdate
  const iVal = inter.userData.validator as THREE.Object3D; const iUpdate = iVal.userData.update as typeof vUpdate
  const phoneDraw = phone.userData.draw as (t: string, r: string[]) => void; const shDraw = shelter.userData.draw as (l: string[]) => void
  let lastStep = -1
  const V = new THREE.Vector3()
  const walk = (o: THREE.Object3D, tx: number, ty: number, tz: number, k = 0.035) => { const d = Math.hypot(tx - o.position.x, tz - o.position.z); o.position.x += (tx - o.position.x) * k; o.position.z += (tz - o.position.z) * k; o.position.y += (ty - o.position.y) * 0.1; return d > 0.08 }
  return (t, step, techView) => {
    walkers.forEach((w) => w(t))
    const s = JOURNEY_STEPS[Math.min(step, STEP_FRAMES - 1)]
    if (step !== lastStep) { lastStep = step; if (s.phone) phoneDraw(...s.phone); if (s.arrival) shDraw(s.arrival) }
    // bus
    bus.position.x += ((s.busX ?? 45) - bus.position.x) * 0.03
    shellParts.forEach((p) => { p.visible = !s.inside }); inter.visible = !!s.inside; ramp.visible = !!s.ramp
    // hero: only walks; lying → standing is a rotation, not a jump
    let target: [number, number, number] = [s.who[0], 0, s.who[1]]
    if (s.inside) { V.set(-1.5, 0.7, 0.8); bus.localToWorld(V); target = [V.x, 0.7, V.z] } else if (s.lie) target = [s.who[0], 0.85, s.who[1]]
    const moving = walk(hero, target[0], target[1], target[2])
    hero.rotation.z += ((s.lie ? Math.PI / 2 : 0) - hero.rotation.z) * 0.08
    hero.rotation.y += ((moving ? Math.atan2(target[0] - hero.position.x, target[2] - hero.position.z) : 0) - hero.rotation.y) * 0.1
    ;(hero.userData.walk as (t: number, m: boolean) => void)(t, moving && !s.lie)
    phone.visible = !!s.phone
    // technician
    tech.visible = !!s.tech
    if (s.tech) { const m2 = walk(tech, -3.0, 0, -3.1, 0.03); ;(tech.userData.walk as (t: number, m: boolean) => void)(t, m2) }
    // crowd and wheelchair: sway while waiting, queue at the door when asked
    crowd.forEach((p, i) => { const q = s.queue && i < 3 && !s.inside; const mv = q ? walk(p, DOOR_X + 0.6 - i * 0.7 - 0.6, 0, -2.9 - i * 0.2, 0.02) : false; (p.userData.walk as (t: number, m: boolean) => void)(t + i, mv); if (!mv) p.rotation.z = Math.sin(t * 1.3 + i) * 0.015 })
    child.visible = !s.inside
    const wm = s.wheel ? walk(wheel, s.wheel[0], 0, s.wheel[1], 0.025) : false; void wm
    // validators: outside (bus), metro gate, inside
    const result = s.fault === 'down' ? 'bad' : s.fault === 'ok' ? 'ok' : null
    vUpdate(t, { tech: techView, active: !!s.tap && s.fault !== 'down', result })
    gUpdate(t, { tech: techView, active: step === 12, result: step === 12 ? 'ok' : null }); iUpdate(t, { tech: techView, active: false, result: null })
    // rings at whichever reader is being tapped
    const ringAt = step === 12 ? V.set(19.6, 1.3, -2.1) : s.tap ? bus.localToWorld(V.set(2.2, 1.3, 2.05)) : null
    rings.forEach((r, i) => { r.visible = !!ringAt && s.fault !== 'down'; if (ringAt) r.position.copy(ringAt); const p = (t * 0.7 + i / 3) % 1; r.scale.setScalar(1 + p * 5); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8 })
    labels.forEach((l, i) => { l.visible = techView && i === step })
    house_light.visible = step <= 2; stop_light.visible = step >= 3
  }
}
