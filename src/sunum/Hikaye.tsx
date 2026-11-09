import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { photoOf } from './tours'
import { SLIDES } from './slides'
import './hikaye.css'

const B = import.meta.env.BASE_URL
const logo = (n: string) => `${B}marka/${n}.svg`
const concept = (n: string) => `${B}hedef/${n}.jpg`

/* ── icons (24px, stroke) ── */
const P: Record<string, string> = {
  bus: 'M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10M5 16h14M5 16v2h2v-2M19 16v2h-2v-2M5 11h14M8.5 13.5h.01M15.5 13.5h.01',
  train: 'M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 10h14M9 21l2-4M15 21l-2-4M9 14h.01M15 14h.01',
  food: 'M6 3v7a2 2 0 0 0 2 2v9M10 3v7M6 6.5h4M17 3c-2 1-3 3.5-3 6.5 0 1.5 1 2.5 3 2.5v9',
  museum: 'M3 9l9-5 9 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18M3 9h18',
  car: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3h-2.5v-1.5h-11V19H4zM8 13h.01M16 13h.01',
  card: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M6.5 15h4',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  cash: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 10h.01M18 14h.01',
  map: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  phone: 'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3zM11 18h2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
}
const Ico = ({ n, or }: { n: string; or?: boolean }) => (
  <span className={'hk-ico' + (or ? ' or' : '')} aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg></span>
)

/* ── building blocks ── */
interface SP { kick: string; title: string; dark?: boolean; n: number; children: ReactNode; lead?: string }
const Slide = ({ kick, title, dark, n, children, lead }: SP) => (
  <section className={'hk-slide' + (dark ? ' hk-dark' : '')} aria-label={title}>
    <p className="hk-kick">{kick}</p>
    <h2>{title}</h2>
    {lead && <p className="hk-lead">{lead}</p>}
    {children}
    <div className="hk-foot"><img src={logo(dark ? 'FORA_logo-yatay-FORADAS-koyu' : 'FORA_logo-yatay-FORADAS')} alt="FORADAŞ" /><span>{n} / {TOTAL}</span></div>
  </section>
)
const Pts = ({ items }: { items: ReactNode[] }) => <ul className="hk-pts">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
const Card = ({ ico, h, t, or }: { ico?: string; h: string; t: string; or?: boolean }) => <div className="hk-card">{ico && <Ico n={ico} or={or} />}<h3>{h}</h3><p>{t}</p></div>
const Tag = ({ t }: { t: 'REAL' | 'DESIGN' | 'SIMULATION' }) => <span className="hk-tag" style={{ color: t === 'REAL' ? '#1a7f4b' : t === 'DESIGN' ? '#0b2d6b' : '#c25a00' }}>{t}</span>
const Flow = ({ steps, hot, cmp }: { steps: [string, string][]; hot?: number; cmp?: boolean }) => (
  <div className="hk-flow" style={cmp ? { ['--sh' as string]: 'calc(10 * var(--u))' } : undefined}>{steps.map(([h, t], i) => <div key={h} className={'hk-step' + (hot === i ? ' hot' : '')}><i>{i + 1}</i><h3>{h}</h3><p>{t}</p></div>)}</div>
)
const Credit = ({ id }: { id: string }) => { const p = photoOf(id); return p ? <p className="hk-credit">Photo: {p.credit} · Wikimedia Commons</p> : null }
const Photo = ({ id, h }: { id: string; h: number }) => { const p = photoOf(id); return p ? <img className="hk-img" src={p.url} alt={id} style={{ height: `calc(${h} * var(--u))` }} loading="eager" /> : null }

/** Hub diagram: one card in the middle, five services around it. Big labels so it stays readable on a phone. */
function Hub() {
  const sat: [string, string, number, number][] = [['bus', 'Bus', 130, 90], ['train', 'Metro', 130, 440], ['food', 'Restaurants', 670, 90], ['museum', 'Museums', 670, 440], ['car', 'Car rental', 400, 500]]
  return (
    <svg viewBox="0 0 800 620" width="100%" role="img" aria-label="One card connects bus, metro, restaurants, museums and car rental" style={{ maxHeight: '100%' }}>
      {sat.map(([, , x, y]) => <line key={x + '-' + y} x1="400" y1="265" x2={x} y2={y} stroke="#ff7a00" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />)}
      <rect x="290" y="195" width="220" height="140" rx="18" fill="#0b2d6b" /><rect x="312" y="222" width="52" height="40" rx="7" fill="#ff7a00" />
      <path d="M400 232q22 14 0 34M418 224q34 24 0 52M436 216q44 34 0 70" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
      <text x="400" y="312" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">FORADAŞ card</text>
      {sat.map(([k, l, x, y]) => (
        <g key={l}><circle cx={x} cy={y} r="62" fill="#fff" stroke="#0b2d6b" strokeWidth="5" />
          <g transform={`translate(${x - 26} ${y - 40}) scale(2.17)`} fill="none" stroke="#0b2d6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={P[k]} /></g>
          <text x={x} y={y + 90} textAnchor="middle" fill="#0a1b3d" fontSize="30" fontWeight="700" fontFamily="Geist, sans-serif">{l}</text></g>
      ))}
    </svg>
  )
}

const jump = (id: string) => { const i = SLIDES.findIndex((s) => s.id === id); try { localStorage.setItem('foradas-sunum-v1', JSON.stringify({ i: Math.max(i, 0), s: 0 })) } catch { /* ignore */ } }

/* ── the deck ── */
interface Def { id: string; say: string; deep?: string; el: (n: number) => ReactNode }
/** B) 3D labs are a hidden option: they did not pass the designer test, so the main flow stays 3D-free. Open one with ?deep=1 in the URL. */
const DEEP = (id: string) => !/[?&]deep=1/.test(location.hash) ? null : <button className="hk-link" onClick={() => { jump(id); location.hash = '#/sunum/ek' }}>Deep dive: 3D lab →</button>

const DECK: Def[] = [
  { id: 'title', say: 'Good morning. Today I will show you a single smart card for a whole city. One card, many services. First, the problem; then the card; then what happens when you tap it.',
    el: (n) => (
      <section className="hk-slide hk-dark" aria-label="Title">
        <img className="hk-bleed" src={concept('h5-durak-sahnesi')} alt="" /><div className="hk-veil" />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <img src={logo('FORA_logo-yatay-FORADAS-koyu')} alt="FORADAŞ" style={{ height: 'calc(3.4 * var(--u))', alignSelf: 'flex-start', marginBottom: 'calc(3 * var(--u))' }} />
          <h1>One card for the whole city.</h1>
          <p className="hk-lead" style={{ color: '#fff', maxWidth: '52%' }}><b style={{ color: '#ff7a00' }}>What is it?</b> One smart card for buses, metro, restaurants and museums.</p>
          <p className="hk-lead" style={{ color: '#cfdcf5', marginTop: 'calc(.8 * var(--u))', maxWidth: '52%' }}><b style={{ color: '#ff7a00' }}>What problem does it solve?</b> Too many tickets, cards and apps.</p>
        </div>
        <div className="hk-foot"><span>Reference design · fictional city of Marisa · Concept illustration</span><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 'agenda', say: 'This talk has six short parts. We start with the problem and end with a summary.',
    el: (n) => (
      <Slide n={n} kick="Agenda" title="Six short parts, one clear story.">
        <div className="hk-body"><div className="hk-grid3 mid">
          {[['The problem', 'Why one city needs one card'], ['The card', 'A chip and a tiny antenna'], ['The tap', 'What happens in one second'], ['Behind the scenes', 'Software, safely and simply'], ['People and business', 'Riders, shops, tourists'], ['Summary', 'Three messages to remember']].map(([h, t], i) => (
            <div className="hk-card" key={h}><div className="hk-num">{i + 1}</div><h3>{h}</h3><p>{t}</p></div>))}
        </div></div>
      </Slide>) },
  { id: 'problem', say: 'Think about visiting a new city. You buy a paper ticket for the bus, another for the metro, and you pay cash in the restaurant. This is slow for you and expensive for the city.',
    el: (n) => (
      <Slide n={n} kick="1 · The problem" title="Every service wants its own ticket.">
        <div className="hk-body">
          <div className="hk-col" style={{ flex: 1.1 }}><div className="hk-grid3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <Card ico="bus" h="Bus ticket" t="Buy it before you board." /><Card ico="train" h="Metro card" t="A different card, a different top-up." />
            <Card ico="museum" h="Museum pass" t="Queue at a separate desk." /><Card ico="cash" h="Cash" t="Slow in shops, risky for the city." />
          </div></div>
          <div className="hk-col"><Pts items={[<><b>Visitors</b> carry many tickets.</>, <><b>Operators</b> lose time and money handling cash.</>, <><b>A shared card</b> needs shared rules, not only shared plastic.</>]} /></div>
        </div>
      </Slide>) },
  { id: 'solution', say: 'The idea is simple. One card. The same card works on the bus, in the metro, in restaurants and in museums. One account, one balance.',
    el: (n) => (
      <Slide n={n} dark kick="2 · The solution" title="One card. One network.">
        <div className="hk-body">
          <div className="hk-col" style={{ flex: 1.2, alignSelf: 'stretch', justifyContent: 'center' }}><div style={{ background: '#fff', borderRadius: 'calc(1.6 * var(--u))', padding: 'calc(1.5 * var(--u))' }}><Hub /></div></div>
          <div className="hk-col"><Pts items={[<><b>One account</b>, one balance.</>, <><b>One tap</b> to ride, pay or enter.</>, <>Each city keeps <b>its own prices and rules</b>.</>]} /><div><Tag t="DESIGN" /></div></div>
        </div>
      </Slide>) },
  { id: 'card', say: 'Inside the plastic there are only two things that matter: a small chip and a copper antenna. There is no battery. The reader sends power through the air, and that wakes the chip.',
    el: (n) => (
      <Slide n={n} kick="3 · The card" title="The card is a chip and an antenna. No battery.">
        <div className="hk-body">
          <div className="hk-col" style={{ alignItems: 'center' }}><img className="hk-img" src={concept('h3-kart-patlatilmis')} alt="Exploded view of a smart card: chip, middle layer, antenna coil" style={{ height: 'calc(27 * var(--u))', objectFit: 'contain', background: '#fff' }} /><p className="hk-credit">Concept illustration: card layers, exploded view</p></div>
          <div className="hk-col" style={{ gap: 'calc(1.4 * var(--u))' }}>
            <Card ico="card" or h="Chip" t="Holds the card number and secret keys. The keys never leave the chip." />
            <Card ico="phone" h="Antenna" t="A copper coil. The reader's radio field gives it power, from about 4 cm away." />
            <div>{DEEP('card-anatomy')}</div>
          </div>
        </div>
      </Slide>) },
  { id: 'tap', say: 'Now the tap. Derya holds the card near the reader. The reader wakes the card, the card proves it is real, the rules are checked and the light turns green. If there is no network, the receipt is sent later.',
    el: (n) => (
      <Slide n={n} kick="4 · The tap" title="One tap: seven small steps.">
        <div className="hk-body" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(2.4 * var(--u))' }}>
          <Flow hot={4} steps={[['Wake up', 'The reader\'s radio field powers the card.'], ['Hello', 'The card sends its ID.'], ['Proof', 'It proves it is genuine.'], ['Rules', 'Balance, line, transfer.'], ['Go', 'Green light and a beep.'], ['Receipt', 'Saved on the device.'], ['Send', 'To the server, now or later.']]} />
          <div className="hk-note"><Tag t="SIMULATION" /><span>No network? The ride still works. The receipt is sent later.</span>{DEEP('tap')}</div>
        </div>
      </Slide>) },
  { id: 'backstage', say: 'Behind the tap, the software has five layers. Apps at the top, then one secure door, then the services, then the ledger, and operations at the bottom keep everything running.',
    el: (n) => (
      <Slide n={n} kick="5 · Behind the scenes" title="Five layers of software, each with one job.">
        <div className="hk-body" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(1 * var(--u))' }}>
          {[['Apps', 'Passenger app, city dashboard', '#0b2d6b'], ['One secure door', 'API gateway: checks who is calling', '#16408a'], ['Services', 'Fares, accounts, payments', '#2a56a8'], ['Ledger', 'A record of every transaction', '#3f6fc0'], ['Operations', 'Monitoring, backups, audits', '#ff7a00']].map(([h, t, c]) => (
            <div key={h} className="hk-layer" style={{ background: c }}><b>{h}</b><span>{t}</span></div>))}
          <div className="hk-note"><Tag t="DESIGN" />{DEEP('arch')}</div>
        </div>
      </Slide>) },
  { id: 'security', say: 'Travel history says a lot about a person, so we collect as little as possible. The validator never sees a name. It sees a token. Analytics use counts, not people.',
    el: (n) => (
      <Slide n={n} dark kick="6 · Security and privacy" title="The bus never learns your name.">
        <div className="hk-body"><div className="hk-grid3 big">
          <Card ico="lock" or h="Locked" t="Secret keys stay inside the chip. Messages are encrypted." />
          <Card ico="user" or h="Minimal" t="The validator sees a token, not a name." />
          <Card ico="clock" or h="Short memory" t="City reports use counts, not people. Old data is deleted." />
        </div></div>
        <p className="hk-note"><Tag t="DESIGN" />Designed with the Turkish data-protection law (KVKK, Law No. 6698) in mind.</p>
      </Slide>) },
  { id: 'journey', say: 'Let us follow Derya for one trip. She taps on the bus. She changes to the metro and taps again. The system sees two rides close together and gives a transfer discount.',
    el: (n) => (
      <Slide n={n} kick="7 · The passenger" title="Derya's trip: tap, ride, transfer.">
        <div className="hk-body">
          <div className="hk-col" style={{ flex: 1.2 }}><img className="hk-img" src={concept('h5-durak-sahnesi')} alt="People boarding a bus at a stop" style={{ height: 'calc(26 * var(--u))' }} /><p className="hk-credit">Concept illustration (AI-generated, supplied by the author)</p></div>
          <div className="hk-col"><Pts items={[<><b>Bus:</b> tap at the door. Fare is checked.</>, <><b>Metro:</b> tap at the gate, same card.</>, <><b>Transfer:</b> two rides close together get a discount.</>]} />{DEEP('journey')}</div>
        </div>
      </Slide>) },
  { id: 'shops', say: 'Shops can accept the same card. The terminal asks for a payment, Derya taps, and the platform approves in about a second. The money moves between accounts later.',
    el: (n) => (
      <Slide n={n} kick="8 · Restaurants and shops" title="Paying in a restaurant: approval first, money later.">
        <div className="hk-body" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(2.4 * var(--u))' }}>
          <Flow hot={2} steps={[['Bill', 'The terminal shows the amount.'], ['Tap', 'Derya taps her card.'], ['Approval', 'The platform says yes in about a second.'], ['Receipt', 'Both sides get a receipt.'], ['Settlement', 'The money moves later, in a batch.']]} />
          <div className="hk-note"><Tag t="SIMULATION" /><span>Fictional restaurant. No real payment is made.</span>{DEEP('rest-pay')}</div>
        </div>
      </Slide>) },
  { id: 'tourism', say: 'The same card helps visitors. The city explorer plans a day: places to see, local food, and the ride between them. These are real places with licensed photos.',
    el: (n) => (
      <Slide n={n} kick="9 · Tourism" title="Visitors get a day plan, not just a ticket.">
        <div className="hk-body">
          <div className="hk-col" style={{ flex: 1.3 }}><Photo id="ayasofya" h={19} /><Credit id="ayasofya" />
            <div style={{ display: 'flex', gap: 'calc(1.2 * var(--u))' }}><div style={{ flex: 1 }}><Photo id="galata" h={8} /></div><div style={{ flex: 1 }}><Photo id="baklava" h={8} /></div></div></div>
          <div className="hk-col"><Pts items={[<><b>See:</b> real places, with short stories.</>, <><b>Eat:</b> local food near each stop.</>, <><b>Move:</b> bus, metro or tram on the same card.</>]} /><div className="hk-note"><Tag t="REAL" /><span>Places and photos. Prices are estimates.</span></div></div>
        </div>
      </Slide>) },
  { id: 'rental', say: 'The card can also unlock a rental car, and it can join guided tours. For the car, the platform first holds a small deposit, then charges the real price, then releases the rest.',
    el: (n) => (
      <Slide n={n} kick="10 · Car rental and tours" title="Hold a deposit. Charge the real price.">
        <div className="hk-body" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(2.4 * var(--u))' }}>
          <Flow cmp hot={2} steps={[['Choose', 'Price list is shown first.'], ['Hold', 'A 50 TRY deposit is reserved, not taken.'], ['Drive', 'Time and fee run on the meter.'], ['Charge', 'The real fee is taken from the hold.'], ['Release', 'The unused part is returned.']]} />
          <div className="hk-grid3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Card ico="car" h="Car rental" t="Demo prices: unlock fee, per minute, daily cap." /><Card ico="map" h="Ready-made tours" t="Themed tours: audio, local guide or self-paced." /><Card ico="star" h="Guides" t="Sample profiles are fictional and labelled." />
          </div>
          <div className="hk-note"><Tag t="SIMULATION" />{DEEP('tours')}</div>
        </div>
      </Slide>) },
  { id: 'economics', say: 'A system needs money to run. Passengers pay fares. Shops pay a small fee. The city pays for the platform. These numbers are illustrative; a real model needs real quotes and legal review.',
    el: (n) => (
      <Slide n={n} kick="11 · How it pays for itself" title="Who pays whom, and why.">
        <div className="hk-body"><div className="hk-grid3 big">
          <Card ico="user" h="Passengers" t="Pay fares and a small card deposit. Get one simple card." />
          <Card ico="food" h="Shops" t="Pay a small fee per payment. Get customers and fast acceptance." />
          <Card ico="museum" h="The city" t="Pays for the platform. Gets better planning data, without watching people." />
        </div></div>
        <p className="hk-note"><Tag t="DESIGN" />All figures in this project are illustrative, not market data.</p>
      </Slide>) },
  { id: 'summary', say: 'To close: one card makes city life simpler. The tap is quick and works offline. And privacy is part of the design. Everything you saw is a design with a simulation, not a real payment system.',
    el: (n) => (
      <Slide n={n} dark kick="12 · Summary" title="Three things to remember.">
        <div className="hk-body"><div className="hk-grid3 big">
          <div className="hk-card"><div className="hk-num">1</div><h3>One card is simpler</h3><p>One account for bus, metro, shops, museums and rentals.</p></div>
          <div className="hk-card"><div className="hk-num">2</div><h3>One tap is quick</h3><p>It is checked in a fraction of a second, even with no network.</p></div>
          <div className="hk-card"><div className="hk-num">3</div><h3>Privacy by design</h3><p>Collect less, protect more. The bus never learns your name.</p></div>
        </div></div>
        <p className="hk-note">Labels used in this talk: <span><Tag t="REAL" />standards and places</span> <span><Tag t="DESIGN" />our architecture</span> <span><Tag t="SIMULATION" />payments and approvals</span></p>
      </Slide>) },
  { id: 'thanks', say: 'Thank you. I am happy to take questions. The appendix has the full technical slides if you want to go deeper.',
    el: (n) => (
      <section className="hk-slide hk-dark" aria-label="Thank you" style={{ justifyContent: 'center' }}>
        <img src={logo('FORA_logo-yatay-FORADAS-koyu')} alt="FORADAŞ" style={{ height: 'calc(5 * var(--u))', alignSelf: 'flex-start', marginBottom: 'calc(3 * var(--u))' }} />
        <h1 style={{ maxWidth: '100%' }}>Thank you. Questions?</h1>
        <div className="hk-grid3" style={{ marginTop: 'calc(3 * var(--u))' }}>
          <Card h="NFC" t="Near Field Communication: a short-range radio the card uses." /><Card h="Validator" t="The device on the bus that reads the card and checks the rules." /><Card h="Ledger" t="A record of every transaction." />
        </div>
        <p style={{ marginTop: 'calc(2 * var(--u))' }}><button className="hk-link" onClick={() => { location.hash = '#/sunum/ek' }}>Appendix: the 42 full technical slides →</button></p>
        <div className="hk-foot"><span>Reference design · Everything shown is simulated</span><span>{n} / {TOTAL}</span></div>
      </section>) },
]
const TOTAL = DECK.length
export const STORY_SAY = DECK.map((d) => d.say)

/** Static story deck for the PDF page (all slides, no controls). */
export function StoryPrint() {
  return <div className="hk-print"><div className="hk">{DECK.map((d, i) => <div className="hk-stage" key={d.id}>{d.el(i + 1)}</div>)}</div></div>
}

export default function Hikaye() {
  const [sp, setSp] = useSearchParams(); const nav = useNavigate()
  const cur = Math.min(Math.max((+(sp.get('s') ?? '1') || 1) - 1, 0), TOTAL - 1)
  const [notes, setNotes] = useState(false)
  const go = useCallback((i: number) => setSp((q) => { const n = new URLSearchParams(q); n.set('s', String(Math.min(Math.max(i, 0), TOTAL - 1) + 1)); return n }, { replace: true }), [setSp])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(cur + 1) }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(cur - 1) }
      else if (e.key === 'Home') go(0); else if (e.key === 'End') go(TOTAL - 1)
      else if (e.key.toLowerCase() === 's') setNotes((v) => !v)
      else if (e.key.toLowerCase() === 'f') { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.() }
      else if (e.key === 'Escape') nav('/')
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [cur, go, nav])
  const [x0, setX0] = useState<number | null>(null)
  return (
    <div className="hk" lang="en" onTouchStart={(e) => setX0(e.touches[0].clientX)} onTouchEnd={(e) => { if (x0 !== null) { const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 60) go(cur + (d < 0 ? 1 : -1)) } setX0(null) }}>
      <div className="hk-stage" key={cur} role="group" aria-roledescription="slide" aria-label={`Slide ${cur + 1} of ${TOTAL}`}>
        {DECK[cur].el(cur + 1)}
        {notes && <div className="hk-notes"><b>SPEAKER SCRIPT</b>{DECK[cur].say}</div>}
        <div className="hk-bar"><i style={{ width: `${((cur + 1) / TOTAL) * 100}%` }} /></div>
      </div>
      <div className="hk-ctl" role="toolbar" aria-label="Slide controls">
        <button onClick={() => go(cur - 1)} aria-label="Previous slide" disabled={cur === 0}>←</button>
        <button onClick={() => go(cur + 1)} aria-label="Next slide" disabled={cur === TOTAL - 1}>→</button>
        <button onClick={() => setNotes((v) => !v)} aria-pressed={notes} aria-label="Speaker script (S)">Script</button>
        <button onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.() }} aria-label="Full screen (F)">⛶</button>
        <a href="#/sunum/ek">Appendix</a>
      </div>
    </div>
  )
}
