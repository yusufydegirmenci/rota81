import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CITY_LABEL, PLACES, TOUR, TOUR_CITIES, type Place, type Source, type TourStep } from '../data/tour'
import { TL } from '../services/api'
import { Viewer3D, type SceneBuilder, type StepDef } from '../sunum/three/Viewer3D'
import { TAP_STEPS, buildTap } from '../sunum/three/tap'
import { JOURNEY_STEPS, buildJourney } from '../sunum/three/journey'
import { RESTAURANT_STEPS, buildRestaurant } from '../sunum/three/restaurant'
import { RENTAL_STEPS, buildRental } from '../sunum/three/rentalScene'
import { GUIDES } from '../sunum/tours'
import { useSafe } from '../sunum/safe'
import { FACTS, Picture, imgOf } from './tourMedia'

/** Tour as a presentation: every TOUR step becomes a short scene that reuses the presentation's 3D components (no copies). Read-only: the wallet is only charged in List mode. */
export type Lang = 'tr' | 'en'
type Kind = 'tap' | 'ride' | 'sight' | 'dine' | 'pay' | 'rental' | 'guide'
export interface Scene { id: string; kind: Kind; city: string; src: Source; title: Record<Lang, string>; text: Record<Lang, string>; detail: Record<Lang, string>; place?: Place; ride?: 'bus' | 'metro' | 'rail'; step?: TourStep }

const MODE_EN: Record<string, string> = { tram: 'tram', metro: 'metro', bus: 'bus', ferry: 'ferry', rail: 'rail' }
const dest = (to: string | [number, number]) => (typeof to === 'string' ? PLACES[to]?.title ?? to : '')
const MIN = (m: number) => `${m} min`

export function buildScenes(): Scene[] {
  const out: Scene[] = []
  const diners = new Set<string>()
  TOUR.forEach((st, i) => {
    const id = `s${i}`
    switch (st.k) {
      case 'topup':
        out.push({ id, kind: 'tap', city: st.city, src: 'SENARYO', step: st, title: { tr: st.title, en: 'Load the visitor card' }, text: { tr: `${TL(st.amount)} yüklenir (simülasyon). Kartı okutmak bir radyo alanı, bir yazılım isteği ve bir bakiye kontrolüdür.`, en: `${TL(st.amount)} is loaded (simulation). A tap is a radio field, a software request and a balance check.` }, detail: { tr: st.note, en: 'The visitor tops up with a foreign bank card at the airport or in the app (simulation, no real payment). The top-up is idempotent and recorded in the ledger.' } })
        break
      case 'local': {
        const metro = st.prefer.includes('metro') && st.prefer.length === 1
        const to = dest(st.to)
        out.push({ id, kind: 'ride', ride: metro ? 'metro' : 'bus', city: st.city, src: 'GERÇEK', step: st, title: { tr: st.title, en: `By ${st.prefer.map((m) => MODE_EN[m]).join(' / ')}${to ? ` to ${to}` : ''}` }, text: { tr: `Yaklaşık ${st.min} dk. Tek kartla binilir; ücreti şehrin tarifesi belirler.`, en: `About ${MIN(st.min)}. One card boards every mode; the city tariff sets the fare.` }, detail: { tr: `${st.note || 'Biniş durağı, gezilecek yere en yakın hat bağlantılı gerçek duraktan seçilir.'} (Liste görünümünde kart zincirini adım adım görürsünüz.)`, en: 'The boarding stop is chosen from real stop and line data, nearest to the destination. Switch to List view to run the nine-step card chain for this leg.' } })
        break
      }
      case 'scenario':
        out.push({ id, kind: 'ride', ride: 'rail', city: st.city, src: st.src, step: st, title: { tr: st.title, en: `${st.operator}: ${st.from} → ${st.to}` }, text: { tr: `${st.from} → ${st.to}, yaklaşık ${st.min} dk, ${TL(st.fare)} (tahmin).`, en: `${st.from} → ${st.to}, about ${MIN(st.min)}, ${TL(st.fare)} (estimate).` }, detail: { tr: st.note, en: 'Stations are real; the timetable and fare are an estimate from distance. There is no real operator integration.' } })
        break
      case 'sight': {
        const p = PLACES[st.place]
        out.push({ id, kind: 'sight', city: st.city, src: 'GERÇEK', step: st, place: p, title: { tr: p.title, en: p.title }, text: { tr: p.tr, en: p.en }, detail: { tr: `Ziyaret süresi yaklaşık ${st.min} dk. ${FACTS[p.id]?.ozet_en ? '' : 'Bu yer için kayıtlı ek özet yok.'}`, en: FACTS[p.id]?.ozet_en || `About ${MIN(st.min)} to visit. No extra summary on file for this place.` } })
        break
      }
      case 'food': {
        const p = PLACES[st.place]
        const first = !diners.has(st.city); diners.add(st.city)
        if (first) out.push({ id: id + 'd', kind: 'dine', city: st.city, src: 'TAHMİN', step: st, place: p, title: { tr: `Yerel restoran: ${p.title}`, en: `A local restaurant: ${p.title}` }, text: { tr: p.tr, en: p.en }, detail: { tr: 'İç mekân ve menü örnek bir restorandır (simülasyon). Menü fotoğrafları künyeleriyle gösterilir.', en: 'The interior and menu are a sample restaurant (simulation). Menu photos carry their credits.' } })
        out.push({ id, kind: 'pay', city: st.city, src: 'TAHMİN', step: st, place: p, title: { tr: `${p.title}: kartla öde`, en: `${p.title}: pay with the card` }, text: { tr: `${st.merchant} · ${st.item} · ${TL(st.amount)} (örnek fiyat).`, en: `${st.merchant} · ${st.item} · ${TL(st.amount)} (sample price).` }, detail: { tr: 'Okuma yerel, onay (authorisation) anında, para aktarımı (settlement) daha sonradır. Gerçek ödeme yoktur.', en: 'Reading is local, authorisation is immediate, settlement (the money) comes later. No real payment happens.' } })
        break
      }
    }
  })
  const last = TOUR[TOUR.length - 1].city
  out.push({ id: 'rental', kind: 'rental', city: last, src: 'SENARYO', title: { tr: 'İsteğe bağlı: araba kiralama', en: 'Optional: rent a car with the same card' }, text: { tr: 'Aynı kartla kiralama: bul, aç, sür, iade et; ücret ve depozito (hold) şeffaf.', en: 'The same card rents a car: find, unlock, drive, return. Fee and deposit hold are transparent.' }, detail: { tr: 'Tamamı simülasyon; ücret motoru src/sunum/three/rental.ts içindedir.', en: 'Entirely simulated. The fee engine is in src/sunum/three/rental.ts.' } })
  out.push({ id: 'guide', kind: 'guide', city: last, src: 'SENARYO', title: { tr: 'Rehber seçeneği', en: 'Choose a guide option' }, text: { tr: 'Sesli rehber, yerel rehber veya kendi hızında.', en: 'Audio guide, local guide or self-paced.' }, detail: { tr: 'Üç seçenek de aynı turu anlatır; yalnızca anlatım ve tempo değişir.', en: 'All three options tell the same tour; only the narration and the pace change.' } })
  return out
}

/** Reuses a presentation scene builder on a slice of its steps: the updater simply receives the original step index. */
const offsetBuild = (b: SceneBuilder, off: number): SceneBuilder => (m) => { const u = b(m); return (t, s, tech) => u(t, s + off, tech) }
interface Cut { steps: StepDef[]; build: SceneBuilder; label: string }
const CUTS: Record<string, Cut> = {
  tap: { steps: TAP_STEPS.slice(0, 6), build: buildTap, label: '3D: tapping the card on a validator' },
  bus: { steps: JOURNEY_STEPS.slice(4, 8), build: offsetBuild(buildJourney, 4), label: '3D: the stop and the arriving bus' },
  metro: { steps: JOURNEY_STEPS.slice(11, 13), build: offsetBuild(buildJourney, 11), label: '3D: from the bus to the metro entrance' },
  rail: { steps: JOURNEY_STEPS.slice(6, 8), build: offsetBuild(buildJourney, 6), label: '3D: boarding at the platform' },
  dine: { steps: RESTAURANT_STEPS.slice(0, 5), build: buildRestaurant(0), label: '3D: the restaurant outside and inside' },
  pay: { steps: RESTAURANT_STEPS.slice(5, 9), build: buildRestaurant(5), label: '3D: paying with the card (simulation)' },
  rental: { steps: RENTAL_STEPS.slice(0, 6), build: buildRental, label: '3D: car rental by card (simulation)' },
}

function MiniMap({ city, cur }: { city: string; cur?: Place }) {
  const ps = Object.values(PLACES).filter((p) => p.city === city)
  if (!ps.length) return null
  const la = ps.map((p) => p.lat), lo = ps.map((p) => p.lon)
  const [a, b, c, d] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)]
  const x = (v: number) => 20 + ((v - c) / (d - c || 1)) * 160, y = (v: number) => 80 - ((v - a) / (b - a || 1)) * 60
  return (
    <svg viewBox="0 0 200 100" className="tsmap" role="img" aria-label={`Map of places in ${CITY_LABEL[city]}${cur ? `; ${cur.title} highlighted` : ''}`}>
      {ps.map((p) => <g key={p.id}><circle cx={x(p.lon)} cy={y(p.lat)} r={p === cur ? 6 : 3.5} fill={p === cur ? 'var(--signal)' : p.kind === 'food' ? 'var(--ok)' : 'var(--ink)'} />{p === cur && <circle cx={x(p.lon)} cy={y(p.lat)} r="11" fill="none" stroke="var(--signal)" className="pulse" />}</g>)}
    </svg>
  )
}

const SRC_TXT: Record<Source, Record<Lang, string>> = { 'GERÇEK': { tr: 'GERÇEK: gerçek durak/yer verisi', en: 'REAL: real stop or place data' }, 'TAHMİN': { tr: 'TAHMİN: gerçek yer, tahmini saat/ücret', en: 'ESTIMATE: real place, estimated time/fare' }, 'SENARYO': { tr: 'SENARYO: ürün fikri, doğrulanmamış', en: 'SCENARIO: product idea, not verified' } }

function SceneBody({ sc, safe }: { sc: Scene; safe: boolean }) {
  const p = sc.place ?? (sc.step && 'to' in sc.step && typeof sc.step.to === 'string' ? PLACES[sc.step.to] : undefined)
  const cut = sc.kind === 'ride' ? CUTS[sc.ride!] : CUTS[sc.kind]
  if (sc.kind === 'guide') return <div className="tsguide">{GUIDES.map((g) => <article key={g.id} className="gcard"><h4>{g.name}</h4><p className="small">{g.what}</p><p className="small muted">{g.pace} {g.price}</p></article>)}</div>
  if (cut && !safe) return <div className="tsviz"><Viewer3D key={sc.id} steps={cut.steps} build={cut.build} label={cut.label} holdMs={3800} autoplay /></div>
  if (sc.kind === 'sight' && sc.place) return <div className="tsphoto"><Picture id={sc.place.id} p={sc.place} /></div>
  return <div className="tsviz">{p && <Picture id={p.id} p={p} />}{cut && <ol className="small">{cut.steps.map((s, i) => <li key={i}><b>{s.title}.</b> {s.text}</li>)}</ol>}</div>
}

export function TourShow({ lang, onList }: { lang: Lang; onList: () => void }) {
  const scenes = useMemo(buildScenes, [])
  const safe = useSafe()
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)
  const [detail, setDetail] = useState(false)
  const [full, setFull] = useState(false)
  const [veil, setVeil] = useState(false)
  const [tick, setTick] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const SCENE_MS = 22000
  const go = useCallback((n: number) => {
    const t = Math.max(0, Math.min(scenes.length - 1, n))
    clearTimeout(timer.current); setVeil(true); setTick(0)
    timer.current = setTimeout(() => { setI(t); setDetail(false); setVeil(false) }, 220)
  }, [scenes.length])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Auto-advance; progress bar fills over SCENE_MS. Pausing keeps the position.
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setTick((v) => { if (v + 250 >= SCENE_MS) { if (i < scenes.length - 1) go(i + 1); else setAuto(false); return 0 } return v + 250 }), 250)
    return () => clearInterval(t)
  }, [auto, i, go, scenes.length])
  const exitFull = useCallback(() => { setFull(false); try { if (document.fullscreenElement) void document.exitFullscreen() } catch { /* unsupported */ } }, [])
  const enterFull = () => { setFull(true); try { void root.current?.requestFullscreen() } catch { /* overlay is enough */ } }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(i + 1) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1) }
      else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(scenes.length - 1)
      else if (e.key === 'p' || e.key === 'P') setAuto((a) => !a)
      else if (e.key === 'f' || e.key === 'F') { full ? exitFull() : enterFull() }
      else if (e.key === 'Escape') { if (full) exitFull(); else onList() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
  useEffect(() => { const h = () => { if (!document.fullscreenElement) setFull(false) }; document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h) }, [])
  const sw = useRef<number | null>(null)
  const sc = scenes[i]
  const city = CITY_LABEL[sc.city]
  const p = sc.place
  const f = p ? FACTS[p.id] : undefined
  const T = lang === 'tr'
  const overall = ((i + (auto ? tick / SCENE_MS : 0)) / scenes.length) * 100
  return (
    <div ref={root} className={`tshow ${full ? 'full' : ''}`} role="region" aria-label={T ? 'Tur sunumu' : 'Tour presentation'}
      onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button,a,summary,details,canvas,.sn-3d,input,select')) { sw.current = null; return } sw.current = e.clientX }}
      onPointerUp={(e) => { if (sw.current === null) return; const dx = e.clientX - sw.current; sw.current = null; if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)) }}>
      <div className="tsbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall)} aria-label={T ? 'Tur ilerlemesi' : 'Tour progress'}><i style={{ width: `${overall}%` }} /></div>
      <div className="tsdots" aria-hidden="true">{scenes.map((s, k) => <span key={s.id} className={k === i ? 'on' : k < i ? 'past' : ''} />)}</div>
      <div className="tscities" role="group" aria-label={T ? 'Şehre git' : 'Jump to city'}>{TOUR_CITIES.map((c) => <button key={c} className={c === sc.city ? 'on' : ''} onClick={() => go(scenes.findIndex((s) => s.city === c))}>{CITY_LABEL[c]}</button>)}</div>
      <div className={`tsstage ${veil ? 'veil' : ''}`}>
        <div className="tsmain"><SceneBody key={sc.id} sc={sc} safe={safe} /></div>
        <aside className="tsside">
          <p className="small mono muted">{city} · {i + 1} / {scenes.length}</p>
          <h2>{sc.title[lang]}</h2>
          <p>{sc.text[lang]}</p>
          {sc.step && sc.step.k === 'food' && <p className="small"><b>{sc.step.merchant}</b> · {sc.step.item} · {TL(sc.step.amount)}</p>}
          {p && <MiniMap city={sc.city} cur={p} />}
          {p && f && <p className="small muted">{T ? 'Foto' : 'Photo'}: {f.yazar} · {f.lisans}</p>}
          {p && !imgOf(p.id) && <p className="small muted">{T ? 'Veri yok: bu yer için serbest lisanslı fotoğraf bulunamadı.' : 'No data: no free-licence photo found for this place.'}</p>}
          <p className="small"><span className="badge">{SRC_TXT[sc.src][lang]}</span></p>
          <button className="btn" aria-expanded={detail} onClick={() => setDetail(!detail)}>{detail ? (T ? 'Detayı kapat' : 'Close detail') : (T ? 'Detay' : 'Detail')}</button>
          {detail && <div className="tsdetail" role="note"><p className="small">{sc.detail[lang]}</p><p className="small muted">{T ? 'Sunum modu salt okunurdur; bakiye yalnızca Liste görünümünde düşer.' : 'Presentation mode is read-only; the balance changes only in List view.'}</p></div>}
        </aside>
      </div>
      <div className="tsctl" role="toolbar" aria-label={T ? 'Tur denetimi' : 'Tour controls'}>
        <button className="btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label={T ? 'Geri' : 'Back'}>←</button>
        <button className="btn accent" onClick={() => setAuto(!auto)} aria-pressed={auto}>{auto ? (T ? 'Duraklat' : 'Pause') : (T ? 'Oynat' : 'Play')}</button>
        <button className="btn" onClick={() => go(i + 1)} disabled={i === scenes.length - 1} aria-label={T ? 'İleri' : 'Next'}>→</button>
        <button className="btn" onClick={full ? exitFull : enterFull}>{full ? (T ? 'Tam ekrandan çık (Esc)' : 'Exit full screen (Esc)') : (T ? 'Tam ekran' : 'Full screen')}</button>
        <button className="btn" onClick={onList}>{T ? 'Liste' : 'List'}</button>
      </div>
    </div>
  )
}
