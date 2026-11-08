import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../app/context'
import { arrivalsAt, crowdOf, firstLast, hhmm, serviceAtStop } from '../services/fleet'
import { MODE_LABEL } from '../services/api'
import { Empty, Modal, PageHeader, SelectField, SimNote, Tabs } from '../ui/ui'
import { useTick, OccupancyBar } from './live'
import type { Route } from '../domain/types'

const up = (s: string) => s.toLocaleUpperCase('tr')

/** "A-B-C" biçiminde güzergâh özeti (ilk, bir iki ara, son durak). */
export function routeTitle(route: Route, name: (id: string) => string): string {
  const ids = route.stopIds
  const pick = ids.length <= 4 ? ids : [ids[0], ids[Math.floor(ids.length / 3)], ids[Math.floor((2 * ids.length) / 3)], ids[ids.length - 1]]
  return up(pick.map(name).join('-'))
}

export function StopBoardPage() {
  const { api, session, toast } = useApp()
  const now = useTick(5000)
  const [city, setCity] = useState('06')
  const [q, setQ] = useState('')
  const [stopId, setStopId] = useState('')
  const [lineFilter, setLineFilter] = useState('all')
  const stops = api.catalog.stops(city)
  const routes = api.catalog.routes(city).filter((r) => r.status === 'active')
  const name = (id: string) => stops.find((s) => s.id === id)?.name ?? id
  const matches = q.trim() ? stops.filter((s) => s.code.includes(q.trim()) || up(s.name).includes(up(q.trim()))).slice(0, 8) : []
  const stop = stops.find((s) => s.id === stopId)
  const favs = api.me.favoriteStops(session)
  const isFav = !!stop && favs.some((f) => f.stopId === stop.id)
  const rows = useMemo(() => {
    if (!stop) return []
    const live = arrivalsAt(stop.id, routes, now)
    return routes.filter((r) => r.stopIds.includes(stop.id)).flatMap((r) => {
      const idx = r.stopIds.indexOf(stop.id)
      return serviceAtStop(r, idx, now, 3).map((d) => {
        const lv = live.find((a) => a.route.id === r.id && a.vehicle.dir === d.dir)
        return { r, d, lv }
      })
    }).sort((a, b) => (a.d.services[0]?.minutesFromNow ?? 9999) - (b.d.services[0]?.minutesFromNow ?? 9999))
  }, [stop, routes, now])
  const shown = rows.filter((x) => lineFilter === 'all' || x.r.code === lineFilter)
  const codes = Array.from(new Set(rows.map((x) => x.r.code)))

  return (
    <div className="stack">
      <PageHeader title="Otobüs nerede?" sub="Durağınıza gelen hatlar, kalkış saatleri ve doluluk" />
      <SimNote>Saatler ve doluluk simülasyondur. Gerçek sistemde araç konumu (AVL) ve kart okutma verisinden gelir.</SimNote>
      <SelectField label="Şehir" value={city} onChange={(v) => { setCity(v); setStopId(''); setQ(''); setLineFilter('all') }} options={api.catalog.cities().map((c) => ({ value: c.id, label: c.name }))} />
      <div className="searchrow">
        <input className="input" aria-label="Durak kodu veya adı" placeholder="Durak kodu veya adı (örn. 06003)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {matches.length > 0 && (
        <div className="matchlist">
          {matches.map((s) => <button key={s.id} className="stoprow" onClick={() => { setStopId(s.id); setQ(''); setLineFilter('all') }}><span className="codechip">{s.code}</span><span>{up(s.name)}</span></button>)}
        </div>
      )}
      {!stop && !matches.length && (
        <div className="stack">
          <p className="muted">Bir durak arayın ya da şehirdeki duraklardan seçin:</p>
          <div className="matchlist">
            {stops.slice(0, 12).map((s) => <button key={s.id} className="stoprow" onClick={() => { setStopId(s.id); setLineFilter('all') }}><span className="codechip">{s.code}</span><span>{up(s.name)}</span></button>)}
          </div>
        </div>
      )}
      {stop && (
        <>
          <div className="stophead">
            <div><span className="codechip">{stop.code}</span> <b>{up(stop.name)}</b></div>
            <button className="starbtn" aria-pressed={isFav} aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'} onClick={() => { api.me.toggleFavoriteStop(session, city, stop.id); toast(isFav ? 'Favorilerden çıkarıldı.' : 'Favori duraklara eklendi.') }}>{isFav ? '★' : '☆'}</button>
          </div>
          <div className="chiprow" role="group" aria-label="Hat filtresi">
            <button className={`chip ${lineFilter === 'all' ? 'on' : ''}`} onClick={() => setLineFilter('all')}>Tümü</button>
            {codes.map((c) => <button key={c} className={`chip ${lineFilter === c ? 'on' : ''}`} onClick={() => setLineFilter(c)}>{c}</button>)}
          </div>
          <div className="stack">
            {shown.map(({ r, d, lv }) => {
              const next = d.services[0]
              const crowd = lv ? lv.vehicle.crowd : next ? crowdOf(Math.round(30 + 40 * ((next.originDep % 60) / 60))) : 'low'
              const pct = lv ? lv.vehicle.pct : 0
              return (
                <div key={r.id + d.dir} className={`linerow crowd-${crowd}`}>
                  <b className="linechip">{r.code}</b>
                  <div className="linemain">
                    <p className="linetitle">{routeTitle(d.dir === 1 ? r : { ...r, stopIds: [...r.stopIds].reverse() }, name)}</p>
                    <p className="linesub muted">{MODE_LABEL[r.mode]} · {up(name(r.stopIds[d.dir === 1 ? r.stopIds.length - 1 : 0]))} yönü</p>
                    {!next ? <p className="linestatus none">Hattın bugün için başka servisi yok</p> : (
                      <>
                        {lv && <><p className="linestatus live">Araç yolda · şu an <b>%{pct}</b> dolu · {lv.vehicle.crowd === 'low' ? 'rahat' : lv.vehicle.crowd === 'mid' ? 'orta yoğun' : lv.vehicle.crowd === 'high' ? 'kalabalık' : 'çok dolu'}</p><OccupancyBar pct={pct} crowd={lv.vehicle.crowd} /></>}
                        <p className="linestatus">{next.onRoute
                          ? <>Sonraki araç durağınıza <b>{hhmm(next.atStop)}</b> / {next.minutesFromNow} dk sonra</>
                          : <>Sonraki hareket saati ilk duraktan <b>{hhmm(next.originDep)}</b> / {next.originInMin} dk sonra</>}</p>
                        {d.services.length > 1 && <p className="small muted">Sonrakiler (durağınızda): {d.services.slice(1).map((x) => hhmm(x.atStop)).join(' · ')}</p>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {!shown.length && <Empty title="Bu durağa uğrayan hat yok" />}
          </div>
        </>
      )}
    </div>
  )
}

export function FavoritesPage() {
  const { api, session, toast } = useApp()
  const [tab, setTab] = useState('stops')
  const favs = api.me.favoriteStops(session)
  const routeFavs = api.me.favorites(session)
  const [edit, setEdit] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const stopOf = (cityId: string, id: string) => api.catalog.stops(cityId).find((s) => s.id === id)
  const cur = favs.find((f) => f.stopId === edit)
  return (
    <div className="stack">
      <PageHeader title="Favorilerim" />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'stops', label: 'Duraklar' }, { id: 'routes', label: 'Rotalar' }]} />
      {tab === 'stops' && (
        <div className="stack">
          {favs.map((f) => {
            const s = stopOf(f.cityId, f.stopId)
            return (
              <div key={f.stopId} className="favrow">
                <span className="codechip big">{s?.code}</span>
                <div className="favmain"><b>{f.label ? up(f.label) : up(s?.name ?? '')}</b>{f.label && <p className="muted small">{up(s?.name ?? '')}</p>}</div>
                <button className="gearbtn" aria-label="Düzenle" onClick={() => { setEdit(f.stopId); setLabel(f.label) }}>⚙</button>
              </div>
            )
          })}
          {!favs.length && <Empty title="Henüz favori durak yok">“Otobüs nerede?” ekranında bir durağın yıldızına dokunun.</Empty>}
          <div className="row"><Link className="btn primary" to="/vatandas/otobus">＋ Durak ekle</Link><Link className="btn" to="/vatandas/kilavuz">? Yardım</Link></div>
        </div>
      )}
      {tab === 'routes' && (
        <div className="stack">
          {routeFavs.map((f, i) => <div key={i} className="favrow"><div className="favmain"><b>{up(stopOf(f.cityId, f.fromStopId)?.name ?? '')} → {up(stopOf(f.cityId, f.toStopId)?.name ?? '')}</b></div><Link className="btn sm" to="/vatandas/rota">Planla</Link></div>)}
          {!routeFavs.length && <Empty title="Henüz favori rota yok">Rota planlayıcıda “favori yap” ile ekleyin.</Empty>}
        </div>
      )}
      <Modal open={!!cur} title="Favori durak" onClose={() => setEdit(null)}>
        {cur && <div className="stack">
          <label className="field"><span>Etiket (örn. EV, OKUL)</span><input className="input" value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} /></label>
          <div className="row">
            <button className="btn primary" onClick={() => { api.me.renameFavoriteStop(session, cur.stopId, label); setEdit(null); toast('Kaydedildi.') }}>Kaydet</button>
            <button className="btn danger" onClick={() => { api.me.toggleFavoriteStop(session, cur.cityId, cur.stopId); setEdit(null); toast('Favorilerden çıkarıldı.') }}>Favoriden çıkar</button>
          </div>
        </div>}
      </Modal>
    </div>
  )
}

/** Hat sayfası için: kalkış durakları, ilk/son sefer. */
export function LineSchedule({ route, name }: { route: Route; name: (id: string) => string }) {
  const fl = firstLast(route)
  return (
    <div className="stack">
      {fl.map((x) => (
        <p key={x.dir} className="small"><b>Kalkış durağı: {up(name(x.dir === 1 ? route.stopIds[0] : route.stopIds[route.stopIds.length - 1]))}</b> ({x.dir === 1 ? 'gidiş' : 'dönüş'}) · ilk sefer <b>{hhmm(x.first)}</b> · son sefer <b>{hhmm(x.last)}</b></p>
      ))}
    </div>
  )
}
