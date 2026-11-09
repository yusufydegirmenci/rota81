import { useMemo, useState } from 'react'
import { GUIDES, READY_TOURS, photoOf, tryText, type GuideId, type Stop } from './tours'

const speak = (text: string) => { try { const s = window.speechSynthesis; if (!s) return false; s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; s.speak(u); return true } catch { return false } }
const stopText = (s: Stop) => (s.kind === 'leg' ? `Travel by ${s.modes.join(' or ')} to ${s.to}. About ${s.min} minutes.` : `${s.title}. ${s.text}`)

/** Ready-made tours with guide options. Pick a tour and a guide, then step through the stops (◀ / ▶). All content is read from the tour data; SIMULATION: no real booking or payment. */
export function ToursView() {
  const [tid, setTid] = useState(READY_TOURS[0].id); const [gid, setGid] = useState<GuideId>('self'); const [i, setI] = useState(0); const [noSpeech, setNoSpeech] = useState(false)
  const tour = READY_TOURS.find((t) => t.id === tid)!; const guide = GUIDES.find((g) => g.id === gid)!
  const stop = tour.stops[Math.min(i, tour.stops.length - 1)]
  const photo = useMemo(() => (stop.kind === 'leg' ? null : photoOf(stop.id)), [stop])
  const done = tour.stops.slice(0, i + 1).reduce((n, s) => n + s.min, 0)
  const go = (n: number) => { setI(Math.max(0, Math.min(tour.stops.length - 1, n))); try { window.speechSynthesis?.cancel() } catch { /* ignore */ } }
  const pick = (id: string) => { setTid(id); setI(0) }
  return (
    <div className="sn-flow">
      <div className="sn-faultpick" role="tablist" aria-label="Tour">{READY_TOURS.map((t) => <button key={t.id} role="tab" aria-selected={tid === t.id} className={tid === t.id ? 'on' : ''} onClick={() => pick(t.id)}>{t.title}</button>)}</div>
      <p className="sn-hint">{tour.blurb}</p>
      <div className="sn-faultpick" role="tablist" aria-label="Guide option">{GUIDES.map((g) => <button key={g.id} role="tab" aria-selected={gid === g.id} className={gid === g.id ? 'on' : ''} onClick={() => setGid(g.id)}>{g.name}</button>)}</div>
      <p className="sn-hint"><b>{guide.name}:</b> {guide.what} {guide.pace} {guide.price}</p>
      <ol aria-label="Stops" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', padding: 0, margin: '8px 0' }}>
        {tour.stops.map((s, k) => <li key={k}><button aria-current={k === i ? 'step' : undefined} onClick={() => go(k)} className={k === i ? 'on' : ''} style={{ minWidth: 44, minHeight: 36 }} title={s.kind === 'leg' ? `Travel: ${s.modes.join('/')}` : s.title}>{s.kind === 'leg' ? '→' : s.kind === 'food' ? '🍽' : '★'}<span className="sr-only"> {k + 1}</span></button></li>)}
      </ol>
      <div className="sn-caption" aria-live="polite">
        <div className="sn-capn">Stop {i + 1} / {tour.stops.length} · {done} of {tour.minutes} min</div>
        {stop.kind === 'leg' ? (<>
          <h3>Travel to {stop.to}</h3>
          <p>{stop.modes.map((m) => <span key={m} className="sn-chip" style={{ marginRight: 6 }}>{m}</span>)} about {stop.min} min.</p>
          <p className="sn-hint">{stop.note}{stop.fare !== undefined && <> Estimated fare: {tryText(stop.fare)} (ESTIMATE).</>}</p>
        </>) : (<>
          <h3>{stop.kind === 'food' ? '🍽 ' : '★ '}{stop.title}</h3>
          {photo ? <figure style={{ margin: '0 0 8px' }}><img src={photo.url} alt={stop.title} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12 }} /><figcaption className="sn-hint">Photo: {photo.credit}</figcaption></figure> : <p className="sn-hint">No photo available for this stop in the tour data.</p>}
          <p>{stop.text}</p>
          <p className="sn-hint">About {stop.min} min.{stop.kind === 'food' && stop.amount !== undefined && <> {stop.item}: {tryText(stop.amount)} (demo price, SIMULATION).</>}</p>
        </>)}
        {gid === 'audio' && <><button onClick={() => setNoSpeech(!speak(stopText(stop)))}>🔊 Listen</button>{noSpeech && <p className="sn-hint" role="status">Speech is not available in this browser. Use the text above instead.</p>}</>}
        {gid === 'local' && <p className="sn-hint">Local guide: this is where the guide adds stories. Booking and price are set by the guide, not by this demo.</p>}
      </div>
      <div className="sn-faultpick">
        <button onClick={() => go(i - 1)} disabled={i === 0}>◀ Previous</button>
        <button onClick={() => go(i + 1)} disabled={i === tour.stops.length - 1}>Next ▶</button>
        <button onClick={() => go(0)}>Replay</button>
      </div>
      <p className="sn-hint">Totals: {tour.minutes} min · food {tryText(tour.foodKurus)}{tour.railKurus > 0 && <> · rail estimate {tryText(tour.railKurus)}</>} · local fares follow each city’s tariff in the app (not in the tour data).</p>
    </div>
  )
}
