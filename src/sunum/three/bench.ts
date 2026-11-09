import * as THREE from 'three'
import { mat, SmartCard, KartOkuyucu, VeriAkisi } from './models'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Component bench: the card and the reader on a table. Shows every Phase-2 model working with the timeline, camera, inspection and real/technical switch. */
export const BENCH_STEPS: StepDef[] = [
  { pos: [0, 1.6, 4.2], look: [0, 0.6, 0], title: 'The two parts that talk', text: 'A passive smart card (left) and a card reader (right). They never touch; they talk by radio over a few centimetres.', deep: 'Passive means the card has no battery. Everything it does is paid for by energy taken from the reader field.' },
  { pos: [-1.2, 1.0, 1.6], look: [-1.2, 0.5, 0], title: 'Inside the card', text: 'Three layers: plastic body, copper antenna coil, chip. Switch to Technical view to see the layers pulled apart.', deep: 'In a real card the coil is etched or wire-embedded between plastic layers and connected to the chip module.' },
  { pos: [1.0, 1.1, 1.8], look: [1.0, 0.45, 0.1], title: 'The reader switches on its field', text: 'The reader coil carries an alternating current at 13.56 MHz. The rings are a schematic of the invisible magnetic field.', deep: 'The reader sends commands by changing the field amplitude. The card replies by switching an internal load (load modulation).' },
  { pos: [0, 1.2, 2.6], look: [0, 0.55, 0.2], title: 'Card in the field: radio link', text: 'The card is now close. The coil gives the chip power and the two exchange bits. This radio link ends at the reader.', deep: 'What happens after the reader (cable, modem, network, fare engine, payment authorisation, settlement) is software and finance, not radio. See the other lanes in later scenes.' },
]

const FLOOR = 0xe9e4d6
export const buildBench: SceneBuilder = (m) => {
  m.scene.background = new THREE.Color(0xdbe9ee)
  const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 3), mat(FLOOR)); table.position.y = -0.05; m.scene.add(table)
  const card = SmartCard(); card.position.set(-1.2, 0.5, 0); m.scene.add(card)
  const rd = KartOkuyucu(); rd.position.set(1.0, 0, 0); m.scene.add(rd)
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.01, 8, 64), new THREE.MeshBasicMaterial({ color: 0x0e7c86, transparent: true })); r.position.set(1.0, 0.25, 0.12); m.scene.add(r); return r })
  const flow = VeriAkisi({ radio: [new THREE.Vector3(1.0, 0.25, 0.2), new THREE.Vector3(0.2, 0.4, 0.3), new THREE.Vector3(-0.4, 0.5, 0.2)] }); m.scene.add(flow.group)
  const { body, coil, chip } = card.userData.layers as Record<'body' | 'coil' | 'chip', THREE.Object3D>
  const screen = rd.userData.screen as THREE.Mesh
  return (t, step, tech) => {
    // Card slides toward the reader in steps 2-3; layers are exploded only in the technical view of step 1.
    const near = step >= 3, tx = near ? 0.35 : -1.2
    card.position.x += (tx - card.position.x) * 0.06; card.rotation.y = near ? -0.2 : 0
    const ex = tech && step === 1 ? 0.28 : 0
    coil.position.z += (0.014 + ex - coil.position.z) * 0.1; chip.position.z += (0.022 + ex * 1.8 - chip.position.z) * 0.1; body.position.z += (0 - body.position.z) * 0.1
    const fieldOn = step >= 2
    rings.forEach((r, i) => { r.visible = fieldOn; const p = (t * 0.7 + i / 4) % 1; r.scale.setScalar(1 + p * 5); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7 })
    flow.show(step === 3 ? 'radio' : null); flow.update(t)
    ;(screen.material as THREE.MeshStandardMaterial).color.set(step === 3 ? 0x35d07f : 0x2a3a44)
  }
}
