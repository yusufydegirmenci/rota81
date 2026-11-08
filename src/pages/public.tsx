import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROLE_HOME, useApp } from '../app/context'
import { Toasts } from '../app/layout'
import { AuthError } from '../services/authz'
import { CENTROIDS } from '../data/places'
import { DEMO_CITY_IDS, PROVINCES } from '../data/provinces'
import { Emblem, LangSwitch, SimNote, TextField, ThemeSwitch } from '../ui/ui'

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pubpage">
      <header className="pubbar">
        <Link to="/" className="pubbrand"><Emblem size={40} /><span>FORADAŞ</span></Link>
        <nav className="pubnav" aria-label="Sayfa bölümleri">
          <a href="#/#nasil">Nasıl çalışır</a><a href="#/#kimin-icin">Kimin için</a>
        </nav>
        <div className="sp" />
        <LangSwitch />
        <ThemeSwitch />
        <Link className="btn sm primary" to="/giris">Giriş yap</Link>
      </header>
      <main id="main">{children}</main>
      <Toasts />
    </div>
  )
}

/** 81 ilin yaklaşık konumlarından oluşan şema: ince noktalar, örnek verili iller dolu; aralarında kesikli hat. */
function HeroMap() {
  const W = 640, H = 340
  const pts = useMemo(() => {
    const lon = (x: number) => 12 + ((x - 25.8) / (44.9 - 25.8)) * (W - 24)
    const lat = (y: number) => 20 + ((42.2 - y) / (42.2 - 35.9)) * (H - 60)
    return PROVINCES.map((p) => ({ id: p.id, name: p.name, x: lon(CENTROIDS[p.id][1]), y: lat(CENTROIDS[p.id][0]), p: DEMO_CITY_IDS.includes(p.id) }))
  }, [])
  const by = (id: string) => pts.find((q) => q.id === id)!
  const path = ['35', '16', '34', '26', '06'].map(by).map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
  const path2 = ['07', '06'].map(by).map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
  return (
    <div className="heromap" role="img" aria-label="81 ilin yaklaşık konumlarını gösteren şema">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <path className="ln" d={path} /><path className="ln" d={path2} />
        {pts.map((q) => (
          <g key={q.id}>
            <circle className={`d ${q.p ? 'p' : ''}`} cx={q.x} cy={q.y} r={q.p ? 6.5 : 4}><title>{q.name}</title></circle>
            {q.p && <text x={q.x + 9} y={q.y + 4} fontSize="13" fontFamily="var(--f-mono)" fill="currentColor">{q.name}</text>}
          </g>
        ))}
      </svg>
      <span className="herocap">81 İL · DOLU NOKTA = ÖRNEK VERİLİ ŞEHİR</span>
    </div>
  )
}

export function Welcome() {
  const { user } = useApp()
  return (
    <PublicFrame>
      <section className="land">
        <div className="land-in">
          <div className="hero">
            <p className="eyebrow">Ulusal ulaşım hesabı · prototip</p>
            <h1>81 il.<br /><em>Tek</em> kart.</h1>
            <p className="lead">Şehir değiştirirken yeni kart almak, her kartta ayrı bakiye tutmak, eski kartta para unutmak… FORADAŞ bunların yerine tek hesap, tek bakiye ve tek kart önerir. Her şehir kendi tarifesini ve işletmecisini korur.</p>
            <div className="row">
              {user ? <Link className="btn accent" to={ROLE_HOME[user.role]}>Panelime git</Link> : <>
                <Link className="btn accent" to="/giris">Demoyu dene</Link>
                <Link className="btn" to="/kayit">Hesap oluştur</Link>
              </>}
            </div>
          </div>
          <HeroMap />
        </div>
        <div className="facts">
          <div className="fact"><p className="v">81</p><p>il</p></div>
          <div className="fact"><p className="v">973</p><p>ilçede en az bir durak</p></div>
          <div className="fact"><p className="v">10.350</p><p>gerçek İETT durağı (İstanbul)</p></div>
          <div className="fact"><p className="v">1</p><p>kart, bakiye ve hesap</p></div>
        </div>
      </section>

      <section className="sec" id="nasil">
        <div className="sec-h">
          <div><p className="eyebrow">Tek kart nasıl çalışır?</p><h2>Kart değil hesap tek.</h2></div>
          <p>Bu bir prototiptir; sahada çalışan bir sistem değildir. Gerçekte işleyen modelin beş katmanı şöyledir ve her biri bugün farklı ülkelerde işleyen örneklere dayanır (Londra Oyster/temassız, Japonya IC kart birlikte çalışabilirliği).</p>
        </div>
        <div className="layers">
          <div className="layer"><h3>Hesap tabanlı bakiye</h3><p>Para kartın çipinde değil merkezî bir cüzdandadır; kart, telefon veya QR yalnızca hesabı tanıtır. Böylece eski kartta unutulan bakiye sorunu biter.</p></div>
          <div className="layer"><h3>Mahsuplaşma (clearing)</h3><p>Yolcu bir kez öder; sistem günlük olarak parayı ilgili şehrin ve işletmecinin payına böler. İşletmeci kendi gelirini görür, yolcu hiçbir şey fark etmez.</p></div>
          <div className="layer"><h3>Şehir tarifesi korunur</h3><p>Her belediye kendi ücretini belirler; ulusal katman yalnızca onay ve denetim yapar. Öğrenci, yaşlı gibi indirimler şehir kurallarıyla uygulanır.</p></div>
          <div className="layer"><h3>Lisanslı ödeme altyapısı</h3><p>Bakiye yükleme ve saklama, lisanslı bir ödeme/elektronik para kuruluşu üzerinden yapılır; bu proje yalnızca ürün katmanını gösterir.</p></div>
          <div className="layer"><h3>Pilotla büyüme</h3><p>Önce birkaç büyükşehir (İstanbul, Ankara, İzmir) ortak hesaba bağlanır; kanıtlanan model kademeli olarak 81 ile yayılır.</p></div>
        </div>
      </section>

      <div className="band" id="kimin-icin">
        <section className="sec">
          <div className="sec-h">
            <div><p className="eyebrow">Kimin için</p><h2>Üç rol, üç ayrı ekran.</h2></div>
            <p>Aynı tasarım dili, farklı yetkiler. Yetki kontrolü arayüzde değil servis katmanında yapılır.</p>
          </div>
          <div className="layers">
            <div className="layer"><h3>Vatandaş</h3><p>Dijital kart, ortak cüzdan, rota ve günübirlik gezi planı, durak panosu, canlı doluluk, favoriler ve bildirimler.</p></div>
            <div className="layer"><h3>İl yönetimi</h3><p>Yalnızca kendi ilinin hat, durak, işletmeci, tarife, sefer ve duyuru yönetimi; filo doluluğu ve raporlar.</p></div>
            <div className="layer"><h3>Ulusal yönetim</h3><p>81 ilin izlenmesi, tarife onayı, roller, politikalar, denetim kayıtları ve entegrasyon durumu.</p></div>
          </div>
        </section>
      </div>

      <footer className="foot">
        <SimNote>Gerçek belediye entegrasyonu, NFC ödeme, canlı araç takibi ve para hareketi yoktur. İstanbul otobüs durak ve hatları İETT/İBB açık verisidir (CC BY 4.0); sefer saatleri, doluluk, ücret ve diğer illerin hatları örnektir.</SimNote>
      </footer>
    </PublicFrame>
  )
}

const DEMO: { label: string; role: string; email: string; icon: string }[] = [
  { label: 'Ayşe Gür', role: 'Vatandaş', email: 'ayse.gur@example.com', icon: '🧑' },
  { label: 'Mehmet Kaya', role: 'Ankara il yöneticisi', email: 'mehmet.kaya@ankara.rota81.example', icon: '🏛️' },
  { label: 'Selin Aydın', role: 'İzmir il yöneticisi', email: 'selin.aydin@izmir.rota81.example', icon: '🏛️' },
  { label: 'Zeynep Arslan', role: 'Ulusal yönetici', email: 'zeynep.arslan@merkez.rota81.example', icon: '🇹🇷' },
]

export function Login() {
  const { api, signIn, store, user } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const go = (em: string, pass: string) => {
    setErr(null)
    try {
      const s = api.auth.login(em, pass)
      signIn(s)
      const u = store.data.users.find((x) => x.id === s.userId)!
      nav(ROLE_HOME[u.role], { replace: true })
    } catch (x) { setErr(x instanceof AuthError ? x.message : 'Giriş yapılamadı.') }
  }
  const submit = (e: React.FormEvent) => { e.preventDefault(); go(email, pw) }
  void user
  return (
    <div className="loginpage">
      <aside className="loginhero">
        <Link to="/" className="loginbrand"><Emblem size={44} light /><span>FORADAŞ</span></Link>
        <div className="stack"><h1>81 il.<br />Tek kart.</h1>
        <p>Ulaşım kartınızı ve bakiyenizi katılımcı şehirlerde tek hesaptan kullanın.</p>
        <ul>
          <li>Tek bakiye, tüm katılımcı şehirlerde</li>
          <li>Rota planlama ve canlı olmayan örnek sefer bilgisi</li>
          <li>Her şehir kendi tarifesini korur</li>
        </ul></div>
        <small>Prototip: gerçek ödeme ve kimlik doğrulama yoktur.</small>
      </aside>
      <main className="loginmain" id="main">
        <div className="loginbox">
          <div className="loginmobilebrand"><Emblem size={44} /><b>FORADAŞ</b><div className="sp" /><LangSwitch /><ThemeSwitch /></div><div className="loginlang row" style={{ justifyContent: 'flex-end' }}><LangSwitch /><ThemeSwitch /></div>
          <div><h2>Tekrar hoş geldiniz</h2>
          <p className="muted" style={{ marginTop: 4 }}>Hesabınıza giriş yapın.</p></div>
          <form className="stack" onSubmit={submit} noValidate>
            <TextField label="E-posta" type="email" value={email} onChange={setEmail} autoComplete="username" />
            <div className="pwwrap">
              <TextField label="Parola" type={show ? 'text' : 'password'} value={pw} onChange={setPw} autoComplete="current-password" />
              <button type="button" className="pwtoggle" onClick={() => setShow(!show)} aria-pressed={show}>{show ? 'Gizle' : 'Göster'}</button>
            </div>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn primary" type="submit">Giriş yap</button>
            <p className="small">Hesabınız yok mu? <Link to="/kayit">Hesap oluşturun</Link></p>
          </form>
          <div className="demobox">
            <h3>Hızlı demo girişi</h3>
            <p className="hint">Bir kişiye dokunun, doğrudan giriş yapılır. Parola: <b>demo1234</b></p>
            <div className="demogrid">
              {DEMO.map((d) => (
                <button key={d.email} className="demo" onClick={() => { setEmail(d.email); setPw('demo1234'); go(d.email, 'demo1234') }}>
                  <b>{d.label}</b><small>{d.role}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Toasts />
      </main>
    </div>
  )
}

export function Register() {
  const { api, signIn } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.name.trim().length < 3) er.name = 'Ad soyad en az 3 karakter olmalı.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) er.email = 'Geçerli bir e-posta adresi girin.'
    if (!api.me.checkPassword(f.pw)) er.pw = 'Parola en az 8 karakter olmalı ve harf ile rakam içermeli.'
    if (f.pw !== f.pw2) er.pw2 = 'Parolalar aynı değil.'
    setErrs(er)
    if (Object.keys(er).length) return
    try { signIn(api.auth.register(f.name, f.email, f.pw)); nav('/vatandas', { replace: true }) } catch (x) { setErrs({ email: x instanceof AuthError ? x.message : 'Kayıt yapılamadı.' }) }
  }
  return (
    <PublicFrame>
      <div className="stack" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Hesap oluştur</h1>
        <form className="card flat stack" onSubmit={submit} noValidate>
          <TextField label="Ad soyad" value={f.name} onChange={(v) => setF({ ...f, name: v })} error={errs.name} autoComplete="name" />
          <TextField label="E-posta" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} error={errs.email} autoComplete="email" />
          <TextField label="Parola" type="password" value={f.pw} onChange={(v) => setF({ ...f, pw: v })} error={errs.pw} hint="En az 8 karakter, harf ve rakam." autoComplete="new-password" />
          <TextField label="Parola (tekrar)" type="password" value={f.pw2} onChange={(v) => setF({ ...f, pw2: v })} error={errs.pw2} autoComplete="new-password" />
          <button className="btn primary" type="submit">Hesap oluştur</button>
        </form>
        <SimNote>Kayıt yalnızca bu tarayıcıda saklanır. Gerçek kimlik doğrulama (OAuth 2.0 / OpenID Connect) planlanan aşamadadır.</SimNote>
      </div>
    </PublicFrame>
  )
}
