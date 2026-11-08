import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { arrivalsAt, CROWD_LABEL, serviceActive, tripOutlook, vehiclesOn, type Crowd, type VehicleState } from '../services/fleet'
import { MODE_LABEL } from '../services/api'
import { Badge, Card, Empty, PageHeader, SelectField, SimNote, Stat, Tabs } from '../ui/ui'

const TONE: Record<Crowd, 'ok' | 'info' | 'warn' | 'bad'> = { low: 'ok', mid: 'info', high: 'warn', full: 'bad' }

export function useTick(ms = 5000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t) }, [ms])
  return now
}

export function OccupancyBar({ pct, crowd }: { pct: number; crowd: Crowd }) {
  return (
    <div className="occ" role="img" aria-label={`Doluluk yüzde ${pct}, ${CROWD_LABEL[crowd]}`}>
      <div className={`occfill ${crowd}`} style={{ width: `${Math.max(3, pct)}%` }} />
    </div>
  )
}

/** Canlı (simüle) araç doluluğu, durak panosu ve yolculuk takibi. lockedCity verilirse şehir seçimi kilitlenir. */
export function LiveBoard({ lockedCity }: { lockedCity?: string }) {
  const { api } = useApp()
  const real = useTick()
  const [simH, setSimH] = useState('now')
  const now = useMemo(() => { if (simH === 'now') return real; const d = new Date(real); d.setHours(Number(simH), 10, real.getSeconds(), 0); return d }, [real, simH])
  const [city, setCity] = useState(lockedCity ?? '06')
  const [tab, setTab] = useState('line')
  const routes = api.catalog.routes(city).filter((r) => r.status === 'active')
  const stops = api.catalog.stops(city)
  const [routeId, setRouteId] = useState('')
  const [stopId, setStopId] = useState('')
  const [destId, setDestId] = useState('')
  const route = routes.find((r) => r.id === routeId) ?? routes[0]
  const stopName = (id: string) => stops.find((s) => s.id === id)?.name ?? id
  const vehicles = useMemo(() => (route ? vehiclesOn(route, now) : []), [route, now])
  const minute = now.getHours() * 60 + now.getMinutes()
  const stopSel = stopId || stops[0]?.id || ''
  const arrivals = useMemo(() => arrivalsAt(stopSel, api.catalog.routes(city).filter((r) => r.status === 'active'), now).slice(0, 8), [stopSel, city, now, api])
  const avg = vehicles.length ? Math.round(vehicles.reduce((s, v) => s + v.pct, 0) / vehicles.length) : 0
  const taps = vehicles.reduce((s, v) => s + v.taps, 0)
  const at = (i: number): VehicleState[] => vehicles.filter((v) => v.atStop && v.stopIndex === i)
  const between = (i: number): VehicleState[] => vehicles.filter((v) => !v.atStop && Math.min(v.stopIndex, v.nextIndex) === i)

  return (
    <div className="stack">
      <PageHeader title="Canlı araç doluluğu" sub={`Güncelleme: ${now.toLocaleTimeString('tr-TR')} · her 5 sn`} />
      <SimNote>Bu ekran simülasyondur: kart okutma sayıları ve araç konumları saate ve hatta göre üretilir. Gerçek sistemde araç konum (AVL) ve kart okutucu (validatör) verisinden hesaplanır.</SimNote>
      <div style={{ maxWidth: 260 }}><SelectField label="Test saati" value={simH} onChange={setSimH} options={[{ value: 'now', label: 'Şu an' }, { value: '8', label: '08:10 sabah tepe saati' }, { value: '13', label: '13:10 öğle' }, { value: '18', label: '18:10 akşam tepe saati' }, { value: '23', label: '23:10 gece' }]} /></div>
      <div className="grid2">
        {!lockedCity && tab !== 'ride' && <SelectField label="Şehir" value={city} onChange={(v) => { setCity(v); setRouteId(''); setStopId(''); setDestId('') }} options={api.catalog.cities().map((c) => ({ value: c.id, label: c.name }))} />}
        {tab === 'stop'
          ? <SelectField label="Bulunduğum durak" value={stopSel} onChange={setStopId} options={stops.map((s) => ({ value: s.id, label: s.name }))} />
          : tab === 'line' ? <SelectField label="Hat" value={route?.id ?? ''} onChange={setRouteId} options={routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name} (${MODE_LABEL[r.mode]})` }))} /> : null}
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'line', label: 'Hat görünümü' }, { id: 'stop', label: 'Durak panosu' }, ...(lockedCity ? [] : [{ id: 'ride', label: 'Yolculuğum' }])]} />
      {!serviceActive(minute) && <Card><Empty title="Şu an sefer yok">Simüle edilen hizmet saatleri 05:00 ile 24:00 arasındadır.</Empty></Card>}
      {serviceActive(minute) && tab === 'line' && route && (
        <>
          <div className="grid3">
            <Stat label="Hatta araç" value={vehicles.length} />
            <Stat label="Ortalama doluluk" value={`%${avg}`} />
            <Stat label="Kart okutma (simüle)" value={taps} />
          </div>
          <div className="grid2" style={{ alignItems: 'start' }}>
            <Card title={`${route.code} · ${route.name}`}>
              <div className="linemap">
                {route.stopIds.map((id, i) => (
                  <div key={id}>
                    <div className="lmrow"><span className={`lmdot ${at(i).length ? 'on' : ''}`} /><span className="lmname">{stopName(id)}</span>
                      {at(i).map((v) => <Badge key={v.id} tone={TONE[v.crowd]}>🚌 {v.id} · %{v.pct}</Badge>)}</div>
                    {i < route.stopIds.length - 1 && <div className="lmseg">{between(i).map((v) => <Badge key={v.id} tone={TONE[v.crowd]}>{v.dir === 1 ? '↓' : '↑'} {v.id} · %{v.pct}</Badge>)}</div>}
                  </div>
                ))}
              </div>
            </Card>
            <div className="stack">
              {vehicles.map((v) => (
                <Card key={v.id}>
                  <div className="row"><b>Araç {v.id}</b><div className="sp" /><Badge tone={TONE[v.crowd]}>{CROWD_LABEL[v.crowd]}</Badge></div>
                  <p className="small muted">{v.atStop ? `${stopName(route.stopIds[v.stopIndex])} durağında` : `${stopName(route.stopIds[v.stopIndex])} → ${stopName(route.stopIds[v.nextIndex])} arasında`} · {v.dir === 1 ? 'gidiş' : 'dönüş'}</p>
                  <OccupancyBar pct={v.pct} crowd={v.crowd} />
                  <p className="small"><b>%{v.pct}</b> dolu · {v.onboard}/{v.capacity} yolcu · {v.taps} kart okutma{!v.atStop && ` · sonraki durak ${v.etaNextMin} dk`}</p>
                </Card>
              ))}
              {!vehicles.length && <Empty title="Bu hatta şu an araç yok" />}
            </div>
          </div>
        </>
      )}
      {serviceActive(minute) && tab === 'stop' && (
        <>
          <SelectField label="Gideceğim durak (isteğe bağlı)" value={destId} onChange={setDestId} options={[{ value: '', label: 'Seçilmedi' }, ...stops.filter((s) => s.id !== stopSel).map((s) => ({ value: s.id, label: s.name }))]} />
          {destId && <Alternatives from={stopSel} to={destId} city={city} now={now} />}
          <Card title={`${stopName(stopSel)} durağına yaklaşanlar`}>
            {arrivals.length ? arrivals.map((a, i) => (
              <div key={i} className="arrrow">
                <b className="arrcode">{a.route.code}</b>
                <div className="arrmid"><span>{MODE_LABEL[a.route.mode]} · {stopName(a.route.stopIds[a.towards])} yönü</span><OccupancyBar pct={a.vehicle.pct} crowd={a.vehicle.crowd} /></div>
                <div className="arrright"><b>{a.etaMin === 0 ? 'Durakta' : `${a.etaMin} dk`}</b><small>%{a.vehicle.pct} dolu</small></div>
              </div>
            )) : <Empty title="Yaklaşan araç yok" />}
          </Card>
        </>
      )}
      {serviceActive(minute) && tab === 'ride' && <RidePanel city={city} now={now} setCity={setCity} />}
    </div>
  )
}

/** Bekleyen yolcu için: seçilen iki durak arasında doğrudan giden hatlar, gelecek araç ve doluluk. */
function Alternatives({ from, to, city, now }: { from: string; to: string; city: string; now: Date }) {
  const { api } = useApp()
  const routes = api.catalog.routes(city).filter((r) => r.status === 'active')
  const rows = routes.flatMap((r) => {
    const a = r.stopIds.indexOf(from), b = r.stopIds.indexOf(to)
    if (a < 0 || b < 0) return []
    const dirWanted = b > a ? 1 : -1
    const arr = arrivalsAt(from, [r], now).find((x) => x.vehicle.dir === dirWanted)
    if (!arr) return []
    const out = tripOutlook(r, arr.vehicle, a, b, now)
    if (!out) return []
    const score = arr.etaMin + out.etaMin + out.peak / 8
    return [{ r, arr, out, score }]
  }).sort((x, y) => x.score - y.score)
  return (
    <Card title="Bu iki durak arasındaki seçenekler">
      {rows.length ? rows.map((x, i) => (
        <div key={x.r.id} className="arrrow">
          <b className="arrcode">{x.r.code}</b>
          <div className="arrmid"><span>{MODE_LABEL[x.r.mode]} · {x.r.name}</span><OccupancyBar pct={x.out.peak} crowd={x.arr.vehicle.crowd} />
            <small className="muted">Bekleme {x.arr.etaMin} dk · yolculuk {x.out.etaMin} dk · en yoğun nokta %{x.out.peak}</small></div>
          <div className="arrright">{i === 0 && <Badge tone="ok">Önerilen</Badge>}<small>{x.out.trend === 'artacak' ? 'yoğunluk artacak' : x.out.trend === 'azalacak' ? 'yoğunluk azalacak' : 'yoğunluk benzer'}</small></div>
        </div>
      )) : <Empty title="Doğrudan hat yok">Bu iki durak arasında tek hatla gidilemiyor. Aktarmalı seçenekler için Rota sayfasını kullanın.</Empty>}
    </Card>
  )
}

/** Kartını okutan yolcu: araç, iniş durağı, yoğunluk tahmini ve bildirimler (simüle). */
function RidePanel({ city, now, setCity }: { city: string; now: Date; setCity: (c: string) => void }) {
  const { api, session, toast } = useApp()
  const routes = api.catalog.routes(city).filter((r) => r.status === 'active')
  const stops = api.catalog.stops(city)
  const [routeId, setRouteId] = useState(''); const [boardId, setBoardId] = useState(''); const [destId, setDestId] = useState('')
  const [ride, setRide] = useState<{ routeId: string; vehicleId: string; boardIdx: number; destIdx: number; dir: 1 | -1 } | null>(null)
  const sent = useRef<Set<string>>(new Set())
  const route = routes.find((r) => r.id === (ride?.routeId ?? routeId)) ?? routes[0]
  const name = (id: string) => stops.find((s) => s.id === id)?.name ?? id
  const live = route && ride ? vehiclesOn(route, now).find((v) => v.id === ride.vehicleId) : undefined
  const waiting = !!(ride && live && live.dir !== ride.dir)
  const vehicle = ride && live ? (waiting ? { ...live, dir: ride.dir, stopIndex: ride.boardIdx, atStop: true, pct: Math.round(live.pct * 0.25), onboard: Math.round(live.onboard * 0.25) } : live) : undefined
  const out = route && ride && vehicle ? tripOutlook(route, vehicle, vehicle.stopIndex, ride.destIdx, now) : null
  const curIdx = vehicle ? vehicle.stopIndex : 0
  const left = ride && vehicle ? Math.abs(ride.destIdx - curIdx) : 0
  useEffect(() => {
    if (!ride || !route || !vehicle) return
    const mark = (k: string, text: string) => { if (!sent.current.has(k)) { sent.current.add(k); api.me.notify(session, text) } }
    if (left <= 2 && left > 0) mark(`${ride.vehicleId}:2`, `${route.code} hattı: ${name(route.stopIds[ride.destIdx])} durağına ${left} durak kaldı. Hazırlanın.`)
    if (left === 0) { mark(`${ride.vehicleId}:0`, `${name(route.stopIds[ride.destIdx])} durağına geldiniz. İyi günler.`); setRide(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, ride?.vehicleId])
  const start = () => {
    const r = routes.find((x) => x.id === routeId) ?? routes[0]
    const a = r.stopIds.indexOf(boardId || r.stopIds[0]); const b = r.stopIds.indexOf(destId || r.stopIds[r.stopIds.length - 1])
    if (a < 0 || b < 0 || a === b) { toast('Biniş ve iniş durağını farklı seçin.', true); return }
    const arr = arrivalsAt(r.stopIds[a], [r], now).find((x) => x.vehicle.dir === (b > a ? 1 : -1))
    if (!arr) { toast('Şu an bu yönde araç yok.', true); return }
    const o = tripOutlook(r, arr.vehicle, a, b, now)
    sent.current = new Set()
    setRide({ routeId: r.id, vehicleId: arr.vehicle.id, boardIdx: a, destIdx: b, dir: b > a ? 1 : -1 })
    api.me.notify(session, `Kartınız okutuldu (simülasyon): ${r.code} hattı, ${name(r.stopIds[a])} → ${name(r.stopIds[b])}. Şu an araç %${arr.vehicle.pct} dolu${o ? `, inişte tahminen %${o.pctDest} (${o.trend === 'artacak' ? 'yoğunluk artacak' : o.trend === 'azalacak' ? 'yoğunluk azalacak' : 'yoğunluk benzer'})` : ''}.`)
    toast('Kart okutuldu (simülasyon). Bildirimlerinize bakın.')
  }
  return (
    <div className="stack">
      {!ride && (
        <Card title="Kartımı okuttum">
          <div className="stack">
            <SelectField label="Şehir" value={city} onChange={(v) => { setCity(v); setRouteId(''); setBoardId(''); setDestId('') }} options={api.catalog.cities().map((c) => ({ value: c.id, label: c.name }))} />
            <SelectField label="Hat" value={route?.id ?? ''} onChange={(v) => { setRouteId(v); setBoardId(''); setDestId('') }} options={routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name} (${MODE_LABEL[r.mode]})` }))} />
            {route && <>
              <SelectField label="Bindiğim durak" value={boardId || route.stopIds[0]} onChange={setBoardId} options={route.stopIds.map((id) => ({ value: id, label: name(id) }))} />
              <SelectField label="İneceğim durak" value={destId || route.stopIds[route.stopIds.length - 1]} onChange={setDestId} options={route.stopIds.map((id) => ({ value: id, label: name(id) }))} />
            </>}
            <button className="btn primary" onClick={start}>💳 Kartı okut (simülasyon)</button>
          </div>
        </Card>
      )}
      {ride && route && vehicle && out && (
        <Card title={`${route.code} · yolculuğunuz sürüyor`}>
          {waiting ? <p>Araç henüz <b>{name(route.stopIds[ride.boardIdx])}</b> durağına gelmedi (yaklaşık {live?.etaNextMin ?? 0} dk). Bindikten sonra takip başlar.</p> : <p><b>{name(route.stopIds[curIdx])}</b> yakınındasınız. İneceğiniz durak: <b>{name(route.stopIds[ride.destIdx])}</b> ({left} durak kaldı)</p>}
          <p className="small">Araç şu an <b>%{vehicle.pct}</b> dolu. İnişte tahmini <b>%{out.pctDest}</b>: {out.trend === 'artacak' ? 'araç daha da yoğunlaşacak.' : out.trend === 'azalacak' ? 'araç boşalacak.' : 'yoğunluk benzer kalacak.'}</p>
          <div className="profile">
            {out.profile.map((p) => (
              <div key={p.stopIndex} className="pcol" title={`${name(route.stopIds[p.stopIndex])} %${p.pct}`}>
                <div className="pbar"><div className={`occfill ${p.pct < 35 ? 'low' : p.pct < 65 ? 'mid' : p.pct < 90 ? 'high' : 'full'}`} style={{ height: `${Math.max(4, p.pct)}%`, width: '100%' }} /></div>
                <small>{name(route.stopIds[p.stopIndex]).slice(0, 7)}</small>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => { setRide(null); toast('Yolculuk takibi bitti.') }}>Takibi bitir</button>
        </Card>
      )}
      <SimNote>Bildirimler "Bildirimler" sayfanıza düşer. Gerçek sistemde bu mesajlar telefon bildirimi olarak gönderilir.</SimNote>
    </div>
  )
}
