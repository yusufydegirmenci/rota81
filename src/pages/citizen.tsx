import { Icon } from '../ui/icons'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../app/context'
import type { NavItem } from '../app/layout'
import type { Journey, ModeId, WalletTransaction } from '../domain/types'
import { MODE_LABEL, TL } from '../services/api'
export { CitiesGuide } from './geo'
export { LiveBoard as Live } from './live'
export { GeziPage } from './trip'
export { StopBoardPage, FavoritesPage } from './stopboard'
import { LineSchedule } from './stopboard'
export { Guide } from './guide'
import { Badge, Emblem, Card, DataTable, Empty, Modal, PageHeader, SelectField, SimNote, Stat, Tabs, TextField, type Col } from '../ui/ui'

export const CITIZEN_NAV: NavItem[] = [
  { to: '/vatandas', label: 'Ana sayfa', icon: '🏠', bottom: true },
  { to: '/vatandas/kart', label: 'Kartım', icon: '💳', bottom: true },
  { to: '/vatandas/tur', label: 'Türkiye turu (rehber)', icon: '🧳', bottom: false },
  { to: '/vatandas/tek-kart', label: 'Tek kart nasıl işler?', icon: '💳' },
  { to: '/vatandas/cuzdan', label: 'Cüzdan', icon: '👛' },
  { to: '/vatandas/rota', label: 'Rota', icon: '🧭', bottom: true },
  { to: '/vatandas/gezi', label: 'Gezi planla', icon: '🧳' },
  { to: '/vatandas/yukle', label: 'Bakiye yükle', icon: '➕' },
  { to: '/vatandas/islemler', label: 'İşlem geçmişi', icon: '🧾' },
  { to: '/vatandas/otobus', label: 'Otobüs nerede?', icon: '🚏', bottom: true },
  { to: '/vatandas/favoriler', label: 'Favorilerim', icon: '⭐' },
  { to: '/vatandas/canli', label: 'Canlı doluluk', icon: '📡', bottom: false },
  { to: '/vatandas/hatlar', label: 'Hatlar', icon: '🚌' },
  { to: '/vatandas/duraklar', label: 'Duraklar', icon: '📍' },
  { to: '/vatandas/sehirler', label: 'İller ve ilçeler', icon: '🗺️' },
  { to: '/vatandas/bildirimler', label: 'Bildirimler', icon: '🔔' },
  { to: '/vatandas/kart-yonetimi', label: 'Kart yönetimi', icon: '⚙️' },
  { to: '/vatandas/profil', label: 'Profilim', icon: '👤' },
  { to: '/vatandas/guvenlik', label: 'Güvenlik', icon: '🔒' },
  { to: '/vatandas/kilavuz', label: 'Kullanım kılavuzu', icon: '📖' },
  { to: '/vatandas/yardim', label: 'Yardım', icon: '❓' },
]

const txTone = (t: WalletTransaction) => (t.status === 'refunded' ? 'warn' : t.status === 'failed' ? 'bad' : 'ok')
const txLabel = (t: WalletTransaction) => (t.status === 'refunded' ? 'İade edildi' : t.status === 'failed' ? 'Başarısız' : 'Tamamlandı')
const typeLabel: Record<string, string> = { topup: 'Yükleme', spend: 'Harcama', refund: 'İade' }
const fdate = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function DigitalCard({ number, status, name }: { number: string; status: string; name: string }) {
  return (
    <div className={`tcard ${status === 'frozen' ? 'frozen' : ''}`} aria-label={`Ulaşım kartı ${number}, ${status === 'frozen' ? 'dondurulmuş' : 'aktif'}`}>
      <span className="rt" aria-hidden="true" />
      <div className="row">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Emblem size={34} light /><b style={{ fontFamily: 'var(--f-disp)', fontSize: '1.15rem' }}>FORADAŞ</b></span><div className="sp" />
        <span className="badge">{status === 'frozen' ? 'DONDURULDU' : 'AKTİF'}</span>
      </div>
      <div>
        <div className="num">{number}</div>
        <p style={{ marginTop: 6, fontSize: '.85rem', letterSpacing: '.06em' }}>{name.toLocaleUpperCase('tr')}</p>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '.65rem', opacity: .65, marginTop: 2 }}>81 İL · TEK KART · SİMÜLE NUMARA</p>
      </div>
    </div>
  )
}

function FakeQR({ seed }: { seed: string }) {
  const cells = useMemo(() => { let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; const a: boolean[] = []; for (let i = 0; i < 441; i++) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; a.push(h % 100 > 48) } return a }, [seed])
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
  return (
    <svg viewBox="0 0 21 21" width="160" height="160" role="img" aria-label="Örnek QR görseli (gerçek değil)" style={{ background: '#fff', border: '6px solid #fff', borderRadius: 8 }}>
      {cells.map((on, i) => { const x = i % 21, y = Math.floor(i / 21); const fp = finder(x, y); const edge = fp && (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || ((x % 14 >= 2 && x % 14 <= 4) && (y % 14 >= 2 && y % 14 <= 4))); return (fp ? edge : on) ? <rect key={i} x={x} y={y} width="1" height="1" fill="#000" /> : null })}
    </svg>
  )
}

export function Dashboard() {
  const { api, user, session } = useApp()
  const w = api.wallet.get(session)
  const favs = api.me.favorites(session)
  const alerts = api.catalog.alerts().slice(0, 3)
  const cities = api.catalog.cities()
  const links: [string, string, string, string][] = [
    ['/vatandas/tur', 'bag', 'Türkiye turu', 'Tek kartla 4 şehir, rehber'],
    ['/vatandas/tek-kart', 'card', 'Tek kart nasıl işler?', '81 ilde ve iller arası, adım adım'],
    ['/vatandas/otobus', 'pin', 'Otobüs nerede?', 'Durak kodunu yaz, sıradaki araçları gör'],
    ['/vatandas/rota', 'route', 'Rota planla', 'Hızlı ve kalabalık olmayan yol'],
    ['/vatandas/gezi', 'bag', 'Günübirlik gezi', 'Başka ile gidiş ve dönüş planı'],
    ['/vatandas/canli', 'signal', 'Canlı doluluk', 'Araç ve durak yoğunluğu'],
  ]
  return (
    <div className="stack">
      <section className="heroband">
        <div className="stack" style={{ gap: 'var(--s4)' }}>
          <div>
            <p className="eyebrow">Merhaba, {user!.name.split(' ')[0]}</p>
            <p className="muted small" style={{ marginTop: 6 }}>Ortak bakiye · tüm katılımcı şehirlerde geçerli</p>
          </div>
          <p className="balance">{TL(w.wallet.balance)}</p>
          {w.wallet.balance < 3000 && <div className="lowbal" role="alert"><b>Bakiyeniz düşük.</b> Araca binmeden önce yükleyin. <Link to="/vatandas/yukle">Hemen yükle</Link></div>}
          <QuickLoad />
          <div className="row">
            <Link className="btn accent" to="/vatandas/yukle">Bakiye yükle</Link>
            <Link className="btn" to="/vatandas/kart">Kartımı göster</Link>
          </div>
        </div>
        <DigitalCard number={w.card.number} status={w.card.status} name={user!.name} />
      </section>
      <nav className="tiles" aria-label="Hızlı erişim">
        {links.slice(0, 4).map(([to, ic, t, sub]) => (
          <Link key={to} to={to} className="tile"><span className="tileic"><Icon name={ic} size={22} /></span><b>{t}</b><small>{sub}</small></Link>
        ))}
      </nav>
      <div className="grid2">
        <Card title="Son işlemler" right={<Link to="/vatandas/islemler" className="small">Tümü</Link>}>
          {w.transactions.length === 0 ? <Empty title="Henüz işlem yok" /> : w.transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line2)' }}>
              <div><b style={{ fontWeight: 500 }}>{typeLabel[t.type]}</b><p className="hint">{t.description}</p></div><div className="sp" />
              <span className="money" style={{ color: t.type === 'spend' ? 'var(--bad)' : 'var(--ok)' }}>{t.type === 'spend' ? '−' : '+'}{TL(t.amount)}</span>
            </div>
          ))}
        </Card>
        <Card title="Favori rotalar" right={<Link to="/vatandas/rota" className="small">Rota planla</Link>}>
          {favs.length === 0 ? <Empty title="Favori rota yok">Rota planlayıcıda bir yolculuğu yıldızlayın.</Empty> : favs.map((f, i) => <FavRow key={i} cityId={f.cityId} from={f.fromStopId} to={f.toStopId} />)}
        </Card>
      </div>
      <Card title="Servis duyuruları">
        {alerts.length === 0 ? <Empty title="Duyuru yok" /> : alerts.map((a) => (
          <div key={a.id} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line2)', alignItems: 'flex-start' }}>
            <Badge tone={a.severity === 'critical' ? 'bad' : a.severity === 'warning' ? 'warn' : 'info'}>{cities.find((c) => c.id === a.cityId)?.name}</Badge>
            <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontWeight: 500 }}>{a.title}</b><p className="hint">{a.body}</p></div>
          </div>
        ))}
      </Card>
    </div>
  )
}

function FavRow({ cityId, from, to }: { cityId: string; from: string; to: string }) {
  const { api, setJourney, run, session } = useApp()
  const nav = useNavigate()
  const st = api.catalog.stops(cityId)
  const n = (id: string) => st.find((s) => s.id === id)?.name ?? id
  return (
    <div className="row" style={{ padding: '0.4rem 0' }}>
      <span>{n(from)} → {n(to)}</span><div className="sp" />
      <button className="btn sm" onClick={() => { const js = run(() => api.journeys.plan(cityId, from, to, {})); if (js?.[0]) { setJourney(js[0]); nav('/vatandas/yolculuk') } }}>Planla</button>
      <button className="btn sm ghost" aria-label="Favoriden çıkar" onClick={() => api.me.removeFavorite(session, cityId, from, to)}><Icon name="x" size={16} /></button>
    </div>
  )
}

function QuickLoad() {
  const { api, session, run } = useApp()
  const keyRef = useRef<string>('')
  return (
    <Card title="Hızlı bakiye yükleme">
      <div className="row">
        {[2000, 5000, 10000].map((a) => (
          <button key={a} className="btn" onClick={() => { keyRef.current = `q-${Date.now()}-${a}`; run(() => api.wallet.topUp(session, a, keyRef.current), `${TL(a)} yüklendi (simülasyon)`) }}>+ {TL(a)}</button>
        ))}
      </div>
      <p className="hint" style={{ marginTop: '0.5rem' }}>Gerçek ödeme alınmaz.</p>
    </Card>
  )
}

export function CardPage() {
  const { api, session, user } = useApp()
  const w = api.wallet.get(session)
  return (
    <div className="stack">
      <PageHeader title="Dijital kartım" />
      <div className="grid2">
        <div className="stack">
          <DigitalCard number={w.card.number} status={w.card.status} name={user!.name} />
          <FreezeButton />
        </div>
        <Card title="Kartı okutmak için QR">
          <div className="row"><FakeQR seed={w.card.number} /><p className="hint" style={{ flex: '1 1 160px' }}>Prototip için örnek bir görseldir; gerçek bir doğrulama kodu değildir. Gerçek sistemde bu kod kısa ömürlü ve imzalı olur.</p></div>
        </Card>
      </div>
      <Card title="Kartla yapılan işlemler"><TxTable /></Card>
    </div>
  )
}

function FreezeButton() {
  const { api, session, run } = useApp()
  const w = api.wallet.get(session)
  const frozen = w.card.status === 'frozen'
  return <button className={`btn ${frozen ? 'primary' : 'danger'}`} onClick={() => run(() => api.wallet.setCardFrozen(session, !frozen), frozen ? 'Kartınız tekrar kullanıma açıldı.' : 'Kartınız donduruldu. Bakiyeniz güvende.')}>{frozen ? 'Kartı çöz' : 'Kartı dondur'}</button>
}

export function Wallet() {
  const { api, session, run } = useApp()
  const w = api.wallet.get(session)
  const [spendOpen, setSpendOpen] = useState(false)
  const spends = w.transactions.filter((t) => t.type === 'spend' && t.status === 'completed')
  return (
    <div className="stack">
      <PageHeader title="Cüzdan" sub="Tüm katılımcı şehirlerde geçerli ortak bakiye" actions={<Link className="btn primary" to="/vatandas/yukle">Bakiye yükle</Link>} />
      <div className="grid3">
        <Stat label="Bakiye" value={TL(w.wallet.balance)} />
        <Stat label="Toplam harcama" value={TL(w.transactions.filter((t) => t.type === 'spend').reduce((a, t) => a + t.amount, 0))} />
        <Stat label="Toplam iade" value={TL(w.transactions.filter((t) => t.type === 'refund').reduce((a, t) => a + t.amount, 0))} />
      </div>
      <SimNote>Yükleme, harcama ve iade işlemleri simülasyondur. Gerçek sistemde çift taraflı defter, mutabakat ve lisanslı ödeme kuruluşu gerekir.</SimNote>
      <div className="grid2">
        <Card title="Harcama simülasyonu">
          <p className="muted" style={{ marginBottom: '0.7rem' }}>Bir ulaşım ücreti harcaması deneyin. Yeterli bakiye ve etkin kart gerekir.</p>
          <button className="btn primary" onClick={() => setSpendOpen(true)}>Örnek harcama yap</button>
        </Card>
        <Card title="İade gösterimi">
          {spends.length === 0 ? <p className="muted">İade edilebilir harcama yok.</p> : spends.slice(0, 3).map((t) => (
            <div key={t.id} className="row" style={{ padding: '0.3rem 0' }}><span>{t.description} · {TL(t.amount)}</span><div className="sp" />
              <button className="btn sm" onClick={() => run(() => api.wallet.refund(session, t.id, `rf-${t.id}`), 'İade yapıldı (simülasyon).')}>İade et</button></div>
          ))}
        </Card>
      </div>
      <SpendModal open={spendOpen} onClose={() => setSpendOpen(false)} />
      <Card title="Son işlemler"><TxTable limit={6} /></Card>
    </div>
  )
}

function SpendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { api, session, run } = useApp()
  const [city, setCity] = useState('06'); const [mode, setMode] = useState<ModeId>('metro')
  const fare = api.fareFor(city, mode, 'full')
  const modes = Array.from(new Set(api.catalog.routes(city).map((r) => r.mode)))
  return (
    <Modal open={open} title="Örnek harcama" onClose={onClose}>
      <div className="stack">
        <SelectField label="Şehir" value={city} onChange={(v) => { setCity(v); setMode((api.catalog.routes(v)[0]?.mode) ?? 'bus') }} options={api.catalog.cities().filter((c) => c.hasDemoData).map((c) => ({ value: c.id, label: c.name }))} />
        <SelectField label="Ulaşım türü" value={mode} onChange={(v) => setMode(v as ModeId)} options={modes.map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
        <p>Ücret: <b className="money">{fare ? TL(fare.amount) : '—'}</b> <span className="hint">(tarife sürümü {fare ? `v${fare.version}` : '—'})</span></p>
        <div className="row">
          <button className="btn primary" disabled={!fare} onClick={() => { if (fare && run(() => api.wallet.spend(session, fare.amount, `${MODE_LABEL[mode]} ücreti`, `sp-${Date.now()}`, { cityId: city, fareVersionId: fare.id }), 'Harcama tamamlandı (simülasyon).')) onClose() }}>Öde</button>
          <button className="btn" onClick={onClose}>Vazgeç</button>
        </div>
      </div>
    </Modal>
  )
}

export function TopUp() {
  const { api, session, run } = useApp()
  const w = api.wallet.get(session)
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<number | null>(null)
  const key = useRef(`top-${Date.now()}`)
  const parse = () => {
    const n = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!amount.trim() || Number.isNaN(n)) return setErr('Bir tutar girin.')
    if (n < 1000 || n > 200000) return setErr('Tutar 10 ₺ ile 2.000 ₺ arasında olmalı.')
    if (w.wallet.balance + n > 500000) return setErr('Bakiye üst sınırı 5.000 ₺. Daha az tutar girin.')
    setErr(null); setConfirm(n)
  }
  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <PageHeader title="Bakiye yükle" sub={`Güncel bakiye: ${TL(w.wallet.balance)}`} />
      <SimNote>Gerçek ödeme alınmaz ve banka bağlantısı yoktur. Bu ekran yükleme akışını gösterir.</SimNote>
      <Card>
        <div className="stack">
          <div className="row">{[2000, 5000, 10000, 20000].map((a) => <button key={a} className="btn" onClick={() => { setAmount(String(a / 100)); setErr(null) }}>{TL(a)}</button>)}</div>
          <TextField label="Tutar (₺)" value={amount} onChange={setAmount} inputMode="decimal" error={err} hint="En az 10 ₺, en fazla 2.000 ₺" />
          <button className="btn primary" onClick={parse}>Devam et</button>
        </div>
      </Card>
      <Modal open={confirm !== null} title="Yüklemeyi onayla" onClose={() => setConfirm(null)}>
        <div className="stack">
          <p><b className="money">{confirm !== null && TL(confirm)}</b> tutarı kartınıza yüklenecek (simülasyon).</p>
          <div className="row">
            <button className="btn primary" onClick={() => { if (confirm !== null && run(() => api.wallet.topUp(session, confirm, key.current), 'Bakiye yüklendi (simülasyon).')) { key.current = `top-${Date.now()}`; setConfirm(null); setAmount('') } }}>Onayla</button>
            <button className="btn" onClick={() => setConfirm(null)}>Vazgeç</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TxTable({ limit }: { limit?: number }) {
  const { api, session } = useApp()
  const [type, setType] = useState('all')
  const all = api.wallet.get(session).transactions
  const rows = (type === 'all' ? all : all.filter((t) => t.type === type)).slice(0, limit)
  const cols: Col<WalletTransaction>[] = [
    { key: 'at', label: 'Tarih', render: (t) => fdate(t.createdAt), sort: (a, b) => a.createdAt.localeCompare(b.createdAt) },
    { key: 'type', label: 'Tür', render: (t) => typeLabel[t.type] },
    { key: 'desc', label: 'Açıklama', render: (t) => t.description },
    { key: 'amt', label: 'Tutar', render: (t) => <span className="money" style={{ color: t.type === 'spend' ? 'var(--color-bad)' : 'var(--color-ok)' }}>{t.type === 'spend' ? '−' : '+'}{TL(t.amount)}</span>, sort: (a, b) => a.amount - b.amount },
    { key: 'st', label: 'Durum', render: (t) => <Badge tone={txTone(t)}>{txLabel(t)}</Badge> },
  ]
  return (
    <DataTable rows={rows} cols={cols} rowKey={(t) => t.id} searchText={limit ? undefined : (t) => `${t.description} ${typeLabel[t.type]}`} pageSize={limit ?? 8} empty="Henüz işlem yok."
      filters={limit ? undefined : <div style={{ minWidth: 180 }}><SelectField label="Tür" value={type} onChange={setType} options={[{ value: 'all', label: 'Tümü' }, { value: 'topup', label: 'Yükleme' }, { value: 'spend', label: 'Harcama' }, { value: 'refund', label: 'İade' }]} /></div>} />
  )
}
export function History() { return <div className="stack"><PageHeader title="İşlem geçmişi" /><Card><TxTable /></Card></div> }

type Sort = 'fastest' | 'fewest' | 'cheapest'
export function Planner() {
  const { api, session, run, setJourney } = useApp()
  const nav = useNavigate()
  const cities = api.catalog.cities()
  const [city, setCity] = useState('06')
  const stops = api.catalog.stops(city)
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [modes, setModes] = useState<ModeId[]>([])
  const [pax, setPax] = useState<'full' | 'student'>('full')
  const [sort, setSort] = useState<Sort>('fastest')
  const [res, setRes] = useState<Journey[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const availModes = Array.from(new Set(api.catalog.routes(city).map((r) => r.mode)))
  const favs = api.me.favorites(session)
  const isFav = favs.some((f) => f.cityId === city && f.fromStopId === from && f.toStopId === to)
  const search = () => {
    setMsg(null); setRes(null)
    if (!from || !to) return setMsg('Başlangıç ve varış duraklarını seçin.')
    const r = run(() => api.journeys.plan(city, from, to, { modes, passenger: pax }))
    if (r) { setRes(r); if (r.length === 0) setMsg('Bu seçimlerle uygun bir yolculuk bulunamadı. Başka ulaşım türleri deneyin.') }
  }
  const ordered = useMemo(() => {
    if (!res) return []
    const k = { fastest: (j: Journey) => j.totalMinutes, fewest: (j: Journey) => j.transfers * 1000 + j.totalMinutes, cheapest: (j: Journey) => j.totalFare * 1000 + j.totalMinutes }[sort]
    return [...res].sort((a, b) => k(a) - k(b))
  }, [res, sort])
  const stopName = (id: string) => stops.find((s) => s.id === id)?.name ?? id
  const hasData = cities.find((c) => c.id === city)?.hasDemoData
  return (
    <div className="stack">
      <PageHeader title="Yolculuk planla" />
      <Card>
        <div className="grid2">
          <SelectField label="Şehir" value={city} onChange={(v) => { setCity(v); setFrom(''); setTo(''); setRes(null); setModes([]) }} options={cities.map((c) => ({ value: c.id, label: `${c.name}${c.hasDemoData ? '' : ' (veri yok)'}` }))} />
          <SelectField label="Yolcu türü" value={pax} onChange={(v) => setPax(v as 'full' | 'student')} options={[{ value: 'full', label: 'Tam' }, { value: 'student', label: 'Öğrenci' }]} />
          <SelectField label="Nereden" value={from} onChange={setFrom} options={[{ value: '', label: 'Durak seçin' }, ...stops.map((s) => ({ value: s.id, label: s.name }))]} />
          <SelectField label="Nereye" value={to} onChange={setTo} options={[{ value: '', label: 'Durak seçin' }, ...stops.map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
        {!hasData && <p className="hint" style={{ margin: '0.7rem 0' }}>Bu il için henüz ulaşım verisi tanımlanmadı. Veri bulunan iller: Ankara, İstanbul, İzmir, Bursa, Antalya, Eskişehir.</p>}
        <fieldset style={{ border: 0, padding: 0, margin: '0.8rem 0' }}>
          <legend style={{ fontWeight: 600 }}>Ulaşım türleri (seçmezseniz hepsi)</legend>
          <div className="row">{availModes.map((m) => <label key={m} className="row" style={{ gap: '0.4rem', minHeight: 44 }}><input type="checkbox" style={{ width: 22, height: 22 }} checked={modes.includes(m)} onChange={(e) => setModes(e.target.checked ? [...modes, m] : modes.filter((x) => x !== m))} />{MODE_LABEL[m]}</label>)}</div>
        </fieldset>
        <div className="row">
          <button className="btn primary" onClick={search}>Yolculuk bul</button>
          <button className="btn" disabled={!from || !to || from === to} onClick={() => run(() => isFav ? api.me.removeFavorite(session, city, from, to) : api.me.addFavorite(session, city, from, to), isFav ? 'Favoriden çıkarıldı.' : 'Favorilere eklendi.')}>{isFav ? 'Favoride' : 'Favori yap'}</button>
        </div>
        {msg && <p className="err" role="alert" style={{ marginTop: '0.6rem' }}>{msg}</p>}
      </Card>
      {res && res.length > 0 && (
        <div className="stack">
          <Tabs<Sort> value={sort} onChange={setSort} items={[{ id: 'fastest', label: 'En hızlı' }, { id: 'fewest', label: 'En az aktarma' }, { id: 'cheapest', label: 'En ekonomik' }]} />
          {ordered.map((j, i) => (
            <Card key={i} title={<>{i === 0 && <Badge tone="ok">Önerilen</Badge>} {j.totalMinutes} dk · <span className="money">{TL(j.totalFare)}</span></>} right={<span className="muted">{j.transfers} aktarma</span>}>
              <p className="muted">{j.legs.map((l) => l.kind === 'walk' ? 'Yürüyüş' : `${MODE_LABEL[l.mode!]} ${api.catalog.routes(city).find((r) => r.id === l.routeId)?.code}`).join('  →  ')}</p>
              <p className="hint">{stopName(j.legs[0].fromStopId)} → {stopName(j.legs[j.legs.length - 1].toStopId)}</p>
              <button className="btn sm primary" style={{ marginTop: '0.6rem' }} onClick={() => { setJourney(j); nav('/vatandas/yolculuk') }}>Ayrıntılar</button>
            </Card>
          ))}
          <SimNote>Süreler ve rotalar örnek veriyle hesaplanır; canlı araç konumu yoktur.</SimNote>
        </div>
      )}
    </div>
  )
}

export function JourneyDetail() {
  const { api, journey, run, session } = useApp()
  const nav = useNavigate()
  const [done, setDone] = useState(false)
  const key = useRef(`jr-${Date.now()}`)
  if (!journey) return <Empty title="Seçili yolculuk yok"><Link className="btn" to="/vatandas/rota">Yolculuk planla</Link></Empty>
  const routes = api.catalog.routes(journey.cityId); const stops = api.catalog.stops(journey.cityId)
  const sn = (id: string) => stops.find((s) => s.id === id)?.name ?? id
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <PageHeader title="Yolculuk ayrıntısı" sub={`${journey.totalMinutes} dk · ${TL(journey.totalFare)} · ${journey.transfers} aktarma`} />
      <Card title="Adımlar">
        {journey.legs.map((l, i) => {
          const r = routes.find((x) => x.id === l.routeId)
          return (
            <div key={i} className="legline">
              <span className={`dot ${l.kind === 'walk' ? 'walk' : ''}`} />
              <div>
                <b>{l.kind === 'walk' ? 'Yürüyüş' : `${MODE_LABEL[l.mode!]} · ${r?.code} ${r?.name}`}</b>
                <p>{sn(l.fromStopId)} → {sn(l.toStopId)} · {l.minutes} dk{l.kind === 'ride' ? ` · ${TL(l.fare)}` : ''}</p>
                {l.fareVersionId && <p className="hint">Tarife sürümü: {l.fareVersionId.split('-').pop() === '1' ? 'v1' : 'güncel'}</p>}
              </div>
            </div>
          )
        })}
      </Card>
      <SimNote>Yolculuğu tamamlamak bakiyenizden simüle edilmiş bir ücret düşer. Duraklar arası süreler örnektir.</SimNote>
      <div className="row">
        <button className="btn primary" disabled={done} onClick={() => { if (run(() => api.journeys.complete(session, journey, key.current), 'Yolculuk tamamlandı, ücret bakiyeden düşüldü (simülasyon).')) setDone(true) }}>{done ? 'Tamamlandı' : 'Yolculuğu tamamla'}</button>
        <button className="btn" onClick={() => nav('/vatandas/rota')}>Geri dön</button>
      </div>
    </div>
  )
}

export function Lines() {
  const { api } = useApp()
  const [city, setCity] = useState('06'); const [mode, setMode] = useState('all'); const [open, setOpen] = useState<string | null>(null)
  const routes = api.catalog.routes(city).filter((r) => mode === 'all' || r.mode === mode)
  const stops = api.catalog.stops(city)
  const ops = api.catalog.operators(city)
  const r = routes.find((x) => x.id === open)
  const cols: Col<(typeof routes)[number]>[] = [
    { key: 'code', label: 'Kod', render: (x) => <b>{x.code}</b>, sort: (a, b) => a.code.localeCompare(b.code) },
    { key: 'name', label: 'Hat', render: (x) => x.name },
    { key: 'mode', label: 'Tür', render: (x) => MODE_LABEL[x.mode] },
    { key: 'op', label: 'İşletici', render: (x) => ops.find((o) => o.id === x.operatorId)?.name },
    { key: 'st', label: 'Durum', render: (x) => <Badge tone={x.status === 'active' ? 'ok' : x.status === 'maintenance' ? 'warn' : 'bad'}>{x.status === 'active' ? 'Çalışıyor' : x.status === 'maintenance' ? 'Bakımda' : 'Kapalı'}</Badge> },
    { key: 'a', label: '', render: (x) => <button className="btn sm" onClick={() => setOpen(x.id)}>Ayrıntı</button> },
  ]
  return (
    <div className="stack">
      <PageHeader title="Ulaşım hatları" />
      <div className="grid2">
        <SelectField label="Şehir" value={city} onChange={setCity} options={api.catalog.cities().map((c) => ({ value: c.id, label: c.name }))} />
        <SelectField label="Tür" value={mode} onChange={setMode} options={[{ value: 'all', label: 'Tümü' }, ...(Object.keys(MODE_LABEL) as ModeId[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))]} />
      </div>
      <DataTable rows={routes} cols={cols} rowKey={(x) => x.id} searchText={(x) => `${x.code} ${x.name}`} empty="Bu ilde hat verisi yok." />
      <Modal open={!!r} title={r ? `${r.code} · ${r.name}` : ''} onClose={() => setOpen(null)}>
        {r && <div className="stack">
          <p>Sefer aralığı: yaklaşık <b>{r.headwayMin} dk</b></p>
          <LineSchedule route={r} name={(id) => stops.find((s) => s.id === id)?.name ?? id} />
          {r.stopIds.map((id, i) => <div key={id} className="legline"><span className="dot" /><div>{stops.find((s) => s.id === id)?.name}{i > 0 && <span className="hint"> · +{r.minutesBetween[i - 1]} dk</span>}</div></div>)}
        </div>}
      </Modal>
    </div>
  )
}

export function Stops() {
  const { api } = useApp()
  const [city, setCity] = useState('06'); const [acc, setAcc] = useState(false); const [openStop, setOpenStop] = useState<string | null>(null)
  const stops = api.catalog.stops(city).filter((s) => !acc || s.accessible)
  const routes = api.catalog.routes(city)
  const cols: Col<(typeof stops)[number]>[] = [
    { key: 'c', label: 'Kod', render: (s) => <span className="codechip">{s.code}</span> },
    { key: 'n', label: 'Durak', render: (s) => <b>{s.name}</b>, sort: (a, b) => a.name.localeCompare(b.name, 'tr') },
    { key: 'r', label: 'Hatlar', render: (s) => routes.filter((r) => r.stopIds.includes(s.id)).map((r) => r.code).join(', ') },
    { key: 'a', label: 'Erişilebilirlik', render: (s) => <Badge tone={s.accessible ? 'ok' : 'warn'}>{s.accessible ? 'Erişilebilir' : 'Sınırlı'}</Badge> },
    { key: 'd', label: '', render: (s) => <button className="btn sm" onClick={() => setOpenStop(s.id)}>Hatlar ve güzergâhlar</button> },
  ]
  const sd = stops.find((s) => s.id === openStop)
  const allStops = api.catalog.stops(city)
  const nm = (id: string) => allStops.find((x) => x.id === id)?.name ?? id
  return (
    <div className="stack">
      <PageHeader title="Duraklar" />
      <SelectField label="Şehir" value={city} onChange={setCity} options={api.catalog.cities().map((c) => ({ value: c.id, label: c.name }))} />
      <label className="row" style={{ minHeight: 44 }}><input type="checkbox" style={{ width: 22, height: 22 }} checked={acc} onChange={(e) => setAcc(e.target.checked)} /> Yalnızca erişilebilir duraklar</label>
      <DataTable rows={stops} cols={cols} rowKey={(s) => s.id} searchText={(s) => s.name} empty="Bu ilde durak verisi yok." />
      <Modal open={!!sd} title={sd ? `${sd.name} durağı` : ''} onClose={() => setOpenStop(null)}>
        {sd && <div className="stack">
          {routes.filter((r) => r.stopIds.includes(sd.id)).map((r) => {
            const i = r.stopIds.indexOf(sd.id)
            return (
              <div key={r.id} className="card flat">
                <p><b>{r.code}</b> · {MODE_LABEL[r.mode]} · {r.name}</p>
                <p className="small muted">Güzergâh: {r.stopIds.map((id, k) => <span key={id}>{k > 0 && ' → '}{id === sd.id ? <b>{nm(id)}</b> : nm(id)}</span>)}</p>
                <p className="small">{i < r.stopIds.length - 1 ? <>{nm(r.stopIds[r.stopIds.length - 1])} yönü: sonraki durak <b>{nm(r.stopIds[i + 1])}</b> (+{r.minutesBetween[i]} dk)</> : 'Hattın son durağı'}{i > 0 && <> · {nm(r.stopIds[0])} yönü: sonraki durak <b>{nm(r.stopIds[i - 1])}</b></>} · sefer aralığı ~{r.headwayMin} dk</p>
              </div>
            )
          })}
          <Link className="btn sm" to="/vatandas/canli">Bu durağın canlı panosu</Link>
        </div>}
      </Modal>
    </div>
  )
}

export function Notifications() {
  const { api, session } = useApp()
  const list = api.me.notifications(session)
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <PageHeader title="Bildirimler" actions={<button className="btn" onClick={() => api.me.markAllRead(session)}>Tümünü okundu yap</button>} />
      <Card>{list.length === 0 ? <Empty title="Bildirim yok" /> : list.map((n) => (
        <div key={n.id} className="row" style={{ padding: '0.55rem 0', borderBottom: '1px solid var(--color-line)' }}>
          {!n.read && <Badge tone="info">Yeni</Badge>}<span>{n.text}</span><div className="sp" /><span className="hint">{fdate(n.at)}</span>
        </div>
      ))}</Card>
    </div>
  )
}

export function CardManagement() {
  const { api, session, user } = useApp()
  const w = api.wallet.get(session)
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <PageHeader title="Kart yönetimi" />
      <Card title="Kart bilgisi"><p>Numara: <b className="money">{w.card.number}</b></p><p>Sahibi: {user!.name}</p><p>Durum: <Badge tone={w.card.status === 'active' ? 'ok' : 'bad'}>{w.card.status === 'active' ? 'Aktif' : 'Dondurulmuş'}</Badge></p></Card>
      <Card title="Dondur / çöz"><p className="muted" style={{ marginBottom: '0.7rem' }}>Dondurulan kartla harcama yapılamaz; bakiyeniz korunur.</p><FreezeButton /></Card>
      <Card title="Kayıp veya çalıntı kart"><p className="muted">Önce kartı dondurun. Yeni kart siparişi ve bakiyenin yeni karta taşınması gerçek sistemde PTT ve kimlik doğrulaması gerektirir; <b>prototipte uygulanmamıştır</b>.</p></Card>
    </div>
  )
}

export function Profile() {
  const { api, session, user, run } = useApp()
  const [name, setName] = useState(user!.name); const [err, setErr] = useState<string | null>(null)
  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <PageHeader title="Profilim" />
      <Card>
        <div className="stack">
          <TextField label="Ad soyad" value={name} onChange={setName} error={err} />
          <p className="muted">E-posta: {user!.email}</p>
          <button className="btn primary" onClick={() => { setErr(null); try { api.me.updateName(session, name); run(() => undefined, 'Profil güncellendi.') } catch (e) { setErr((e as Error).message) } }}>Kaydet</button>
        </div>
      </Card>
    </div>
  )
}

export function SecurityPage() {
  const { api, signOut } = useApp()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="stack" style={{ maxWidth: 600 }}>
      <PageHeader title="Güvenlik ayarları" />
      <Card title="Parola değiştir">
        <div className="stack">
          <TextField label="Yeni parola" type="password" value={pw} onChange={setPw} hint="En az 8 karakter, harf ve rakam." />
          <TextField label="Yeni parola (tekrar)" type="password" value={pw2} onChange={setPw2} error={pw2 && pw !== pw2 ? 'Parolalar aynı değil.' : null} />
          <button className="btn primary" onClick={() => setMsg(!api.me.checkPassword(pw) ? 'Parola kurallara uymuyor.' : pw !== pw2 ? 'Parolalar aynı değil.' : 'Kurallar sağlandı. Prototipte parola gerçekten değiştirilmez; gerçek sistemde kimlik sağlayıcıda değişir.')}>Kuralları denetle</button>
          {msg && <p role="status" className="hint">{msg}</p>}
        </div>
      </Card>
      <Card title="Oturum"><p className="muted" style={{ marginBottom: '0.7rem' }}>Rolünüz ve yetkiniz her işlemde sunucu tarafı servislerde kayıttan okunur; tarayıcıdan değiştirilemez.</p><button className="btn danger" onClick={signOut}>Bu oturumu kapat</button></Card>
      <SimNote>İki aşamalı doğrulama ve cihaz yönetimi planlanan özelliklerdir; prototipte yoktur.</SimNote>
    </div>
  )
}

export function Help() {
  const items = [
    ['Bakiyeyi nasıl yüklerim?', '“Bakiye yükle” sayfasında tutarı yazın ve onaylayın. Prototipte gerçek ödeme alınmaz.'],
    ['Kartım çalışmıyor', 'Kartın dondurulmuş olup olmadığına ve bakiyenize bakın.'],
    ['Başka şehirde kullanabilir miyim?', 'Her şehir kendi tarifesini uygular; bakiyeniz ortaktır. Prototipte 6 ilde örnek veri vardır.'],
    ['Yolculuk bilgileri gerçek mi?', 'Hayır. Hatlar, süreler ve ücretler örnektir.'],
    ['Kişisel verilerim?', 'Yönetim ekranlarında kimlik numarası tutulmaz; yalnızca ad ve e-posta saklanır.'],
  ]
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <PageHeader title="Yardım ve destek" />
      {items.map(([q, a]) => <details key={q} className="card flat"><summary style={{ fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>{q}</summary><p className="muted" style={{ marginTop: '0.5rem' }}>{a}</p></details>)}
      <Card title="Destek talebi"><p className="muted">Canlı destek hattı ve destek formu prototipte <b>yoktur</b> (planlanan).</p></Card>
    </div>
  )
}
