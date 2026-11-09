import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SLIDES, PLANS, estMinutes } from './slides'
import { TERMS } from './terms'
import { QA_LIST } from './qa'
import type { Slide } from './types'
import { Hero, CardScene, CardsGrid, DashScene, FAULTS, FlowView, MapScene, NfcScene, RestaurantScene, StreetScene, TableView, TechScene, maxSteps } from './scenes'

const Stage3D = lazy(() => import('./Stage3D').then((m) => ({ default: m.Stage3D })))
import { TAP_SHOTS } from './Stage3D'
import { HeroFigure } from './three/HeroFigure'
import { isSafe, setSafe, useSafe, webglOk } from './safe'
import { PROVA_CHECKLIST, PROVA_PLANS, PROVA_QA } from './prova'
import { ToursView } from './ToursView'
import { CityDesigner } from './CityDesigner'
const Rental = lazy(() => import('./three/RentalView').then((m) => ({ default: m.RentalView })))
const Replay = lazy(() => import('./three/ReplayLab').then((m) => ({ default: m.ReplayLab })))
const Resto = lazy(() => import('./three/RestaurantView').then((m) => ({ default: m.RestaurantView })))
const Journey = lazy(() => import('./three/JourneyView').then((m) => ({ default: m.JourneyView })))
const TapLab = lazy(() => import('./three/TapView').then((m) => ({ default: m.TapView })))
const Bench = lazy(() => import('./three/BenchView').then((m) => ({ default: m.BenchView })))
const STEP_SHOT = [2, 3, 3, 3, 4, 4, 5, 5, 6, 7, 7, 7, 8]
type Mode = 'present' | 'rehearse' | 'explore'
const KEY = 'foradas-sunum-v1'
const CH = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('foradas-sunum') : null

interface Pos { i: number; s: number }
const load = (): Pos => { try { const p = JSON.parse(localStorage.getItem(KEY) || '{}'); return { i: Math.min(Math.max(+p.i || 0, 0), SLIDES.length - 1), s: Math.max(+p.s || 0, 0) } } catch { return { i: 0, s: 0 } } }

export function usePos() {
  const [pos, setPos] = useState<Pos>(load)
  const set = useCallback((p: Pos) => { setPos(p); try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } CH?.postMessage(p) }, [])
  useEffect(() => { if (!CH) return; const h = (e: MessageEvent) => setPos(e.data as Pos); CH.addEventListener('message', h); return () => CH.removeEventListener('message', h) }, [])
  return [pos, set] as const
}

function beep(on: boolean, ok = true) {
  if (!on || isSafe()) return
  try { const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new A(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = ok ? 880 : 220; g.gain.value = 0.04; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.12) } catch { /* sound is optional */ }
}

export function SceneView({ slide, step, view, quality = 'auto' }: { slide: Slide; step: number; view: 'tech' | 'real' | '3d' | 'lab'; quality?: 'auto' | 'low' | 'high' }) {
  const sc = slide.scene
  if (slide.id === 'usecases') return <><SceneView slide={{ ...slide, id: 'usecases-base' }} step={step} view={view} quality={quality} /><Suspense fallback={<p className="sn-hint">Loading 3D car rental…</p>}><Rental quality={quality} /></Suspense></>
  if (slide.id === 'tap' && view === 'lab') return <Suspense fallback={<p className="sn-hint">Loading 3D lab…</p>}><TapLab quality={quality} /></Suspense>
  const [fault, setFault] = useState(FAULTS[0].id)
  const [mm, setMm] = useState('2D'); const [pick, setPick] = useState('Old Town')
  const fN = FAULTS.find((f) => f.id === fault)?.steps.length ?? 3
  if (slide.id === 'tap' && view === '3d' && slide.scene.k === 'flow') {
    const sh = STEP_SHOT[Math.min(step, STEP_SHOT.length - 1)], fs = slide.scene.flow.steps[Math.min(step, slide.scene.flow.steps.length - 1)]
    return (<div className="sn-flow"><Suspense fallback={<p className="sn-hint">Loading 3D scene…</p>}><Stage3D shot={sh} quality={quality} /></Suspense>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">Camera: {TAP_SHOTS[sh].title} · step {Math.min(step, 12) + 1} / 13</div><h3>{fs.title}</h3><p>{TAP_SHOTS[sh].text}</p><p className="sn-hint">{fs.text}</p></div></div>)
  }
  if (slide.id === 'tap' && view === 'real' && SLIDES[0]) { const j = SLIDES.find((s) => s.id === 'journey'); if (j && j.scene.k === 'street') return <StreetScene steps={j.scene.steps} step={5} /> }
  switch (sc.k) {
    case 'street': return slide.id === 'journey'
      ? <><StreetScene steps={sc.steps} step={step} /><Suspense fallback={<p className="sn-hint">Loading 3D journey…</p>}><Journey quality={quality} /></Suspense></>
      : <StreetScene steps={sc.steps} step={step} />
    case 'flow': return slide.id === 'rest-pay'
      ? <><FlowView flow={sc.flow} step={step} /><Suspense fallback={<p className="sn-hint">Loading 3D payment…</p>}><Resto quality={quality} part="pay" /></Suspense></>
      : <FlowView flow={sc.flow} step={step} />
    case 'card': return slide.id === 'card-anatomy'
      ? <><CardScene step={step} /><Suspense fallback={<p className="sn-hint">Loading 3D parts…</p>}><Bench quality={quality} /></Suspense></>
      : <CardScene step={step} />
    case 'nfc': return <NfcScene step={step} />
    case 'restaurant': return <><RestaurantScene step={step} /><Suspense fallback={<p className="sn-hint">Loading 3D restaurant…</p>}><Resto quality={quality} part="tour" /></Suspense></>
    case 'tech': return <><TechScene faultId={fault} step={Math.min(step, fN + 1)} onFault={setFault} />{slide.id === 'lab' && <Suspense fallback={<p className="sn-hint">Loading replay lab…</p>}><Replay quality={quality} /></Suspense>}</>
    case 'map': return <MapScene mode={mm} setMode={setMm} pick={pick} setPick={setPick} />
    case 'dash': return <DashScene step={step} />
    case 'tours': return <ToursView />
    case 'design': return <CityDesigner quality={quality} />
    case 'cards': return <CardsGrid items={sc.items} />
    case 'table': return <TableView head={sc.head} rows={sc.rows} />
    default: return <Hero />
  }
}

function useStepper(pos: { i: number; s: number }, setPos: (p: Pos) => void, faultN = 3) {
  const slide = SLIDES[pos.i]
  const last = (i: number) => Math.max(0, maxSteps(SLIDES[i].scene, i === pos.i ? faultN : 3) - 1)
  const next = useCallback(() => { if (pos.s < last(pos.i)) setPos({ i: pos.i, s: pos.s + 1 }); else if (pos.i < SLIDES.length - 1) setPos({ i: pos.i + 1, s: 0 }) }, [pos, setPos])
  const prev = useCallback(() => { if (pos.s > 0) setPos({ i: pos.i, s: pos.s - 1 }); else if (pos.i > 0) setPos({ i: pos.i - 1, s: last(pos.i - 1) }) }, [pos, setPos])
  return { slide, next, prev, last: last(pos.i) }
}

/** Splits a script into the sentences the presenter reads one at a time. */
const Term = ({ en }: { en: string }) => { const t = TERMS.find((x) => x.en === en); return <span className="sn-termchip" title={t ? `${t.tr}: ${t.def}` : en}>{en}{t ? <i> {t.tr}</i> : null}</span> }

function Teleprompter({ slide, size, keywords }: { slide: Slide; size: number; keywords: boolean }) {
  const [k, setK] = useState(0)
  useEffect(() => { setK(0) }, [slide.id])
  const kw = (s: string) => (keywords ? s.split(/\s+/).filter((w) => w.length > 5).slice(0, 4).join(' · ') : s)
  const em = slide.emphasize
  const mark = (s: string): ReactNode => { if (!em || keywords) return kw(s); const i = s.toLowerCase().indexOf(em.toLowerCase()); return i < 0 ? s : <>{s.slice(0, i)}<mark>{s.slice(i, i + em.length)}</mark>{s.slice(i + em.length)}</> }
  return (
    <div className="sn-prompt" style={{ fontSize: size }}>
      {slide.script.map((s, i) => <p key={i} className={i === k ? 'cur' : i === k + 1 ? 'nxt' : i < k ? 'done' : ''} onClick={() => setK(i)}>{mark(s)}</p>)}
      <div className="sn-pbtn"><button className="btn sm" onClick={() => setK(Math.max(0, k - 1))}>Previous sentence</button><button className="btn sm primary" onClick={() => setK(Math.min(slide.script.length - 1, k + 1))}>Next sentence</button></div>
      {slide.pause && <p className="sn-hint">Pause: {slide.pause}</p>}
      {slide.transition && <p className="sn-hint">Transition: “{slide.transition}”</p>}
    </div>
  )
}

function Glossary({ filter }: { filter: string[] | null }) {
  const [q, setQ] = useState(''); const [open, setOpen] = useState<string | null>(null)
  const list = TERMS.filter((t) => (!filter || filter.includes(t.en)) && (!q || (t.en + t.tr + t.def).toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="sn-gloss"><input className="input" placeholder="Search English or Turkish…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search terms" />
      {list.map((t) => (
        <div key={t.en} className={`sn-term ${open === t.en ? 'open' : ''}`}><button onClick={() => setOpen(open === t.en ? null : t.en)} aria-expanded={open === t.en}><b>{t.en}</b><span>{t.tr}</span></button>
          {open === t.en && <dl><dt>Definition</dt><dd>{t.def}</dd><dt>Context</dt><dd>{t.ctx}</dd><dt>Example</dt><dd>“{t.ex}”</dd><dt>Alternatives</dt><dd>{t.alt ?? '—'}</dd><dt>Common mistake</dt><dd>{t.mistake ?? '—'}</dd><dt>Pronunciation</dt><dd>{t.say}{t.ipa ? ` · ${t.ipa}` : ' · IPA not provided (not verified)'}</dd></dl>}
        </div>
      ))}
      <p className="sn-hint">IPA is shown only for common words, dictionary style (General American). Check a dictionary before relying on it.</p>
    </div>
  )
}

function QALab() {
  const [i, setI] = useState(0); const [show, setShow] = useState(0)
  const [level, setLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All')
  const list = useMemo(() => QA_LIST.filter((x) => level === 'All' || x.level === level), [level])
  const it = list[Math.min(i, list.length - 1)]
  const pickNext = (q: string) => { const f = QA_LIST.findIndex((x) => x.q.toLowerCase().includes(q.toLowerCase().split(' ').slice(-4).join(' '))); void f; setShow(0); setI((v) => (v + 1) % list.length) }
  return (
    <div className="sn-qa">
      <div className="sn-faultpick">{(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((l) => <button key={l} className={level === l ? 'on' : ''} onClick={() => { setLevel(l); setI(0); setShow(0) }}>{l}</button>)}<button onClick={() => { setI(Math.floor(Math.random() * list.length)); setShow(0) }}>Random</button></div>
      {it && <article><div className="sn-capn">{it.level} · question {Math.min(i, list.length - 1) + 1} / {list.length}</div><h3>{it.q}</h3>
        {show >= 1 && <p><b>Short answer.</b> {it.short}</p>}{show >= 2 && <p><b>Technical answer.</b> {it.deep}</p>}{show >= 3 && <p><b>Example.</b> {it.example}</p>}
        {show >= 4 && <><p><b>Terms.</b> {it.terms.map((t) => <Term key={t} en={t} />)}</p><p><b>Possible follow-up.</b> {it.follow}</p></>}
        <div className="row"><button className="btn sm" onClick={() => setShow(Math.min(4, show + 1))}>{show === 0 ? 'Reveal short answer' : show < 4 ? 'Reveal more' : 'All shown'}</button><button className="btn sm primary" onClick={() => pickNext(it.follow)}>Next question</button></div>
        <p className="sn-hint">This is a transparent branching practice list, not an AI interviewer. The follow-up is a suggestion for a teacher.</p></article>}
    </div>
  )
}

function Plans({ goTo }: { goTo: (i: number) => void }) {
  const [m, setM] = useState(15)
  const ids = PLANS[m]
  return (
    <div className="sn-plans"><div className="sn-faultpick">{Object.keys(PLANS).map((k) => <button key={k} className={+k === m ? 'on' : ''} onClick={() => setM(+k)}>{k} min</button>)}</div>
      <p className="sn-hint">Core slides are kept; optional slides are skipped, never cut in half. Estimated {SLIDES.filter((s) => ids.includes(s.id)).reduce((a, s) => a + estMinutes(s), 0).toFixed(1)} min of speaking.</p>
      <ol>{SLIDES.map((s, i) => <li key={s.id} className={ids.includes(s.id) ? 'in' : 'out'}><button onClick={() => goTo(i)}>{s.title}</button><span>{ids.includes(s.id) ? `${estMinutes(s).toFixed(1)} min${s.core ? ' · core' : ' · optional'}` : 'skipped'}</span></li>)}</ol>
    </div>
  )
}

const CHECKLIST = ['I can explain how a passive card gets energy', 'I can name the six different “OK”s of a tap', 'I know which tap steps are local and which need the backend', 'I can explain offline mode and its risk', 'I can separate authorisation, clearing and settlement', 'I practised the Turkish equivalents of 8 key terms', 'I tested full screen, the presenter window and sound on the presentation computer', 'I have a plan for questions: short answer first, details second']

export default function Sunum() {
  const [mode, setMode] = useState<Mode>('present')
  const [pos, setPos] = usePos()
  const [view, setView] = useState<'tech' | 'real' | '3d' | 'lab'>('tech')
  const [quality, setQuality] = useState<'auto' | 'low' | 'high'>('auto')
  const [sound, setSound] = useState(false)
  const [calm, setCalm] = useState(() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } })
  const [drawer, setDrawer] = useState<null | 'notes' | 'terms' | 'plans' | 'chapters'>(null)
  const [fs, setFs] = useState(false)
  const [size, setSize] = useState(24); const [kw, setKw] = useState(false)
  const [tab, setTab] = useState<'script' | 'terms' | 'qa' | 'plans' | 'check'>('script')
  const [xtab, setXtab] = useState<'slides' | 'glossary' | 'qa' | 'plans' | 'sources'>('slides')
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false))
  const root = useRef<HTMLDivElement>(null)
  const { slide, next, prev } = useStepper(pos, setPos)
  const slideRef = useRef(slide); slideRef.current = slide

  const go = (n: () => void) => { n(); beep(sound) }
  const [dark, setDark] = useState(false)
  const [goto, setGoto] = useState('')
  const safe = useSafe()
  const [suggest, setSuggest] = useState(false)
  useEffect(() => {
    if (safe) return
    if (!webglOk()) { setSuggest(true); return }
    let n = 0, stop = false; const t0 = performance.now()
    const f = (t: number) => { if (stop) return; n++; if (t - t0 < 1500) requestAnimationFrame(f); else if (n / ((t - t0) / 1000) < 18) setSuggest(true) }
    requestAnimationFrame(f); return () => { stop = true }
  }, [safe])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return
      if (/^[0-9]$/.test(e.key)) { setGoto((g) => (g + e.key).slice(0, 2)); return }
      if (e.key === 'Enter' && goto) { e.preventDefault(); const n = Math.min(Math.max(+goto, 1), SLIDES.length); setGoto(''); setPos({ i: n - 1, s: 0 }); return }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') { if (e.key === 'Enter' && /BUTTON|A|SUMMARY/.test(t.tagName)) return; e.preventDefault(); go(next) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') { e.preventDefault(); prev() }
      else if (e.key === 'Home') setPos({ i: 0, s: 0 })
      else if (e.key === 'End') setPos({ i: SLIDES.length - 1, s: 0 })
      else if (e.key === 'b' || e.key === 'B' || e.key === '.') setDark((d) => !d)
      else if (e.key === 'f' || e.key === 'F') toggleFs()
      else if (e.key === 'n' || e.key === 'N') setDrawer((d) => (d === 'notes' ? null : 'notes'))
      else if (e.key === 'Escape') { setGoto(''); setDark(false); setDrawer(null); if (document.fullscreenElement) void document.exitFullscreen() }
      else if (e.key === 'r' || e.key === 'R') setPos({ i: pos.i, s: 0 })
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
  useEffect(() => { const h = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h) }, [])
  const toggleFs = () => { try { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen() } catch { /* unsupported */ } }
  const chapters = useMemo(() => [...new Set(SLIDES.map((s) => s.chapter))], [])
  const pct = Math.round(((pos.i + 1) / SLIDES.length) * 100)
  const stepsN = maxSteps(slide.scene)
  const openPresenter = () => { try { window.open('#/sunum/sunucu', 'foradas-presenter', 'width=980,height=760') } catch { /* popup blocked */ } }

  const deck = (
    <>
      <header className="sn-head"><div><div className="sn-ch">{slide.chapter}</div><h1>{slide.title}</h1></div>
        {slide.core ? <span className="sn-core">Core</span> : <span className="sn-core opt">Optional</span>}</header>
      <div className="sn-body">
        <ul className="sn-bul">{slide.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        <div className="sn-scene">
          {slide.id === 'tap' && <div className="sn-faultpick" role="tablist" aria-label="View"><button role="tab" aria-selected={view === 'tech'} className={view === 'tech' ? 'on' : ''} onClick={() => setView('tech')}>Technical view</button><button role="tab" aria-selected={view === 'real'} className={view === 'real' ? 'on' : ''} onClick={() => setView('real')}>Real-world view</button><button role="tab" aria-selected={view === 'lab'} className={view === 'lab' ? 'on' : ''} onClick={() => setView('lab')}>3D lab</button><button role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}>3D camera (classic)</button>{view === '3d' &&<select aria-label="3D quality" value={quality} onChange={(e) => setQuality(e.target.value as 'auto' | 'low' | 'high')}><option value="auto">Quality: auto</option><option value="low">Low (weak device)</option><option value="high">High</option></select>}</div>}
          <HeroFigure slideId={slide.id} />
          <SceneView slide={slide} step={pos.s} view={safe && view !== 'real' ? 'tech' : view} quality={quality} />
        </div>
      </div>
      {slide.check && <details className="sn-check"><summary>Optional check</summary><p><b>{slide.check.q}</b></p><p>{slide.check.a}</p></details>}
    </>
  )

  return (
    <div ref={root} lang="en" className={`sn-root ${calm || safe ? 'calm' : ''} ${fs ? 'fs' : ''} ${safe ? 'safe' : ''}`}>
      {dark && <div className="sn-black" onClick={() => setDark(false)} role="button" aria-label="Screen blanked. Press B or click to return." />}
      {suggest && !safe && <div className="sn-suggest" role="alert">This device looks slow or has no WebGL. <button className="btn sm" onClick={() => setSafe(true)}>Switch to safe mode</button> <button className="btn sm" onClick={() => setSuggest(false)}>Dismiss</button></div>}
      <div className="sn-top">
        <Link to="/" className="sn-brand" aria-label="Back to site">FORADAŞ</Link>
        <div className="sn-modes" role="tablist" aria-label="Mode">{([['present', 'Presentation'], ['rehearse', 'Rehearsal'], ['explore', 'Technical exploration']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
        <div className="sn-tools">
          <button onClick={() => setDrawer(drawer === 'chapters' ? null : 'chapters')} aria-label="Chapters">☰</button>
          <button onClick={() => setSafe(!safe)} aria-pressed={safe} title="Safe mode: no 3D, effects or sound">{safe ? 'Safe mode: on' : 'Safe mode'}</button>
          <button onClick={() => setSound(!sound)} aria-pressed={sound && !safe} aria-label="Sound">{sound ? '🔊' : '🔇'}</button>
          <button onClick={() => setCalm(!calm)} aria-pressed={calm} title="Reduce motion">{calm ? 'Motion off' : 'Motion on'}</button>
          <button onClick={openPresenter}>Presenter window</button>
          <button onClick={toggleFs}>{fs ? 'Exit full screen' : 'Full screen'}</button>
        </div>
      </div>
      <div className="sn-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: pct + '%' }} /></div>

      {mode === 'present' && <main className="sn-stage" onClick={(e) => { const t = e.target as HTMLElement; if (t.closest('button,a,summary,details,input,select,.sn-drawer,.sn-3d')) return; go(next) }}>{deck}</main>}

      {mode === 'rehearse' && (
        <main className="sn-rehearse">
          <section className="sn-stage small">{deck}</section>
          <aside className="sn-side">
            <div className="sn-faultpick">{(['script', 'terms', 'qa', 'plans', 'check'] as const).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{({ script: 'Teleprompter', terms: 'Terms', qa: 'Teacher questions', plans: 'Timing', check: 'Readiness' })[k]}</button>)}</div>
            {tab === 'script' && <><div className="sn-pctl"><label>Text size <input type="range" min={16} max={40} value={size} onChange={(e) => setSize(+e.target.value)} /></label><label><input type="checkbox" checked={kw} onChange={(e) => setKw(e.target.checked)} /> Keyword mode</label><span className="sn-hint">About {Math.round(slide.script.join(' ').split(/\s+/).length / 2.3)} s at 140 words per minute</span></div><Teleprompter slide={slide} size={size} keywords={kw} /><details open><summary>Advanced notes (layer C)</summary><p>{slide.notes}</p></details></>}
            {tab === 'terms' && <Glossary filter={slide.terms?.length ? slide.terms : null} />}
            {tab === 'qa' && <QALab />}
            {tab === 'plans' && <Plans goTo={(i) => setPos({ i, s: 0 })} />}
            {tab === 'check' && <ul className="sn-checklist">{CHECKLIST.map((c, i) => <li key={c}><label><input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((v, k) => (k === i ? !v : v)))} /> {c}</label></li>)}<li className="sn-hint">{checks.filter(Boolean).length} / {CHECKLIST.length} ready</li></ul>}
          </aside>
        </main>
      )}

      {mode === 'explore' && (
        <main className="sn-explore">
          <div className="sn-faultpick">{(['slides', 'glossary', 'qa', 'plans', 'sources'] as const).map((k) => <button key={k} className={xtab === k ? 'on' : ''} onClick={() => setXtab(k)}>{({ slides: 'Slides and notes', glossary: 'Terminology', qa: 'Question lab', plans: 'Timing plans', sources: 'Source verification' })[k]}</button>)}</div>
          {xtab === 'slides' && <div className="sn-xgrid"><ol className="sn-xlist">{SLIDES.map((s, i) => <li key={s.id}><button className={i === pos.i ? 'on' : ''} onClick={() => setPos({ i, s: 0 })}>{s.chapter.split(' · ')[0]}. {s.title}</button></li>)}</ol><section className="sn-stage small">{deck}<div className="sn-notes"><h3>Layer B · script</h3>{slide.script.map((s, i) => <p key={i}>{s}</p>)}<h3>Layer C · notes</h3><p>{slide.notes}</p></div></section></div>}
          {xtab === 'glossary' && <Glossary filter={null} />}
          {xtab === 'qa' && <QALab />}
          {xtab === 'plans' && <Plans goTo={(i) => { setPos({ i, s: 0 }); setMode('present') }} />}
          {xtab === 'sources' && <section className="sn-stage small"><h2>Source verification panel</h2><p className="sn-hint">Nothing below is invented. “Series verified by title” means the document series exists under that title; edition years must still be confirmed in the publisher catalogue before citing.</p>{(() => { const r = SLIDES.find((s) => s.id === 'refs'); return r && r.scene.k === 'table' ? <TableView head={r.scene.head} rows={r.scene.rows} /> : null })()}</section>}
        </main>
      )}

      {mode !== 'explore' && (
        <footer className="sn-foot">
          <button className="btn" onClick={prev} aria-label="Previous step">← Back</button>
          <button className="btn" onClick={() => setPos({ i: pos.i, s: 0 })} aria-label="Replay this scene">⟲ Replay</button>
          <span className="sn-pos" aria-live="polite">{goto ? `Go to slide ${goto}… (Enter)` : ''} Slide {pos.i + 1} / {SLIDES.length}{stepsN > 1 ? ` · step ${Math.min(pos.s, stepsN - 1) + 1} / ${stepsN}` : ''}</span>
          <button className="btn" onClick={() => setDrawer(drawer === 'notes' ? null : 'notes')}>Deeper explanation (N)</button>
          <button className="btn" onClick={() => setPos({ i: 0, s: 0 })}>Reset</button>
          <a className="btn" href="#/sunum/pdf" target="_blank" rel="noreferrer">Download PDF</a>
          <button className="btn accent" onClick={() => go(next)} aria-label="Next step">Next →</button>
        </footer>
      )}

      {drawer && (
        <aside className="sn-drawer" role="dialog" aria-label="Details"><button className="iconbtn" onClick={() => setDrawer(null)} aria-label="Close">✕</button>
          {drawer === 'notes' && <><h3>{slide.title}</h3><p>{slide.notes}</p>{slide.terms?.length ? <p>{slide.terms.map((t) => <Term key={t} en={t} />)}</p> : null}</>}
          {drawer === 'chapters' && <><h3>Chapters</h3><ol className="sn-xlist">{chapters.map((c) => <li key={c}><button onClick={() => { setPos({ i: SLIDES.findIndex((s) => s.chapter === c), s: 0 }); setDrawer(null) }}>{c}</button></li>)}</ol><p className="sn-hint">Return to your slide: {slide.title}</p></>}
        </aside>
      )}
    </div>
  )
}

/** Presenter window: private script, next sentence, notes. Stays in sync via BroadcastChannel. */
export function PresenterView() {
  const [pos, setPos] = usePos()
  const { slide, next, prev } = useStepper(pos, setPos)
  const [size, setSize] = useState(26); const [kw, setKw] = useState(false)
  const [t0] = useState(Date.now()); const [, force] = useState(0)
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  const el = Math.floor((Date.now() - t0) / 1000)
  const emTerm = TERMS.find((t) => slide.emphasize && t.en.toLowerCase().includes(slide.emphasize.toLowerCase()))
  const nextSlide = SLIDES[pos.i + 1]
  return (
    <div lang="en" className="sn-root presenter">
      <div className="sn-top"><b>Presenter view (private)</b><span className="sn-pos">Slide {pos.i + 1} / {SLIDES.length} · {String(Math.floor(el / 60)).padStart(2, '0')}:{String(el % 60).padStart(2, '0')} · est. {estMinutes(slide).toFixed(1)} min</span>
        <div className="sn-tools"><label>Size <input type="range" min={16} max={44} value={size} onChange={(e) => setSize(+e.target.value)} /></label><label><input type="checkbox" checked={kw} onChange={(e) => setKw(e.target.checked)} /> Keywords</label></div></div>
      <main className="sn-rehearse"><section className="sn-side wide"><h2>{slide.title}</h2><Teleprompter slide={slide} size={size} keywords={kw} />
        <div className="row"><button className="btn" onClick={prev}>← Back step</button><button className="btn accent" onClick={next}>Next step →</button></div>
        <p className="sn-hint">Presenter controls the audience window: steps advance only when you click.</p></section>
        <aside className="sn-side"><h3>On screen now</h3><ul>{slide.bullets.map((b) => <li key={b}>{b}</li>)}</ul><h3>Next slide</h3><p><b>{nextSlide ? nextSlide.title : 'End'}</b></p>{nextSlide && <ul>{nextSlide.bullets.slice(0, 3).map((b) => <li key={b}>{b}</li>)}</ul>}
          <details><summary>Rehearsal checklist and likely questions</summary><ul>{PROVA_CHECKLIST.map((c) => <li key={c}>{c}</li>)}</ul><h3>Time plans</h3><ul>{PROVA_PLANS.map((c) => <li key={c}>{c}</li>)}</ul><h3>Questions</h3>{PROVA_QA.map((x) => <p key={x.q}><b>{x.q}</b><br />{x.a}</p>)}</details>
          {emTerm && <><h3>Emphasise: {emTerm.en}</h3><p>{emTerm.say}{emTerm.ipa ? ` · ${emTerm.ipa}` : ''}<br />Turkish: {emTerm.tr}</p></>}
          <h3>Terms on this slide</h3><p>{slide.terms?.map((t) => <Term key={t} en={t} />)}</p><h3>Technical notes</h3><p>{slide.notes}</p>
          {slide.check && <><h3>Likely question</h3><p><b>{slide.check.q}</b></p><p>{slide.check.a}</p></>}</aside></main>
    </div>
  )
}
