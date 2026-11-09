import { useEffect, useMemo, useState } from 'react'
import type { Flow, Scene, Tag } from './types'

export const TAG_LABEL: Record<Tag, string> = { LOCAL: 'Local, on the device', BACKEND: 'Needs the backend', PHYSICAL: 'Physical layer', SIMULATED: 'Simulated in this project', STANDARD: 'Real-world standard', DESIGN: 'Project design decision' }
const TagPill = ({ t }: { t?: Tag }) => (t ? <span className={`sn-tag t-${t}`}>{TAG_LABEL[t]}</span> : null)

/* ───────────── Generic flow diagram: nodes, edges, one highlighted step at a time ───────────── */
export function FlowView({ flow, step }: { flow: Flow; step: number }) {
  const s = flow.steps[Math.min(step, flow.steps.length - 1)]
  const byId = useMemo(() => Object.fromEntries(flow.nodes.map((n) => [n.id, n])), [flow])
  const H = flow.height ?? 340
  const pt = (id: string) => { const n = byId[id]; return [n.x, n.y] as const }
  const hot = (a: string, b: string) => s.edges?.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  const lead = s.edges?.[0]
  return (
    <div className="sn-flow">
      <svg viewBox={`0 0 960 ${H}`} role="img" aria-label={s.title}>
        <defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="currentColor" /></marker></defs>
        {flow.edges.map(([a, b]) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} className={`sn-edge ${hot(a, b) ? 'hot' : ''}`} /> })}
        {lead && (() => { const [x1, y1] = pt(lead[0]), [x2, y2] = pt(lead[1]); return <circle key={step} r="7" className="sn-packet" style={{ ['--x1' as string]: `${x1}px`, ['--y1' as string]: `${y1}px`, ['--x2' as string]: `${x2}px`, ['--y2' as string]: `${y2}px` }} /> })()}
        {flow.nodes.map((n) => {
          const on = s.active.includes(n.id), bad = s.fail?.includes(n.id), w = n.w ?? 128
          return (
            <g key={n.id} transform={`translate(${n.x - w / 2},${n.y - 24})`} className={`sn-node k-${n.kind ?? 'service'} ${on ? 'on' : ''} ${bad ? 'bad' : ''}`}>
              <rect width={w} height={48} rx={10} />
              <text x={w / 2} y={n.sub ? 21 : 29} textAnchor="middle" className="nl">{n.label}</text>
              {n.sub && <text x={w / 2} y={37} textAnchor="middle" className="ns">{n.sub}</text>}
            </g>
          )
        })}
      </svg>
      <div className="sn-caption" aria-live="polite">
        <div className="sn-capn">Step {Math.min(step, flow.steps.length - 1) + 1} / {flow.steps.length}</div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
        <TagPill t={s.tag} />
        {s.data && <pre className="sn-data">{s.data}</pre>}
      </div>
    </div>
  )
}

/* ───────────── Street scene: the character walks, the bus arrives, she taps ───────────── */
const STREET = [
  { cx: 120, bx: 1200, phone: true },
  { cx: 330, bx: 1200 },
  { cx: 560, bx: 1200 },
  { cx: 560, bx: 620 },
  { cx: 640, bx: 620 },
  { cx: 700, bx: 620, tap: true },
]
export function Person({ x, walking, jacket = 'var(--signal)' }: { x: number; walking?: boolean; jacket?: string }) {
  return (
    <g className={`sn-person ${walking ? 'walk' : ''}`} style={{ transform: `translate(${x}px, 0)` }}>
      <ellipse cx="0" cy="414" rx="22" ry="5" fill="#0003" />
      <rect x="-9" y="372" width="7" height="42" rx="3" fill="#24364a" className="leg l1" />
      <rect x="2" y="372" width="7" height="42" rx="3" fill="#24364a" className="leg l2" />
      <rect x="-15" y="318" width="30" height="62" rx="12" fill={jacket} />
      <rect x="-20" y="322" width="8" height="44" rx="4" fill={jacket} />
      <rect x="12" y="322" width="8" height="44" rx="4" fill={jacket} />
      <circle cx="0" cy="302" r="13" fill="#e6b98d" />
      <path d="M-13 298 q13 -18 26 0 q-13 -6 -26 0z" fill="#3a2418" />
    </g>
  )
}
export function StreetScene({ steps, step }: { steps: { title: string; text: string }[]; step: number }) {
  const i = Math.min(step, STREET.length - 1), s = STREET[i]
  return (
    <div className="sn-flow">
      <svg viewBox="0 0 960 540" role="img" aria-label="Street scene in the city of Marisa">
        <rect width="960" height="540" className="sn-sky" />
        <circle cx="820" cy="90" r="38" fill="#ffd9a0" opacity=".9" />
        {[40, 250, 470, 700].map((x, k) => (
          <g key={x}>
            <rect x={x} y={140 + (k % 2) * 30} width="190" height={250 - (k % 2) * 30} fill={['#e8d5b5', '#d9b99b', '#c9d8d3', '#ecc9a8'][k]} />
            {[0, 1, 2].map((c) => [0, 1].map((r) => <rect key={c + '' + r} x={x + 20 + c * 56} y={165 + (k % 2) * 30 + r * 60} width="34" height="40" fill="#fff6e2" stroke="#8a6f50" />)).flat()}
            <rect x={x + 60} y={330} width="70" height="60" fill="#2f6f77" /><text x={x + 95} y={322} textAnchor="middle" fontSize="13" fill="#14323f" fontWeight="700">{['BAKERY', 'CAFÉ', 'BOOKS', 'FLORIST'][k]}</text>
          </g>
        ))}
        <rect y="390" width="960" height="150" fill="#d8d2c4" /><rect y="430" width="960" height="70" fill="#4a5560" />
        {Array.from({ length: 12 }).map((_, k) => <rect key={k} x={k * 90 + 20} y="462" width="46" height="6" fill="#f4f0e6" />)}
        {/* bus stop with live board */}
        <g transform="translate(520,250)"><rect x="0" y="0" width="8" height="140" fill="#14323f" /><rect x="-4" y="0" width="150" height="10" fill="#14323f" /><rect x="8" y="10" width="136" height="80" fill="#9bd1d6" opacity=".35" stroke="#14323f" />
          <rect x="14" y="20" width="124" height="46" rx="4" fill="#0d2029" /><text x="22" y="38" fontSize="12" fill="#ffb27a" fontFamily="monospace">STOP 0417 · Old Town</text><text x="22" y="56" fontSize="13" fill="#7ee0a8" fontFamily="monospace">{i >= 3 ? 'Line 12 · NOW' : 'Line 12 · 2 min'}</text></g>
        {/* bus */}
        <g style={{ transform: `translate(${s.bx}px, 0)` }} className="sn-bus">
          <rect x="0" y="300" width="330" height="120" rx="14" fill="#ef5f26" /><rect x="0" y="372" width="330" height="14" fill="#c44a18" />
          {[20, 90, 160, 230].map((x) => <rect key={x} x={x} y="318" width="56" height="42" rx="5" fill="#cfeaee" />)}
          <rect x="290" y="318" width="30" height="86" rx="4" fill="#cfeaee" /><rect x="14" y="304" width="150" height="8" rx="4" fill="#fff" opacity=".9" /><text x="22" y="311" fontSize="8" fill="#14323f" fontWeight="700">12 · CITY CENTRE</text>
          <circle cx="70" cy="420" r="22" fill="#14323f" /><circle cx="70" cy="420" r="9" fill="#9aa5ad" /><circle cx="260" cy="420" r="22" fill="#14323f" /><circle cx="260" cy="420" r="9" fill="#9aa5ad" />
          <g transform="translate(288,350)"><rect width="22" height="34" rx="4" fill="#0d2029" stroke="#fff" /><rect x="4" y="5" width="14" height="9" fill={s.tap ? '#35d07f' : '#223'} /><circle cx="11" cy="24" r="3" fill={s.tap ? '#35d07f' : '#667'} /></g>
        </g>
        <Person x={s.cx} walking={i === 1 || i === 4} />
        {s.phone && (
          <g transform="translate(160,170)"><rect width="150" height="190" rx="16" fill="#0d2029" stroke="#fff" strokeWidth="3" /><rect x="10" y="14" width="130" height="162" rx="8" fill="#fdf8ef" />
            <text x="20" y="38" fontSize="11" fill="#14323f" fontWeight="700">FORADAŞ</text><text x="20" y="62" fontSize="20" fill="#14323f" fontFamily="monospace">₺ 412,50</text>
            <rect x="20" y="76" width="110" height="34" rx="6" fill="#ef5f26" /><text x="30" y="98" fontSize="11" fill="#fff">Home → Old Town</text>
            <text x="20" y="130" fontSize="10" fill="#3f5963">Line 12 · 4 stops · 11 min</text><text x="20" y="146" fontSize="10" fill="#3f5963">Fare ₺ 17,50 · transfer free</text></g>
        )}
        <rect x="0" y="480" width="960" height="60" fill="none" />
      </svg>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">Scene {i + 1} / {steps.length}</div><h3>{steps[i]?.title}</h3><p>{steps[i]?.text}</p></div>
    </div>
  )
}

/* ───────────── Card anatomy (exploded) ───────────── */
const LAYERS = [
  { n: 'Overlay (clear PVC/PET-G)', d: 'Scratch-resistant protective film over the print.', c: '#cfeaee' },
  { n: 'Printed layer', d: 'Branding, card number, tactile mark. Offset or digital print.', c: '#fdf8ef' },
  { n: 'Inlay: antenna + chip module', d: 'Etched or wire-embedded copper coil connected to the chip module.', c: '#e8c27a' },
  { n: 'Core substrate (PVC / PET)', d: 'Carries the inlay; sets stiffness. 0.76 mm total card thickness (ISO/IEC 7810 ID-1).', c: '#d9e4e6' },
  { n: 'Bottom printed layer + overlay', d: 'Back print, signature or help text, protective film.', c: '#fdf8ef' },
]
export function CardScene({ step }: { step: number }) {
  const open = Math.min(step, 4) / 4
  const sel = Math.min(step, 4)
  return (
    <div className="sn-flow">
      <svg viewBox="0 0 960 400" role="img" aria-label="Exploded view of a contactless card">
        {LAYERS.map((l, i) => {
          const gap = open * 62
          const y = 40 + i * (24 + gap)
          const hot = i === sel
          return (
            <g key={l.n} className={`sn-layer ${hot ? 'on' : ''}`} style={{ transition: 'transform .7s', transform: `translate(${300 - i * 6}px, ${y}px)` }}>
              <path d="M0 40 L60 0 L330 0 L270 40z" fill={l.c} stroke="#14323f" strokeWidth="1.5" opacity={hot || open < .1 ? 1 : .8} />
              <path d="M0 40 L270 40 L270 52 L0 52z" fill="#14323f" opacity=".25" />
              {i === 2 && <g><path d="M70 30 L108 8 L230 8 L196 30z" fill="none" stroke="#b8741a" strokeWidth="2.4" /><path d="M92 26 L116 12 L214 12 L186 26z" fill="none" stroke="#b8741a" strokeWidth="2.4" /><rect x="112" y="12" width="34" height="18" fill="#2a2f36" stroke="#d9a441" /></g>}
              <text x="-20" y="30" textAnchor="end" className="sn-lab">{i + 1}. {l.n.split(' (')[0]}</text>
            </g>
          )
        })}
      </svg>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">Layer {sel + 1} / 5</div><h3>{LAYERS[sel].n}</h3><p>{LAYERS[sel].d}</p><TagPill t="DESIGN" /></div>
    </div>
  )
}

/* ───────────── NFC field and load modulation ───────────── */
const NFC_STEPS = [
  { t: '1 · The reader creates a magnetic field', d: 'A driver circuit pushes a 13.56 MHz alternating current through the reader coil. The coil produces an alternating magnetic field that is strongest within a few centimetres.', tag: 'PHYSICAL' as Tag },
  { t: '2 · The card coil harvests energy', d: 'The card antenna sits inside that field. By Faraday induction a voltage appears across its coil; a rectifier turns it into DC power for the chip. The card has no battery.', tag: 'PHYSICAL' as Tag },
  { t: '3 · The reader talks: modulation', d: 'The reader changes (modulates) the field amplitude to encode bits. For ISO/IEC 14443 Type A the reader uses 100% ASK with Modified Miller coding at 106 kbit/s.', tag: 'STANDARD' as Tag },
  { t: '4 · The card answers: load modulation', d: 'The card cannot transmit its own field. It switches an internal load on and off, which slightly changes the reader field. The reader detects this change as a subcarrier signal (Type A: 847 kHz, Manchester coding at 106 kbit/s).', tag: 'STANDARD' as Tag },
  { t: '5 · Frames become commands', d: 'Above the signal layer sits the protocol: anti-collision, card selection, then ISO/IEC 7816-4 style APDU commands (SELECT, READ, signed counters). This is where applications and security begin.', tag: 'STANDARD' as Tag },
]
export function NfcScene({ step }: { step: number }) {
  const i = Math.min(step, NFC_STEPS.length - 1), s = NFC_STEPS[i]
  const amp = (k: number) => (i >= 2 && Math.floor(k / 6) % 2 ? 0.55 : 1)
  const wave = Array.from({ length: 48 }, (_, k) => `${k === 0 ? 'M' : 'L'}${20 + k * 18} ${60 - Math.sin(k * 1.5) * 26 * amp(k)}`).join(' ')
  const resp = Array.from({ length: 48 }, (_, k) => `${k === 0 ? 'M' : 'L'}${20 + k * 18} ${60 - Math.sin(k * 1.5) * (26 + (i >= 3 && Math.floor(k / 3) % 2 ? 4 : 0))}`).join(' ')
  return (
    <div className="sn-flow">
      <svg viewBox="0 0 960 400" role="img" aria-label="NFC magnetic field between reader and card">
        <g transform="translate(60,70)"><rect width="150" height="230" rx="14" fill="#14323f" /><circle cx="75" cy="115" r="48" fill="none" stroke="#e8c27a" strokeWidth="5" /><circle cx="75" cy="115" r="34" fill="none" stroke="#e8c27a" strokeWidth="5" /><circle cx="75" cy="115" r="20" fill="none" stroke="#e8c27a" strokeWidth="5" /><text x="75" y="210" textAnchor="middle" fill="#fff" fontSize="14">Reader coil</text></g>
        {[1, 2, 3, 4, 5].map((k) => <ellipse key={k} cx="210" cy="185" rx={30 + k * 56} ry={20 + k * 34} fill="none" stroke="#0e7c86" strokeWidth="2" opacity={i >= 0 ? .65 - k * .1 : 0} className="sn-field" style={{ animationDelay: `${k * .25}s` }} />)}
        <g transform="translate(540,100)"><rect width="260" height="170" rx="14" fill="#fdf8ef" stroke="#14323f" strokeWidth="2" /><rect x="40" y="40" width="180" height="90" rx="8" fill="none" stroke="#b8741a" strokeWidth="5" /><rect x="50" y="50" width="160" height="70" rx="6" fill="none" stroke="#b8741a" strokeWidth="5" /><rect x="105" y="68" width="50" height="34" fill="#2a2f36" stroke="#d9a441" /><circle cx="130" cy="85" r={i >= 1 ? 9 : 0} fill="#35d07f" className="sn-pulse" /><text x="130" y="152" textAnchor="middle" fontSize="13" fill="#14323f">Card: antenna + chip</text></g>
        <g transform="translate(0,300)"><text x="20" y="14" fontSize="12" fill="currentColor">Reader field (13.56 MHz carrier{i >= 2 ? ', amplitude modulated' : ''})</text><path d={wave} transform="translate(0,16)" fill="none" stroke="#ef5f26" strokeWidth="2" opacity={i >= 2 ? 1 : .6} /></g>
        {i >= 3 && <g transform="translate(0,360)"><path d={resp} transform="translate(0,-16) scale(1,.45)" fill="none" stroke="#0e7c86" strokeWidth="2" /></g>}
      </svg>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">Physics {i + 1} / {NFC_STEPS.length}</div><h3>{s.t}</h3><p>{s.d}</p><TagPill t={s.tag} /></div>
    </div>
  )
}

/* ───────────── Restaurant: a place worth visiting ───────────── */
const ROOMS = [
  { n: 'Street front', d: 'Kemer Sofrası occupies a restored 1920s stone arcade in Old Town. Three arches face a pedestrian lane; the blue-tiled sign and lantern lights mark the entrance, 120 m from bus stop 0417.', tag: 'DESIGN' as Tag },
  { n: 'Dining room', d: 'Vaulted brick ceiling, walnut tables, hand-glazed tiles and warm pendant lights. Forty seats, an open view of the hearth, and quiet corners for conversation.', tag: 'DESIGN' as Tag },
  { n: 'Open kitchen', d: 'A wood-fired oven and a copper-pan station sit behind a glass pass. Guests can watch bread being slapped onto the oven wall and meat rested before service.', tag: 'DESIGN' as Tag },
  { n: 'Menu', d: 'Slow-cooked lamb with smoked aubergine purée, hand-rolled mantı with yoghurt and chilli butter, charcoal sea bass with herbs, and a walnut baklava with clotted cream.', tag: 'DESIGN' as Tag },
  { n: 'Counter and POS', d: 'The server brings the bill to the table; the contactless POS accepts the FORADAŞ card. The same card that opened the bus validator now pays the merchant, through a different credential application and payment path.', tag: 'SIMULATED' as Tag },
]
export function RestaurantScene({ step }: { step: number }) {
  const i = Math.min(step, ROOMS.length - 1), r = ROOMS[i]
  const dish = (cx: number, cy: number, c1: string, c2: string, n: string) => (
    <g><circle cx={cx} cy={cy} r="62" fill="#fdf8ef" stroke="#cfc4a8" strokeWidth="3" /><circle cx={cx} cy={cy} r="48" fill="#f4ebd9" /><ellipse cx={cx - 6} cy={cy + 2} rx="30" ry="20" fill={c1} /><circle cx={cx + 14} cy={cy - 8} r="12" fill={c2} /><circle cx={cx - 22} cy={cy - 6} r="6" fill="#4d8a3b" /><text x={cx} cy={cy + 90} y={cy + 86} textAnchor="middle" fontSize="13" fill="currentColor">{n}</text></g>
  )
  return (
    <div className="sn-flow">
      <svg viewBox="0 0 960 440" role="img" aria-label={r.n}>
        {i === 0 && <g><rect width="960" height="440" fill="#f2d8b0" /><rect y="360" width="960" height="80" fill="#c9bfa8" />
          <rect x="140" y="80" width="680" height="290" fill="#d6b48a" />{[0, 1, 2].map((a) => <g key={a}><path d={`M${200 + a * 220} 370 V230 a70 70 0 0 1 140 0 V370z`} fill="#3a2a1e" /><path d={`M${210 + a * 220} 370 V232 a60 60 0 0 1 120 0 V370z`} fill="#ffcf85" opacity=".9" /></g>)}
          <rect x="330" y="104" width="300" height="52" rx="8" fill="#1f5fa8" /><text x="480" y="138" textAnchor="middle" fontSize="28" fill="#fdf8ef" fontFamily="Bricolage Grotesque, serif" fontWeight="700">Kemer Sofrası</text>
          {[220, 440, 660].map((x) => <g key={x}><circle cx={x + 60} cy="190" r="8" fill="#ffd36b" /><rect x={x + 58} y="170" width="4" height="12" fill="#444" /></g>)}
          <rect x="860" y="270" width="12" height="100" fill="#14323f" /><text x="866" y="262" textAnchor="middle" fontSize="12" fill="#14323f">Stop 0417 →120 m</text></g>}
        {i === 1 && <g><rect width="960" height="440" fill="#4a2f22" /><path d="M0 120 q480 -180 960 0 V0 H0z" fill="#8c4a35" />{Array.from({ length: 12 }).map((_, k) => <line key={k} x1={k * 80} y1="0" x2={k * 80 + 30} y2="130" stroke="#6b3526" />)}
          {[160, 400, 640].map((x) => <g key={x}><line x1={x + 60} y1="0" x2={x + 60} y2="90" stroke="#222" /><path d={`M${x + 30} 90 h60 l-10 28 h-40z`} fill="#ffcf85" /><ellipse cx={x + 60} cy="150" rx="70" ry="14" fill="#ffcf85" opacity=".25" /></g>)}
          <rect y="330" width="960" height="110" fill="#6a4a30" />{[90, 330, 570, 800].map((x) => <g key={x}><rect x={x} y="300" width="120" height="14" rx="4" fill="#9a6c42" /><rect x={x + 10} y="314" width="8" height="70" fill="#5a3b24" /><rect x={x + 102} y="314" width="8" height="70" fill="#5a3b24" /><circle cx={x + 60} cy="292" r="10" fill="#fdf8ef" /></g>)}</g>}
        {i === 2 && <g><rect width="960" height="440" fill="#3a3430" /><path d="M300 380 V210 a130 130 0 0 1 260 0 V380z" fill="#1b1411" /><path d="M340 380 V225 a90 90 0 0 1 180 0 V380z" fill="#ff7a2e" className="sn-flame" /><path d="M385 380 V250 a45 45 0 0 1 90 0 V380z" fill="#ffd36b" className="sn-flame" />
          <g transform="translate(640,200)"><circle cx="30" cy="20" r="18" fill="#e6b98d" /><rect y="2" x="8" width="44" height="14" rx="6" fill="#fff" /><rect x="6" y="40" width="48" height="90" rx="12" fill="#fff" /></g>
          {[60, 140, 220].map((x, k) => <circle key={x} cx={x} cy={150 + k * 20} r={30 - k * 4} fill="none" stroke="#b87333" strokeWidth="6" />)}<rect y="380" width="960" height="60" fill="#241f1c" /></g>}
        {i === 3 && <g><rect width="960" height="440" fill="#efe3cb" />{dish(160, 170, '#8c4a2b', '#c0623a', 'Slow-cooked lamb')}{dish(400, 170, '#f0c66a', '#fff', 'Hand-rolled mantı')}{dish(640, 170, '#9bb7c1', '#e8c27a', 'Charcoal sea bass')}{dish(850, 170, '#d9a441', '#fdf8ef', 'Walnut baklava')}
          <text x="480" y="340" textAnchor="middle" fontSize="15" fill="#3f5963">Prices shown in the app menu are illustrative project data.</text></g>}
        {i === 4 && <g><rect width="960" height="440" fill="#f3ead8" /><rect x="60" y="250" width="840" height="120" rx="10" fill="#8c5a36" />
          <g transform="translate(560,120)"><rect width="170" height="210" rx="14" fill="#14323f" /><rect x="14" y="16" width="142" height="62" rx="6" fill="#0d2029" /><text x="24" y="42" fontSize="12" fill="#ffb27a" fontFamily="monospace">TOTAL  ₺ 684,00</text><text x="24" y="64" fontSize="13" fill="#7ee0a8" fontFamily="monospace">TAP CARD</text>{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + '' + c} x={20 + c * 44} y={92 + r * 30} width="36" height="22" rx="4" fill="#2c4a58" />)).flat()}</g>
          <g transform="translate(340,150)" className="sn-tapcard"><rect width="150" height="94" rx="10" fill="#0f1f3d" /><text x="14" y="30" fontSize="14" fill="#fff" fontWeight="700">FORADAŞ</text><circle cx="120" cy="22" r="8" fill="#ef5f26" /></g>
          <text x="480" y="410" textAnchor="middle" fontSize="14" fill="#3f5963">Merchant POS · contactless reader · receipt printer</text></g>}
      </svg>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">Room {i + 1} / {ROOMS.length}</div><h3>{r.n}</h3><p>{r.d}</p><TagPill t={r.tag} /></div>
    </div>
  )
}

/* ───────────── Technician: finds the fault and fixes it ───────────── */
export interface Fault { id: string; name: string; sees: string; shows: string; logs: string; causes: string[]; steps: { part: string; do: string; found: string }[]; fix: string; escalate: string; prevent: string }
export const FAULTS: Fault[] = [
  { id: 'nodetect', name: 'Card not detected', sees: 'Passenger taps; nothing happens, no beep.', shows: 'Idle screen: "Tap card".', logs: 'rf.field=ON; rf.poll count=1840; rf.card_found=0 (last 4 min)', causes: ['Card antenna broken', 'Reader NFC antenna detached or detuned', 'NFC controller firmware fault', 'Metal object near the antenna'],
    steps: [{ part: 'card', do: 'Check card orientation and test a second, known-good card.', found: 'A known-good card works. The passenger card does not, on any reader.' }, { part: 'antenna', do: 'Check that other cards are read on this validator at normal distance.', found: 'Known-good cards read fine, so the reader field and antenna are healthy.' }, { part: 'card', do: 'Run the card through the bench tester: antenna continuity and resonance.', found: 'Coil open circuit at the chip bond. The card is physically damaged.' }],
    fix: 'Mark the card as damaged, issue a replacement card, and migrate the account entitlement. The balance lives in the backend account, not on the plastic, so nothing is lost.', escalate: 'Card Services team if the balance is on-card in a variant design.', prevent: 'Reinforced inlay, card holder advice, batch tracking of failure rates.' },
  { id: 'field', name: 'NFC field failure (validator)', sees: 'Every passenger on this bus is rejected or ignored.', shows: 'Reader LED dark; "Reader error E12".', logs: 'rf.field=OFF; nfc_ctrl.init FAIL code=0x2A; reboot loop x3', causes: ['Loose antenna connector', 'NFC controller firmware crash', 'Power dip from the bus electrical system'],
    steps: [{ part: 'psu', do: 'Measure supply voltage at the validator connector.', found: '24 V bus supply regulated to 5 V: stable. Power is not the cause.' }, { part: 'antenna', do: 'Power off. Inspect and reseat the antenna cable.', found: 'The coaxial connector is half out of its socket after vibration.' }, { part: 'nfc', do: 'Reseat, power on, read the NFC controller self-test.', found: 'Self-test passes. RF field measured at 13.56 MHz.' }, { part: 'card', do: 'Tap a test card; confirm in the remote device console.', found: 'Card detected. Transaction posts to the backend.' }],
    fix: 'Reseat and lock the antenna connector with a retaining clip; record the work order; remove the device from the "faulty" list.', escalate: 'Hardware supplier RMA if the controller self-test fails.', prevent: 'Locking connectors, vibration-rated cables, preventive inspection every 6 months.' },
  { id: 'offline', name: 'No network (backend unreachable)', sees: 'Cards are accepted, but the screen shows "Offline mode".', shows: '"Offline · rules active".', logs: 'modem.reg=SEARCHING; ping gw TIMEOUT; queue.depth=312', causes: ['No mobile coverage in a tunnel', 'SIM or APN issue', 'Modem or antenna fault', 'Core network incident'],
    steps: [{ part: 'modem', do: 'Read the modem status on the vehicle computer.', found: 'Registered on the network, signal bars low, packet loss 100% at the gateway.' }, { part: 'modem', do: 'Check the SIM state and APN configuration.', found: 'SIM is active, APN matches the policy.' }, { part: 'cloud', do: 'Check the central monitoring: other vehicles on the same cell?', found: 'Eight other vehicles in the same district are also offline: a cell-site incident, not a device fault.' }],
    fix: 'No on-device repair. The validators keep recording signed offline transactions. When coverage returns the queue (312 items) is replayed; the backend deduplicates and reconciles.', escalate: 'Telecom provider NOC under the SLA.', prevent: 'Dual-SIM modems, local cached rules, regular offline drills.' },
  { id: 'clock', name: 'Clock synchronisation drift', sees: 'Transfers are charged twice; passes show as expired.', shows: 'Normal.', logs: 'ntp.offset=+412s; tx.ts after server.ts; rule.transfer_window=FAIL', causes: ['No NTP/GNSS time source', 'RTC battery depleted', 'Wrong time zone setting'],
    steps: [{ part: 'mcu', do: 'Compare the device time with the server time.', found: 'The validator clock is 6 min 52 s ahead.' }, { part: 'modem', do: 'Check the time source: NTP over the modem, GNSS time.', found: 'GNSS lock lost because the antenna is shadowed; NTP blocked by a firewall rule.' }, { part: 'mcu', do: 'Allow NTP in the firewall policy and force a resync.', found: 'Offset 0.2 s. Transfer window evaluates correctly.' }],
    fix: 'Fix the firewall rule, resync the clock, and re-evaluate the affected transactions; refund the wrongly charged transfers automatically.', escalate: 'Network team for the policy change.', prevent: 'Monitor clock offset; reject device time beyond a threshold; two time sources.' },
]
const PARTS: Record<string, { x: number; y: number; w: number; h: number; n: string }> = {
  card: { x: 40, y: 150, w: 120, h: 80, n: 'Card' }, antenna: { x: 230, y: 70, w: 130, h: 50, n: 'NFC antenna' }, nfc: { x: 230, y: 150, w: 130, h: 50, n: 'NFC controller' },
  mcu: { x: 420, y: 150, w: 130, h: 50, n: 'Validator MCU' }, modem: { x: 610, y: 150, w: 130, h: 50, n: 'Modem / vehicle PC' }, psu: { x: 420, y: 250, w: 130, h: 50, n: 'Power supply' }, cloud: { x: 800, y: 150, w: 130, h: 80, n: 'Monitoring / backend' },
}
export function TechScene({ faultId, step, onFault }: { faultId: string; step: number; onFault: (id: string) => void }) {
  const f = FAULTS.find((x) => x.id === faultId) ?? FAULTS[0]
  const n = f.steps.length
  const phase = step === 0 ? 'symptoms' : step <= n ? 'diag' : 'fix'
  const di = Math.max(0, Math.min(step - 1, n - 1))
  const part = phase === 'diag' ? f.steps[di].part : phase === 'fix' ? f.steps[n - 1].part : ''
  const tp = part ? PARTS[part] : PARTS.mcu
  return (
    <div className="sn-flow">
      <div className="sn-faultpick" role="tablist" aria-label="Choose a fault">{FAULTS.map((x) => <button key={x.id} role="tab" aria-selected={x.id === faultId} className={x.id === faultId ? 'on' : ''} onClick={() => onFault(x.id)}>{x.name}</button>)}</div>
      <svg viewBox="0 0 960 330" role="img" aria-label="Validator internals and technician">
        {Object.entries(PARTS).map(([k, p]) => <g key={k} className={`sn-node k-device ${part === k ? 'on' : ''} ${phase === 'fix' && part === k ? 'fixed' : ''}`} transform={`translate(${p.x},${p.y})`}><rect width={p.w} height={p.h} rx={10} /><text x={p.w / 2} y={p.h / 2 + 5} textAnchor="middle" className="nl">{p.n}</text></g>)}
        <g className="sn-tech" style={{ transform: `translate(${tp.x + tp.w / 2 - 14}px, ${tp.y + tp.h + 14}px)` }}><circle cx="14" cy="10" r="10" fill="#e6b98d" /><path d="M2 8 q12 -14 24 0z" fill="#f2c200" /><rect x="3" y="22" width="22" height="36" rx="7" fill="#1f5fa8" />{phase === 'fix' && <text x="34" y="30" fontSize="18">🔧</text>}{phase === 'diag' && <text x="34" y="30" fontSize="16">🔍</text>}</g>
        <text x="480" y="318" textAnchor="middle" fontSize="12" fill="currentColor">Illustrative validator architecture · parts vary by supplier</text>
      </svg>
      <div className="sn-caption sn-diag" aria-live="polite">
        {phase === 'symptoms' && <><div className="sn-capn">Reported symptom</div><h3>{f.name}</h3>
          <dl><dt>User sees</dt><dd>{f.sees}</dd><dt>Device shows</dt><dd>{f.shows}</dd><dt>Logs show</dt><dd><code>{f.logs}</code></dd><dt>Possible causes</dt><dd>{f.causes.join(' · ')}</dd></dl></>}
        {phase === 'diag' && <><div className="sn-capn">Diagnostic step {di + 1} / {n}</div><h3>{f.steps[di].do}</h3><p><b>Finding:</b> {f.steps[di].found}</p></>}
        {phase === 'fix' && <><div className="sn-capn">Resolution</div><h3>Fixed and confirmed</h3><dl><dt>Corrective action</dt><dd>{f.fix}</dd><dt>Escalation path</dt><dd>{f.escalate}</dd><dt>Prevention</dt><dd>{f.prevent}</dd></dl></>}
      </div>
    </div>
  )
}

/* ───────────── City map: 2D, transit network, district, tilted 3D ───────────── */
const DISTRICTS = [
  { n: 'Old Town', x: 420, y: 200, c: '#e9c9a0', d: 'Stone arcades, restaurants, museum quarter.' }, { n: 'Harbour', x: 700, y: 330, c: '#bcd9dd', d: 'Ferry pier, waterfront promenade, fish market.' },
  { n: 'Uptown', x: 220, y: 110, c: '#d4dcc0', d: 'Residential hills; Derya lives here.' }, { n: 'Campus', x: 150, y: 330, c: '#d9cfe6', d: 'University and library.' }, { n: 'Business Bay', x: 650, y: 110, c: '#cfd7de', d: 'Offices and metro hub.' },
]
const STOPS = [{ id: '0417', n: 'Old Town', x: 440, y: 230 }, { id: '0102', n: 'Uptown', x: 240, y: 140 }, { id: '0310', n: 'Campus', x: 170, y: 340 }, { id: '0520', n: 'Business Bay', x: 650, y: 140 }, { id: '0610', n: 'Harbour Pier', x: 710, y: 350 }, { id: '0001', n: 'Central Station', x: 420, y: 320 }]
export function MapScene({ mode, setMode, pick, setPick }: { mode: string; setMode: (m: string) => void; pick: string; setPick: (s: string) => void }) {
  const tilt = mode === '3D'
  const sel = DISTRICTS.find((d) => d.n === pick) ?? DISTRICTS[0]
  return (
    <div className="sn-flow">
      <div className="sn-faultpick" role="tablist" aria-label="Map mode">{['2D', '3D', 'Transit', 'District', 'Street'].map((m) => <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
      <div className="sn-mapwrap"><svg viewBox="0 0 960 440" className={tilt ? 'tilt' : ''} role="img" aria-label="Map of Marisa">
        <rect width="960" height="440" fill="#e8efe6" /><path d="M560 440 Q640 300 960 280 V440z" fill="#9bd1d6" /><text x="860" y="410" fill="#14323f" fontSize="14">Marisa Bay</text>
        {mode !== 'Street' && DISTRICTS.map((d) => <g key={d.n} onClick={() => setPick(d.n)} style={{ cursor: 'pointer' }}><circle cx={d.x} cy={d.y} r={mode === 'District' && pick === d.n ? 120 : 90} fill={d.c} opacity=".85" />{tilt && [0, 1, 2, 3, 4].map((k) => <rect key={k} x={d.x - 50 + k * 22} y={d.y - 20 - (k % 3) * 14} width="16" height={30 + (k % 3) * 22} fill="#fdf8ef" stroke="#8a6f50" />)}<text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="#14323f">{d.n}</text></g>)}
        {(mode === 'Transit' || mode === '2D' || tilt) && <g fill="none" strokeWidth="6" strokeLinecap="round"><polyline points="240,140 440,230 650,140" stroke="#ef5f26" /><polyline points="170,340 420,320 710,350" stroke="#0e7c86" /><polyline points="440,230 420,320" stroke="#7b5cc4" /></g>}
        {mode === 'Street' && <g><rect y="150" width="960" height="140" fill="#4a5560" /><rect y="145" width="960" height="8" fill="#d8d2c4" />{Array.from({ length: 10 }).map((_, k) => <rect key={k} x={k * 100 + 10} y="216" width="50" height="6" fill="#f4f0e6" />)}<rect x="400" y="100" width="150" height="44" fill="#fdf8ef" stroke="#14323f" /><text x="475" y="127" textAnchor="middle" fontSize="13" fill="#14323f">Stop 0417 · Old Town</text><rect x="180" y="300" width="200" height="80" fill="#d6b48a" /><text x="280" y="346" textAnchor="middle" fontSize="14" fill="#14323f">Kemer Sofrası</text></g>}
        {STOPS.map((s) => <g key={s.id}><circle cx={s.x} cy={s.y} r="8" fill="#fff" stroke="#14323f" strokeWidth="3" />{mode !== 'Street' && <text x={s.x + 12} y={s.y - 8} fontSize="11" fill="#14323f">{s.n}</text>}</g>)}
        {mode !== 'Street' && <circle r="7" fill="#ef5f26" className="sn-busdot" />}
      </svg></div>
      <div className="sn-caption"><div className="sn-capn">{mode} view</div><h3>{mode === 'District' ? sel.n : 'Marisa: a coastal city of 1.2 million (fictional)'}</h3><p>{mode === 'District' ? sel.d : 'Five districts, three lines (orange bus 12, teal tram T2, violet metro M1), six main stops. Tap a district to inspect it. Marisa is a fictional reference city, not a real place.'}</p><TagPill t="DESIGN" /></div>
    </div>
  )
}

/* ───────────── Dashboard with simulated data ───────────── */
export function DashScene({ step }: { step: number }) {
  const views = ['Operator', 'Merchant', 'Municipality', 'System']
  const v = Math.min(step, 3)
  const bars = [[40, 62, 88, 70, 95, 80, 55], [30, 40, 66, 90, 84, 72, 48], [52, 58, 64, 70, 66, 60, 50], [99.9, 99.8, 99.95, 99.7, 99.9, 99.9, 99.95]][v]
  const kpi = [[['Active validators', '1,284'], ['Daily taps', '412,380'], ['Failed taps', '0.6%'], ['Offline queue', '312']], [['Card payments today', '1,906'], ['Approval rate', '98.2%'], ['Peak', '13:00–14:00'], ['Promo use', '14%']], [['Aggregated trips', '389k'], ['Busiest district', 'Old Town'], ['Step-free stops', '71%'], ['Min. group size', '≥ 20']], [['API p95 latency', '184 ms'], ['Error rate', '0.07%'], ['DB replication lag', '0.4 s'], ['Open incidents', '3']]][v]
  return (
    <div className="sn-flow">
      <div className="sn-faultpick">{views.map((x, i) => <span key={x} className={i === v ? 'on' : ''}>{x}</span>)}</div>
      <div className="sn-dash"><div className="sn-kpis">{kpi.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
        <svg viewBox="0 0 420 130" role="img" aria-label="Simulated weekly trend">{bars.map((h, k) => <rect key={k} x={20 + k * 56} y={120 - (v === 3 ? (h - 99) * 100 : h)} width="38" height={v === 3 ? (h - 99) * 100 : h} rx="5" fill="var(--signal)" opacity={.45 + k * .08} />)}</svg></div>
      <div className="sn-caption"><div className="sn-capn">Perspective {v + 1} / 4</div><h3>{views[v]} dashboard</h3><p>All figures are simulated project data. Analytics use aggregated, anonymised counts with a minimum group size; individual journeys are not exposed without a lawful basis and safeguards.</p><TagPill t="SIMULATED" /></div>
    </div>
  )
}

/** With `step` set, items appear one at a time; without it everything is visible. */
const shown = (i: number, step?: number) => (step === undefined || i <= step ? 'sn-pop' : 'sn-hid')
export function CardsGrid({ items, step }: { items: { h: string; t: string; tag?: Tag }[]; step?: number }) {
  return <div className="sn-grid">{items.map((c, i) => <article key={c.h} className={shown(i, step)}><h4>{c.h}</h4><p>{c.t}</p><TagPill t={c.tag} /></article>)}</div>
}
export function TableView({ head, rows, step }: { head: string[]; rows: string[][]; step?: number }) {
  return <div className="sn-tablewrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className={shown(i, step)}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
}

/* ───────────── Route map: cities light up one by one (real coordinates, schematic projection) ───────────── */
export const ROUTE_CITIES = [
  { n: 'İstanbul', lon: 28.98, lat: 41.01, d: 'Ferries across the Bosphorus, tram to Sultanahmet and Eminönü.' },
  { n: 'Ankara', lon: 32.86, lat: 39.93, d: 'Anıtkabir, the Anatolian Civilizations Museum and Hamamönü.' },
  { n: 'Eskişehir', lon: 30.52, lat: 39.78, d: 'Tram city: Odunpazarı, the Porsuk river and Sazova Park.' },
  { n: 'İzmir', lon: 27.14, lat: 38.42, d: 'Kordon waterfront, Konak, the Agora and a day trip to Ephesus.' },
  { n: 'Antalya', lon: 30.71, lat: 36.89, d: 'Kaleiçi old town, the heritage tram and Düden waterfalls.' },
]
export function RouteScene({ step }: { step: number }) {
  const i = Math.min(step, ROUTE_CITIES.length - 1)
  const p = (c: { lon: number; lat: number }) => [40 + (c.lon - 26.5) * 125, 400 - (c.lat - 36.5) * 80] as const
  return (
    <div className="sn-flow">
      <svg viewBox="0 0 960 440" role="img" aria-label="Five demo cities on a schematic map of Türkiye">
        <rect width="960" height="440" fill="#e8efe6" />
        {ROUTE_CITIES.slice(1, i + 1).map((c, k) => { const [x1, y1] = p(ROUTE_CITIES[k]), [x2, y2] = p(c); return <line key={c.n} x1={x1} y1={y1} x2={x2} y2={y2} className="sn-routeline" /> })}
        {ROUTE_CITIES.map((c, k) => { const [x, y] = p(c), on = k <= i; return (
          <g key={c.n} className={`sn-city ${on ? 'on' : ''} ${k === i ? 'now' : ''}`}><circle cx={x} cy={y} r={k === i ? 11 : 8} /><text x={x + 16} y={y + 5}>{c.n}</text></g>
        ) })}
        <text x="20" y="425" fontSize="11" fill="#3f5963">Schematic positions from real coordinates, not a surveyed map.</text>
      </svg>
      <div className="sn-caption" aria-live="polite"><div className="sn-capn">City {i + 1} / {ROUTE_CITIES.length}</div><h3>{ROUTE_CITIES[i].n}</h3><p>{ROUTE_CITIES[i].d}</p></div>
    </div>
  )
}

export function maxSteps(s: Scene, faultN = 4): number {
  switch (s.k) {
    case 'street': return s.steps.length
    case 'flow': return s.flow.steps.length
    case 'card': return 5
    case 'nfc': return NFC_STEPS.length
    case 'restaurant': return ROOMS.length
    case 'tech': return faultN + 2
    case 'dash': return 4
    case 'route': return ROUTE_CITIES.length
    case 'cards': return s.reveal ? s.items.length : 1
    case 'table': return s.reveal ? s.rows.length : 1
    default: return 1
  }
}
export function useReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => { try { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches) } catch { /* ignore */ } }, [])
  return [r, setR] as const
}

export function Hero() {
  return (
    <div className="sn-flow"><svg viewBox="0 0 960 420" role="img" aria-label="A smart card above the city of Marisa">
      <rect width="960" height="420" className="sn-sky" />
      <circle cx="800" cy="90" r="46" fill="#ffd9a0" />
      <path d="M0 330 Q240 270 480 320 T960 300 V420 H0z" fill="#8fc3c9" />
      {[40, 120, 200, 290, 380, 470, 560, 650, 740, 830].map((x, k) => <rect key={x} x={x} y={230 - (k % 4) * 28} width={70} height={150 + (k % 4) * 28} fill={['#e8d5b5', '#d9b99b', '#c9d8d3', '#ecc9a8'][k % 4]} stroke="#8a6f50" />)}
      <rect y="372" width="960" height="48" fill="#4a5560" />
      <g transform="translate(250,50) rotate(-6)"><rect width="440" height="270" rx="26" fill="#0f1f3d" stroke="#fff" strokeWidth="3" />
        <g fill="none" stroke="#e8c27a" strokeWidth="5"><rect x="130" y="60" width="180" height="150" rx="16" /><rect x="150" y="80" width="140" height="110" rx="12" /><rect x="170" y="100" width="100" height="70" rx="8" /></g>
        <rect x="200" y="115" width="40" height="40" fill="#2a2f36" stroke="#d9a441" />
        <text x="30" y="52" fontSize="30" fill="#fff" fontWeight="800" fontFamily="Bricolage Grotesque, serif">FORADAŞ</text><circle cx="400" cy="40" r="14" fill="#ef5f26" />
        <text x="30" y="246" fontSize="16" fill="#cfe8ee" fontFamily="monospace">R81 4821 0073 6190</text></g>
      {[1, 2, 3].map((k) => <ellipse key={k} cx="470" cy="185" rx={150 + k * 70} ry={100 + k * 40} fill="none" stroke="#0e7c86" strokeWidth="2" className="sn-field" style={{ animationDelay: `${k * .4}s` }} />)}
    </svg>
    <div className="sn-caption"><div className="sn-capn">Click anywhere, or press → to continue</div><h3>Marisa, a fictional city</h3><p>Everything you see in this presentation is a designed reference system. Real standards are cited; payments and partners are simulated.</p></div></div>
  )
}
