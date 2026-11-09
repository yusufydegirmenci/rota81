import { useEffect, useMemo, useRef, useState } from 'react'
import { SceneManager, type Quality } from './SceneManager'
import { Timeline } from './timeline'
import { PARTS, type PartId } from './registry'
import type { ShotDef } from './camera'

export interface StepDef extends ShotDef { deep?: string }
/** A scene builds its objects into the manager and returns a per-frame updater that receives the current step. */
export type SceneBuilder = (m: SceneManager) => (tSec: number, step: number, technical: boolean) => void

/** Reusable 3D viewer: camera per step, pause/resume, step back/forward, replay, click-to-inspect, real↔technical, deep-explanation panel. */
export function Viewer3D({ steps, build, label, quality: q0 = 'auto', holdMs = 5000, onStep }: { steps: StepDef[]; build: SceneBuilder; label: string; quality?: Quality; holdMs?: number; onStep?: (i: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const tl = useMemo(() => new Timeline(steps.length, holdMs), [steps.length, holdMs])
  const [, bump] = useState(0); const redraw = () => bump((n) => n + 1)
  const mgr = useRef<SceneManager | null>(null)
  const stepRef = useRef(0); const techRef = useRef(false)
  const [tech, setTech] = useState(false); const [quality, setQuality] = useState<Quality>(q0)
  const [picked, setPicked] = useState<PartId | null>(null); const [ok, setOk] = useState(true)

  useEffect(() => {
    const el = host.current; if (!el) return
    let m: SceneManager
    try { m = new SceneManager(el, quality) } catch { setOk(false); return }
    mgr.current = m
    const update = build(m); m.snap(steps[stepRef.current])
    let last = 0
    m.onFrame = (t, mm) => {
      const dt = last ? (t - last) * 1000 : 0; last = t
      if (tl.tick(Math.min(dt, 250))) { stepRef.current = tl.step; mm.flyTo(steps[tl.step]); redraw() }
      mm.technical = techRef.current; update(t, tl.step, techRef.current)
    }
    m.start()
    return () => { m.dispose(); mgr.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, build, steps])

  const cb = useRef(onStep); cb.current = onStep
  const lastStep = useRef(0)
  useEffect(() => { if (lastStep.current !== tl.step) { lastStep.current = tl.step; cb.current?.(tl.step) } })
  const go = (fn: () => void) => { fn(); stepRef.current = tl.step; mgr.current?.flyTo(steps[tl.step]); redraw() }
  const s = steps[tl.step]
  if (!ok) return <p className="sn-hint">3D is not available on this device. Use another view; the content is the same.</p>
  return (
    <div className="sn-flow sn-viewer">
      <div className="sn-3d" ref={host} role="img" aria-label={`${label}. Press Enter to cycle through the objects and hear their names and functions.`} tabIndex={0}
        onClick={(e) => setPicked(mgr.current?.pick(e.clientX, e.clientY) ?? null)}
        onKeyDown={(e) => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); e.stopPropagation(); const ps = mgr.current?.parts() ?? []; if (!ps.length) return; const i = picked ? ps.indexOf(picked) : -1; setPicked(ps[(i + 1) % ps.length]) }} />
      <div className="sn-faultpick" role="toolbar" aria-label="3D controls">
        <button onClick={() => go(() => tl.toggle())}>{tl.playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => go(() => tl.prev())} disabled={tl.step === 0}>◀ Step</button>
        <button onClick={() => go(() => tl.next())} disabled={tl.step === steps.length - 1}>Step ▶</button>
        <button onClick={() => go(() => tl.replay())}>Replay</button>
        <button aria-pressed={tech} className={tech ? 'on' : ''} onClick={() => { techRef.current = !tech; setTech(!tech) }}>{tech ? 'Technical view' : 'Real-world view'}</button>
        <select aria-label="3D quality" value={quality} onChange={(e) => setQuality(e.target.value as Quality)}><option value="auto">Quality: auto</option><option value="low">Low (weak device)</option><option value="high">High</option></select>
      </div>
      <div className="sn-caption" aria-live="polite">
        <div className="sn-capn">Step {tl.step + 1} / {steps.length}</div><h3>{s.title}</h3><p>{s.text}</p>
        {s.deep && <details><summary>Deep explanation</summary><p className="sn-hint">{s.deep}</p></details>}
        <p className="sn-hint" role="status">{picked ? <><b>{PARTS[picked].name}</b> · {PARTS[picked].tag} — {PARTS[picked].fn}{tech && 'tech' in PARTS[picked] ? ` (${(PARTS[picked] as { tech?: string }).tech})` : ''}</> : 'Click any object to see its name and function.'}</p>
      </div>
    </div>
  )
}
