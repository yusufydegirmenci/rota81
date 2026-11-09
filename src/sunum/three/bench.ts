import * as THREE from 'three'
import { SmartCard, KartOkuyucu, VeriAkisi, Hand, mat, phys, woodTexture } from './models'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Component bench (H1/H3 look): wooden desk, black NFC reader with RGB edge LED, blue metallic card held by a hand. Technical view makes the card glassy and pulls its layers apart. */
export const BENCH_STEPS: StepDef[] = [
  { pos: [0.4, 1.5, 3.4], look: [0, 0.3, 0], title: 'The two parts that talk', text: 'A passive smart card (blue) and a desk reader (black). They never touch; they talk by radio over a few centimetres.', deep: 'Passive means the card has no battery. Everything it does is paid for by energy taken from the reader field.' },
  { pos: [-1.0, 1.2, 1.9], look: [-1.1, 0.7, 0], title: 'Inside the card', text: 'Switch to Technical view: the card turns glassy and its layers pull apart. Gold chip pad on one layer, copper antenna coil on the next, plastic body underneath.', deep: 'In a real card the coil is etched or wire-embedded between plastic layers and connected to the chip module.' },
  { pos: [1.2, 1.1, 1.9], look: [1.1, 0.15, 0.2], title: 'The reader switches on its field', text: 'The reader coil under the NFC circle carries an alternating current at 13.56 MHz. The blue rings are a schematic of the invisible magnetic field; the LED edge breathes while it waits.', deep: 'The reader sends commands by changing the field amplitude. The card replies by switching an internal load (load modulation).' },
  { pos: [0.6, 1.0, 1.8], look: [0.6, 0.25, 0.2], title: 'Card in the field: radio link', text: 'The card is now close. The coil gives the chip power and the two exchange bits; the LED turns green when the exchange succeeds. This radio link ends at the reader.', deep: 'What happens after the reader (cable, modem, network, fare engine, payment authorisation, settlement) is software and finance, not radio. See the other lanes in later scenes.' },
]

export const buildBench: SceneBuilder = (m) => {
  m.scene.background = new THREE.Color(0x120d0a); if (m.scene.fog) (m.scene.fog as THREE.Fog).color.set(0x120d0a)
  const wood = woodTexture(); if (wood) { wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(2, 1) }
  const table = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 4), phys(0xffffff, { map: wood, roughness: 0.45, clearcoat: 0.3 })); table.position.y = -0.1; m.scene.add(table)
  const kb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.7), mat(0x14171b)); kb.position.set(-1.4, 0.06, -1.3); m.scene.add(kb)
  const card = SmartCard(); card.position.set(-1.1, 0.8, 0); card.rotation.x = -0.35; m.scene.add(card)
  const hand = Hand(); hand.position.set(0.05, -0.02, 0); card.add(hand)
  const rd = KartOkuyucu(); rd.position.set(1.1, 0, 0); m.scene.add(rd)
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.01, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2fd0ff).multiplyScalar(2), toneMapped: false, transparent: true })); r.rotation.x = Math.PI / 2; r.position.set(1.1, 0.25, 0.0); m.scene.add(r); return r })
  const flow = VeriAkisi({ radio: [new THREE.Vector3(1.1, 0.3, 0), new THREE.Vector3(0.5, 0.45, 0), new THREE.Vector3(0, 0.55, 0)] }); m.scene.add(flow.group)
  const lamp = new THREE.SpotLight(0xffd9a8, 90, 14, 0.7, 0.6); lamp.position.set(0, 5, 3); lamp.target.position.set(0, 0, 0); m.scene.add(lamp, lamp.target)
  m.prepare()
  const { body, coil, chip } = card.userData.layers as Record<'body' | 'coil' | 'chip', THREE.Object3D>
  const update = rd.userData.update as (t: number, s: { tech?: boolean; active?: boolean; result?: 'ok' | 'bad' | null }) => void
  return (t, step, tech) => {
    const near = step >= 3; const tx = near ? 0.75 : -1.1, ty = near ? 0.32 : 0.8
    card.position.x += (tx - card.position.x) * 0.06; card.position.y += (ty - card.position.y) * 0.06; card.rotation.x += ((near ? -Math.PI / 2 + 0.05 : -0.35) - card.rotation.x) * 0.06
    const ex = tech && step === 1
    card.userData.xray(tech)
    const k = 0.1; const lz = (o: THREE.Object3D, z: number) => { o.position.z += (z - o.position.z) * k }
    lz(body, 0); lz(coil, ex ? 0.22 : 0); lz(chip, ex ? 0.4 : 0.002)
    hand.visible = !tech
    const fieldOn = step >= 2
    rings.forEach((r, i) => { r.visible = fieldOn; const p = (t * 0.7 + i / 4) % 1; r.scale.setScalar(1 + p * 4); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8 })
    flow.show(step === 3 ? 'radio' : null); flow.update(t)
    update(t, { tech, active: fieldOn, result: step === 3 ? 'ok' : null })
  }
}
