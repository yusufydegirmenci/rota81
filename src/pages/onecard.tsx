import { useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { MODE_LABEL, TL } from '../services/api'
import { processIntercity, processTap, POLICY, type LegTrace, type Step } from '../services/cardflow'
import { Badge, Card, PageHeader, SelectField, SimNote, Tabs } from '../ui/ui'

const FLOW = [
  ['Kart okunur', 'Doğrulayıcı kartın kimliğini ve durumunu (aktif/dondurulmuş) okur.'],
  ['Durak ve il belirlenir', 'Doğrulayıcının bağlı olduğu durak, ili ve ilçeyi söyler. Kullanıcı il seçmez.'],
  ['Hat ve işletmeci', 'Araç/hat bulunur; parayı kimin alacağı (işletmeci) belli olur.'],
  ['Şehir tarifesi', 'O ilin belediyesinin yürürlükteki tarifesi (tam/öğrenci) okunur.'],
  ['Aktarma kuralı', `Son ${POLICY.transferWindowMin} dk içinde başka bir biniş varsa indirim hesaplanır.`],
  ['Bakiye kontrolü', 'Ortak cüzdanda yeterli bakiye var mı bakılır; yoksa geçiş reddedilir.'],
  ['Defter kaydı', 'Tekil anahtarla (çift okutma korumalı) cüzdandan düşülür.'],
  ['Mahsuplaşma', 'Gün sonu: toplanan ücretler işletmeci ve il bazında ayrıştırılır, ödeme yapılır.'],
  ['Makbuz ve bildirim', 'Yolcuya kalan bakiye ve gerekirse uyarı gönderilir.'],
]

function Trace({ steps }: { steps: Step[] }) {
  return (
    <ol className="trace">
      {steps.map((s) => (
        <li key={s.n} className={s.state}><span className="tn">{String(s.n).padStart(2, '0')}</span><div><b>{s.title}</b><p className="small">{s.detail}</p></div></li>
      ))}
    </ol>
  )
}

/** "Tek kart" kanıtı: aynı kart ve aynı bakiye ile 81 ilin herhangi birinde ve iller arası yolculukta okutma; işleyiş adım adım. */
export function OneCard() {
  const { api, session, run } = useApp()
  const cities = api.catalog.cities()
  const [kind, setKind] = useState<'single' | 'inter'>('single')
  const [cityId, setCityId] = useState('06')
  const [to, setTo] = useState('34')
  const [q, setQ] = useState('')
  const [stopId, setStopId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [pax, setPax] = useState<'full' | 'student'>('full')
  const [legs, setLegs] = useState<LegTrace[] | null>(null)
  const seq = useRef(0)
  const w = api.wallet.get(session)
  const stops = useMemo(() => {
    const n = q.trim().toLocaleLowerCase('tr')
    const all = api.catalog.stops(cityId)
    return (n ? all.filter((s) => s.name.toLocaleLowerCase('tr').includes(n) || s.code.includes(n)) : all).slice(0, 30)
  }, [api, cityId, q])
  const stop = stops.find((s) => s.id === stopId) ?? stops[0]
  const routes = stop ? api.catalog.routes(cityId).filter((r) => r.stopIds.includes(stop.id)).slice(0, 40) : []
  const used = new Set(w.transactions.filter((t) => t.type === 'spend' && t.status === 'completed' && t.cityId).map((t) => t.cityId))
  const tap = () => {
    seq.current += 1
    const key = `tap-${Date.now()}-${seq.current}`
    if (kind === 'single') {
      if (!stop) return
      const r = run(() => processTap(api, session, { cityId, stopId: stop.id, routeId: routeId || undefined, passenger: pax }, key))
      if (r) setLegs([{ title: `${r.cityName} · ${stop.name}`, result: r }])
    } else {
      const r = run(() => processIntercity(api, session, cityId, to, pax, key))
      if (r) setLegs(r.legs)
    }
  }
  const total = legs?.reduce((a, l) => a + l.result.paid, 0) ?? 0
  const byOp = new Map<string, number>()
  legs?.forEach((l) => { if (l.result.paid) byOp.set(`${l.result.operator || '—'} · ${l.result.cityName}`, (byOp.get(`${l.result.operator || '—'} · ${l.result.cityName}`) ?? 0) + l.result.paid) })
  return (
    <div className="stack">
      <PageHeader title="Tek kart: nasıl işler?" sub="Aynı kart, aynı bakiye, 81 ilde ve iller arası yolculukta. Okutun; her adımın gerçekten ne yaptığını görün." />
      <div className="grid2">
        <div className="stack">
          <Tabs value={kind} onChange={(v) => { setKind(v); setLegs(null) }} items={[{ id: 'single', label: 'Tek biniş' }, { id: 'inter', label: 'İller arası yolculuk' }]} />
          <SelectField label={kind === 'inter' ? 'Çıkış ili' : 'Şehir (81 ilden biri)'} value={cityId} onChange={(v) => { setCityId(v); setStopId(''); setRouteId('') }} options={cities.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))} />
          {kind === 'inter'
            ? <SelectField label="Varış ili" value={to} onChange={setTo} options={cities.filter((c) => c.id !== cityId).map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))} />
            : <>
              <div className="field"><label htmlFor="dq">Durak ara (ad veya kod)</label><input id="dq" className="input" value={q} onChange={(e) => { setQ(e.target.value); setStopId('') }} placeholder={`${stops.length} durak listeleniyor`} /></div>
              <SelectField label="Durak" value={stop?.id ?? ''} onChange={(v) => { setStopId(v); setRouteId('') }} options={stops.length ? stops.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}${s.real ? '' : ' (örnek)'}` })) : [{ value: '', label: 'Bu ilde kayıtlı durak yok' }]} />
              <SelectField label="Hat" value={routeId} onChange={setRouteId} options={[{ value: '', label: routes.length ? 'Otomatik (ilk hat)' : 'Bu durakta kayıtlı hat yok' }, ...routes.map((r) => ({ value: r.id, label: `${MODE_LABEL[r.mode]} ${r.code} · ${r.name}` }))]} />
            </>}
          <SelectField label="Yolcu türü" value={pax} onChange={(v) => setPax(v as 'full' | 'student')} options={[{ value: 'full', label: 'Tam' }, { value: 'student', label: 'Öğrenci' }]} />
          <div className="row"><button className="btn accent" onClick={tap} disabled={kind === 'single' && !stop}>Kartı okut</button><span className="muted small">Bakiye <span className="money">{TL(w.wallet.balance)}</span></span></div>
          <SimNote>Okutma simülasyondur: gerçek doğrulayıcı ve ödeme yok. Duraklar gerçektir (İstanbul: İETT, diğer iller: OpenStreetMap); tarifeler ve iller arası ücret/süre tahmindir.</SimNote>
        </div>
        <div className="stack">
          <div className="validator" aria-live="polite">
            {legs ? (<>
              <p className="eyebrow">{legs.every((l) => l.result.ok) ? 'GEÇİŞ ONAYLANDI' : 'GEÇİŞ TAMAMLANAMADI'}</p>
              <h2>{legs.length > 1 ? `Toplam −${TL(total)}` : `${legs[0].result.cityName} · −${TL(legs[0].result.paid)}`}</h2>
              <p className="muted small">Kalan ortak bakiye <span className="money">{TL(w.wallet.balance)}</span></p>
              {byOp.size > 0 && <div className="clearing"><h3>Gün sonu mahsuplaşma</h3>{[...byOp].map(([k, v]) => <p key={k} className="small"><span className="money">{TL(v)}</span> → {k}</p>)}</div>}
            </>) : (<>
              <p className="eyebrow">BEKLİYOR</p>
              <h2>Kartı okutun</h2>
              <p className="muted">Soldan bir il ve durak seçip “Kartı okut”a basın. Aşağıda işlem adım adım açılır.</p>
            </>)}
          </div>
        </div>
      </div>

      {legs ? legs.map((l) => (
        <Card key={l.title} title={l.title} right={<Badge tone={l.result.ok ? 'ok' : 'bad'}>{l.result.ok ? `−${TL(l.result.paid)}` : 'reddedildi'}</Badge>}><Trace steps={l.result.steps} /></Card>
      )) : (
        <Card title="Bir okutma nasıl işlenir? (A'dan Z'ye)">
          <ol className="trace">{FLOW.map(([t, d], i) => <li key={t} className="info"><span className="tn">{String(i + 1).padStart(2, '0')}</span><div><b>{t}</b><p className="small">{d}</p></div></li>)}</ol>
          <p className="hint" style={{ marginTop: 12 }}>İller arası yolculukta bu zincir her bacak için ayrı çalışır: her il kendi tarifesini uygular, para kendi işletmecisine yazılır, yolcu tek bakiyeden öder.</p>
        </Card>
      )}
      <Card title={`Bu kartla geçtiğiniz iller · ${used.size} / 81`} right={<Badge tone={used.size >= 3 ? 'ok' : 'mute'}>{used.size >= 3 ? 'Tek kart çalışıyor' : 'Birkaç il deneyin'}</Badge>}>
        <div className="cityGrid" role="img" aria-label={`81 ilden ${used.size} tanesinde kullanıldı`}>
          {cities.map((c) => <span key={c.id} className={used.has(c.id) ? 'on' : ''} title={c.name}>{c.id}</span>)}
        </div>
      </Card>
    </div>
  )
}
