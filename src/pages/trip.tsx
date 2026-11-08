import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { PLACES, type Place } from '../data/places'
import { PROVINCES } from '../data/provinces'
import { intercity } from '../services/intercity'
import { MODE_LABEL, TL } from '../services/api'
import type { Journey } from '../domain/types'
import { Badge, Card, Empty, PageHeader, SelectField, SimNote, Stat } from '../ui/ui'

interface Step { kind: 'local' | 'bus' | 'walk' | 'wait'; title: string; detail: string; minutes: number; fare: number; cityId: string }


export function GeziPage() {
  const { api, session, toast } = useApp()
  const [fromCity, setFromCity] = useState('06')
  const [toCity, setToCity] = useState('26')
  const [placeIdx, setPlaceIdx] = useState(0)
  const [follow, setFollow] = useState<{ start: number; steps: Step[] } | null>(null)
  const places: Place[] = PLACES[toCity] ?? []
  const place = places[placeIdx] ?? places[0]
  const cityName = (id: string) => PROVINCES.find((p) => p.id === id)?.name ?? id

  const hubOf = (cityId: string): string => {
    const st = api.catalog.stops(cityId)
    return (st.find((s) => /otogar|terminal|aşti/i.test(s.name)) ?? st[0])?.id ?? ''
  }
  const stopFor = (cityId: string, p: Place): string => {
    const st = api.catalog.stops(cityId)
    const byName = (n: string) => st.find((s) => s.name.toLocaleLowerCase('tr') === n.toLocaleLowerCase('tr'))?.id
    const nm = (x: string) => (x === 'Merkez' ? `${cityName(cityId)} Merkez` : `${x} Merkez`)
    return (p.s && byName(p.s)) || byName(nm(p.d)) || byName(p.d) || hubOf(cityId)
  }
  const stopLabel = (cityId: string, id: string) => api.catalog.stops(cityId).find((s) => s.id === id)?.name ?? id
  const home = useMemo(() => api.catalog.stops(fromCity)[0]?.id ?? '', [fromCity, api])
  const [fromStop, setFromStop] = useState('')
  const origin = fromStop || home

  const localSteps = (cityId: string, a: string, b: string, label: string): Step[] => {
    if (!a || !b || a === b) return []
    let j: Journey | undefined
    try { j = api.journeys.plan(cityId, a, b, {})[0] } catch { j = undefined }
    if (!j) return [{ kind: 'local', title: `${label}: ${stopLabel(cityId, a)} → ${stopLabel(cityId, b)}`, detail: 'Bu iki durak arasında hat bulunamadı. Taksi veya yürüyüş gerekebilir.', minutes: 20, fare: 0, cityId }]
    const routes = api.catalog.routes(cityId)
    return j.legs.map((l) => {
      const r = l.routeId ? routes.find((x) => x.id === l.routeId) : undefined
      return {
        kind: l.kind === 'ride' ? 'local' : 'walk', cityId,
        title: l.kind === 'ride' ? `${MODE_LABEL[l.mode!]} ${r?.code ?? ''}` : l.kind === 'walk' ? 'Yürüyüş' : 'Aktarma',
        detail: `${stopLabel(cityId, l.fromStopId)} → ${stopLabel(cityId, l.toStopId)}${r ? ` · ${r.name}` : ''}`,
        minutes: l.minutes, fare: l.fare,
      } as Step
    })
  }

  const plan: Step[] = useMemo(() => {
    if (!place) return []
    const steps: Step[] = []
    const target = stopFor(toCity, place)
    if (fromCity === toCity) return localSteps(toCity, origin, target, 'Şehir içi')
    steps.push(...localSteps(fromCity, origin, hubOf(fromCity), 'Otogara'))
    const ic = intercity(fromCity, toCity)!
    steps.push({ kind: 'bus', cityId: fromCity, title: `Şehirler arası otobüs: ${cityName(fromCity)} → ${cityName(toCity)}`, detail: `~${ic.roadKm} km (tahmini) · örnek firma ve sefer`, minutes: ic.minutes, fare: ic.fareKurus })
    steps.push(...localSteps(toCity, hubOf(toCity), target, 'Varış şehrinde'))
    return steps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCity, toCity, place?.n, origin])
  const totalMin = plan.reduce((s, x) => s + x.minutes, 0)
  const totalFare = plan.reduce((s, x) => s + x.fare, 0)

  // Canlı takip (simüle konum): 1 gerçek saniye = 1 simüle dakika
  const [tick, setTick] = useState(0)
  useEffect(() => { if (!follow) return; const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t) }, [follow])
  const sent = useRef<Set<number>>(new Set())
  const elapsed = follow ? (Date.now() - follow.start) / 1000 : 0
  void tick
  let acc = 0, cur = -1, within = 0
  if (follow) {
    for (let i = 0; i < follow.steps.length; i++) { if (elapsed < acc + follow.steps[i].minutes) { cur = i; within = (elapsed - acc) / follow.steps[i].minutes; break } acc += follow.steps[i].minutes }
  }
  const finished = !!follow && cur === -1
  useEffect(() => {
    if (!follow) return
    const idx = cur === -1 ? follow.steps.length : cur
    if (sent.current.has(idx)) return
    sent.current.add(idx)
    if (cur === -1) api.me.notify(session, `Hedefe ulaştınız: ${place?.n}. İyi gezmeler (simülasyon).`)
    else if (cur > 0) api.me.notify(session, `Sıradaki adım: ${follow.steps[cur].title}. ${follow.steps[cur].detail}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, follow])
  const startFollow = () => { sent.current = new Set(); setFollow({ start: Date.now(), steps: plan }); toast('Canlı takip başladı (simüle konum).') }

  return (
    <div className="stack">
      <PageHeader title="Gezi planla" sub="Başka şehre günübirlik gezi: otogardan gezilecek yere, canlı takipli" />
      <SimNote>Gezilecek yerler örnek listedir. Şehirler arası süre ve ücret kuş uçuşu mesafeden tahmin edilir; gerçek sefer, firma ve fiyat verisi yoktur. Konumunuz simüle edilir (gerçek konum izni istenmez).</SimNote>
      <Card>
        <div className="grid2">
          <SelectField label="Bulunduğum il" value={fromCity} onChange={(v) => { setFromCity(v); setFromStop(''); setFollow(null) }} options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))} />
          <SelectField label="Konumum (en yakın durak)" value={origin} onChange={(v) => { setFromStop(v); setFollow(null) }} options={api.catalog.stops(fromCity).map((s) => ({ value: s.id, label: s.name }))} />
          <SelectField label="Gideceğim il" value={toCity} onChange={(v) => { setToCity(v); setPlaceIdx(0); setFollow(null) }} options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))} />
        </div>
      </Card>
      <div className="places">
        {places.map((p, i) => (
          <button key={p.n} className={`place ${i === placeIdx ? 'sel' : ''}`} onClick={() => { setPlaceIdx(i); setFollow(null) }} aria-pressed={i === placeIdx}>
            <span className="placeic" aria-hidden="true">{p.c.slice(0, 1)}</span><b>{p.n}</b><small>{p.d === 'Merkez' ? cityName(toCity) : p.d} · {p.c}</small>
          </button>
        ))}
      </div>
      {plan.length > 0 ? (
        <>
          <div className="grid3">
            <Stat label="Toplam süre" value={`${Math.floor(totalMin / 60)} sa ${totalMin % 60} dk`} />
            <Stat label="Tahmini ücret" value={TL(totalFare)} />
            <Stat label="Adım" value={plan.length} />
          </div>
          <Card title={`${place?.n} için yol tarifi`} right={!follow ? <button className="btn primary sm" onClick={startFollow}>Canlı takibi başlat</button> : <button className="btn sm" onClick={() => setFollow(null)}>Takibi bitir</button>}>
            <ol className="steps">
              {plan.map((s, i) => {
                const state = !follow ? '' : finished || i < cur ? 'done' : i === cur ? 'now' : ''
                return (
                  <li key={i} className={`step ${state}`}>
                    <span className="stepdot" />
                    <div><b>{s.title}</b> <Badge tone="mute">{s.minutes} dk</Badge>{s.fare > 0 && <> <Badge tone="info">{TL(s.fare)}</Badge></>}
                      <p className="small muted">{s.detail}</p>
                      {state === 'now' && <div className="occ"><div className="occfill mid" style={{ width: `${Math.round(within * 100)}%` }} /></div>}
                    </div>
                  </li>
                )
              })}
            </ol>
            {follow && <p className="small"><b>{finished ? 'Hedefe ulaştınız ' : `Şu an: ${follow.steps[cur].title}`}</b> · hızlandırılmış demo: 1 sn = 1 dk</p>}
          </Card>
        </>
      ) : <Empty title="Plan bulunamadı" />}
    </div>
  )
}
