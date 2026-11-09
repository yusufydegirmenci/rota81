import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Etiket, mark, phys } from './models'
import type { PartId } from './registry'
import { EDGES, type NodeId, type TraceStep } from './replay'
import type { SceneBuilder, StepDef } from './Viewer3D'

/** Neon isometric architecture view (target H4). Nodes are clickable parts; the replay engine says which are active. */
const XZ: Record<NodeId, [number, number]> = { reader: [-17, -9], gateway: [-10, -4], auth: [-10, 1], notify: [-10, 6], fare: [10, -4], queue: [10, 2], sql: [-4, 10], nosql: [1, 10], storage: [8, 9] }
const PART: Record<NodeId, PartId> = { reader: 'arch-reader', gateway: 'arch-gateway', auth: 'arch-auth', fare: 'arch-fare', nosql: 'arch-nosql', sql: 'arch-sql', queue: 'arch-queue', notify: 'arch-notify', storage: 'arch-storage' }
const COL: Record<NodeId, number> = { reader: 0x35d07f, gateway: 0x2fd0ff, auth: 0x8a7bff, fare: 0xffd23a, nosql: 0x7b5cff, sql: 0x3d8bff, queue: 0xff7a35, notify: 0xff6ec7, storage: 0x6ad6ff }
const REAL: Record<NodeId, string> = { reader: 'Bus reader', gateway: 'Front door', auth: 'ID check', fare: 'Price calculator', nosql: 'Trip history', sql: 'Accounts and ledger', queue: 'Message queue', notify: 'Receipts', storage: 'Archive' }
const TECH: Record<NodeId, string> = { reader: 'Reader / validator', gateway: 'API Gateway', auth: 'Auth Service', fare: 'Microservices (fare)', nosql: 'NoSQL DB', sql: 'SQL DB (ledger)', queue: 'Message Queue', notify: 'Notification Service', storage: 'Cloud Storage' }
const NODES = Object.keys(XZ) as NodeId[]

export const traceSteps = (trace: TraceStep[]): StepDef[] => trace.map((s) => {
  const pts = s.active.map((n) => XZ[n]); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return { pos: [cx + 10, 10.5, cz + 12], look: [cx, 0.8, cz], title: s.title, text: s.text, deep: s.deep }
})

export const buildReplay = (trace: TraceStep[]): SceneBuilder => (m) => {
  m.scene.background = new THREE.Color(0x050818); if (m.scene.fog) (m.scene.fog as THREE.Fog).color.set(0x050818)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x070b1e, roughness: 0.5, metalness: 0.6 })); floor.rotation.x = -Math.PI / 2; m.scene.add(floor)
  const grid = new THREE.GridHelper(80, 40, 0x2342a0, 0x101a4a); grid.position.y = 0.01; m.scene.add(grid)
  // platform core: three layers + glowing lattice cube
  const stack = mark(new THREE.Group(), 'arch-stack'); m.scene.add(stack)
  ;[['Application layer', 0x4d6bff, 0.4], ['Business logic layer', 0x7a5cff, 1.25], ['Data layer', 0x3a2fa0, 2.1]].forEach(([n, c, y]) => {
    const s = new THREE.Mesh(new RoundedBoxGeometry(7, 0.6, 7, 4, 0.15), phys(0x0c1236, { roughness: 0.2, metalness: 0.6, clearcoat: 1, emissive: c as number, emissiveIntensity: 0.35 })); s.position.y = (y as number); s.rotation.y = Math.PI / 4; stack.add(s)
    const l = Etiket(n as string, 1.1); l.position.set(0, (y as number) + 0.6, 4.4); stack.add(l)
  })
  const cube = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x6a8bff).multiplyScalar(2), wireframe: true, toneMapped: false })); cube.position.y = 4.2; stack.add(cube)
  // service nodes
  const box = new Map<NodeId, THREE.Mesh>(); const lab = new Map<NodeId, [THREE.Sprite, THREE.Sprite]>()
  NODES.forEach((n) => {
    const b = mark(new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.6, 2.2, 4, 0.25), phys(0x0b1230, { roughness: 0.2, metalness: 0.6, clearcoat: 1, emissive: COL[n], emissiveIntensity: 0.15 })), PART[n]); b.position.set(XZ[n][0], 0.8, XZ[n][1]); m.scene.add(b); box.set(n, b)
    const a = Etiket(REAL[n], 1.4), t = Etiket(TECH[n], 1.4); a.position.set(XZ[n][0], 2.9, XZ[n][1]); t.position.copy(a.position); m.scene.add(a, t); lab.set(n, [a, t])
  })
  // edges: dim lines plus one bright moving dot on the active edge
  const key = (a: NodeId, b: NodeId) => [a, b].sort().join('>')
  const lines = new Map<string, { line: THREE.Mesh; curve: THREE.LineCurve3 }>()
  EDGES.forEach(([a, b]) => {
    const A = new THREE.Vector3(XZ[a][0], 0.8, XZ[a][1]), B = new THREE.Vector3(XZ[b][0], 0.8, XZ[b][1]); const curve = new THREE.LineCurve3(A, B)
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 2, 0.05, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3a5cff).multiplyScalar(0.8), toneMapped: false, transparent: true, opacity: 0.45 })); m.scene.add(line); lines.set(key(a, b), { line, curve })
  })
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(3), toneMapped: false })); m.scene.add(dot)
  const glow = new THREE.PointLight(0x4d6bff, 60, 40); glow.position.set(0, 8, 0); m.scene.add(glow); const g2 = new THREE.PointLight(0xff6ec7, 25, 30); g2.position.set(-12, 5, 8); m.scene.add(g2)
  m.prepare()
  const tmp = new THREE.Color()
  return (t, step, tech) => {
    const s = trace[Math.min(step, trace.length - 1)]
    cube.rotation.y = t * 0.4; cube.rotation.x = t * 0.2
    NODES.forEach((n) => {
      const mat = box.get(n)!.material as THREE.MeshPhysicalMaterial; const on = s.active.includes(n)
      const failing = on && s.status === 'fail'; const warn = on && s.status === 'warn'
      tmp.set(failing ? 0xff3b3b : warn ? 0xffb020 : n === 'reader' && s.result === 'ok' ? 0x35d07f : n === 'reader' && s.result === 'bad' ? 0xff3b3b : COL[n]); mat.emissive.copy(tmp)
      mat.emissiveIntensity = on ? 0.8 + 0.3 * Math.sin(t * 6) : 0.12
      const [a, b] = lab.get(n)!; a.visible = !tech; b.visible = tech
    })
    lines.forEach((l) => { (l.line.material as THREE.MeshBasicMaterial).opacity = 0.45; (l.line.material as THREE.MeshBasicMaterial).color.set(0x3a5cff).multiplyScalar(0.8) })
    if (s.edge) {
      const e = lines.get(key(s.edge[0], s.edge[1]))!; const mm = e.line.material as THREE.MeshBasicMaterial
      mm.opacity = 1; mm.color.set(s.status === 'fail' ? 0xff3b3b : 0x6af0ff).multiplyScalar(2.4)
      const forward = s.edge[0] === EDGES.find(([a, b]) => key(a, b) === key(s.edge![0], s.edge![1]))![0]
      const p = (t * 0.6) % 1; dot.visible = s.status !== 'fail' || p < 0.6; dot.position.copy(e.curve.getPoint(forward !== !!s.reverse ? p : 1 - p))
    } else dot.visible = false
  }
}
