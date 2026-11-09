import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import type { SceneManager } from './SceneManager'

/** Free-licence assets (see ops/raporlar/GORSEL_KAYNAKLAR.md). Every loader fails soft: on any error the procedural model or room light stays, nothing crashes. */
const base = () => import.meta.env.BASE_URL
const cache = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] } | null>>()
export const loadGlb = (file: string) => {
  let p = cache.get(file)
  if (!p) { p = new GLTFLoader().loadAsync(`${base()}models/${file}`).then((g) => ({ scene: g.scene, animations: g.animations })).catch(() => null); cache.set(file, p) }
  return p
}

/** Poly Haven "Venice Sunset" (CC0) as image-based light and reflections. The scene keeps its own sky and ground. */
export function loadHdri(m: SceneManager) {
  new RGBELoader().loadAsync(`${base()}tex/venice_sunset_1k.hdr`).then((tex) => {
    const pm = new THREE.PMREMGenerator(m.renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose()
    m.scene.environment?.dispose(); m.scene.environment = env; m.scene.environmentIntensity = 0.7
  }).catch(() => { /* keep RoomEnvironment */ })
}

/** An animated glTF walker (Cesium Man, CC BY 4.0). Added when loaded; returns a per-frame updater. */
export function addWalker(m: SceneManager, at: [number, number, number], scale = 1, rotY = 0) {
  let mixer: THREE.AnimationMixer | null = null; let last = 0
  void loadGlb('CesiumMan.glb').then((g) => {
    if (!g) return
    const o = g.scene.clone(true); o.position.set(...at); o.scale.setScalar(scale); o.rotation.y = rotY
    o.traverse((c) => { const mesh = c as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true } })
    m.scene.add(o); if (g.animations[0]) { mixer = new THREE.AnimationMixer(o); mixer.clipAction(g.animations[0]).play() }
  })
  return (t: number) => { if (mixer) { mixer.update(last ? Math.min(t - last, 0.1) : 0); } last = t }
}
