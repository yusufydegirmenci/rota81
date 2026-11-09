import { lazy, Suspense, useMemo, useRef, useState, type MouseEvent } from 'react'
import { DISTRICTS, LINE_COLORS, evaluate, sampleNetwork, type DLine, type DStop, type LineMode } from './citydesign'
import { OSM_INDEX } from '../data/seed'
import type { Quality } from './three/SceneManager'

const CityView = lazy(() => import('./three/CityView').then((m) => ({ default: m.CityView })))
const StreetView = lazy(() => import('./three/CityView').then((m) => ({ default: m.StreetViewer })))
const OSM = import.meta.glob('../data/real/osm/[0-9][0-9].json', { eager: true, import: 'default' }) as Record<string, { s: [string, number, number, string, string, string][] }>

type Mode = '2D design' | 'Network' | 'District' | '3D' | 'Street' | 'Real data'
const MODES: Mode[] = ['2D design', 'Network', 'District', '3D', 'Street', 'Real data']
type Tool = 'stop' | 'line' | 'delete'
const nearestDistrict = (x: number, y: number) => DISTRICTS.reduce((a, d) => (Math.hypot(d.x - x, d.y - y) < Math.hypot(a.x - x, a.y - y) ? d : a))

/** Design-your-city: place stops, draw lines, see coverage, line loads and connectivity on fictional Marisa. SCENARIO numbers, SIMULATION only. */
export function CityDesigner({ quality }: { quality: Quality }) {
  const init = useMemo(() => sampleNetwork(), [])
  const [stops, setStops] = useState<DStop[]>(init.stops); const [lines, setLines] = useState<DLine[]>(init.lines)
  const [tool, setTool] = useState<Tool>('stop'); const [active, setActive] = useState(1); const [mode, setMode] = useState<Mode>('2D design')
  const [dsel, setDsel] = useState(0); const [ssel, setSsel] = useState<number | null>(null); const [real, setReal] = useState('06')
  const nextId = useRef(100)
  const res = useMemo(() => evaluate(DISTRICTS, stops, lines), [stops, lines])
  const line = lines.find((l) => l.id === active)
  const svgRef = useRef<SVGSVGElement>(null)

  const addStopAt = (x: number, y: number) => { if (stops.length >= 40) return; setStops([...stops, { id: nextId.current++, x: Math.round(x), y: Math.round(y) }]) }
  const hit = (x: number, y: number) => stops.find((s) => Math.hypot(s.x - x, s.y - y) < 16)
  const onMap = (e: MouseEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 960, y = ((e.clientY - r.top) / r.height) * 440; const s = hit(x, y)
    if (tool === 'stop' && !s) addStopAt(x, y)
    else if (s && tool === 'line' && line) { if (line.stops[line.stops.length - 1] !== s.id) setLines(lines.map((l) => (l.id === line.id ? { ...l, stops: [...l.stops, s.id] } : l))) }
    else if (s && tool === 'delete') { setStops(stops.filter((p) => p.id !== s.id)); setLines(lines.map((l) => ({ ...l, stops: l.stops.filter((id) => id !== s.id) }))) }
    if (s) setSsel(s.id)
  }
  const newLine = () => { const id = nextId.current++; setLines([...lines, { id, name: `Line ${lines.length + 1}`, color: LINE_COLORS[lines.length % LINE_COLORS.length], mode: 'bus', headway: 8, stops: [] }]); setActive(id); setTool('line') }
  const patch = (p: Partial<DLine>) => line && setLines(lines.map((l) => (l.id === line.id ? { ...l, ...p } : l)))
  const reset = (empty: boolean) => { if (empty) { setStops([]); setLines([]); setActive(0) } else { setStops(init.stops); setLines(init.lines); setActive(1) } setSsel(null) }

  const pts = (l: DLine) => l.stops.map((id) => stops.find((s) => s.id === id)).filter((s): s is DStop => !!s)
  const stopName = (s: DStop) => `Stop ${s.id > 99 ? s.id - 99 : s.id} (${nearestDistrict(s.x, s.y).n})`
  const sel = stops.find((s) => s.id === ssel) ?? stops[0]
  const ridersAt = (s?: DStop) => s ? Math.round(lines.reduce((n, l) => { const r = res.lines.find((x) => x.id === l.id); return n + (l.stops.includes(s.id) && r ? r.ridersPerHour / Math.max(l.stops.length, 1) : 0) }, 0)) : 0
  const worst = res.lines.some((l) => l.status === 'overloaded') ? 'some lines are overloaded' : 'loads are within capacity'

  const Map2D = ({ showDistricts, labels, vb = '0 0 960 440' }: { showDistricts: boolean; labels?: boolean; vb?: string }) => (
    <svg ref={svgRef} viewBox={vb} role="img" aria-label="Map of Marisa with your stops and lines" onClick={onMap} style={{ width: '100%', background: '#e8f1ee', borderRadius: 12, cursor: tool === 'delete' ? 'not-allowed' : 'crosshair', touchAction: 'manipulation' }}>
      <rect x="640" y="300" width="320" height="140" fill="#bcd9dd" opacity=".8" />
      {showDistricts && DISTRICTS.map((d) => <g key={d.n}><circle cx={d.x} cy={d.y} r="62" fill={d.c} opacity=".85" /><circle cx={d.x} cy={d.y} r="120" fill="none" stroke="#14323f" strokeDasharray="4 6" opacity=".25" /><text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="#14323f">{d.n}</text><text x={d.x} y={d.y + 22} textAnchor="middle" fontSize="12" fill="#14323f">{Math.round(d.pop / 1000)}k (scenario)</text></g>)}
      {lines.map((l) => <polyline key={l.id} points={pts(l).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={l.color} strokeWidth={l.id === active ? 9 : 6} strokeLinejoin="round" strokeLinecap="round" opacity=".9" />)}
      {stops.map((s) => { const n = lines.filter((l) => l.stops.includes(s.id)).length; return <g key={s.id}><circle cx={s.x} cy={s.y} r={n > 1 ? 11 : 8} fill="#fff" stroke={s.id === ssel ? '#ef5f26' : '#14323f'} strokeWidth="3" />{labels && <text x={s.x + 13} y={s.y - 10} fontSize="13" fontWeight="600" fill="#14323f">{stopName(s)}</text>}</g> })}
    </svg>
  )
  const realCity = OSM[`../data/real/osm/${real}.json`]; const idx = OSM_INDEX.il[real]
  const realView = useMemo(() => {
    if (!realCity || realCity.s.length < 2) return null
    const la = realCity.s.map((p) => p[1]), lo = realCity.s.map((p) => p[2]); const a = Math.min(...la), b = Math.max(...la), c = Math.min(...lo), d = Math.max(...lo)
    const sx = 900 / Math.max(d - c, 1e-6), sy = 400 / Math.max(b - a, 1e-6), k = Math.min(sx, sy)
    return realCity.s.map((p) => `M${(20 + (p[2] - c) * k).toFixed(1)} ${(420 - (p[1] - a) * k).toFixed(1)}h1.6`).join('')
  }, [realCity])

  return (
    <div className="sn-flow">
      <div className="sn-faultpick" role="tablist" aria-label="Map mode">{MODES.map((m) => <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
      {(mode === '2D design' || mode === 'Network') && (
        <div className="sn-faultpick" aria-label="Design tools">
          <button aria-pressed={tool === 'stop'} className={tool === 'stop' ? 'on' : ''} onClick={() => setTool('stop')}>Add stop</button>
          <button aria-pressed={tool === 'line'} className={tool === 'line' ? 'on' : ''} onClick={() => setTool('line')} disabled={!line}>Draw line</button>
          <button aria-pressed={tool === 'delete'} className={tool === 'delete' ? 'on' : ''} onClick={() => setTool('delete')}>Delete stop</button>
          <button onClick={newLine}>New line</button>
          <button onClick={() => reset(false)}>Sample network</button>
          <button onClick={() => reset(true)}>Clear</button>
          {DISTRICTS.map((d) => <button key={d.n} onClick={() => addStopAt(d.x, d.y)} aria-label={`Add a stop in ${d.n}`}>+ {d.n}</button>)}
        </div>
      )}
      {mode === '2D design' && <Map2D showDistricts labels={false} />}
      {mode === 'Network' && <><Map2D showDistricts={false} labels /><p className="sn-hint">Network view: only stops and lines. Large white dots are transfer stops (two or more lines).</p></>}
      {mode === 'District' && (<>
        <div className="sn-faultpick" role="tablist" aria-label="District">{DISTRICTS.map((d, i) => <button key={d.n} role="tab" aria-selected={dsel === i} className={dsel === i ? 'on' : ''} onClick={() => setDsel(i)}>{d.n}</button>)}</div>
        {(() => { const d = DISTRICTS[dsel]; const r = res.districts[dsel]; const near = stops.map((s) => ({ s, m: Math.round(Math.hypot(s.x - d.x, s.y - d.y) * 8.3) })).sort((a, b) => a.m - b.m)[0]; return (<>
          <Map2D showDistricts labels vb={`${d.x - 200} ${d.y - 140} 400 280`} />
          <div className="sn-caption"><h3>{d.n}</h3><p>{d.d}</p><p>Residents (scenario): {d.pop.toLocaleString('en-US')} · served: {Math.round(r.share * 100)}% · nearest stop: {near ? `${near.m} m (${stopName(near.s)})` : 'none yet'}.</p><p className="sn-hint">Lines reaching it: {lines.filter((l) => l.stops.some((id) => { const s = stops.find((p) => p.id === id); return s && Math.hypot(s.x - d.x, s.y - d.y) < 120 })).map((l) => l.name).join(', ') || 'none'}.</p></div></>) })()}
      </>)}
      {mode === '3D' && <Suspense fallback={<p className="sn-hint">Loading 3D city…</p>}><CityView stops={stops} lines={lines} quality={quality} /></Suspense>}
      {mode === 'Street' && (<>
        {stops.length === 0 ? <p className="sn-hint">Add a stop first, then open Street view to see the people waiting there.</p> : (<>
          <label className="sn-hint">Stop: <select value={sel?.id} onChange={(e) => setSsel(+e.target.value)} aria-label="Stop for street view">{stops.map((s) => <option key={s.id} value={s.id}>{stopName(s)}</option>)}</select></label>
          <Suspense fallback={<p className="sn-hint">Loading street view…</p>}><StreetView key={`${sel.id}-${ridersAt(sel)}`} riders={ridersAt(sel)} status={worst} quality={quality} /></Suspense></>)}
      </>)}
      {mode === 'Real data' && (<div className="sn-caption">
        <label className="sn-hint">Province: <select value={real} onChange={(e) => setReal(e.target.value)} aria-label="Province with real data">{Object.entries(OSM_INDEX.il).map(([id, v]) => <option key={id} value={id}>{id} {v.ad}</option>)}</select></label>
        {idx && idx.durak >= 2 && realView ? (<>
          <h3>{idx.ad}: {idx.durak.toLocaleString('en-US')} real stops, {idx.hat.toLocaleString('en-US')} lines</h3>
          <svg viewBox="0 0 960 440" role="img" aria-label={`Real stops in ${idx.ad}`} style={{ width: '100%', background: '#0d2029', borderRadius: 12 }}><path d={realView} stroke="#7fe3ff" strokeWidth="2" fill="none" /></svg>
          <p className="sn-hint">GERÇEK: stops from OpenStreetMap / open data, read from src/data/real (read only). {idx.ilceDurakYok.length > 0 ? `No stop data for districts: ${idx.ilceDurakYok.slice(0, 12).join(', ')}${idx.ilceDurakYok.length > 12 ? '…' : ''}.` : 'All districts have stops.'}</p>
        </>) : <><h3>{idx?.ad ?? real}</h3><p>No real stop data for this province yet (veri yok). Nothing is invented; the fictional Marisa above is the only designed network.</p></>}
        <p className="sn-hint">Real data is shown on its own map. Marisa is fictional and its population numbers are scenario inputs.</p>
      </div>)}
      {mode !== '3D' && mode !== 'Street' && mode !== 'Real data' && (
        <div className="sn-caption" aria-live="polite">
          {line && <p className="sn-hint"><b>Active line:</b> <select value={active} onChange={(e) => setActive(+e.target.value)} aria-label="Active line">{lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select> mode <select value={line.mode} onChange={(e) => patch({ mode: e.target.value as LineMode })} aria-label="Line mode"><option>bus</option><option>tram</option><option>metro</option></select> every <input type="range" min={2} max={30} value={line.headway} onChange={(e) => patch({ headway: +e.target.value })} aria-label="Headway in minutes" /> {line.headway} min <button onClick={() => patch({ stops: line.stops.slice(0, -1) })}>Undo last stop</button></p>}
          <h3>Result: {Math.round(res.coverage * 100)}% of residents covered · {res.unserved.toLocaleString('en-US')} not served</h3>
          <p>{res.connected ? 'One connected network' : `${res.components} separate network(s)`} · {res.transferStops} transfer stop(s).</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{res.lines.map((l) => { const ln = lines.find((x) => x.id === l.id)!; return <li key={l.id} style={{ margin: '4px 0' }}><span style={{ display: 'inline-block', width: 12, height: 12, background: ln.color, borderRadius: 3, marginRight: 6 }} /><b>{l.name}</b> {l.km} km · {l.minutes} min · {l.ridersPerHour.toLocaleString('en-US')} riders/h of {l.capacityPerHour.toLocaleString('en-US')} → <span style={{ color: l.status === 'overloaded' ? '#c0392b' : undefined, fontWeight: 700 }}>{l.status === 'incomplete' ? 'needs 2+ stops' : `${Math.round(l.load * 100)}% ${l.status}`}</span></li> })}</ul>
          <p className="sn-hint">SCENARIO: populations are design inputs (about 1.0 million in total), peak-hour demand is 1.5% of covered residents, vehicle capacities are design values. Overloaded lines need a shorter headway, another line or a bigger vehicle. SIMULATION.</p>
        </div>
      )}
    </div>
  )
}
