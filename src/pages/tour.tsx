import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { CENTROIDS } from '../data/places'
import { CITY_LABEL, PLACES, TOUR, TOUR_CITIES, type Place, type TourStep } from '../data/tour'
import { TL } from '../services/api'
import { findBoarding, processPurchase, processScenarioLeg, processTap, type TapResult } from '../services/cardflow'
import { distanceKm } from '../services/intercity'
import { Badge, Card, PageHeader, SimNote } from '../ui/ui'
import { Trace } from './onecard'

interface Fact { baslik: string; ozet_en: string; resim_dosya: string; yazar: string; lisans: string; kaynak_url: string }
const FACTS = (Object.values(import.meta.glob('../data/tour/facts.json', { eager: true, import: 'default' }))[0] ?? {}) as Record<string, Fact>
const IMGS = import.meta.glob('../data/tour/img/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const imgOf = (id: string) => IMGS[`../data/tour/img/${id}.jpg`]

interface Done { step: TourStep; label: string; result?: TapResult; at: string; day: number; src: string; boarding?: string }

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function Picture({ id, p }: { id: string; p: Place }) {
  const src = imgOf(id)
  const f = FACTS[id]
  if (src) return <figure className="pic"><img src={src} alt={p.title} loading="lazy" />{f && <figcaption>{f.yazar} · {f.lisans} · <a href={f.kaynak_url} target="_blank" rel="noreferrer">kaynak</a></figcaption>}</figure>
  return <div className="pic ph" aria-hidden="true"><span>{p.kind === 'food' ? 'YEMEK' : 'GEZİ'}</span><b>{p.title}</b></div>
}

function TourMap({ cityIdx, doneCities }: { cityIdx: number; doneCities: Set<string> }) {
  const pts = TOUR_CITIES.map((c) => ({ c, la: CENTROIDS[c][0], lo: CENTROIDS[c][1] }))
  const W = 520, H = 240
  const x = (lo: number) => 30 + ((lo - 28) / (34 - 28)) * (W - 60)
  const y = (la: number) => 20 + ((42 - la) / (42 - 37)) * (H - 40)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.lo).toFixed(0)} ${y(p.la).toFixed(0)}`).join(' ')
  const cur = pts[Math.min(cityIdx, pts.length - 1)]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tourmap" role="img" aria-label="Tur rotası: İstanbul, Kocaeli, Ankara, Konya">
      <path d={path} fill="none" stroke="var(--line)" strokeWidth="2" />
      <path d={path} fill="none" stroke="var(--signal)" strokeWidth="2" strokeDasharray="6 7" className="ln" />
      {pts.map((p) => (
        <g key={p.c}>
          <circle cx={x(p.lo)} cy={y(p.la)} r={doneCities.has(p.c) ? 8 : 5} fill={doneCities.has(p.c) ? 'var(--signal)' : 'var(--bg)'} stroke="var(--ink)" strokeWidth="2" />
          <text x={x(p.lo)} y={y(p.la) - 14} textAnchor="middle" fontSize="13" fontFamily="var(--f-mono)" fill="currentColor">{CITY_LABEL[p.c]}</text>
        </g>
      ))}
      <circle cx={x(cur.lo)} cy={y(cur.la)} r="13" fill="none" stroke="var(--signal)" strokeWidth="2" className="pulse" />
    </svg>
  )
}

/** Turist rehberi: tek kartla İstanbul – Kocaeli – Ankara – Konya turu. Her adım gerçek durak/hat verisiyle ve aynı cüzdanla çalışır. */
export function TourPage() {
  const { api, session, run } = useApp()
  const [done, setDone] = useState<Done[]>([])
  const [play, setPlay] = useState(false)
  const [lang, setLang] = useState<'tr' | 'en'>('en')
  const [clock, setClock] = useState({ day: 1, min: 9 * 60 })
  const seq = useRef(0)
  const next = TOUR[done.length] as TourStep | undefined
  const w = api.wallet.get(session)

  const exec = () => {
    const st = TOUR[done.length]
    if (!st) return
    seq.current += 1
    const key = `tour-${Date.now()}-${seq.current}`
    let min = clock.min + ('min' in st ? st.min : 0)
    let day = clock.day
    if (min > 21 * 60) { day += 1; min = 9 * 60 + ('min' in st ? st.min : 0) }
    let entry: Done | null = null
    const at = `Gün ${day} · ${hhmm(min)}`
    if (st.k === 'topup') {
      const tx = run(() => api.wallet.topUp(session, st.amount, key), `${TL(st.amount)} yüklendi (simülasyon)`)
      if (!tx) { setPlay(false); return }
      entry = { step: st, label: st.title, at, day, src: 'SENARYO' }
    } else if (st.k === 'local') {
      const target: [number, number] = typeof st.to === 'string' ? [PLACES[st.to].lat, PLACES[st.to].lon] : st.to
      const b = findBoarding(api, st.city, target[0], target[1], st.prefer)
      if (!b) { entry = { step: st, label: st.title, at, day, src: 'SENARYO' } } else {
        const r = run(() => processTap(api, session, { cityId: st.city, stopId: b.stop.id, routeId: b.routeId, passenger: 'full' }, key))
        if (!r) { setPlay(false); return }
        entry = { step: st, label: st.title, result: r, at, day, src: b.stop.real ? 'GERÇEK' : 'SENARYO', boarding: `${b.stop.name} (${b.stop.code}) · hedefe ${(b.km * 1000).toFixed(0)} m${b.routeId ? '' : ' · bu durakta hat kaydı yok'}` }
      }
    } else if (st.k === 'scenario') {
      const r = run(() => processScenarioLeg(api, session, { cityId: st.city, mode: st.mode, operator: st.operator, from: st.from, to: st.to, fare: st.fare, note: st.note }, key))
      if (!r) { setPlay(false); return }
      entry = { step: st, label: st.title, result: r, at, day, src: st.src }
    } else if (st.k === 'food') {
      const r = run(() => processPurchase(api, session, { cityId: st.city, merchant: st.merchant, item: st.item, amount: st.amount }, key))
      if (!r) { setPlay(false); return }
      entry = { step: st, label: PLACES[st.place].title, result: r, at, day, src: 'TAHMİN' }
    } else {
      entry = { step: st, label: PLACES[st.place].title, at, day, src: 'GERÇEK' }
    }
    setClock({ day, min })
    setDone((d) => [...d, entry!])
    if (done.length + 1 >= TOUR.length) setPlay(false)
  }
  const execRef = useRef(exec); execRef.current = exec
  useEffect(() => {
    if (!play) return
    const t = setInterval(() => execRef.current(), 1600)
    return () => clearInterval(t)
  }, [play])

  const spent = done.reduce((a, d) => a + (d.result?.paid ?? 0), 0)
  const byCity = new Map<string, { paid: number; taps: number; sights: number; meals: number }>()
  TOUR_CITIES.forEach((c) => byCity.set(c, { paid: 0, taps: 0, sights: 0, meals: 0 }))
  const byOp = new Map<string, number>()
  done.forEach((d) => {
    const c = byCity.get(d.step.city)!
    if (d.result?.ok) { c.paid += d.result.paid; if (d.step.k === 'food') c.meals += 1; else c.taps += 1; byOp.set(`${d.result.operator} · ${CITY_LABEL[d.step.city]}`, (byOp.get(`${d.result.operator} · ${CITY_LABEL[d.step.city]}`) ?? 0) + d.result.paid) }
    if (d.step.k === 'sight') c.sights += 1
  })
  const doneCities = new Set(done.map((d) => d.step.city))
  const cityIdx = next ? TOUR_CITIES.indexOf(next.city) : TOUR_CITIES.length - 1
  let railKm = 0
  done.forEach((d) => { if (d.step.k === 'scenario') railKm += Math.round(distanceKm(d.step.from.includes('İzmit') ? '41' : d.step.from.includes('Ankara') ? '06' : '42', d.step.to.includes('İzmit') ? '41' : d.step.to.includes('Ankara') ? '06' : '42') * 1.2) })
  const co2Saved = Math.round(railKm * (0.17 - 0.04) * 10) / 10

  return (
    <div className="stack">
      <PageHeader title="Türkiye turu: tek kart, dört şehir" sub="İstanbul, Kocaeli, Ankara ve Konya'yı yalnızca bu kartla gezin: tramvay, metro, Marmaray, hızlı tren, otobüs ve yemek ödemeleri. Gidiş-dönüş." actions={
        <div className="row">
          <div className="langsw" role="group" aria-label="Rehber dili"><button className={lang === 'tr' ? 'on' : ''} onClick={() => setLang('tr')}>TR</button><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button></div>
        </div>} />
      <div className="grid2">
        <div className="stack">
          <TourMap cityIdx={cityIdx} doneCities={doneCities} />
          <div className="row">
            <button className="btn accent" onClick={() => setPlay(!play)} disabled={!next}>{play ? 'Duraklat' : done.length ? 'Devam et' : 'Turu başlat'}</button>
            <button className="btn" onClick={exec} disabled={!next || play}>Sıradaki adım</button>
            <span className="muted small">{done.length} / {TOUR.length} adım</span>
          </div>
          <div className="occ" aria-hidden="true"><div className="occfill mid" style={{ width: `${(done.length / TOUR.length) * 100}%` }} /></div>
        </div>
        <div className="stack">
          <div className="statsrow">
            <div className="statbox"><h3>Kart bakiyesi</h3><p className="v">{TL(w.wallet.balance)}</p></div>
            <div className="statbox"><h3>Tur harcaması</h3><p className="v">{TL(spent)}</p></div>
            <div className="statbox"><h3>Saat</h3><p className="v">{hhmm(clock.min)}</p><p className="hint">Gün {clock.day}</p></div>
          </div>
          <div className="stamps" aria-label="Şehir damgaları">{TOUR_CITIES.map((c) => <span key={c} className={doneCities.has(c) ? 'on' : ''}>{CITY_LABEL[c]}</span>)}</div>
          <SimNote>Her durak ve hat gerçek veridir (İstanbul: İETT + OpenStreetMap, diğer şehirler: OpenStreetMap). <b>GERÇEK</b>: gerçek durak/hat. <b>TAHMİN</b>: gerçek istasyonlar, tahmini saat ve ücret. <b>SENARYO</b>: verisi doğrulanamayan öğe. Yemek fiyatları ve işletmeler örnektir.</SimNote>
        </div>
      </div>

      <section aria-label="Tur adımları">
        <ol className="tourlist">
          {TOUR.map((st, i) => {
            const d = done[i]
            const isNow = i === done.length
            const place = 'place' in st ? PLACES[st.place] : null
            return (
              <li key={i} className={`${d ? 'done' : isNow ? 'now' : 'todo'} ${st.k}`}>
                <div className="thead">
                  <span className="tcity">{CITY_LABEL[st.city]}</span>
                  <b>{place ? place.title : ('title' in st ? st.title : '')}</b>
                  {d && <Badge tone={d.src === 'GERÇEK' ? 'ok' : d.src === 'TAHMİN' ? 'warn' : 'info'}>{d.src}</Badge>}
                  {d && <span className="muted small mono">{d.at}</span>}
                  {d?.result && <span className="money small">{d.result.ok ? `−${TL(d.result.paid)}` : 'reddedildi'}</span>}
                </div>
                {d && d.boarding && <p className="small muted">Biniş: {d.boarding}</p>}
                {d && place && (
                  <div className="placecard">
                    <Picture id={place.id} p={place} />
                    <div>
                      <p>{lang === 'en' ? place.en : place.tr}</p>
                      {lang === 'en' && FACTS[place.id]?.ozet_en && <p className="small muted" style={{ marginTop: 6 }}>{FACTS[place.id].ozet_en}</p>}
                      {st.k === 'food' && <p className="small" style={{ marginTop: 6 }}><b>{st.merchant}</b> · {st.item} · {TL(st.amount)}</p>}
                    </div>
                  </div>
                )}
                {d?.result && <details><summary>Kart işleyişi (adım adım)</summary><Trace steps={d.result.steps} /></details>}
                {!d && !isNow && 'note' in st && st.note && <p className="small muted">{st.note}</p>}
              </li>
            )
          })}
        </ol>
      </section>

      <Card title="Sonuç: şehir bazında">
        <div className="tablewrap"><table><thead><tr><th>Şehir</th><th>Ulaşım geçişi</th><th>Gezilen yer</th><th>Yemek</th><th>Harcama</th></tr></thead>
          <tbody>{TOUR_CITIES.map((c) => { const v = byCity.get(c)!; return <tr key={c}><td><b>{CITY_LABEL[c]}</b></td><td>{v.taps}</td><td>{v.sights}</td><td>{v.meals}</td><td className="money">{TL(v.paid)}</td></tr> })}</tbody></table></div>
        <p className="small muted" style={{ marginTop: 8 }}>Tahmini karbon tasarrufu (trenle, araca göre): <b>{co2Saved} kg CO₂</b> · tren {railKm} km. (Yaklaşık emisyon katsayıları: araç 0,17, tren 0,04 kg/km.)</p>
      </Card>
      <Card title="Gün sonu mahsuplaşma: kime ne ödendi?">
        {byOp.size === 0 ? <p className="muted">Tur başlayınca dolar.</p> : [...byOp].map(([k, v]) => <p key={k} className="small" style={{ padding: '4px 0', borderBottom: '1px solid var(--line2)' }}><span className="money">{TL(v)}</span> → {k}</p>)}
      </Card>
      <Card title="Yöntem ve sınırlar">
        <ul className="small" style={{ paddingLeft: '1.1rem', display: 'grid', gap: 6 }}>
          <li><b>Veri:</b> durak ve hatlar İETT açık verisi (İBB, CC BY 4.0) ve © OpenStreetMap contributors (ODbL). Biniş durağı, gezilecek yere en yakın hat bağlantılı durak olarak algoritmik seçilir.</li>
          <li><b>Kart:</b> her biniş 9 adımlı zincirden geçer (kart, il, hat, tarife, aktarma, bakiye, defter, mahsuplaşma, makbuz); ayrıntısı her adımda açılır ve docs/KART_ALGORITMASI.md içindedir.</li>
          <li><b>Sınırlar:</b> sefer saatleri, tren/otobüs ücretleri ve yemek fiyatları tahmindir; gerçek ödeme ve doğrulayıcı yoktur. Konya–Ankara gibi iller arası saat/ücret mesafeden tahmin edilir.</li>
        </ul>
      </Card>
    </div>
  )
}
