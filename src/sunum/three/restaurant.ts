import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Etiket, POS, SmartCard, Sokak, VeriAkisi, canvasTex, mark, mat, phys, type LaneKind } from './models'
import { Person } from './world'
import { skyTex } from './sky'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Photos and credits come from the tour data (read only). */
interface Fact { baslik: string; resim_dosya: string; yazar: string; lisans: string }
const FACTS = (Object.values(import.meta.glob('../../data/tour/facts.json', { eager: true, import: 'default' }))[0] ?? {}) as Record<string, Fact>
const IMGS = import.meta.glob('../../data/tour/img/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const imgUrl = (id: string) => { const f = FACTS[id]; return f ? Object.entries(IMGS).find(([k]) => k.endsWith('/' + f.resim_dosya))?.[1] : undefined }
export const MENU_IDS = ['etli-ekmek', 'ankara-tava', 'baklava'].filter((id) => FACTS[id])
const credits = MENU_IDS.map((id) => `${FACTS[id].baslik}: ${FACTS[id].yazar}, ${FACTS[id].lisans}`).join('; ')

/** Phase 5: restaurant (outside, entrance, inside, menu) then the card payment. Authorisation (permission, now) and settlement (money, later) are different lanes. SIMULATION: no real payment. */
interface RStep extends StepDef { lanes: LaneKind[]; reverse?: boolean; inside?: boolean; pos2?: string[]; tap?: boolean; waiter?: boolean; result?: 'ok'; lab: [string, [number, number, number]] }
export const RESTAURANT_STEPS: RStep[] = [
  { lanes: [], pos: [7, 3.2, 0.5], look: [0, 2.2, -9.5], title: 'Outside: a place worth visiting', text: 'Kemer Sofrası, a restored stone arcade with a blue-tiled sign and a barrel-vaulted roof. The place is fictional, the story is realistic.', deep: 'Exterior first, so the audience can place the restaurant on the street where the bus stopped.', lab: ['Restaurant sign', [0, 4.6, -9]] },
  { lanes: [], pos: [1.5, 1.8, -5.5], look: [0, 1.4, -9], title: 'The entrance', text: 'A wide door onto the pavement. A small sticker on the window tells guests that the table POS accepts the transit card (demo).', deep: 'Entrance steps are level with the pavement so wheelchairs and prams can enter.', lab: ['Entrance', [0, 3, -9]] },
  { lanes: [], inside: true, pos: [0, 3.2, -8.2], look: [0, 1.5, -16], title: 'Inside', text: 'The front wall is cut away so we can look in: stone vault, warm pendant lights, tables with guests, an open kitchen at the back.', deep: 'Camera purpose: show atmosphere and layout before any technology appears.', lab: ['Cutaway: front wall hidden', [0, 4.6, -9]] },
  { lanes: [], inside: true, pos: [2.5, 1.8, -12], look: [0, 1.2, -18.2], title: 'The open hearth', text: 'A wood fire in a stone hearth. The cook works in view of the guests; the flickering light is the main mood of the room.', deep: 'Open kitchens are a design choice that makes the food and the staff visible.', lab: ['Open wood-fired hearth', [0, 3, -18]] },
  { lanes: [], inside: true, pos: [-2.5, 2.0, -12.5], look: [-7, 2.2, -14], title: 'The menu', text: `Three dishes with photographs from the tour data. Credits: ${credits || 'photos not available in this build (placeholder shown)'}.`, deep: 'Photos keep their licence and author line. A dish with no photo shows a placeholder panel instead of an invented picture.', lab: ['Menu board', [-6.5, 3.8, -14]] },
  { lanes: [], inside: true, waiter: true, pos2: ['Total 480.00 TRY', '(SIMULATION)'], pos: [5.6, 1.9, -11.4], look: [3.5, 1.0, -14.8], title: 'The bill and the table POS', text: 'Derya asks to pay by card. The waiter brings the POS to the table so the card never leaves her hands. The POS creates a payment request for the total (demo amount).', deep: 'Payment request = amount + merchant + a unique id. This is a different application, key set and party list from the bus tap.', lab: ['Table POS', [3.5, 1.8, -14.9]] },
  { lanes: ['radio'], inside: true, tap: true, pos2: ['Hold card…'], pos: [3.0, 1.5, -12.7], look: [3.5, 1.1, -14.9], title: 'Tap: the radio link again', text: 'Same physics as before: the POS field powers the card coil, the chip wakes and proves itself. This is the only radio step; everything after it is software and finance.', deep: 'The payment application on the card differs from the transit application, so the keys and the answer the chip gives are different.', lab: ['NFC radio ends at the POS', [3.5, 1.8, -14.9]] },
  { lanes: ['data'], inside: true, pos2: ['Sending…'], pos: [14, 12, -6], look: [-2, 4, -30], title: 'Data leaves the POS', text: 'The POS sends a signed authorisation request over the internet to the payment processor behind the restaurant. From here it is software data, not radio.', deep: 'Payment data is encrypted and the sensitive card values never appear in plain text on the network.', lab: ['Payment processor', [-9, 6.5, -45]] },
  { lanes: ['auth'], inside: true, pos2: ['Authorising…'], pos: [-2, 10, -34], look: [0, 4, -45], title: 'Authorisation: permission, now', text: 'The processor asks the card network, which asks the issuer. The issuer checks the balance and says yes. Authorisation is only permission to charge; no money has moved yet.', deep: 'SIMULATION: the issuer here is the FORADAŞ account. Authorisation reserves the amount; capture, clearing and settlement follow.', lab: ['Issuer says yes (SIMULATION)', [9, 6.5, -45]] },
  { lanes: ['data', 'auth'], reverse: true, inside: true, result: 'ok', pos2: ['APPROVED', '480.00 TRY'], pos: [3.2, 1.7, -12.3], look: [3.5, 1.0, -14.9], title: 'Approved', text: 'The answer comes back along the same chain in about a second. The POS shows APPROVED and the guest gets a receipt. The money has not arrived at the restaurant yet.', deep: 'Latency budget: radio exchange, request to processor, network hop, issuer decision and back: roughly one second end to end in this simulation.', lab: ['APPROVED', [3.5, 1.8, -14.9]] },
  { lanes: ['settle'], inside: true, pos2: ['Receipt printed'], pos: [0, 14, -26], look: [0, 3, -40], title: 'Settlement: money, later', text: 'Overnight, clearing exchanges the details and settlement moves the funds between the parties (grey lane). Reconciliation then checks that every approved payment has a matching transfer.', deep: 'Clearing = exchange of transaction details; settlement = transfer of funds; reconciliation = checking both sides agree. Refunds, reversals and chargebacks are separate flows.', lab: ['Settlement later (batch)', [0, 8, -45]] },
]

export const buildRestaurant = (offset: number): SceneBuilder => (m) => {
  const sky = skyTex(); if (sky) m.scene.background = sky
  m.scene.add(Sokak(0))
  const R = new THREE.Group(); R.position.set(0, 0, -14); m.scene.add(R)
  const stone = mat(0xcbb79a, { roughness: 0.9 })
  const box = (w: number, h: number, d: number, mm: THREE.Material, x: number, y: number, z: number) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); b.position.set(x, y, z); R.add(b); return b }
  box(14.4, 0.2, 10.4, mat(0x8a6f55, { roughness: 0.6 }), 0, 0.1, 0)
  box(14, 4.2, 0.4, stone, 0, 2.1, -5); box(0.4, 4.2, 10, stone, -7, 2.1, 0); box(0.4, 4.2, 10, stone, 7, 2.1, 0)
  const front = new THREE.Group(); R.add(front)
  for (const x of [-4.1, 4.1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(5.8, 4.2, 0.4), stone); w.position.set(x, 2.1, 5); front.add(w) }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.4), stone); lintel.position.set(0, 3.6, 5); front.add(lintel)
  const signTex = canvasTex(512, 128, (c) => { c.fillStyle = '#2a5d9c'; c.fillRect(0, 0, 512, 128); c.strokeStyle = '#e8c27a'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 116); c.fillStyle = '#fff'; c.font = '700 54px serif'; c.textAlign = 'center'; c.fillText('Kemer Sofrası', 256, 82) })
  const sign = mark(new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })), 'restaurant-sign'); sign.position.set(0, 4.6, 5.25); front.add(sign)
  const vault = mark(new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 10.4, 28, 1, true, Math.PI / 2, Math.PI), mat(0xb9a688, { side: THREE.DoubleSide, roughness: 0.95 })), 'restaurant-vault'); vault.rotation.x = Math.PI / 2; vault.position.y = 4.2; R.add(vault)
  for (let z = -4; z <= 4; z += 2) { const rib = new THREE.Mesh(new THREE.TorusGeometry(7, 0.14, 8, 28, Math.PI), mat(0x8c7a5f)); rib.position.set(0, 4.2, z); R.add(rib) }
  // neighbours so the street is not empty
  for (const [x, h] of [[-12, 9], [12.5, 11], [-20, 12], [21, 8]] as const) { const b = new THREE.Mesh(new THREE.BoxGeometry(9, h, 10), mat(0xe2cfb0)); b.position.set(x, h / 2, 0); R.add(b) }
  // hearth with animated fire
  const hearth = mark(new THREE.Group(), 'restaurant-hearth'); const hb = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 1.2), mat(0x6b5d50, { roughness: 1 })); hb.position.y = 0.9
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a1a).multiplyScalar(2.2), toneMapped: false })); fire.position.set(0, 1.0, 0.25); hearth.add(hb, fire); hearth.position.set(0, 0, -4.2); R.add(hearth)
  const fl = new THREE.PointLight(0xff8a30, 25, 12); fl.position.set(0, 1.6, -3.4); R.add(fl)
  const cook = Person({ coat: 0xf2efe8, height: 1.0, id: 'crowd' }); cook.position.set(1.8, 0.2, -3.4); R.add(cook)
  // menu board with licensed photos
  const board = mark(new THREE.Group(), 'menu-board'); board.position.set(-6.75, 2.4, 0); board.rotation.y = Math.PI / 2; R.add(board)
  board.add(new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.2, 0.1), mat(0x2b2f36)))
  const loader = new THREE.TextureLoader()
  MENU_IDS.forEach((id, i) => {
    const mm = new THREE.MeshBasicMaterial({ color: 0x555b63 }); const url = imgUrl(id)
    if (url) loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; mm.map = t; mm.color.set(0xffffff); mm.needsUpdate = true })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), mm); p.position.set(-1.8 + i * 1.8, 0.2, 0.06); board.add(p)
    const cap = Etiket(FACTS[id]?.baslik ?? 'Placeholder', 0.5); cap.position.set(-1.8 + i * 1.8, -0.7, 0.1); cap.visible = true; board.add(cap)
  })
  // tables and guests
  const tables: [number, number][] = [[-4, 1], [-4, -2.2], [0, -0.8], [3.5, -0.5], [-0.5, 3]]
  const seat = (p: THREE.Object3D) => { p.position.y = 0.3; p.children.slice(3).forEach((c) => { c.visible = false }) }
  tables.forEach(([x, z], i) => {
    const t = mark(new THREE.Group(), 'restaurant-table'); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 20), mat(0x8a6a4a)); top.position.y = 0.78; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.78, 8), mat(0x2b3138)); leg.position.y = 0.39; t.add(top, leg); t.position.set(x, 0.2, z); R.add(t)
    const g = Person({ coat: [0xc0392b, 0x2e8b57, 0x8e6e53, 0x34495e, 0x6c5ce7][i], height: 0.97 + (i % 3) * 0.04, skin: [0xe8bf9d, 0xc68642, 0x8d5524][i % 3] }); g.position.set(x - 0.9, 0.2, z); seat(g); R.add(g)
  })
  const hero = Person({ coat: 0x1f6f8b, id: 'character', hair: 0x2a1a12 }); hero.position.set(3.5 + 0.9, 0.2, -0.5); seat(hero); R.add(hero)
  const waiter = mark(Person({ coat: 0x1a1a1a, height: 1.02, id: 'waiter' }), 'waiter'); waiter.position.set(-5.5, 0.2, -3.5); R.add(waiter)
  const counter = box(3, 1.1, 0.8, mat(0x6a4a30), -5.5, 0.75, -4.2); void counter
  for (const [x, z] of [[-3, 0], [3, 1.5], [0, -2.5], [-5, -1]] as const) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(2.5), toneMapped: false })); l.position.set(x, 3.4, z); R.add(l) }
  const pl = new THREE.PointLight(0xffd9a0, 18, 10); pl.position.set(0, 3.2, 0); R.add(pl); const pl2 = pl.clone(); pl2.position.set(4, 3.2, 0); R.add(pl2)
  // POS on Derya's table, with a drawn screen
  const pos = POS(); pos.position.set(3.5, 1.02, -0.9); R.add(pos); pos.visible = false
  const posTex = canvasTex(256, 128, () => {}); const posCv = posTex?.image as HTMLCanvasElement | undefined
  const posScr = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), new THREE.MeshBasicMaterial({ map: posTex, toneMapped: false })); posScr.position.set(0, 0.06, -0.15); posScr.rotation.x = -Math.PI / 2 - 0.3; pos.add(posScr)
  const draw = (lines: string[], ok: boolean) => { const x = posCv?.getContext('2d'); if (!x || !posCv || !posTex) return; x.fillStyle = ok ? '#0b5a30' : '#0d2029'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#fff'; x.font = '700 30px sans-serif'; lines.forEach((l, i) => x.fillText(l, 12, 48 + i * 38)); posTex.needsUpdate = true }
  const card = SmartCard(); card.scale.setScalar(0.55); card.position.set(3.5, 1.35, -0.9); card.rotation.x = -1.2; R.add(card)
  const P = THREE.Vector3
  const back = [['Payment processor', 0x1f5fa8, -9, 'pay-processor'], ['Card network', 0x0e7c86, 0, 'pay-network'], ['Issuer (FORADAŞ account)', 0x7b5cc4, 9, 'pay-issuer']] as const
  const labels: THREE.Sprite[] = []
  back.forEach(([, col, x, id]) => { const b = mark(new THREE.Mesh(new RoundedBoxGeometry(3, 4, 3, 4, 0.25), phys(0x101c2e, { roughness: 0.25, metalness: 0.5, clearcoat: 1, emissive: col, emissiveIntensity: 0.2 })), id); b.position.set(x, 2, -45); m.scene.add(b) })
  RESTAURANT_STEPS.forEach((s) => { const l = Etiket(s.lab[0], 0.9); l.position.set(...s.lab[1]); l.visible = false; m.scene.add(l); labels.push(l) })
  const flow = VeriAkisi({
    radio: [new P(3.5, 1.35, -14.9), new P(3.5, 1.2, -14.9), new P(3.5, 1.08, -14.9)],
    data: [new P(3.5, 1.1, -14.9), new P(3.5, 7, -17), new P(-2, 10, -30), new P(-9, 4.2, -43.5)],
    auth: [new P(-9, 4.2, -45), new P(0, 4.6, -45), new P(9, 4.2, -45)],
    settle: [new P(9, 4.5, -45), new P(0, 7, -45), new P(-9, 6, -45), new P(-4, 9, -30), new P(3.5, 1.4, -14.9)],
  })
  m.scene.add(flow.group)
  const glow = new THREE.PointLight(0x6aa8ff, 25, 30); glow.position.set(0, 8, -40); m.scene.add(glow)
  m.prepare()
  let last = -1; const walkTo = (o: THREE.Object3D, x: number, z: number, k = 0.03) => { const d = Math.hypot(x - o.position.x, z - o.position.z); o.position.x += (x - o.position.x) * k; o.position.z += (z - o.position.z) * k; return d > 0.08 }
  return (t, rel, tech) => {
    const step = rel + offset; const s = RESTAURANT_STEPS[step]
    if (step !== last) { last = step; draw(s.pos2 ?? [''], s.result === 'ok') }
    front.visible = !s.inside; pos.visible = !!s.waiter || !!s.pos2
    fire.scale.set(1 + 0.15 * Math.sin(t * 11), 1 + 0.25 * Math.sin(t * 7 + 1), 1); fl.intensity = 22 + 6 * Math.sin(t * 9)
    const mv = walkTo(waiter, s.waiter || s.pos2 ? 4.3 : -5.5, s.waiter || s.pos2 ? -0.6 : -3.5)
    ;(waiter.userData.walk as (t: number, m: boolean) => void)(t, mv)
    card.visible = !!s.tap || step >= 6 && step <= 9
    card.position.y += ((s.tap ? 1.12 : 1.35) - card.position.y) * 0.08
    card.userData.xray(!!s.tap)
    flow.show(s.lanes, !!s.reverse); flow.update(t)
    labels.forEach((l, i) => { l.visible = tech && i === step })
  }
}
