import { GEO } from '../data/turkiye'
import { CityInfo } from './geo'
import { useState } from 'react'
import { useApp } from '../app/context'
import type { NavItem } from '../app/layout'
import type { City, Role } from '../domain/types'
import { permissionsFor } from '../services/authz'
import { MODE_LABEL, TL } from '../services/api'
import { Badge, Card, DataTable, Empty, Modal, PageHeader, SelectField, SimNote, Stat, TextField } from '../ui/ui'
import { FARE_LABEL } from './city'
import { downloadCsv } from './csv'

export const NATIONAL_NAV: NavItem[] = [
  { to: '/ulusal', label: 'Genel bakış', icon: '🗺️' },
  { to: '/ulusal/iller', label: '81 il', icon: '📍' },
  { to: '/ulusal/il-yoneticileri', label: 'İl yöneticileri', icon: '🧑‍💼' },
  { to: '/ulusal/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { to: '/ulusal/roller', label: 'Roller ve yetkiler', icon: '🔑' },
  { to: '/ulusal/politikalar', label: 'Ulusal politikalar', icon: '📜' },
  { to: '/ulusal/tarife-onay', label: 'Tarife onayı', icon: '✅' },
  { to: '/ulusal/raporlar', label: 'Sistem raporları', icon: '📈' },
  { to: '/ulusal/denetim', label: 'Denetim kayıtları', icon: '🛡️' },
  { to: '/ulusal/entegrasyonlar', label: 'Entegrasyon izleme', icon: '🔌' },
  { to: '/ulusal/yapilandirma', label: 'Platform ayarları', icon: '⚙️' },
]
const fdate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const CITY_TONE = { pilot: 'ok', planned: 'mute', active: 'info' } as const
const CITY_LABEL = { pilot: 'Pilot (örnek veri)', planned: 'Planlanan', active: 'Aktif' }

export function NationalOverview() {
  const { api, session } = useApp()
  const o = api.national.overview(session)
  const audit = api.national.audit(session).slice(0, 6)
  return (
    <div className="stack">
      <PageHeader title="Ulusal genel bakış" sub="Tüm ekosistemin özeti" />
      <div className="grid3">
        <Stat label="İl kaydı" value={o.provinces} sub={`${o.pilot} pilot · ${o.planned} planlanan`} />
        <Stat label="Kullanıcı" value={o.users} sub={`${o.citizens} vatandaş`} />
        <Stat label="Yolculuk (prototip)" value={o.journeys} />
        <Stat label="Toplanan ücret" value={TL(o.revenue)} sub="Simüle" />
        <Stat label="Onay bekleyen tarife" value={o.pendingFares} />
      </div>
      <div className="grid2">
        <Card title="İl durumu"><div className="stack">{(['pilot', 'planned'] as const).map((s) => <div key={s} className="row"><Badge tone={CITY_TONE[s]}>{CITY_LABEL[s]}</Badge><div className="sp" /><b>{o.cities.filter((c) => c.status === s).length}</b></div>)}</div></Card>
        <Card title="Son denetim kayıtları">{audit.length === 0 ? <Empty title="Kayıt yok" /> : audit.map((a) => <p key={a.id} className="small" style={{ padding: '0.25rem 0' }}><Badge tone={a.result === 'success' ? 'ok' : 'bad'}>{a.result === 'success' ? 'OK' : 'RED'}</Badge> {a.actorName} · {a.action}</p>)}</Card>
      </div>
    </div>
  )
}

export function Provinces() {
  const { api, session, run } = useApp()
  const o = api.national.overview(session)
  const [region, setRegion] = useState('all'); const [status, setStatus] = useState('all'); const [detail, setDetail] = useState<City | null>(null)
  const regions = Array.from(new Set(o.cities.map((c) => c.region))).sort((a, b) => a.localeCompare(b, 'tr'))
  const rows = o.cities.filter((c) => (region === 'all' || c.region === region) && (status === 'all' || c.status === status))
  const users = api.national.users(session)
  const d = detail && detail.hasDemoData ? api.city.dashboard(session, detail.id) : null
  return (
    <div className="stack">
      <PageHeader title="81 il" sub="Tüm illerin kaydı. Ulaşım verisi yalnızca örnek illerde vardır." />
      <DataTable rows={rows} rowKey={(c) => c.id} searchText={(c) => `${c.name} ${c.id} ${c.region}`} pageSize={12}
        filters={<><div style={{ minWidth: 170 }}><SelectField label="Bölge" value={region} onChange={setRegion} options={[{ value: 'all', label: 'Tümü' }, ...regions.map((r) => ({ value: r, label: r }))]} /></div>
          <div style={{ minWidth: 170 }}><SelectField label="Durum" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Tümü' }, { value: 'pilot', label: 'Pilot' }, { value: 'planned', label: 'Planlanan' }]} /></div></>}
        cols={[
          { key: 'id', label: 'Plaka', render: (c) => c.id, sort: (a, b) => a.id.localeCompare(b.id) },
          { key: 'n', label: 'İl', render: (c) => <b>{c.name}</b>, sort: (a, b) => a.name.localeCompare(b.name, 'tr') },
          { key: 'r', label: 'Bölge', render: (c) => c.region },
          { key: 'pop', label: 'Nüfus', render: (c) => (GEO[c.id]?.p ?? 0).toLocaleString('tr-TR'), sort: (a, b) => (GEO[a.id]?.p ?? 0) - (GEO[b.id]?.p ?? 0) },
          { key: 'dc', label: 'İlçe', render: (c) => GEO[c.id]?.d.length ?? 0 },
          { key: 's', label: 'Durum', render: (c) => <Badge tone={CITY_TONE[c.status]}>{CITY_LABEL[c.status]}</Badge> },
          { key: 'a', label: 'İl yöneticisi', render: (c) => users.find((u) => u.id === c.adminUserId)?.name ?? <span className="muted">Atanmadı</span> },
          { key: 'x', label: '', render: (c) => <button className="btn sm" onClick={() => setDetail(c)}>Ayrıntı</button> },
        ]} />
      <Modal open={!!detail} title={detail ? `${detail.id} · ${detail.name}` : ''} onClose={() => setDetail(null)}>
        {detail && <div className="stack">
          <CityInfo id={detail.id} />
          {d ? <div className="grid3"><Stat label="Hat" value={d.routes} /><Stat label="Durak" value={d.stops} /><Stat label="İşletici" value={d.operators} /></div> : <Empty title="Ulaşım verisi tanımlı değil">Bu il, veri modelinde kayıtlı fakat henüz hat/durak/ücret verisi yok.</Empty>}
          <SelectField label="İl durumu" value={detail.status} onChange={(v) => { run(() => api.national.setCityStatus(session, detail.id, v as City['status']), 'İl durumu güncellendi.'); setDetail({ ...detail, status: v as City['status'] }) }} options={[{ value: 'planned', label: 'Planlanan' }, { value: 'pilot', label: 'Pilot' }, { value: 'active', label: 'Aktif' }]} />
        </div>}
      </Modal>
    </div>
  )
}

export function CityAdmins() {
  const { api, session, run } = useApp()
  const users = api.national.users(session)
  const o = api.national.overview(session)
  const [uid, setUid] = useState(''); const [cid, setCid] = useState('')
  const admins = users.filter((u) => u.role === 'cityAdmin')
  return (
    <div className="stack">
      <PageHeader title="İl yöneticileri" />
      <DataTable rows={admins} rowKey={(u) => u.id} searchText={(u) => u.name} cols={[
        { key: 'n', label: 'Yönetici', render: (u) => <b>{u.name}</b> },
        { key: 'c', label: 'Sorumlu il', render: (u) => o.cities.find((c) => c.id === u.cityId)?.name },
        { key: 'e', label: 'E-posta', render: (u) => u.email },
        { key: 's', label: 'Durum', render: (u) => <Badge tone={u.status === 'active' ? 'ok' : 'bad'}>{u.status === 'active' ? 'Aktif' : 'Askıda'}</Badge> },
      ]} />
      <Card title="İl yöneticisi ata">
        <div className="grid2">
          <SelectField label="Kullanıcı" value={uid} onChange={setUid} options={[{ value: '', label: 'Seçin' }, ...users.filter((u) => u.role !== 'nationalAdmin').map((u) => ({ value: u.id, label: `${u.name} (${u.role === 'citizen' ? 'vatandaş' : 'il yöneticisi'})` }))]} />
          <SelectField label="İl" value={cid} onChange={setCid} options={[{ value: '', label: 'Seçin' }, ...o.cities.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))]} />
        </div>
        <button className="btn primary" style={{ marginTop: '0.8rem' }} disabled={!uid || !cid} onClick={() => run(() => api.national.assignCityAdmin(session, uid, cid), 'Atama yapıldı.')}>Ata</button>
        <p className="hint" style={{ marginTop: '0.5rem' }}>Rol ve il bilgisi yalnızca bu serviste, ulusal yönetici yetkisiyle değişir.</p>
      </Card>
    </div>
  )
}

export function UsersPage() {
  const { api, session, run, user } = useApp()
  const [role, setRole] = useState('all')
  const users = api.national.users(session).filter((u) => role === 'all' || u.role === role)
  const L: Record<Role, string> = { citizen: 'Vatandaş', cityAdmin: 'İl yöneticisi', nationalAdmin: 'Ulusal yönetici' }
  return (
    <div className="stack">
      <PageHeader title="Kullanıcılar" />
      <DataTable rows={users} rowKey={(u) => u.id} searchText={(u) => `${u.name} ${u.email}`}
        filters={<div style={{ minWidth: 190 }}><SelectField label="Rol" value={role} onChange={setRole} options={[{ value: 'all', label: 'Tümü' }, { value: 'citizen', label: 'Vatandaş' }, { value: 'cityAdmin', label: 'İl yöneticisi' }, { value: 'nationalAdmin', label: 'Ulusal yönetici' }]} /></div>}
        cols={[
          { key: 'n', label: 'Ad', render: (u) => <b>{u.name}</b>, sort: (a, b) => a.name.localeCompare(b.name, 'tr') },
          { key: 'e', label: 'E-posta', render: (u) => u.email },
          { key: 'r', label: 'Rol', render: (u) => L[u.role] },
          { key: 's', label: 'Durum', render: (u) => <Badge tone={u.status === 'active' ? 'ok' : 'bad'}>{u.status === 'active' ? 'Aktif' : 'Askıda'}</Badge> },
          { key: 'x', label: '', render: (u) => u.id === user?.id ? null : <button className="btn sm" onClick={() => run(() => api.national.setUserStatus(session, u.id, u.status === 'active' ? 'suspended' : 'active'), 'Kullanıcı durumu güncellendi.')}>{u.status === 'active' ? 'Askıya al' : 'Etkinleştir'}</button> },
        ]} />
    </div>
  )
}

export function RolesPage() {
  const roles: [Role, string][] = [['citizen', 'Vatandaş'], ['cityAdmin', 'İl yöneticisi'], ['nationalAdmin', 'Ulusal yönetici']]
  const desc: Record<string, string> = { 'wallet:own': 'Kendi cüzdanı', 'card:own': 'Kendi kartı', 'city:read:own': 'Kendi ilini okuma', 'city:write:own': 'Kendi ilini yönetme', 'tariff:draft:own': 'Tarife taslağı (kendi il)', 'tariff:approve': 'Tarife onayı', 'city:read:all': 'Tüm illeri okuma', 'users:manage': 'Kullanıcı ve rol yönetimi', 'audit:read:all': 'Tüm denetim kayıtları', 'audit:read:own': 'Kendi il kayıtları', 'config:manage': 'Platform ayarları' }
  return (
    <div className="stack">
      <PageHeader title="Roller ve yetkiler" sub="Yetki kontrolleri servis katmanında uygulanır ve testlerle doğrulanır." />
      <div className="grid3">{roles.map(([r, l]) => <Card key={r} title={l}>{permissionsFor(r).map((p) => <p key={p} style={{ padding: '0.2rem 0' }}>✓ {desc[p] ?? p}</p>)}</Card>)}</div>
    </div>
  )
}

export function Policies() {
  const { api, session, run } = useApp()
  const list = api.national.policies()
  const [ed, setEd] = useState<{ id: string; title: string; body: string } | null>(null); const [err, setErr] = useState<string | null>(null)
  return (
    <div className="stack">
      <PageHeader title="Ulusal politikalar" />
      {list.map((p) => <Card key={p.id} title={p.title} right={<button className="btn sm" onClick={() => { setEd({ id: p.id, title: p.title, body: p.body }); setErr(null) }}>Düzenle</button>}><p>{p.body}</p><p className="hint" style={{ marginTop: '0.4rem' }}>Son güncelleme: {fdate(p.updatedAt)}</p></Card>)}
      <Modal open={!!ed} title={ed?.title ?? ''} onClose={() => setEd(null)}>
        {ed && <div className="stack"><TextField label="Politika metni" value={ed.body} onChange={(v) => setEd({ ...ed, body: v })} error={err} />
          <button className="btn primary" onClick={() => { setErr(null); try { api.national.updatePolicy(session, ed.id, ed.body); setEd(null); run(() => undefined, 'Politika güncellendi.') } catch (e) { setErr((e as Error).message) } }}>Kaydet</button></div>}
      </Modal>
    </div>
  )
}

export function FareApprovals() {
  const { api, session, run, store } = useApp()
  const pending = api.fares.pendingAll(session)
  const [rej, setRej] = useState<string | null>(null); const [why, setWhy] = useState(''); const [err, setErr] = useState<string | null>(null)
  const decided = store.data.fareVersions.filter((v) => v.status === 'rejected' || (v.status === 'approved' && v.version > 1) || (v.status === 'superseded' && v.version >= 1 && v.validTo))
  const info = (v: typeof pending[number]) => { const p = api.fares.productName(v.productId); const cur = api.fareAt(v.productId, new Date()); const city = store.data.cities.find((c) => c.id === v.cityId)?.name; return { name: `${city} · ${p ? MODE_LABEL[p.mode] + ' ' + p.name : v.productId}`, cur } }
  return (
    <div className="stack">
      <PageHeader title="Tarife onay akışı" sub="İl yönetimlerinin gönderdiği değişiklikler burada karara bağlanır." />
      <Card title={`Bekleyen başvurular (${pending.length})`}>
        {pending.length === 0 ? <Empty title="Bekleyen başvuru yok" /> : pending.map((v) => { const i = info(v); return (
          <div key={v.id} className="row" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--color-line)' }}>
            <div><b>{i.name}</b><p className="hint">Mevcut {i.cur ? TL(i.cur.amount) : '—'} → öneri <b>{TL(v.amount)}</b> · {v.note || 'gerekçe yok'}</p></div><div className="sp" />
            <button className="btn sm primary" onClick={() => run(() => api.fares.decide(session, v.id, true), 'Tarife onaylandı ve yürürlüğe girdi.')}>Onayla</button>
            <button className="btn sm danger" onClick={() => { setRej(v.id); setWhy(''); setErr(null) }}>Reddet</button>
          </div>) })}
      </Card>
      <Card title="Karara bağlanan sürümler">
        <DataTable rows={decided} rowKey={(v) => v.id} cols={[
          { key: 'p', label: 'Ürün', render: (v) => info(v).name },
          { key: 'v', label: 'Sürüm', render: (v) => `v${v.version}` },
          { key: 'a', label: 'Ücret', render: (v) => TL(v.amount) },
          { key: 's', label: 'Durum', render: (v) => FARE_LABEL[v.status] },
          { key: 'd', label: 'Geçerlilik', render: (v) => `${fdate(v.validFrom)} → ${v.validTo ? fdate(v.validTo) : 'devam'}` },
        ]} empty="Henüz karar yok." />
      </Card>
      <Modal open={!!rej} title="Tarifeyi reddet" onClose={() => setRej(null)}>
        <div className="stack"><TextField label="Red gerekçesi" value={why} onChange={setWhy} error={err} />
          <button className="btn danger primary" onClick={() => { setErr(null); try { api.fares.decide(session, rej!, false, why); setRej(null); run(() => undefined, 'Tarife reddedildi.') } catch (e) { setErr((e as Error).message) } }}>Reddet</button></div>
      </Modal>
    </div>
  )
}

export function NationalReports() {
  const { api, session } = useApp()
  const o = api.national.overview(session)
  const rows = o.cities.filter((c) => c.hasDemoData).map((c) => { const d = api.city.dashboard(session, c.id); return [c.name, d.routes, d.stops, d.operators, d.journeys, (d.revenue / 100).toFixed(2)] })
  return (
    <div className="stack">
      <PageHeader title="Sistem raporları" actions={<button className="btn" onClick={() => downloadCsv('rota81-il-ozeti.csv', [['İl', 'Hat', 'Durak', 'İşletici', 'Yolculuk', 'Ücret (₺)'], ...rows])}>CSV indir</button>} />
      <SimNote>Yalnızca örnek veri bulunan 6 il listelenir; diğer 75 il kayıtlıdır ancak ulaşım verisi yoktur.</SimNote>
      <DataTable rows={rows} rowKey={(r) => String(r[0])} cols={['İl', 'Hat', 'Durak', 'İşletici', 'Yolculuk', 'Ücret (₺)'].map((l, i) => ({ key: String(i), label: l, render: (r: (string | number)[]) => r[i], sort: i > 0 ? (a: (string | number)[], b: (string | number)[]) => Number(a[i]) - Number(b[i]) : (a: (string | number)[], b: (string | number)[]) => String(a[0]).localeCompare(String(b[0]), 'tr') }))} />
    </div>
  )
}

export function AuditPage() {
  const { api, session } = useApp()
  const [res, setRes] = useState('all')
  const rows = api.national.audit(session).filter((a) => res === 'all' || a.result === res)
  return (
    <div className="stack">
      <PageHeader title="Denetim kayıtları" sub="Tüm işlemler ve reddedilen yetki denemeleri (son 500)." actions={<button className="btn" onClick={() => downloadCsv('rota81-denetim.csv', [['Zaman', 'Kullanıcı', 'İşlem', 'İl', 'Hedef', 'Sonuç'], ...rows.map((a) => [a.at, a.actorName, a.action, a.cityId ?? '', a.target ?? a.detail ?? '', a.result])])}>CSV indir</button>} />
      <DataTable rows={rows} rowKey={(a) => a.id} searchText={(a) => `${a.actorName} ${a.action} ${a.cityId ?? ''} ${a.target ?? ''}`}
        filters={<div style={{ minWidth: 170 }}><SelectField label="Sonuç" value={res} onChange={setRes} options={[{ value: 'all', label: 'Tümü' }, { value: 'success', label: 'Başarılı' }, { value: 'denied', label: 'Reddedildi' }]} /></div>}
        cols={[
          { key: 't', label: 'Zaman', render: (a) => fdate(a.at), sort: (x, y) => x.at.localeCompare(y.at) },
          { key: 'u', label: 'Kullanıcı', render: (a) => a.actorName },
          { key: 'a', label: 'İşlem', render: (a) => a.action },
          { key: 'c', label: 'İl', render: (a) => a.cityId ?? '—' },
          { key: 'g', label: 'Hedef / ayrıntı', render: (a) => a.target ?? a.detail ?? '' },
          { key: 'r', label: 'Sonuç', render: (a) => <Badge tone={a.result === 'success' ? 'ok' : 'bad'}>{a.result === 'success' ? 'Başarılı' : 'Reddedildi'}</Badge> },
        ]} />
    </div>
  )
}

export function Integrations() {
  const { api } = useApp()
  const T = { planned: ['info', 'Planlanan'], simulated: ['warn', 'Simüle'], unavailable: ['bad', 'Kullanılamaz'] } as const
  return (
    <div className="stack">
      <PageHeader title="Entegrasyon izleme" sub="Hiçbir gerçek dış entegrasyon etkin değildir; durumlar dürüstçe gösterilir." />
      <div className="grid2">{api.national.integrations().map((i) => <Card key={i.id} title={i.name} right={<Badge tone={T[i.status][0]}>{T[i.status][1]}</Badge>}><p className="muted">{i.note}</p></Card>)}</div>
    </div>
  )
}

export function Config() {
  const { store, signOut, toast } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <PageHeader title="Platform ayarları" />
      <Card title="Prototip ve üretim farkı">
        <p className="muted">Bu sürüm tarayıcıda çalışır; veri yerel depolamada tutulur. Üretimde: ASP.NET Core Web API, PostgreSQL + PostGIS, Redis, OIDC kimlik doğrulama, çift taraflı defter ve mutabakat gerekir. Servis arayüzleri bu geçişi kolaylaştıracak şekilde ayrılmıştır.</p>
      </Card>
      <Card title="Demo verisini sıfırla"><p className="muted" style={{ marginBottom: '0.7rem' }}>Tüm değişiklikler silinir ve başlangıç örnek verisi yüklenir.</p><button className="btn danger" onClick={() => setOpen(true)}>Verileri sıfırla</button></Card>
      <Modal open={open} title="Emin misiniz?" onClose={() => setOpen(false)}>
        <div className="stack"><p>Bu tarayıcıdaki tüm prototip verisi sıfırlanır.</p>
          <div className="row"><button className="btn danger primary" onClick={() => { store.reset(); setOpen(false); signOut(); toast('Veri sıfırlandı.') }}>Evet, sıfırla</button><button className="btn" onClick={() => setOpen(false)}>Vazgeç</button></div></div>
      </Modal>
    </div>
  )
}
