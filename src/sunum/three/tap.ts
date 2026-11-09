import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Bus, Etiket, Hand, Karakter, Sokak, SmartCard, Validator, VeriAkisi, mark, mat, phys, type LaneKind } from './models'
import { skyTex } from './sky'
import type { PartId } from './registry'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Phase 3: the card tap, step by step. Each step = one camera shot + one idea. Lanes keep radio, software data, fare validation, authorisation and settlement visually separate. */
interface TapStep extends StepDef { lanes: LaneKind[]; reverse?: boolean; field?: boolean; coilGlow?: boolean; chipOn?: boolean; xray?: boolean; result?: 'ok'; label?: number }

export const TAP_STEPS: TapStep[] = [
  { lanes: [], pos: [-9, 3.2, 12], look: [0, 1.2, 1], title: 'Street: where the story happens', text: 'Bus 12 stands at stop 0417. Derya waits at the front door, where the validator is mounted.', deep: 'Camera purpose: set the place first. Every later close-up returns to this street so the viewer never loses where they are.' },
  { lanes: [], pos: [4.6, 2.2, 6], look: [2.2, 1.4, 2], title: 'The validator at the door', text: 'The validator sits at hand height beside the entrance so every boarding passenger passes within reach of its antenna. Its edge LED shows the state from a distance.', deep: 'Placement is a design decision: too high or too low and tap time grows, because the coupling distance is only a few centimetres.' },
  { lanes: [], field: true, label: 0, pos: [3.6, 1.8, 4.4], look: [2.2, 1.3, 2.1], title: 'The reader switches on its field', text: 'The reader coil (under the NFC circle) carries 13.56 MHz current and creates an alternating magnetic field (blue rings, schematic). Nothing is sent yet; the reader is asking "is anyone there?".', deep: 'The field is invisible and reaches only about 4 cm. The rings are a drawing aid (DESIGN), not a measurement.' },
  { lanes: [], field: true, coilGlow: true, xray: true, label: 1, pos: [3.2, 1.6, 4.0], look: [2.2, 1.3, 2.3], title: 'The card coil harvests energy', text: 'The card turns glassy (X-ray, a drawing aid): inside is the copper antenna coil. The field crosses it and Faraday induction creates a voltage. Rectified, that voltage powers the chip. The card has no battery.', deep: 'Energy transfer is the only reason a battery-less card can compute. The coil and a small capacitor form a circuit tuned near 13.56 MHz.' },
  { lanes: [], field: true, coilGlow: true, chipOn: true, xray: true, label: 2, pos: [2.9, 1.5, 3.8], look: [2.0, 1.3, 2.3], title: 'The chip wakes up', text: 'Powered by the coil, the chip (gold pad) starts its operating system and waits for commands. It will select the transit application, authenticate itself with a diversified key and return its record.', deep: 'Diversified key: every card derives its own key from a master key and its serial number, so a leaked card key does not open other cards.' },
  { lanes: ['radio'], field: true, coilGlow: true, chipOn: true, xray: true, pos: [3.8, 1.9, 4.5], look: [2.2, 1.3, 2.1], title: 'Radio conversation', text: 'The reader sends bits by changing the field amplitude. The card answers by switching an internal load, which slightly changes the reader field. Two directions, two modulation methods.', deep: 'This is the only radio step in the whole chain. After the validator, nothing is radio communication with the card any more.' },
  { lanes: ['data'], label: 3, pos: [-1.5, 3.8, 6.5], look: [-0.5, 2.4, 1.2], title: 'Data leaves the radio and enters the network', text: 'The validator passes a signed request to the vehicle computer by cable. A modem with a roof antenna sends it over the mobile network. From here it is software data, no longer radio communication with the card.', deep: 'Software data flow: cable inside the bus, then 4G/5G to the backend gateway. Different medium, different security (TLS, signatures) from the card radio link.' },
  { lanes: ['fee'], label: 4, pos: [-5, 9, 27], look: [-6, 4, 14], title: 'The backend validates the fare', text: 'The gateway passes the request to the fare engine. It applies the tariff, the transfer window and the trip history and decides the price. This is fare validation, not NFC.', deep: 'Fare validation answers "how much?". It is a rules engine and does not move money.' },
  { lanes: ['auth', 'settle'], label: 5, pos: [-3, 8, 27], look: [-2, 4, 14], title: 'Authorisation now, settlement later', text: 'The account service checks the balance and authorises the charge (purple). Real money moves between the parties later, in a batch (grey). These are two different things.', deep: 'SIMULATION: no real payment happens in this deck. Authorisation = permission to charge; settlement = later reconciliation between operators and banks.' },
  { lanes: ['data'], reverse: true, result: 'ok', pos: [4.4, 1.9, 4.6], look: [2.2, 1.4, 2], title: 'The answer returns to the passenger', text: 'The decision travels back in a few hundred milliseconds. The LED and screen turn green and the buzzer beeps once. The passenger sees one result for a long chain of events.', deep: 'Total round trip is typically well under a second online. Offline operation (a later scene) uses a local rule set instead.' },
  { lanes: [], result: 'ok', pos: [-9, 3.2, 12], look: [0, 1.2, 1], title: 'Back to the real world', text: 'Derya boards. For her, nothing visible happened except a green light and a beep. Everything else was invisible infrastructure.', deep: 'Camera purpose: return to the opening shot to close the loop between the technical chain and the human moment.' },
]


export const buildTap: SceneBuilder = (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  m.scene.add(Sokak())
  const bus = Bus(); m.scene.add(bus)
  const val = Validator(); val.position.set(2.2, 0.9, 1.9); m.scene.add(val)
  const pole = mark(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), mat(0x2b3138, { metalness: 0.6 })), 'reader-pole'); pole.position.set(2.2, 0.45, 1.85); m.scene.add(pole)
  const card = SmartCard(); card.position.set(2.2, 1.3, 2.4); card.scale.setScalar(0.75); m.scene.add(card)
  const hand = Hand(); hand.position.set(0.05, -0.02, 0); card.add(hand)
  const person = Karakter(); person.position.set(3.3, 0, 3.4); m.scene.add(person)
  // Backend: dark glass blocks with a faint glow (colour = role), each clickable.
  const specs: [string, PartId, number][] = [['API gateway', 'backend-gateway', 0x2fd0ff], ['Fare engine', 'backend-fare', 0xffd23a], ['Account service', 'backend-account', 0xa77cff], ['Ledger DB', 'backend-ledger', 0xff7a35]]
  const pad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 9), mat(0x0d1a24, { roughness: 0.4, metalness: 0.5 })); pad.position.set(-6, 0.05, 14); m.scene.add(pad)
  specs.forEach(([, id, col], i) => { const h = 3 + i * 0.8; const b = mark(new THREE.Mesh(new RoundedBoxGeometry(2.4, h, 2.4, 4, 0.2), phys(0x101c2e, { roughness: 0.25, metalness: 0.5, clearcoat: 1, emissive: col, emissiveIntensity: 0.18 })), id); b.position.set(-12 + i * 4, h / 2 + 0.1, 14); m.scene.add(b) })
  const labels: THREE.Sprite[] = []
  const mk = (t: string, p: [number, number, number]) => { const l = Etiket(t, 0.9); l.position.set(...p); m.scene.add(l); labels.push(l) }
  mk('Reader coil', [2.2, 2.4, 2.2]); mk('Card coil (antenna)', [1.2, 2.0, 2.6]); mk('Chip', [1.5, 1.0, 2.6]); mk('Vehicle computer + modem', [-1.8, 4.4, 1.5]); mk('Fare engine', [-8, 6.2, 14]); mk('Account service', [-4, 6.6, 14])
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2fd0ff).multiplyScalar(2), toneMapped: false, transparent: true })); r.position.set(2.2, 1.3, 2.05); m.scene.add(r); return r })
  const P = THREE.Vector3
  const flow = VeriAkisi({
    radio: [new P(2.2, 1.3, 2.35), new P(2.2, 1.3, 2.2), new P(2.2, 1.3, 2.03)],
    data: [new P(2.2, 0.85, 1.75), new P(1.0, 1.6, 1.4), new P(-1.8, 2.3, 0.8), new P(-1.8, 3.4, 0.2), new P(-8, 9, 8), new P(-12, 5, 13)],
    fee: [new P(-12, 4.4, 12.6), new P(-8, 4.9, 12.6), new P(-4, 5.4, 12.6)],
    auth: [new P(-4, 5.4, 12.6), new P(0, 5.6, 12.6)],
    settle: [new P(0, 5.6, 13), new P(6, 7, 16), new P(14, 9, 20)],
  })
  m.scene.add(flow.group)
  const spot = new THREE.PointLight(0xffffff, 4, 6); spot.position.set(3.4, 2.4, 3.2); m.scene.add(spot)
  const glow = new THREE.PointLight(0x6aa8ff, 25, 20); glow.position.set(-6, 8, 16); m.scene.add(glow)
  m.prepare()
  const { coil, chip } = card.userData.layers as Record<'coil' | 'chip', THREE.Mesh>
  const update = val.userData.update as (t: number, s: { tech?: boolean; active?: boolean; result?: 'ok' | 'bad' | null }) => void
  return (t, step, tech) => {
    const s = TAP_STEPS[step]
    rings.forEach((r, i) => { r.visible = !!s.field; const p = (t * 0.7 + i / 4) % 1; r.scale.setScalar(1 + p * 5); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8 * (step === 5 ? 0.6 + 0.4 * Math.sin(t * 20) : 1) })
    card.visible = step >= 2 && step <= 5 || step === 9
    card.position.z += ((step >= 3 && step <= 5 ? 2.2 : 2.4) - card.position.z) * 0.08
    card.userData.xray(!!s.xray || (tech && card.visible))
    ;(coil.children as THREE.Mesh[]).forEach((c) => (c.material as THREE.MeshStandardMaterial).emissive.set(s.coilGlow ? 0xff8a1a : 0x000000))
    ;(chip.material as THREE.MeshStandardMaterial).emissive.set(s.chipOn ? 0x66ff99 : 0x000000); chip.scale.setScalar(s.chipOn ? 1.15 + 0.1 * Math.sin(t * 6) : 1)
    labels.forEach((l, i) => { l.visible = tech && s.label === i })
    hand.visible = !tech && !s.xray; person.visible = !tech || step === 0 || step === 10
    flow.show(s.lanes, !!s.reverse); flow.update(t)
    update(t, { tech, active: !!s.field, result: s.result ?? null })
  }
}
