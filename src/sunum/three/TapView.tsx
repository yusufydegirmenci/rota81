import { Viewer3D } from './Viewer3D'
import { TAP_STEPS, buildTap } from './tap'
import type { Quality } from './SceneManager'

/** Confirmation sound on the "answer returns" step. Optional: silently skipped when audio is unavailable. */
function beep() {
  try { const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new A(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = 0.04; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.12) } catch { /* sound is optional */ }
}

export function TapView({ quality }: { quality: Quality }) {
  return <Viewer3D steps={TAP_STEPS} build={buildTap} label="3D scene: card tap on a bus validator and the backend behind it" quality={quality} onStep={(i) => { if (i === 9) beep() }} />
}
