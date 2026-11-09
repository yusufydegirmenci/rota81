import type { ReactNode } from 'react'
import { photoOf } from './tours'
import { FOTO } from './foto'
import { CENTROIDS } from '../data/places'

export const B = import.meta.env.BASE_URL
export const logo = (n: string) => `${B}marka/${n}.svg`
export const concept = (n: string) => `${B}hedef/${n}.jpg`
export const CITIES = [['06', 'Ankara'], ['26', 'Eskişehir'], ['34', 'İstanbul'], ['35', 'İzmir'], ['07', 'Antalya']] as const

/** A photo by id: Commons photos fetched for this deck (public/foto) or the tour photos already in the repo. Always with author and licence. */
export function ph(id: string): { url: string; credit: string } {
  if (id.startsWith('ai-')) return { url: `${B}foto/${id}.jpg`, credit: 'Concept illustration (AI-generated)' }
  const f = FOTO[id]
  if (f) return { url: `${B}foto/${id}.jpg`, credit: `${f.by}, ${f.lic}` }
  const p = photoOf(id)
  return p ?? { url: '', credit: '' }
}
export const credits = (ids: string[]) => {
  const real = ids.filter((i) => !i.startsWith('ai-')).map((i) => ph(i).credit).filter(Boolean)
  const ai = ids.some((i) => i.startsWith('ai-'))
  return [real.length ? 'Photos: ' + real.join(' · ') + ' · Wikimedia Commons' : '', ai ? 'Concept illustration (AI-generated)' : ''].filter(Boolean).join(' · ')
}

const P: Record<string, string> = {
  bus: 'M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10M5 16h14M5 16v2h2v-2M19 16v2h-2v-2M5 11h14M8.5 13.5h.01M15.5 13.5h.01',
  train: 'M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 10h14M9 21l2-4M15 21l-2-4M9 14h.01M15 14h.01',
  food: 'M6 3v7a2 2 0 0 0 2 2v9M10 3v7M6 6.5h4M17 3c-2 1-3 3.5-3 6.5 0 1.5 1 2.5 3 2.5v9',
  museum: 'M3 9l9-5 9 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18M3 9h18',
  card: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M6.5 15h4',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  map: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM8.5 12l2.5 2.5 4.5-5',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  grad: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7V6a2 2 0 0 1 2-2h12M16 14h2',
  nfc: 'M7 8c2.5 2.5 2.5 5.5 0 8M11 6c4 3.5 4 8.5 0 12M15 4c5.5 4.5 5.5 11.5 0 16',
  sync: 'M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4',
  plane: 'M10.5 13.5L3 11l1-2 8 .5L16 5l2 1-2.5 5 5 .5 1 1.5-1 1-5.5-.5L12 19l-2-1z',
  ferry: 'M3 17l2-6h14l2 6M7 11V7h10v4M2 20c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1',
  tram: 'M7 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 10h14M8 21l1.5-4M16 21l-1.5-4M10 6h4',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.8 2.5 1.8c0 2.4-5 1.2-5 3.7 0 1 1 1.8 2.5 1.8s2.5-.6 2.5-1.5',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
}
export const Ico = ({ n, or, teal }: { n: string; or?: boolean; teal?: boolean }) => (
  <span className={'hk-ico' + (or ? ' or' : '') + (teal ? ' teal' : '')} aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg></span>
)
export const SvgIcon = ({ n, size = 24 }: { n: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={P[n]} /></svg>

/** Thin route strip: where the traveller is. */
export const Trail = ({ at }: { at: number }) => (
  <div className="hk-trail" aria-label={`Traveller is in ${CITIES[at][1]}`}>
    {CITIES.map(([, n], i) => <span key={n} className={i < at ? 'done' : i === at ? 'now' : ''}><i />{n}</span>)}
  </div>
)

export const Tag = ({ t }: { t: 'REAL' | 'DESIGN' | 'SIMULATION' | 'PROPOSAL' | 'ILLUSTRATIVE' }) => <span className="hk-tag" style={{ color: t === 'REAL' ? '#1a7f4b' : t === 'SIMULATION' || t === 'ILLUSTRATIVE' ? '#c25a00' : '#0b2d6b' }}>{t}</span>

interface SP { kick: string; title: string; dark?: boolean; n: number; total: number; at?: number; children: ReactNode; lead?: string; tech?: boolean; bg?: string }
export const Slide = ({ kick, title, dark, n, total, at, children, lead, tech, bg }: SP) => (
  <section className={'hk-slide' + (dark ? ' hk-dark' : '') + (tech ? ' hk-tech' : '')} aria-label={title}>
    {bg && <img className="hk-slidebg" src={ph(bg).url} alt="" />}
    {at !== undefined && <Trail at={at} />}
    <p className="hk-kick">{kick}</p>
    <h2>{title}</h2>
    {lead && <p className="hk-lead">{lead}</p>}
    {children}
    <div className="hk-foot"><img src={logo(dark ? 'FORA_logo-yatay-FORADAS-koyu' : 'FORA_logo-yatay-FORADAS')} alt="FORADAŞ" /><span>{bg ? credits([bg]) + ' · ' : ''}{n} / {total}</span></div>
  </section>
)
export const Pts = ({ items }: { items: ReactNode[] }) => <ul className="hk-pts">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
export const Card = ({ ico, h, t, or, teal }: { ico?: string; h: string; t: string; or?: boolean; teal?: boolean }) => <div className="hk-card">{ico && <Ico n={ico} or={or} teal={teal} />}<h3>{h}</h3><p>{t}</p></div>
export const Flow = ({ steps, hot, vert }: { steps: [string, string][]; hot?: number; vert?: boolean }) => (
  <div className={'hk-flow' + (vert ? ' vert' : '')}>{steps.map(([h, t], i) => <div key={h} className={'hk-step' + (hot === i ? ' hot' : '')} style={{ animationDelay: `${0.15 * i + 0.2}s` }}><i>{i + 1}</i><h3>{h}</h3><p>{t}</p></div>)}</div>
)

/** Dot map of Türkiye from the 81 province centres (src/data/places.ts). `lit` = province ids drawn in orange; `route` joins them in order. Schematic, not a survey map. */
export function DotMap({ lit, route, label, all }: { lit: string[]; route?: boolean; label?: boolean; all?: boolean }) {
  const k = 67, c = Math.cos((39 * Math.PI) / 180)
  const pt2 = (lo: number, la: number): [number, number] => [(lo - 25.7) * c * k + 20, (42.4 - la) * k + 20]
  const pt = (id: string): [number, number] => { const [la, lo] = CENTROIDS[id]; return pt2(lo, la) }
  const ids = Object.keys(CENTROIDS)
  const OUT: [number, number][] = [[26.1, 41.7], [28.0, 41.9], [29.2, 41.3], [31.3, 41.15], [32.6, 42.0], [35.2, 42.05], [36.6, 41.4], [38.4, 40.95], [40.0, 41.0], [41.6, 41.55], [43.4, 41.1], [43.7, 40.2], [44.8, 39.7], [44.4, 38.4], [44.2, 37.2], [42.4, 37.1], [40.0, 36.9], [38.0, 36.8], [36.6, 36.2], [35.9, 36.6], [34.0, 36.2], [32.0, 36.1], [30.5, 36.3], [29.0, 36.6], [27.4, 37.0], [26.6, 38.3], [26.3, 39.4], [26.2, 40.0], [27.8, 40.4], [29.0, 40.4], [27.2, 40.7], [26.6, 40.9]]
  const outline = OUT.map(([lo, la]) => pt2(lo, la).join(',')).join(' ')
  return (
    <svg viewBox="0 0 1000 440" width="100%" role="img" aria-label="Schematic map of Türkiye: one dot per province" style={{ maxHeight: '100%' }}>
      <polygon points={outline} fill="#123a82" stroke="#2a5aa8" strokeWidth="3" strokeLinejoin="round" opacity=".7" />
      {ids.map((id, i) => { const [x, y] = pt(id); const on = lit.includes(id); return on ? null : <circle key={id} cx={x} cy={y} r="6" className={all ? 'hk-dot all' : 'hk-dot'} style={all ? { animationDelay: `${(i % 27) * 0.06 + 0.3}s` } : undefined} /> })}
      {route && <polyline points={lit.map((id) => pt(id).join(',')).join(' ')} fill="none" stroke="#ff7a00" strokeWidth="4" strokeDasharray="10 9" strokeLinecap="round" strokeLinejoin="round" />}
      {lit.map((id) => { const [x, y] = pt(id); const name = CITIES.find(([i]) => i === id)?.[1]; return (
        <g key={id}><circle cx={x} cy={y} r="13" fill="#ff7a00" stroke="#fff" strokeWidth="4" />
          {label && name && <text x={x} y={y + (id === '07' ? 40 : -22)} textAnchor="middle" fill="#fff" fontSize="27" fontWeight="700" fontFamily="Geist, sans-serif" stroke="#0b2d6b" strokeWidth="6" paintOrder="stroke">{name}</text>}</g>) })}
    </svg>
  )
}

/** Symbolic card render (not a real card design): FORA colours, chip, contactless waves. */
export function CardArt({ w = 560 }: { w?: number }) {
  return (
    <svg viewBox="0 0 560 354" width="100%" style={{ maxWidth: w, filter: 'drop-shadow(0 24px 36px rgba(7,29,71,.35))' }} role="img" aria-label="Symbolic design of the shared transport card">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#16408a" /><stop offset="1" stopColor="#071d47" /></linearGradient><linearGradient id="chip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc26b" /><stop offset="1" stopColor="#ff7a00" /></linearGradient></defs>
      <rect width="560" height="354" rx="30" fill="url(#cg)" />
      <path d="M0 250 C140 200 260 330 560 230 L560 324 a30 30 0 0 1-30 30 H30 a30 30 0 0 1-30-30z" fill="#ff7a00" opacity=".9" />
      <rect x="52" y="76" width="82" height="62" rx="11" fill="url(#chip)" /><path d="M52 107h82M93 76v62" stroke="#b25400" strokeWidth="2" opacity=".6" />
      <path d="M168 92q30 20 0 44M190 82q44 30 0 66M212 72q58 40 0 88" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".85" />
      <image href={logo('FORA_amblem-beyaz-koyu-zemin')} x="420" y="40" width="96" height="96" />
      <text x="52" y="286" fill="#fff" fontSize="34" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">FORADAŞ</text>
      <text x="52" y="314" fill="#fff" fontSize="17" fontWeight="600" fontFamily="Geist, sans-serif" opacity=".9">81 İL, BİR YOL, HEP BERABER.</text>
    </svg>
  )
}
