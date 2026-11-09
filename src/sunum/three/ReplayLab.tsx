import { useMemo, useState } from 'react'
import { Viewer3D } from './Viewer3D'
import { FAULTS, buildTrace, type Fault } from './replay'
import { buildReplay, traceSteps } from './replayScene'
import type { Quality } from './SceneManager'

/** Transaction replay lab: pick a fault, then step the same tap back and forth through the platform (use Step ◀ / Step ▶). */
export function ReplayLab({ quality }: { quality: Quality }) {
  const [fault, setFault] = useState<Fault>('none')
  const { steps, build } = useMemo(() => { const tr = buildTrace(fault); return { steps: traceSteps(tr), build: buildReplay(tr) } }, [fault])
  const f = FAULTS.find((x) => x.id === fault)!
  return (
    <div>
      <div className="sn-faultpick" role="tablist" aria-label="Inject a fault">
        {FAULTS.map((x) => <button key={x.id} role="tab" aria-selected={fault === x.id} className={fault === x.id ? 'on' : ''} onClick={() => setFault(x.id)}>{x.label}</button>)}
      </div>
      <p className="sn-hint">{f.blurb} Technical view shows the real component names and each component’s failure mode when you click it. SIMULATION: no real payment.</p>
      <Viewer3D key={fault} steps={steps} build={build} label={`3D replay of one tap through the platform: ${f.label}`} quality={quality} holdMs={6000} />
    </div>
  )
}
