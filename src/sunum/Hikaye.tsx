import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SLIDES } from './slides'
import { concept, Card, CardArt, Flow, DotMap, Pts, Slide, SvgIcon, Tag, Trail, credits, logo, ph } from './HikayeParts'
import './hikaye.css'
import './hikaye-a0.css'

/** Story deck A0: one traveller, five cities, one card. Four small "technology stops" sit inside the journey. All text is English (class language); the plan source is Turkish. */
const TOTAL = 22
const PATHS: Record<string, number[] | undefined> = { '10': [1, 2, 4, 5, 6, 7, 9, 11, 12, 15, 18, 19, 21, 22], '3': [1, 4, 5, 7, 17, 22] }

const jump = (id: string) => { const i = SLIDES.findIndex((s) => s.id === id); try { localStorage.setItem('foradas-sunum-v1', JSON.stringify({ i: Math.max(i, 0), s: 0 })) } catch { /* ignore */ } }
/** B) 3D labs stay a hidden option (they did not pass the designer test). Show with ?deep=1. */
const DEEP = (id: string) => !/[?&]deep=1/.test(location.hash) ? null : <button className="hk-link" onClick={() => { jump(id); location.hash = '#/sunum/ek' }}>Deep dive: 3D lab →</button>

interface CityDef { num: string; name: string; at: number; msg: string; hero: string; thumbs: string[]; sights: string; food: string; go: { ico: string; t: string }; acc: string; side: 'l' | 'r' | 'b' }
function City({ c, n }: { c: CityDef; n: number }) {
  const hero = ph(c.hero)
  return (
    <section className={'hk-slide hk-dark hk-city side-' + c.side} aria-label={c.name} style={{ ['--acc' as string]: c.acc }}>
      <img className="hk-bleed" src={hero.url} alt="" /><div className="hk-veil" />
      <Trail at={c.at} />
      <div className="hk-citybox">
        <p className="hk-kick" style={{ color: c.acc }}>{c.num} — {c.name.toUpperCase()}</p>
        <h2>{c.msg}</h2>
        <ul className="hk-trio">
          <li><SvgIcon n="map" /><span>{c.sights}</span></li>
          <li><SvgIcon n="food" /><span>{c.food}</span></li>
          <li><SvgIcon n={c.go.ico} /><span>{c.go.t}</span></li>
        </ul>
      </div>
      <div className="hk-thumbs">{c.thumbs.map((t) => <img key={t} src={ph(t).url} alt="" />)}</div>
      <div className="hk-foot"><span>{credits([c.hero, ...c.thumbs])}</span><span>{n} / {TOTAL}</span></div>
    </section>
  )
}

interface Def { id: number; say: string; el: (n: number) => ReactNode }
const city = (c: CityDef) => (n: number) => <City c={c} n={n} />
const S = (p: { kick: string; title: string; at?: number; dark?: boolean; tech?: boolean; lead?: string; bg?: string }, kids: ReactNode) => (n: number) => <Slide n={n} total={TOTAL} {...p}>{kids}</Slide>
const col = { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(2.2 * var(--u))' } as const

const DECK: Def[] = [
  { id: 1, say: 'Imagine setting out to discover a country. Five cities, dozens of stops, and one card.',
    el: (n) => (
      <section className="hk-slide hk-dark hk-cover rt" aria-label="Cover">
        <img className="hk-bleed" src={ph('ai-gezgin').url} alt="" /><div className="hk-veil hk-veil-b" />
        <img src={logo('FORA_logo-yatay-FORADAS-koyu')} alt="FORADAŞ" className="hk-coverlogo" />
        <div className="hk-covertext"><h1>81 CITIES.<br />ONE JOURNEY.</h1><p className="hk-lead">Can one transport card take us across Türkiye?</p></div>
        <div className="hk-foot"><span>National Shared Transport Card Project · {credits(['ai-gezgin'])}</span><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 2, say: 'When we move from one city to another, we also have to rebuild our travel habits.',
    el: S({ kick: 'The journey begins', title: 'Do we have to start again in every city?' },
      <div className="hk-body"><div className="hk-col" style={{ flex: 1.1 }}>
        <div className="hk-fan" aria-hidden>{['City A card', 'City B card', 'City C card', 'Top-up app', 'Paper ticket'].map((t, i) => <div key={t} style={{ transform: `rotate(${(i - 2) * 7}deg) translateY(${Math.abs(i - 2) * 8}px)`, zIndex: i }}><SvgIcon n="card" size={28} /><b>{t}</b></div>)}</div></div>
        <div className="hk-col"><Pts items={['A new city means a new transport card.', 'Balances are loaded separately and are often left unused.', 'Different apps and payment systems everywhere.']} /></div></div>) },
  { id: 3, say: 'The real problem is that transport is cut apart at city borders.',
    el: S({ kick: 'The size of the problem', title: 'The problem is not only the number of cards.', dark: true },
      <div className="hk-body"><div className="hk-grid3 big">
        <Card ico="clock" or h="Lost time" t="Queues at ticket machines in every new city." />
        <Card ico="wallet" or h="Balance chaos" t="Many small balances. Some are never used." />
        <Card ico="layers" or h="Confusion" t="Frequent travellers, students and tourists feel it most." />
      </div></div>) },
  { id: 4, say: 'So what if one card were enough? This is the idea we want to explore.',
    el: (n) => (
      <section className="hk-slide hk-launch" aria-label="Product launch">
        <p className="hk-kick">The idea</p>
        <div className="hk-body" style={{ marginTop: 'calc(1 * var(--u))' }}>
          <div className="hk-col" style={{ flex: 1.1 }}><h2 style={{ maxWidth: '100%' }}>What if one card were enough?</h2>
            <p className="hk-lead" style={{ maxWidth: '100%', color: 'var(--ink)' }}>A shared transport card for all 81 provinces of Türkiye.</p>
            <p className="hk-lead" style={{ maxWidth: '100%', marginTop: 'calc(.4 * var(--u))' }}><b style={{ color: 'var(--navy)' }}>One card. One balance experience. A shared transport network.</b></p></div>
          <div className="hk-col" style={{ alignItems: 'center' }}><CardArt /><p className="hk-credit">Symbolic card design, not a final product.</p></div>
        </div>
        <div className="hk-foot"><img src={logo('FORA_logo-yatay-FORADAS')} alt="FORADAŞ" /><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 5, say: 'Let us try this idea on a real journey.',
    el: S({ kick: 'The route', title: 'One traveller. Five cities. The same card.', dark: true },
      <div className="hk-body" style={{ flexDirection: 'column', gap: 'calc(1 * var(--u))' }}>
        <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}><DotMap lit={['06', '26', '34', '35', '07']} route label /></div>
        <p className="hk-note"><Tag t="DESIGN" /><span>Between cities: train, plane or coach. The card is for city transport. Schematic map, one dot per province.</span></p>
      </div>) },
  { id: 6, say: 'Our first stop is Ankara. We explore the city by public transport.',
    el: city({ num: '01', name: 'Ankara', at: 0, msg: 'The journey begins.', hero: 'ankara-hamamonu', thumbs: ['ankara-kale', 'ankara-tava'], sights: 'Anıtkabir · Hamamönü · Ankara Castle', food: 'Ankara tava · Beypazarı dried fruit', go: { ico: 'bus', t: 'Bus · Metro · Ankaray' }, acc: '#ff9a3c', side: 'l' }) },
  { id: 7, say: 'The moment we tap the card, the system checks that it is valid. Then the ride can start.',
    el: S({ kick: 'Technology stop 01', title: 'One tap. The journey has started.', dark: true, tech: true, at: 0 },
      <div className="hk-body"><div className="hk-col" style={{ flex: .9 }}><img className="hk-img" src={concept('h1-nfc-okuyucu-el')} alt="A hand holds a card to a reader" style={{ height: 'calc(25 * var(--u))' }} /><p className="hk-credit">Concept illustration (supplied by the author)</p></div>
        <div className="hk-col" style={{ flex: 1.3 }}>
          <Flow vert hot={0} steps={[['Tap', 'Radio signals wake the card (NFC).'], ['Card check', 'The card proves it is genuine.'], ['Fare check', 'Balance and city tariff are checked.'], ['Approve', 'Green light and a beep.'], ['Record', 'The ride is saved as a transaction.']]} />
          <div className="hk-note"><Tag t="SIMULATION" /><span>Contactless (NFC), secure card ID, authorisation, transaction check.</span>{DEEP('tap')}</div></div></div>) },
  { id: 8, say: 'After Ankara we arrive in Eskişehir. We ride the tram, and we do not buy a new card.',
    el: city({ num: '02', name: 'Eskişehir', at: 1, msg: 'History, youth and city life.', hero: 'eskisehir-porsuk', thumbs: ['eskisehir-odunpazari', 'eskisehir-tram'], sights: 'Odunpazarı · Porsuk River · Sazova Park', food: 'Çibörek · Met helva', go: { ico: 'tram', t: 'Tram · Bus' }, acc: '#3fd0c9', side: 'b' }) },
  { id: 9, say: 'Every municipality may run its own system. What matters is that the systems can talk to each other through a shared base.',
    el: S({ kick: 'Technology stop 02', title: 'Each city runs its own system. The card experience stays the same.', dark: true, tech: true, at: 1 },
      <div className="hk-body"><div className="hk-col" style={{ flex: 1.15 }}>
        <svg viewBox="0 0 640 400" width="100%" role="img" aria-label="City systems connect to a shared integration layer around the national card">
          {([['Ankara', 70, 40], ['Eskişehir', 320, 20], ['İstanbul', 570, 40], ['İzmir', 70, 350], ['Antalya', 570, 350]] as [string, number, number][]).map(([n, x, y]) => <g key={n}><line x1={x} y1={y} x2="320" y2="200" stroke="#ff7a00" strokeWidth="4" strokeDasharray="3 10" strokeLinecap="round" /><rect x={x - 62} y={y - 24} width="124" height="48" rx="12" fill="#fff" /><text x={x} y={y + 9} textAnchor="middle" fontSize="23" fontWeight="700" fill="#0b2d6b" fontFamily="Geist, sans-serif">{n}</text></g>)}
        <rect x="150" y="150" width="340" height="100" rx="18" fill="#3fd0c9" /><text x="320" y="192" textAnchor="middle" fontSize="28" fontWeight="800" fill="#071d47" fontFamily="Bricolage Grotesque, sans-serif">Shared integration</text><text x="320" y="226" textAnchor="middle" fontSize="28" fontWeight="800" fill="#071d47" fontFamily="Bricolage Grotesque, sans-serif">layer</text>
          </svg></div>
        <div className="hk-col"><Pts items={[<><b>One card standard</b> for everyone.</>, <><b>Shared checks</b> across operators.</>, <><b>Local tariffs</b> stay with each city.</>]} /><div className="hk-note"><Tag t="PROPOSAL" /><span>Municipality and operator integration is a design, not a live system.</span></div>{DEEP('interop')}</div></div>) },
  { id: 10, say: 'We reach the next city with an intercity vehicle. When we arrive in İstanbul, the same card is waiting for us.',
    el: (n) => (
      <section className="hk-slide hk-dark hk-city side-b" aria-label="Between cities" style={{ ['--acc' as string]: '#ffc26b' }}>
        <img className="hk-bleed" src={ph('tren').url} alt="" /><div className="hk-veil" /><Trail at={1} />
        <div className="hk-citybox"><p className="hk-kick" style={{ color: '#ffc26b' }}>BETWEEN CITIES</p><h2>Cities change. Our card does not.</h2>
          <ul className="hk-trio"><li><SvgIcon n="train" /><span>Eskişehir → İstanbul by train, plane or coach</span></li><li><SvgIcon n="card" /><span>Intercity travel is separate. The card is for transport inside a city.</span></li></ul></div>
        <div className="hk-foot"><span>{credits(['tren'])}</span><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 11, say: 'In İstanbul we use several kinds of transport in one day, and every time it is the same card.',
    el: city({ num: '03', name: 'İstanbul', at: 2, msg: 'Two continents, endless discoveries.', hero: 'ai-istanbul-kart', thumbs: ['istanbul-bogaz', 'galata', 'simit'], sights: 'Sultanahmet · Galata · Kadıköy · the Bosphorus', food: 'Balık ekmek · Simit', go: { ico: 'ferry', t: 'Metro · Tram · Ferry · Bus' }, acc: '#ffc26b', side: 'r' }) },
  { id: 12, say: 'The traveller sees one card. Behind it, municipalities, operators and payment systems work together.',
    el: S({ kick: 'Technology stop 03', title: 'What stands behind one card?', dark: true, tech: true, at: 2 },
      <div className="hk-body" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 'calc(.9 * var(--u))' }}>
        {[['Passenger and card', 'Who rides and what they carry', '#0b2d6b'], ['Reader and validation', 'Checks the card on the vehicle or gate', '#16408a'], ['Shared integration platform', 'Identity · authorisation · transactions', '#2a8f8a'], ['Municipal systems | Payment systems', 'Each keeps its own tariffs and accounts', '#ff7a00']].map(([h, t, c], i) => (
          <div key={h} className="hk-layer hk-rise" style={{ background: c, animationDelay: `${0.25 * i + 0.2}s` }}><b>{h}</b><span>{t}</span></div>))}
        <div className="hk-note"><Tag t="PROPOSAL" />{DEEP('arch')}</div>
      </div>) },
  { id: 13, say: 'The balance is managed in one shared way, while each city keeps applying its own fares.',
    el: S({ kick: 'Balance and payment', title: 'One balance experience. Transparent fares.' },
      <div className="hk-body"><div className="hk-col" style={{ alignItems: 'center', flex: .8 }}>
        <div className="hk-phone" aria-label="Example phone screen"><b className="hk-ph-t">My card</b><div className="hk-ph-bal"><small>Balance</small><strong>100.00 TRY</strong></div>
          {[['Ankara · Bus', '−10.00'], ['Eskişehir · Tram', '−10.00'], ['İstanbul · Ferry', '−10.00']].map(([a, b]) => <div className="hk-ph-row" key={a}><span>{a}</span><em>{b}</em></div>)}</div>
        <div className="hk-note"><Tag t="ILLUSTRATIVE" /><span>Example amounts, not real tariffs.</span></div></div>
        <div className="hk-col"><Pts items={['Top up in one place.', 'Each city sets its own fare.', 'Every ride is recorded. Operators and municipalities reconcile later.']} /></div></div>) },
  { id: 14, say: 'In İzmir we live the same experience. No new card, no new balance to manage.',
    el: city({ num: '04', name: 'İzmir', at: 3, msg: 'The rhythm of the Aegean.', hero: 'izmir-kordon', thumbs: ['izmir-saat'], sights: 'Clock Tower · Kemeraltı · Kordon', food: 'Boyoz · Kumru', go: { ico: 'ferry', t: 'Metro · Tram · Ferry · Bus' }, acc: '#6cc4ff', side: 'r' }) },
  { id: 15, say: 'A single system working in many cities has to keep people safe and keep running.',
    el: S({ kick: 'Technology stop 04', title: 'Safe travel needs a trustworthy system.', dark: true, tech: true, at: 3, bg: 'ai-guvenlik' },
      <div className="hk-body"><div className="hk-grid3 big six">
        <Card ico="shield" teal h="Secure card check" t="The card proves it is genuine, every time." />
        <Card ico="lock" teal h="Encrypted messages" t="Data is protected on its way to the server." />
        <Card ico="eye" teal h="Access control" t="Only authorised people and systems can act." />
        <Card ico="sync" teal h="No double use" t="Fraud and replayed taps are detected." />
        <Card ico="layers" teal h="Always on" t="Backups keep the service running." />
        <Card ico="user" teal h="Privacy first" t="Collect less. The reader sees a token, not a name." />
      </div></div>) },
  { id: 16, say: 'Our journey that began in Ankara ends in Antalya. We visited five cities and rode many vehicles, and the card never changed.',
    el: city({ num: '05', name: 'Antalya', at: 4, msg: 'The last stop, on the Mediterranean.', hero: 'antalya-kaleici', thumbs: ['antalya-hadrian', 'antalya-duden'], sights: 'Kaleiçi · Düden Waterfalls · Konyaaltı', food: 'Antalya piyaz · Tahini pumpkin dessert', go: { ico: 'tram', t: 'Tram · Bus' }, acc: '#3fd0c9', side: 'b' }) },
  { id: 17, say: 'Five cities, five experiences, one card.',
    el: (n) => (
      <section className="hk-slide hk-dark" aria-label="Journey summary">
        <p className="hk-kick">The journey in one look</p><h2>Five cities. Five experiences. One card.</h2>
        <div className="hk-strip">{['ankara-hamamonu', 'eskisehir-odunpazari', 'istanbul-bogaz', 'izmir-kordon', 'antalya-hadrian'].map((id, i) => <figure key={id}><img src={ph(id).url} alt="" /><figcaption>{['Ankara', 'Eskişehir', 'İstanbul', 'İzmir', 'Antalya'][i]}</figcaption></figure>)}</div>
        <p className="hk-lead" style={{ maxWidth: '100%', marginTop: 'calc(1.6 * var(--u))' }}>The culture changed. The food changed. The vehicles changed. <b style={{ color: '#ff9a3c' }}>The card did not.</b></p>
        <div className="hk-foot"><span>{credits(['ankara-hamamonu', 'eskisehir-odunpazari', 'istanbul-bogaz', 'izmir-kordon', 'antalya-hadrian'])}</span><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 18, say: 'This journey should not stop at five cities. Our goal is a shared transport experience across Türkiye.',
    el: S({ kick: 'National vision', title: 'Five cities are only the start.', dark: true, bg: 'ai-turkiye-ag' },
      <div className="hk-body"><div className="hk-col" style={{ flex: 1.3, alignSelf: 'stretch', justifyContent: 'center' }}><DotMap lit={['06', '26', '34', '35', '07']} all /><p className="hk-credit">Target: all 81 provinces. This is a goal, not a live integration.</p></div>
        <div className="hk-col" style={{ gap: 'calc(1.4 * var(--u))' }}>
          <div className="hk-card"><Tag t="REAL" /><h3>Already today</h3><p>Türkiye Kart (PTT) works in the public transport of municipalities that have agreed to it.</p></div>
          <div className="hk-card"><Tag t="PROPOSAL" /><h3>Our proposal</h3><p>Make it widespread, joined-up and focused on the traveller across 81 provinces.</p></div></div></div>) },
  { id: 19, say: 'Instead of changing every city at once, a step-by-step integration model is more realistic.',
    el: S({ kick: 'Is it feasible?', title: 'How can every city join the same system?' },
      <div className="hk-body" style={col}>
        <Flow hot={3} steps={[['Agree standards', 'Common card and transaction rules.'], ['Connect', 'Municipalities and operators join.'], ['Share revenue', 'Payment and revenue-sharing rules.'], ['Pilot', 'Test in a few pilot cities.'], ['Roll out', 'Spread step by step across the country.']]} />
        <div className="hk-note"><Tag t="PROPOSAL" /><span>A phased plan, not a promise of dates.</span></div>
      </div>) },
  { id: 20, say: 'Less confusion and an easier journey, for everyone who travels.',
    el: S({ kick: 'What changes for people', title: 'Less confusion. An easier journey.' },
      <div className="hk-body"><div className="hk-grid3 big two">
        <Card ico="grad" h="Students" t="Easier travel between cities." /><Card ico="user" h="Passengers" t="One card, simple to use." />
        <Card ico="map" h="Tourists" t="Fewer cards and apps to learn." /><Card ico="museum" h="Municipalities" t="Shared standards and easier integration." />
      </div></div>) },
  { id: 21, say: 'Cities may differ and systems may differ. But the travel experience can be shared.',
    el: (n) => (
      <section className="hk-slide hk-dark hk-big" aria-label="The big idea">
        <div className="hk-collage" aria-hidden>{['ankara-hamamonu', 'eskisehir-odunpazari', 'istanbul-bogaz', 'izmir-kordon', 'antalya-kaleici'].map((id) => <img key={id} src={ph(id).url} alt="" />)}</div><div className="hk-veil hk-veil-c" />
        <div className="hk-bigtext"><div className="hk-bigcard"><CardArt /></div><h2>Not just a transport card. A shared experience.</h2>
          <p className="hk-lead">Cities may differ. Systems may differ. The journey can be shared.</p></div>
        <div className="hk-foot"><span>{credits(['ankara-hamamonu', 'eskisehir-odunpazari', 'istanbul-bogaz', 'izmir-kordon', 'antalya-kaleici'])}</span><span>{n} / {TOTAL}</span></div>
      </section>) },
  { id: 22, say: 'Because discovering a country should not mean starting again in every city.',
    el: (n) => (
      <section className="hk-slide hk-dark hk-cover" aria-label="Final">
        <img className="hk-bleed" src={ph('kapak').url} alt="" /><div className="hk-veil hk-veil-b" />
        <img src={logo('FORA_logo-yatay-FORADAS-koyu')} alt="FORADAŞ" className="hk-coverlogo" />
        <div className="hk-covertext"><h1>81 CITIES.<br />ONE CARD.<br />UNLIMITED DISCOVERY.</h1><p className="hk-lead">Let us discover Türkiye together.</p>
          <p><button className="hk-link" onClick={() => { location.hash = '#/sunum/ek' }}>Appendix: the 42 full technical slides →</button></p></div>
        <div className="hk-foot"><span>National Shared Transport Card Project · {credits(['kapak'])}</span><span>{n} / {TOTAL}</span></div>
      </section>) },
]
export const STORY_SAY = DECK.map((d) => d.say)

/** Static story deck for the PDF page (all slides, no controls). */
export function StoryPrint() {
  return <div className="hk-print"><div className="hk">{DECK.map((d, i) => <div className="hk-stage" key={d.id}>{d.el(i + 1)}</div>)}</div></div>
}

export default function Hikaye() {
  const [sp, setSp] = useSearchParams(); const nav = useNavigate()
  const p = sp.get('p') ?? ''
  const order = PATHS[p] ?? DECK.map((d) => d.id)
  const cur = Math.min(Math.max((+(sp.get('s') ?? '1') || 1) - 1, 0), TOTAL - 1)
  const [notes, setNotes] = useState(false)
  const setS = useCallback((i: number) => setSp((q) => { const n = new URLSearchParams(q); n.set('s', String(Math.min(Math.max(i, 0), TOTAL - 1) + 1)); return n }, { replace: true }), [setSp])
  const step = useCallback((d: 1 | -1) => {
    const nxt = d === 1 ? order.find((x) => x > cur + 1) : [...order].reverse().find((x) => x < cur + 1)
    if (nxt) setS(nxt - 1)
  }, [order, cur, setS])
  const setPath = (v: string) => setSp((q) => { const n = new URLSearchParams(q); if (v) n.set('p', v); else n.delete('p'); n.set('s', String((PATHS[v] ?? [1])[0])); return n }, { replace: true })
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); step(1) }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); step(-1) }
      else if (e.key === 'Home') setS(order[0] - 1); else if (e.key === 'End') setS(order[order.length - 1] - 1)
      else if (e.key.toLowerCase() === 's') setNotes((v) => !v)
      else if (e.key.toLowerCase() === 'f') { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.() }
      else if (e.key === 'Escape') nav('/')
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [step, setS, order, nav])
  const [x0, setX0] = useState<number | null>(null)
  return (
    <div className="hk" lang="en" onTouchStart={(e) => setX0(e.touches[0].clientX)} onTouchEnd={(e) => { if (x0 !== null) { const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 60) step(d < 0 ? 1 : -1) } setX0(null) }}>
      <div className="hk-stage" key={cur} role="group" aria-roledescription="slide" aria-label={`Slide ${cur + 1} of ${TOTAL}`}>
        {DECK[cur].el(cur + 1)}
        {notes && <div className="hk-notes"><b>SPEAKER SCRIPT</b>{DECK[cur].say}</div>}
        <div className="hk-bar"><i style={{ width: `${((Math.max(order.indexOf(cur + 1), 0) + 1) / order.length) * 100}%` }} /></div>
      </div>
      <div className="hk-ctl" role="toolbar" aria-label="Slide controls">
        <button onClick={() => step(-1)} aria-label="Previous slide" disabled={cur === 0}>←</button>
        <button onClick={() => step(1)} aria-label="Next slide" disabled={cur === TOTAL - 1}>→</button>
        {[['', 'Full'], ['10', '10 min'], ['3', '3 min']].map(([v, l]) => <button key={l} onClick={() => setPath(v)} aria-pressed={p === v} aria-label={`${l} path`}>{l}</button>)}
        <button onClick={() => setNotes((v) => !v)} aria-pressed={notes} aria-label="Speaker script (S)">Script</button>
        <button onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.() }} aria-label="Full screen (F)">⛶</button>
        <a href="#/sunum/ek">Appendix</a>
      </div>
    </div>
  )
}
