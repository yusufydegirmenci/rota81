import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/** Each camera shot explains one thing. `look` is the point the camera watches; `pos` is where it stands. */
export interface Shot { pos: [number, number, number]; look: [number, number, number]; title: string; text: string }
export const TAP_SHOTS: Shot[] = [
  { pos: [-9, 3.2, 9], look: [0, 1.2, 0], title: 'Street: where the story happens', text: 'Bus 12 stands at stop 0417. Derya waits at the front door, where the validator is mounted.' },
  { pos: [2.2, 2.2, 3.8], look: [2.2, 1.7, 0.4], title: 'The validator at the door', text: 'The validator sits at hand height beside the entrance so every boarding passenger passes within reach of its antenna.' },
  { pos: [2.5, 2.1, 1.7], look: [2.2, 1.8, 0.3], title: 'The reader switches on its field', text: 'The reader coil carries 13.56 MHz current and creates an alternating magnetic field (teal rings). Nothing is sent yet; the reader is asking "is anyone there?".' },
  { pos: [2.1, 1.85, 1.1], look: [2.1, 1.8, 0.5], title: 'The card coil harvests energy', text: 'The field crosses the copper coil inside the card. Faraday induction creates a voltage in it. That voltage, rectified, powers the chip. The card has no battery.' },
  { pos: [2.0, 1.85, 0.78], look: [2.0, 1.8, 0.5], title: 'The chip wakes up', text: 'Powered by the coil, the chip starts its operating system and waits for commands. It will select the transit application, authenticate itself with a diversified key and return its record.' },
  { pos: [2.6, 2.0, 1.4], look: [2.0, 1.8, 0.4], title: 'Radio conversation', text: 'The reader sends bits by changing the field amplitude. The card answers by switching an internal load, which slightly changes the reader field. Two different directions, two different modulation methods.' },
  { pos: [-2.4, 3.2, 4.4], look: [-1.8, 2.2, 0.6], title: 'Data leaves the radio and enters the network', text: 'The validator passes a signed request to the vehicle computer by cable. A modem with a roof antenna sends it over the mobile network. From here it is software data, no longer radio communication with the card.' },
  { pos: [-4, 9, 22], look: [-4, 7, 10], title: 'The backend decides', text: 'The gateway, fare engine, account service and ledger decide the fare and record it. This is fare validation and account authorisation, not NFC. Settlement with operators happens later.' },
  { pos: [3.2, 2.4, 2.8], look: [2.2, 1.8, 0.3], title: 'The answer returns to the passenger', text: 'The decision travels back in a few hundred milliseconds. The screen turns green and the buzzer beeps once. The passenger sees one result for a long chain of events.' },
]

const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1, ...o })
const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)

function label(text: string, scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96
  const g = c.getContext('2d')!; g.fillStyle = 'rgba(13,32,41,.82)'; g.beginPath(); g.roundRect(4, 4, 504, 88, 18); g.fill()
  g.fillStyle = '#fff'; g.font = '600 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }))
  s.scale.set(2.6 * scale, 0.49 * scale, 1); s.renderOrder = 10
  return s
}

function buildWorld() {
  const w = new THREE.Group()
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(0x4a5560)); ground.rotation.x = -Math.PI / 2; w.add(ground)
  const walk = box(120, 0.12, 5, mat(0xd8d2c4)); walk.position.set(0, 0.06, -4.5); w.add(walk)
  for (let i = -10; i < 10; i++) { const l = box(1.4, 0.02, 0.18, mat(0xf4f0e6)); l.position.set(i * 3, 0.011, 5); w.add(l) }
  // buildings: consistent with the SVG street (bakery, café, books, florist)
  const cols = [0xe8d5b5, 0xd9b99b, 0xc9d8d3, 0xecc9a8]
  for (let i = 0; i < 9; i++) { const h = 6 + (i % 4) * 2.4; const b = box(5.2, h, 5, mat(cols[i % 4])); b.position.set(-20 + i * 5.6, h / 2, -9); w.add(b); for (let k = 0; k < 3; k++) { const win = box(0.9, 1.1, 0.06, mat(0xfff0cf, { emissive: 0x332200 })); win.position.set(-21.4 + i * 5.6 + k * 1.5 + 0.6, 3 + (i % 3), -6.45); w.add(win) } }
  // bus
  const bus = new THREE.Group()
  const body = box(8.2, 2.7, 2.5, mat(0xef5f26)); body.position.set(0, 1.75, 0); bus.add(body)
  const stripe = box(8.22, 0.35, 2.52, mat(0xc44a18)); stripe.position.set(0, 0.95, 0); bus.add(stripe)
  for (let i = 0; i < 4; i++) { const wd = box(1.3, 0.95, 0.06, mat(0xcfeaee, { roughness: 0.1, metalness: 0.3 })); wd.position.set(-2.6 + i * 1.75, 2.0, 1.27); bus.add(wd) }
  const door = box(1.0, 2.2, 0.06, mat(0xcfeaee, { roughness: 0.1 })); door.position.set(3.4, 1.4, 1.27); bus.add(door)
  for (const x of [-2.5, 2.4]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 24), mat(0x14323f)); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.55, 1.2); bus.add(wh) }
  const roofAnt = box(0.5, 0.2, 0.3, mat(0x222a31)); roofAnt.position.set(-1.8, 3.2, 0); bus.add(roofAnt)
  const pc = box(0.7, 0.45, 0.5, mat(0x2f3d49)); pc.position.set(-1.8, 2.2, 0.5); bus.add(pc)
  bus.position.set(0, 0, 1); w.add(bus)
  // validator on a pole by the door (outside view, for clarity of the lesson)
  const val = new THREE.Group()
  const pole = box(0.12, 1.6, 0.12, mat(0x14323f)); pole.position.y = 0.8; val.add(pole)
  const head = box(0.9, 1.0, 0.35, mat(0x0d2029)); head.position.y = 1.9; val.add(head)
  const screen = box(0.65, 0.34, 0.02, mat(0x35d07f, { emissive: 0x0b3a22 })); screen.position.set(0, 2.2, 0.19); val.add(screen); (val as THREE.Group & { screen?: THREE.Mesh }).screen = screen
  const pad = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 12, 40), mat(0xe8c27a, { metalness: 0.6 })); pad.position.set(0, 1.78, 0.2); val.add(pad)
  val.position.set(2.2, 0, 1.9); w.add(val)
  return { w, val, screen, bus, pc, roofAnt }
}

function buildCard() {
  const g = new THREE.Group()
  const body = box(0.85, 0.54, 0.02, mat(0x0f1f3d)); g.add(body)
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.05, 0.008, 8, 48), mat(0xe8c27a, { metalness: 0.8, roughness: 0.3 })); t.scale.set(1.4, 1, 1); t.position.z = 0.013; g.add(t) }
  const chip = box(0.12, 0.12, 0.02, mat(0x2a2f36, { metalness: 0.7 })); chip.position.z = 0.02; g.add(chip)
  return { g, chip }
}

function buildCloud() {
  const g = new THREE.Group(); const items = ['API gateway', 'Fare engine', 'Account service', 'Ledger DB']
  items.forEach((n, i) => { const b = box(2.4, 3 + i * 0.8, 2.4, mat([0x0e7c86, 0x1f5fa8, 0x7b5cc4, 0xb8741a][i], { emissive: 0x050a10 })); b.position.set(-12 + i * 4, (3 + i * 0.8) / 2, 10); g.add(b); const l = label(n, 0.9); l.position.set(-12 + i * 4, 5.6 + i * 0.8, 10); g.add(l) })
  return g
}

export function Stage3D({ shot, quality, onUnavailable }: { shot: number; quality: 'auto' | 'low' | 'high'; onUnavailable?: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const target = useRef(shot); target.current = shot
  const [ok, setOk] = useState(true)
  useEffect(() => {
    const el = host.current; if (!el) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: false }) } catch { setOk(false); onUnavailable?.(); return }
    const dpr = quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5)
    renderer.setPixelRatio(dpr); renderer.shadowMap.enabled = false
    el.appendChild(renderer.domElement); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; renderer.domElement.setAttribute('aria-label', '3D scene of a bus validator, card and network')
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfe8ee); scene.fog = new THREE.Fog(0xcfe8ee, 30, 90)
    const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 200)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0a8, 1.1)); const sun = new THREE.DirectionalLight(0xffe2b0, 1.6); sun.position.set(-8, 14, 10); scene.add(sun)
    const { w, val, screen } = buildWorld(); scene.add(w)
    const { g: card, chip } = buildCard(); card.position.set(2.0, 1.8, 0.5); card.scale.setScalar(1); scene.add(card)
    const cloud = buildCloud(); scene.add(cloud)
    const rings: THREE.Mesh[] = []
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: 0x0e7c86, transparent: true, opacity: 0.7 })); r.position.set(2.2, 1.78, 0.22); scene.add(r); rings.push(r) }
    const lab = [label('Reader coil'), label('Card coil (antenna)'), label('Chip'), label('Vehicle computer'), label('Modem + antenna')]
    lab[0].position.set(2.2, 2.7, 0.5); lab[1].position.set(1.2, 2.3, 0.6); lab[2].position.set(2.0, 1.45, 0.6); lab[3].position.set(-1.8, 3.5, 1.6); lab[4].position.set(-1.8, 4.3, 1.0); lab.forEach((l) => scene.add(l))
    const pkt = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: 0xef5f26 })); scene.add(pkt)
    const path = [new THREE.Vector3(2.2, 1.8, 0.4), new THREE.Vector3(1.2, 2.1, 1.2), new THREE.Vector3(-1.8, 2.3, 1.5), new THREE.Vector3(-1.8, 3.3, 1.0), new THREE.Vector3(-8, 9, 8), new THREE.Vector3(-12, 3, 10), new THREE.Vector3(-8, 3.5, 10), new THREE.Vector3(-4, 4, 10), new THREE.Vector3(0, 4.5, 10)]
    const curve = new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.1)

    const S = TAP_SHOTS
    const camPos = new THREE.Vector3(...S[shot].pos), camLook = new THREE.Vector3(...S[shot].look)
    const fromPos = camPos.clone(), fromLook = camLook.clone(); let t0 = performance.now(), cur = shot
    const resize = () => { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(r.height, 1); cam.updateProjectionMatrix() }
    resize(); const ro = new ResizeObserver(resize); ro.observe(el)
    let raf = 0, alive = true
    const ease = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
    const loop = (now: number) => {
      if (!alive) return
      if (cur !== target.current) { cur = target.current; fromPos.copy(cam.position); fromLook.copy(camLook); t0 = now; camPos.set(...S[cur].pos); camLook.set(...S[cur].look) }
      const k = ease(Math.min(1, (now - t0) / 1600))
      cam.position.lerpVectors(fromPos, camPos, k); const look = new THREE.Vector3().lerpVectors(fromLook, camLook, k); cam.lookAt(look); if (k >= 1) camLook.copy(look)
      const fieldOn = cur >= 2 && cur <= 5, t = now / 1000
      rings.forEach((r, i) => { r.visible = fieldOn; const p = ((t * 0.7 + i / 4) % 1); r.scale.setScalar(1 + p * 5); (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7 * (cur === 5 ? 0.6 + 0.4 * Math.sin(t * 20) : 1) })
      card.visible = cur >= 2 && cur <= 5 || cur === 8; card.position.z = cur >= 3 && cur <= 5 ? 0.5 : 0.5 + (cur === 2 ? 0.5 : 0)
      card.rotation.y = cur === 4 ? 0.0 : -0.25; chip.scale.setScalar(cur === 4 ? 1.4 + 0.2 * Math.sin(t * 6) : 1)
      lab[0].visible = cur === 2; lab[1].visible = cur === 3; lab[2].visible = cur === 4; lab[3].visible = cur === 6; lab[4].visible = cur === 6
      ;(screen.material as THREE.MeshStandardMaterial).color.set(cur === 8 ? 0x35d07f : 0x2a3a44); (screen.material as THREE.MeshStandardMaterial).emissive.set(cur === 8 ? 0x0b3a22 : 0x000000)
      const moving = cur === 6 || cur === 7; pkt.visible = moving; if (moving) pkt.position.copy(curve.getPoint(((t * 0.12) % 1) * (cur === 6 ? 0.45 : 1)))
      void val
      renderer.render(scene, cam); raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach((x) => { (x as THREE.SpriteMaterial).map?.dispose?.(); x.dispose() }) }); renderer.dispose(); renderer.domElement.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality])
  if (!ok) return <p className="sn-hint">3D is not available on this device. Use the Technical view or Real-world view; the content is the same.</p>
  return <div ref={host} className="sn-3d" />
}
