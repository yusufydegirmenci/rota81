import * as THREE from 'three'
import { CameraRig, type ShotDef } from './camera'
import { partOf } from './models'
import type { PartId } from './registry'

export type Quality = 'auto' | 'low' | 'high'

/** Owns renderer, scene, lights, camera rig and picking. Scenes add objects and an `onFrame` callback; the manager never knows what the story is. */
export class SceneManager {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 200)
  readonly rig = new CameraRig()
  readonly renderer: THREE.WebGLRenderer
  /** Real-world view (false) vs technical view (true); scenes read this each frame. */
  technical = false
  onFrame: (tSec: number, mgr: SceneManager) => void = () => {}
  private ray = new THREE.Raycaster(); private raf = 0; private alive = true; private ro: ResizeObserver
  private el: HTMLElement

  constructor(el: HTMLElement, quality: Quality, sky = 0xcfe8ee) {
    this.el = el
    // Throws when WebGL is unavailable; the caller shows a text fallback.
    this.renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low' })
    this.renderer.setPixelRatio(quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5))
    const cv = this.renderer.domElement; cv.style.width = '100%'; cv.style.height = '100%'; el.appendChild(cv)
    this.scene.background = new THREE.Color(sky); this.scene.fog = new THREE.Fog(sky, 30, 90)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0a8, 1.1))
    const sun = new THREE.DirectionalLight(0xffe2b0, 1.6); sun.position.set(-8, 14, 10); this.scene.add(sun)
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize()
  }
  private resize() { const r = this.el.getBoundingClientRect(); this.renderer.setSize(r.width, r.height, false); this.camera.aspect = r.width / Math.max(r.height, 1); this.camera.updateProjectionMatrix() }
  snap(s: ShotDef) { this.rig.snap(this.camera, s) }
  flyTo(s: ShotDef) { this.rig.flyTo(this.camera, s, performance.now()) }
  /** Click/tap position → registry id of the part under it, or null. */
  pick(clientX: number, clientY: number): PartId | null {
    const r = this.el.getBoundingClientRect()
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera)
    for (const h of this.ray.intersectObjects(this.scene.children, true)) { if (!h.object.visible) continue; const id = partOf(h.object); if (id) return id }
    return null
  }
  start() {
    const loop = (now: number) => { if (!this.alive) return; this.rig.update(this.camera, now); this.onFrame(now / 1000, this); this.renderer.render(this.scene, this.camera); this.raf = requestAnimationFrame(loop) }
    this.raf = requestAnimationFrame(loop)
  }
  dispose() {
    this.alive = false; cancelAnimationFrame(this.raf); this.ro.disconnect()
    this.scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach((x) => { (x as THREE.SpriteMaterial).map?.dispose?.(); x.dispose() }) })
    this.renderer.dispose(); this.renderer.domElement.remove()
  }
}
