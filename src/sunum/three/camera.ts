import * as THREE from 'three'

/** One camera shot: where the camera stands (`pos`), what it watches (`look`), and what it explains. */
export interface ShotDef { pos: [number, number, number]; look: [number, number, number]; title: string; text: string }

export const ease = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)

/** Smooth camera transitions between shots. A new flyTo mid-flight starts from the current pose (no jump). */
export class CameraRig {
  private fromPos = new THREE.Vector3(); private toPos = new THREE.Vector3()
  private fromLook = new THREE.Vector3(); private toLook = new THREE.Vector3()
  private curLook = new THREE.Vector3(); private t0 = 0
  private ms: number
  constructor(ms = 1500) { this.ms = ms }
  snap(cam: THREE.Camera, s: ShotDef) {
    cam.position.set(...s.pos); this.curLook.set(...s.look); cam.lookAt(this.curLook)
    this.fromPos.copy(cam.position); this.toPos.copy(cam.position); this.fromLook.copy(this.curLook); this.toLook.copy(this.curLook)
  }
  flyTo(cam: THREE.Camera, s: ShotDef, now: number) {
    this.fromPos.copy(cam.position); this.fromLook.copy(this.curLook)
    this.toPos.set(...s.pos); this.toLook.set(...s.look); this.t0 = now
  }
  /** Progress 0..1 of the current flight. */
  progress(now: number) { return Math.min(1, Math.max(0, (now - this.t0) / this.ms)) }
  update(cam: THREE.Camera, now: number) {
    const k = ease(this.progress(now))
    cam.position.lerpVectors(this.fromPos, this.toPos, k)
    this.curLook.lerpVectors(this.fromLook, this.toLook, k)
    cam.lookAt(this.curLook)
  }
}
