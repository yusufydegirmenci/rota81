import { LiveBoard } from './live'
import { useState } from 'react'
import { useApp } from '../app/context'
import type { NavItem } from '../app/layout'
import type { FareVersion, ModeId, Route } from '../domain/types'
import { MODE_LABEL, TL } from '../services/api'
import { Badge, Card, DataTable, Empty, Modal, PageHeader, SelectField, SimNote, Stat, Tabs, TextField, type Col } from '../ui/ui'
import { downloadCsv } from './csv'

export const CITY_NAV: NavItem[] = [
  { to: '/il', label: 'Pano', icon: '📊' },
  { to: '/il/istatistik', label: 'İstatistikler', icon: '📈' },
  { to: '/il/filo', label: 'Filo doluluğu', icon: '📡' },
  { to: '/il/hatlar', label: 'Hatlar', icon: '🚌' },
  { to: '/il/duraklar', label: 'Duraklar', icon: '📍' },
  { to: '/il/isleticiler', label: 'İşleticiler', icon: '🏢' },
  { to: '/il/tarifeler', label: 'Tarifeler ve onay', icon: '💰' },
  { to: '/il/seferler', label: 'Sefer çizelgesi', icon: '🕒' },
  { to: '/il/duyurular', label: 'Duyurular', icon: '📣' },
  { to: '/il/raporlar', label: 'Raporlar', icon: '🗂️' },
  { to: '/il/gecmis', label: 'Değişiklik geçmişi', icon: '📜' },
]
const fdate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const FARE_TONE: Record<FareVersion['status'], 'ok' | 'warn' | 'bad' | 'info' | 'mute'> = { draft: 'mute', pending: 'warn', approved: 'ok', rejected: 'bad', superseded: 'info' }
export const FARE_LABEL: Record<FareVersion['status'], string> = { draft: 'Taslak', pending: 'Onay bekliyor', approved: 'Yürürlükte', rejected: 'Reddedildi', superseded: 'Eski sürüm' }

function useCityCtx() {
  const ctx = useApp()
  const cityId = ctx.user!.cityId!
  return { ...ctx, cityId, city: ctx.store.data.cities.find((c) => c.id === cityId)! }
}

export function CityDashboard() {
  const { api, session, cityId, city } = useCityCtx()
  const d = api.city.dashboard(session, cityId)
  const alerts = api.catalog.alerts(cityId)
  return (
    <div className="stack">
      <PageHeader title={`${city.name} il yönetimi`} sub="Yalnızca kendi ilinizin kayıtlarını görür ve yönetirsiniz." />
      <div className="grid3">
        <Stat label="Hat" value={d.routes} sub={`${d.activeRoutes} çalışıyor`} />
        <Stat label="Durak" value={d.stops} />
        <Stat label="İşletici" value={d.operators} />
        <Stat label="Tamamlanan yolculuk" value={d.journeys} sub="Bu prototipte yapılanlar" />
        <Stat label="Toplanan ücret" value={TL(d.revenue)} sub="Simüle" />
        <Stat label="Onay bekleyen tarife" value={d.pendingFares} sub={`${d.draftFares} taslak`} />
      </div>
      <div className="grid2">
        <Card title="Ulaşım türüne göre hat">{Object.keys(d.byMode).length ? Object.entries(d.byMode).map(([m, n]) => <div key={m} className="row"><span>{MODE_LABEL[m as ModeId]}</span><div className="sp" /><b>{n}</b></div>) : <Empty title="Hat yok" />}</Card>
        <Card title="Duyurular">{alerts.length ? alerts.slice(0, 3).map((a) => <p key={a.id}><b>{a.title}</b> <span className="hint">{fdate(a.createdAt)}</span></p>) : <Empty title="Duyuru yok" />}</Card>
      </div>
    </div>
  )
}

export function CityStats() {
  const { api, session, cityId } = useCityCtx()
  const d = api.city.dashboard(session, cityId)
  const routes = api.catalog.routes(cityId)
  const dailyTrips = routes.filter((r) => r.status === 'active').reduce((a, r) => a + Math.floor((18 * 60) / r.headwayMin) * 2, 0)
  const max = Math.max(1, ...Object.values(d.byMode))
  return (
    <div className="stack">
      <PageHeader title="Şehir istatistikleri" />
      <SimNote>İstatistikler, bu tarayıcıdaki prototip verisinden hesaplanır.</SimNote>
      <div className="grid3">
        <Stat label="Tahmini günlük sefer" value={dailyTrips} sub="Sefer aralıklarından türetilir" />
        <Stat label="Yolculuk başına ortalama ücret" value={d.journeys ? TL(Math.round(d.revenue / d.journeys)) : '—'} />
        <Stat label="Erişilebilir durak oranı" value={`%${Math.round((api.catalog.stops(cityId).filter((s) => s.accessible).length / Math.max(1, d.stops)) * 100)}`} />
      </div>
      <Card title="Türe göre hat sayısı">
        {Object.entries(d.byMode).map(([m, n]) => <div key={m} className="row" style={{ margin: '0.4rem 0' }}><span style={{ width: 90 }}>{MODE_LABEL[m as ModeId]}</span><div style={{ flex: 1, background: 'var(--color-brand-50)', borderRadius: 8 }}><div style={{ width: `${(n / max) * 100}%`, background: 'var(--color-brand-600)', height: 18, borderRadius: 8 }} /></div><b>{n}</b></div>)}
      </Card>
    </div>
  )
}

export function CityRoutes() {
  const { api, session, cityId, run } = useCityCtx()
  const routes = api.catalog.routes(cityId); const stops = api.catalog.stops(cityId); const ops = api.catalog.operators(cityId)
  const [add, setAdd] = useState(false)
  const [f, setF] = useState({ code: '', name: '', mode: 'bus' as ModeId, operatorId: '', stopIds: [] as string[], minutes: '5' })
  const [err, setErr] = useState<string | null>(null)
  const cols: Col<Route>[] = [
    { key: 'c', label: 'Kod', render: (r) => <b>{r.code}</b>, sort: (a, b) => a.code.localeCompare(b.code) },
    { key: 'n', label: 'Hat', render: (r) => r.name },
    { key: 'm', label: 'Tür', render: (r) => MODE_LABEL[r.mode] },
    { key: 'o', label: 'İşletici', render: (r) => ops.find((o) => o.id === r.operatorId)?.name },
    { key: 's', label: 'Durak', render: (r) => r.stopIds.length, sort: (a, b) => a.stopIds.length - b.stopIds.length },
    { key: 'st', label: 'Durum', render: (r) => (
      <select aria-label={`${r.code} durumu`} className="input" style={{ minHeight: 40 }} value={r.status} onChange={(e) => run(() => api.city.setRouteStatus(session, r.id, e.target.value as Route['status']), 'Hat durumu güncellendi.')}>
        <option value="active">Çalışıyor</option><option value="maintenance">Bakımda</option><option value="closed">Kapalı</option>
      </select>
    ) },
  ]
  const submit = () => {
    setErr(null)
    try { api.city.addRoute(session, cityId, { ...f, minutes: Number(f.minutes) }); setAdd(false); setF({ ...f, code: '', name: '', stopIds: [] }); run(() => undefined, 'Hat eklendi.') } catch (e) { setErr((e as Error).message) }
  }
  const opsForMode = ops.filter((o) => o.modes.includes(f.mode))
  return (
    <div className="stack">
      <PageHeader title="Hat yönetimi" actions={<button className="btn primary" onClick={() => { setAdd(true); setF((x) => ({ ...x, operatorId: ops.find((o) => o.modes.includes(x.mode))?.id ?? '' })) }}>Hat ekle</button>} />
      <DataTable rows={routes} cols={cols} rowKey={(r) => r.id} searchText={(r) => `${r.code} ${r.name}`} />
      <Modal open={add} title="Yeni hat" onClose={() => setAdd(false)}>
        <div className="stack">
          <TextField label="Hat kodu" value={f.code} onChange={(v) => setF({ ...f, code: v })} />
          <TextField label="Hat adı" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <SelectField label="Ulaşım türü" value={f.mode} onChange={(v) => setF({ ...f, mode: v as ModeId, operatorId: ops.find((o) => o.modes.includes(v as ModeId))?.id ?? '' })} options={(Object.keys(MODE_LABEL) as ModeId[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
          <SelectField label="İşletici" value={f.operatorId} onChange={(v) => setF({ ...f, operatorId: v })} options={[{ value: '', label: opsForMode.length ? 'Seçin' : 'Bu türde işletici yok' }, ...opsForMode.map((o) => ({ value: o.id, label: o.name }))]} />
          <TextField label="Duraklar arası dakika" value={f.minutes} onChange={(v) => setF({ ...f, minutes: v })} inputMode="numeric" />
          <fieldset style={{ border: 0, padding: 0 }}><legend style={{ fontWeight: 600 }}>Duraklar (sıraya göre seçin)</legend>
            <div className="stack" style={{ gap: 0.2 as unknown as string, maxHeight: 180, overflow: 'auto' }}>{stops.map((s) => <label key={s.id} className="row" style={{ minHeight: 36 }}><input type="checkbox" checked={f.stopIds.includes(s.id)} onChange={(e) => setF({ ...f, stopIds: e.target.checked ? [...f.stopIds, s.id] : f.stopIds.filter((x) => x !== s.id) })} />{s.name}{f.stopIds.includes(s.id) && <span className="hint">#{f.stopIds.indexOf(s.id) + 1}</span>}</label>)}</div>
          </fieldset>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary" onClick={submit}>Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}

export function CityStops() {
  const { api, session, cityId, run } = useCityCtx()
  const stops = api.catalog.stops(cityId); const routes = api.catalog.routes(cityId)
  const [add, setAdd] = useState(false)
  const [f, setF] = useState({ name: '', lat: '', lon: '', acc: true }); const [err, setErr] = useState<string | null>(null)
  const cols: Col<(typeof stops)[number]>[] = [
    { key: 'n', label: 'Durak', render: (s) => <b>{s.name}</b>, sort: (a, b) => a.name.localeCompare(b.name, 'tr') },
    { key: 'c', label: 'Koordinat', render: (s) => `${s.lat}, ${s.lon}` },
    { key: 'r', label: 'Hat sayısı', render: (s) => routes.filter((r) => r.stopIds.includes(s.id)).length },
    { key: 'a', label: 'Erişilebilir', render: (s) => <Badge tone={s.accessible ? 'ok' : 'warn'}>{s.accessible ? 'Evet' : 'Sınırlı'}</Badge> },
    { key: 'x', label: '', render: (s) => <button className="btn sm danger" onClick={() => run(() => api.city.removeStop(session, s.id), 'Durak silindi.')}>Sil</button> },
  ]
  const submit = () => { setErr(null); try { api.city.addStop(session, cityId, f.name, Number(f.lat), Number(f.lon), f.acc); setAdd(false); setF({ name: '', lat: '', lon: '', acc: true }); run(() => undefined, 'Durak eklendi.') } catch (e) { setErr((e as Error).message) } }
  return (
    <div className="stack">
      <PageHeader title="Durak yönetimi" actions={<button className="btn primary" onClick={() => setAdd(true)}>Durak ekle</button>} />
      <DataTable rows={stops} cols={cols} rowKey={(s) => s.id} searchText={(s) => s.name} />
      <Modal open={add} title="Yeni durak" onClose={() => setAdd(false)}>
        <div className="stack">
          <TextField label="Durak adı" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <TextField label="Enlem" value={f.lat} onChange={(v) => setF({ ...f, lat: v })} inputMode="decimal" hint="Örnek: 39.9200" />
          <TextField label="Boylam" value={f.lon} onChange={(v) => setF({ ...f, lon: v })} inputMode="decimal" hint="Örnek: 32.8500" />
          <label className="row" style={{ minHeight: 44 }}><input type="checkbox" checked={f.acc} onChange={(e) => setF({ ...f, acc: e.target.checked })} /> Erişilebilir durak</label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary" onClick={submit}>Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}

export function CityOperators() {
  const { api, session, cityId, run } = useCityCtx()
  const ops = api.catalog.operators(cityId)
  const [add, setAdd] = useState(false); const [name, setName] = useState(''); const [modes, setModes] = useState<ModeId[]>([]); const [err, setErr] = useState<string | null>(null)
  return (
    <div className="stack">
      <PageHeader title="İşleticiler" actions={<button className="btn primary" onClick={() => setAdd(true)}>İşletici ekle</button>} />
      <DataTable rows={ops} rowKey={(o) => o.id} searchText={(o) => o.name} cols={[
        { key: 'n', label: 'İşletici', render: (o) => <b>{o.name}</b> },
        { key: 'm', label: 'Türler', render: (o) => o.modes.map((m) => MODE_LABEL[m]).join(', ') },
        { key: 'h', label: 'Hat', render: (o) => api.catalog.routes(cityId).filter((r) => r.operatorId === o.id).length },
        { key: 's', label: 'Durum', render: (o) => <Badge tone={o.status === 'active' ? 'ok' : 'bad'}>{o.status === 'active' ? 'Aktif' : 'Askıda'}</Badge> },
        { key: 'a', label: '', render: (o) => <button className="btn sm" onClick={() => run(() => api.city.setOperatorStatus(session, o.id, o.status === 'active' ? 'suspended' : 'active'), 'İşletici durumu güncellendi.')}>{o.status === 'active' ? 'Askıya al' : 'Etkinleştir'}</button> },
      ]} />
      <Modal open={add} title="Yeni işletici" onClose={() => setAdd(false)}>
        <div className="stack">
          <TextField label="İşletici adı" value={name} onChange={setName} />
          <fieldset style={{ border: 0, padding: 0 }}><legend style={{ fontWeight: 600 }}>Ulaşım türleri</legend>
            <div className="row">{(Object.keys(MODE_LABEL) as ModeId[]).map((m) => <label key={m} className="row" style={{ minHeight: 40 }}><input type="checkbox" checked={modes.includes(m)} onChange={(e) => setModes(e.target.checked ? [...modes, m] : modes.filter((x) => x !== m))} />{MODE_LABEL[m]}</label>)}</div></fieldset>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary" onClick={() => { setErr(null); try { api.city.addOperator(session, cityId, name, modes); setAdd(false); setName(''); setModes([]); run(() => undefined, 'İşletici eklendi.') } catch (e) { setErr((e as Error).message) } }}>Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}

export function CityFares() {
  const { api, session, cityId, run } = useCityCtx()
  const [tab, setTab] = useState<'now' | 'drafts' | 'history'>('now')
  const list = api.fares.list(session, cityId)
  const [draft, setDraft] = useState<{ productId: string; name: string; current: number } | null>(null)
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState<string | null>(null)
  const [np, setNp] = useState(false); const [pf, setPf] = useState({ name: '', mode: 'bus' as ModeId, amount: '' })
  const toKurus = (s: string) => Math.round(Number(s.replace(',', '.')) * 100)
  const all = list.flatMap((l) => l.versions.map((v) => ({ v, p: l.product })))
  return (
    <div className="stack">
      <PageHeader title="Tarifeler ve onay" sub="Değişiklikler taslak olarak başlar, ulusal onayla yürürlüğe girer; eski sürümler saklanır." actions={<button className="btn primary" onClick={() => setNp(true)}>Tarife ürünü ekle</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'now', label: 'Güncel tarife' }, { id: 'drafts', label: 'Taslak ve onay' }, { id: 'history', label: 'Sürüm geçmişi' }]} />
      {tab === 'now' && (
        <DataTable rows={list} rowKey={(l) => l.product.id} searchText={(l) => l.product.name} cols={[
          { key: 'p', label: 'Ürün', render: (l) => <b>{MODE_LABEL[l.product.mode]} · {l.product.name}</b> },
          { key: 'a', label: 'Güncel ücret', render: (l) => { const cur = api.fareAt(l.product.id, new Date()); return cur ? <span className="money">{TL(cur.amount)} <span className="hint">v{cur.version}</span></span> : <Badge tone="mute">Yürürlükte sürüm yok</Badge> } },
          { key: 'x', label: '', render: (l) => <button className="btn sm" onClick={() => { setDraft({ productId: l.product.id, name: `${MODE_LABEL[l.product.mode]} · ${l.product.name}`, current: api.fareAt(l.product.id, new Date())?.amount ?? 0 }); setAmt(''); setNote(''); setErr(null) }}>Değişiklik taslağı</button> },
        ]} />
      )}
      {tab === 'drafts' && (
        <DataTable rows={all.filter((x) => x.v.status === 'draft' || x.v.status === 'pending' || x.v.status === 'rejected')} rowKey={(x) => x.v.id} empty="Bekleyen taslak veya onay yok." cols={[
          { key: 'p', label: 'Ürün', render: (x) => `${MODE_LABEL[x.p.mode]} · ${x.p.name}` },
          { key: 'a', label: 'Önerilen ücret', render: (x) => <span className="money">{TL(x.v.amount)}</span> },
          { key: 's', label: 'Durum', render: (x) => <Badge tone={FARE_TONE[x.v.status]}>{FARE_LABEL[x.v.status]}</Badge> },
          { key: 'n', label: 'Not', render: (x) => x.v.note ?? '' },
          { key: 'x', label: '', render: (x) => x.v.status === 'draft' ? <button className="btn sm primary" onClick={() => run(() => api.fares.submit(session, x.v.id), 'Onaya gönderildi.')}>Onaya gönder</button> : null },
        ]} />
      )}
      {tab === 'history' && (
        <DataTable rows={all} rowKey={(x) => x.v.id} searchText={(x) => `${x.p.name} ${MODE_LABEL[x.p.mode]}`} cols={[
          { key: 'p', label: 'Ürün', render: (x) => `${MODE_LABEL[x.p.mode]} · ${x.p.name}` },
          { key: 'v', label: 'Sürüm', render: (x) => `v${x.v.version}`, sort: (a, b) => a.v.version - b.v.version },
          { key: 'a', label: 'Ücret', render: (x) => <span className="money">{TL(x.v.amount)}</span> },
          { key: 'f', label: 'Geçerlilik', render: (x) => `${fdate(x.v.validFrom)} → ${x.v.validTo ? fdate(x.v.validTo) : 'devam ediyor'}` },
          { key: 's', label: 'Durum', render: (x) => <Badge tone={FARE_TONE[x.v.status]}>{FARE_LABEL[x.v.status]}</Badge> },
        ]} />
      )}
      <Modal open={!!draft} title="Tarife değişikliği taslağı" onClose={() => setDraft(null)}>
        {draft && <div className="stack">
          <p><b>{draft.name}</b> · mevcut ücret {TL(draft.current)}</p>
          <TextField label="Yeni ücret (₺)" value={amt} onChange={setAmt} inputMode="decimal" error={err} />
          <TextField label="Gerekçe (isteğe bağlı)" value={note} onChange={setNote} />
          <button className="btn primary" onClick={() => { setErr(null); try { api.fares.createDraft(session, draft.productId, toKurus(amt), note); setDraft(null); setTab('drafts'); run(() => undefined, 'Taslak oluşturuldu. Onaya göndermeyi unutmayın.') } catch (e) { setErr((e as Error).message) } }}>Taslağı kaydet</button>
        </div>}
      </Modal>
      <Modal open={np} title="Yeni tarife ürünü" onClose={() => setNp(false)}>
        <div className="stack">
          <TextField label="Ürün adı" value={pf.name} onChange={(v) => setPf({ ...pf, name: v })} hint="Örnek: Yaşlı, Aylık abonman" />
          <SelectField label="Ulaşım türü" value={pf.mode} onChange={(v) => setPf({ ...pf, mode: v as ModeId })} options={(Object.keys(MODE_LABEL) as ModeId[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
          <TextField label="Başlangıç ücreti (₺)" value={pf.amount} onChange={(v) => setPf({ ...pf, amount: v })} inputMode="decimal" error={err} />
          <button className="btn primary" onClick={() => { setErr(null); try { api.fares.createProduct(session, cityId, pf.mode, pf.name, toKurus(pf.amount)); setNp(false); setTab('drafts'); run(() => undefined, 'Ürün taslağı oluşturuldu.') } catch (e) { setErr((e as Error).message) } }}>Kaydet</button>
        </div>
      </Modal>
    </div>
  )
}

export function CitySchedules() {
  const { api, session, cityId, run } = useCityCtx()
  const routes = api.catalog.routes(cityId)
  const [edit, setEdit] = useState<Record<string, string>>({})
  return (
    <div className="stack">
      <PageHeader title="Sefer çizelgesi" sub="Sefer aralığını dakika olarak güncelleyin. Günlük sefer sayısı 06:00–24:00 arası varsayımla hesaplanır." />
      <DataTable rows={routes} rowKey={(r) => r.id} searchText={(r) => `${r.code} ${r.name}`} cols={[
        { key: 'c', label: 'Hat', render: (r) => <b>{r.code} · {r.name}</b> },
        { key: 'h', label: 'Sefer aralığı (dk)', render: (r) => <input aria-label={`${r.code} sefer aralığı`} className="input" style={{ width: 100, minHeight: 40 }} inputMode="numeric" value={edit[r.id] ?? String(r.headwayMin)} onChange={(e) => setEdit({ ...edit, [r.id]: e.target.value })} /> },
        { key: 'd', label: 'Günlük sefer', render: (r) => Math.floor((18 * 60) / (Number(edit[r.id] ?? r.headwayMin) || r.headwayMin)) * 2 },
        { key: 'x', label: '', render: (r) => <button className="btn sm primary" onClick={() => run(() => api.city.setHeadway(session, r.id, Number(edit[r.id] ?? r.headwayMin)), 'Sefer aralığı kaydedildi.')}>Kaydet</button> },
      ]} />
    </div>
  )
}

export function CityAlerts() {
  const { api, session, cityId, run } = useCityCtx()
  const [f, setF] = useState({ title: '', body: '', sev: 'info' as 'info' | 'warning' | 'critical' })
  const list = api.catalog.alerts(cityId)
  return (
    <div className="stack">
      <PageHeader title="Servis duyuruları" />
      <Card title="Yeni duyuru">
        <div className="stack">
          <TextField label="Başlık" value={f.title} onChange={(v) => setF({ ...f, title: v })} />
          <TextField label="Metin" value={f.body} onChange={(v) => setF({ ...f, body: v })} />
          <SelectField label="Önem" value={f.sev} onChange={(v) => setF({ ...f, sev: v as typeof f.sev })} options={[{ value: 'info', label: 'Bilgi' }, { value: 'warning', label: 'Uyarı' }, { value: 'critical', label: 'Kritik' }]} />
          <button className="btn primary" onClick={() => { if (run(() => api.city.publishAlert(session, cityId, f.title, f.body, f.sev) ?? true, 'Duyuru yayınlandı.')) setF({ title: '', body: '', sev: 'info' }) }}>Yayınla</button>
        </div>
      </Card>
      <Card title="Yayındaki duyurular">{list.length === 0 ? <Empty title="Duyuru yok" /> : list.map((a) => <div key={a.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-line)' }}><Badge tone={a.severity === 'critical' ? 'bad' : a.severity === 'warning' ? 'warn' : 'info'}>{a.severity === 'critical' ? 'Kritik' : a.severity === 'warning' ? 'Uyarı' : 'Bilgi'}</Badge> <b>{a.title}</b><p className="muted">{a.body}</p><p className="hint">{fdate(a.createdAt)}</p></div>)}</Card>
    </div>
  )
}

export function CityReports() {
  const { api, session, cityId, city } = useCityCtx()
  const d = api.city.dashboard(session, cityId)
  const routes = api.catalog.routes(cityId); const stops = api.catalog.stops(cityId); const ops = api.catalog.operators(cityId)
  return (
    <div className="stack">
      <PageHeader title="İl raporları" sub={`${city.name} · ${fdate(new Date().toISOString())}`} />
      <SimNote>Raporlar prototip verisinden üretilir; CSV dosyaları gerçekten indirilir.</SimNote>
      <div className="grid3">
        <Card title="Hat raporu"><p className="muted">{routes.length} hat</p><button className="btn" onClick={() => downloadCsv(`${city.name}-hatlar.csv`, [['Kod', 'Ad', 'Tür', 'İşletici', 'Durak', 'Sefer aralığı (dk)', 'Durum'], ...routes.map((r) => [r.code, r.name, MODE_LABEL[r.mode], ops.find((o) => o.id === r.operatorId)?.name ?? '', r.stopIds.length, r.headwayMin, r.status])])}>CSV indir</button></Card>
        <Card title="Durak raporu"><p className="muted">{stops.length} durak</p><button className="btn" onClick={() => downloadCsv(`${city.name}-duraklar.csv`, [['Ad', 'Enlem', 'Boylam', 'Erişilebilir'], ...stops.map((s) => [s.name, s.lat, s.lon, s.accessible ? 'Evet' : 'Hayır'])])}>CSV indir</button></Card>
        <Card title="Tarife raporu"><p className="muted">{d.pendingFares} onay bekleyen</p><button className="btn" onClick={() => downloadCsv(`${city.name}-tarifeler.csv`, [['Ürün', 'Sürüm', 'Ücret (₺)', 'Durum', 'Geçerlilik başlangıcı', 'Bitişi'], ...api.fares.list(session, cityId).flatMap((l) => l.versions.map((v) => [`${MODE_LABEL[l.product.mode]} ${l.product.name}`, v.version, (v.amount / 100).toFixed(2), FARE_LABEL[v.status], v.validFrom ?? '', v.validTo ?? '']))])}>CSV indir</button></Card>
      </div>
    </div>
  )
}

export function CityHistory() {
  const { api, session, cityId } = useCityCtx()
  const rows = api.city.history(session, cityId)
  return (
    <div className="stack">
      <PageHeader title="Değişiklik geçmişi" sub="Bu ilde yapılan tüm işlemler ve reddedilen erişim denemeleri." />
      <DataTable rows={rows} rowKey={(a) => a.id} searchText={(a) => `${a.action} ${a.actorName} ${a.target ?? ''}`} cols={[
        { key: 't', label: 'Zaman', render: (a) => fdate(a.at), sort: (x, y) => x.at.localeCompare(y.at) },
        { key: 'u', label: 'Kullanıcı', render: (a) => a.actorName },
        { key: 'a', label: 'İşlem', render: (a) => a.action },
        { key: 'g', label: 'Hedef', render: (a) => a.target ?? a.detail ?? '' },
        { key: 'r', label: 'Sonuç', render: (a) => <Badge tone={a.result === 'success' ? 'ok' : 'bad'}>{a.result === 'success' ? 'Başarılı' : 'Reddedildi'}</Badge> },
      ]} empty="Bu il için kayıt yok." />
    </div>
  )
}

export function CityFleet() {
  const { cityId } = useCityCtx()
  return <LiveBoard lockedCity={cityId} />
}
