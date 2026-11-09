import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { CameraRig, type ShotDef } from './camera'
import { partOf } from './models'
import type { PartId } from './registry'

export type Quality = 'auto' | 'low' | 'high'

/** Owns renderer, scene, lights, camera rig and picking. Scenes add objects and an `onFrame` callback; the manager never knows what the story is.
 *  Quality: low = no shadows, no bloom, DPR 1; auto/high = ACES tone mapping, environment light, soft shadows, bloom (only very bright surfaces glow: field rings, LEDs, screens). */
export class SceneManager {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 300)
  readonly rig = new CameraRig()
  readonly renderer: THREE.WebGLRenderer
  readonly sun: THREE.DirectionalLight
  /** Real-world view (false) vs technical view (true); scenes read this each frame. */
  technical = false
  onFrame: (tSec: number, mgr: SceneManager) => void = () => {}
  private ray = new THREE.Raycaster(); private raf = 0; private alive = true; private ro: ResizeObserver
  private el: HTMLElement; private composer: EffectComposer | null = null; private lowQ: boolean

  constructor(el: HTMLElement, quality: Quality, sky = 0xcfe8ee) {
    this.el = el; this.lowQ = quality === 'low'
    // Throws when WebGL is unavailable; the caller shows a text fallback.
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowQ })
    this.renderer.setPixelRatio(this.lowQ ? 1 : Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 0.8
    this.renderer.shadowMap.enabled = !this.lowQ; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const cv = this.renderer.domElement; cv.style.width = '100%'; cv.style.height = '100%'; el.appendChild(cv)
    this.scene.background = new THREE.Color(sky); this.scene.fog = new THREE.Fog(sky, 40, 140)
    if (!this.lowQ) { const pm = new THREE.PMREMGenerator(this.renderer); this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.35; pm.dispose() }
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0a8, 0.35))
    this.sun = new THREE.DirectionalLight(0xffe2b0, 1.5); this.sun.position.set(-8, 14, 10)
    this.sun.castShadow = !this.lowQ; this.sun.shadow.mapSize.set(2048, 2048)
    const sc = this.sun.shadow.camera; sc.left = -25; sc.right = 25; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 60; this.sun.shadow.bias = -0.0004
    this.scene.add(this.sun)
    const fill = new THREE.PointLight(0x9fc4ff, 8, 25); fill.position.set(6, 4, 8); this.scene.add(fill)
    if (!this.lowQ) {
      this.composer = new EffectComposer(this.renderer)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(512, 288), 0.3, 0.4, 1.0))
      this.composer.addPass(new OutputPass())
    }
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize()
  }
  /** Call after a scene is built: meshes cast/receive shadows (lines, sprites and glowing field rings do not). */
  prepare() {
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material).transparent) { m.castShadow = true; m.receiveShadow = true } })
  }
  private resize() {
    const r = this.el.getBoundingClientRect(); this.renderer.setSize(r.width, r.height, false); this.composer?.setSize(r.width, r.height)
    this.camera.aspect = r.width / Math.max(r.height, 1); this.camera.updateProjectionMatrix()
  }
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
    const loop = (now: number) => {
      if (!this.alive) return
      this.rig.update(this.camera, now); this.onFrame(now / 1000, this)
      if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }
  dispose() {
    this.alive = false; cancelAnimationFrame(this.raf); this.ro.disconnect()
    this.scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach((x) => { (x as THREE.SpriteMaterial).map?.dispose?.(); x.dispose() }) })
    this.scene.environment?.dispose(); this.composer?.dispose(); this.renderer.dispose(); this.renderer.domElement.remove()
  }
}
