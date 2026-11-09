/** Step timeline for a 3D scene: pause/resume, step back/forward, replay. Pure logic (no timers), driven by tick(dtMs). */
export class Timeline {
  step = 0
  playing = false
  private acc = 0
  readonly count: number
  readonly holdMs: number
  constructor(count: number, holdMs = 4000) {
    if (count < 1) throw new Error('Timeline needs at least one step')
    this.count = count; this.holdMs = holdMs
  }
  goto(n: number) { this.step = Math.max(0, Math.min(this.count - 1, Math.round(n))); this.acc = 0 }
  /** Manual stepping pauses playback: the presenter is now in control. */
  next() { this.playing = false; this.goto(this.step + 1) }
  prev() { this.playing = false; this.goto(this.step - 1) }
  pause() { this.playing = false }
  resume() { if (this.step >= this.count - 1) this.goto(0); this.playing = true; this.acc = 0 }
  toggle() { if (this.playing) this.pause(); else this.resume() }
  replay() { this.goto(0); this.playing = true }
  /** Advance the clock; returns true when the step changed. Stops at the last step. */
  tick(dtMs: number): boolean {
    if (!this.playing) return false
    this.acc += dtMs
    if (this.acc < this.holdMs) return false
    this.acc = 0
    if (this.step < this.count - 1) { this.step++; return true }
    this.playing = false
    return false
  }
}
