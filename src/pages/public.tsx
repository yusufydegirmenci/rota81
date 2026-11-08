import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROLE_HOME, useApp } from '../app/context'
import { Toasts } from '../app/layout'
import { AuthError } from '../services/authz'
import { Card, Emblem, LangSwitch, SimNote, TextField } from '../ui/ui'

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pubpage">
      <header className="pubbar">
        <Link to="/" className="pubbrand"><Emblem size={44} /><span>FORADAŞ</span></Link>
        <div className="sp" />
        <LangSwitch />
        <Link className="btn sm" to="/giris">Giriş yap</Link>
      </header>
      <main id="main">{children}</main>
      <Toasts />
    </div>
  )
}

export function Welcome() {
  const { user } = useApp()
  const cities = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir']
  return (
    <PublicFrame>
      <section className="herowrap">
        <div className="hero">
          <p className="eyebrow">Ortak ulaşım ağı · prototip</p>
          <h1>81 il, bir kart,<br />hep beraber.</h1>
          <p className="lead">Ulaşım kartınızı ve bakiyenizi katılımcı şehirlerde tek hesaptan kullanın. Her şehir kendi tarifesini ve işletmecisini korur.</p>
          <div className="row">
            {user ? <Link className="btn accent" to={ROLE_HOME[user.role]}>Panelime git</Link> : <>
              <Link className="btn accent" to="/giris">Giriş yap</Link>
              <Link className="btn ghost" to="/kayit">Hesap oluştur</Link>
            </>}
          </div>
          <div className="chips" aria-label="Örnek verisi olan şehirler">
            {cities.map((c) => <span key={c}>{c}</span>)}
          </div>
        </div>
        <div className="heroart" aria-hidden="true"><Emblem size={260} light /></div>
      </section>
      <section className="pubsec">
        <div className="grid3">
          <Card title="Vatandaşlar için"><p>Dijital kart, bakiye, rota planlama ve hat bilgileri. Büyük yazı ve sade menüler.</p></Card>
          <Card title="İl yönetimleri için"><p>Yalnızca kendi ilinizin hat, durak, tarife ve duyuru yönetimi.</p></Card>
          <Card title="Ulusal yönetim için"><p>81 ilin izlenmesi, tarife onayı, kullanıcı ve denetim kayıtları.</p></Card>
        </div>
        <SimNote>Bu bir prototiptir. Gerçek belediye entegrasyonu, NFC ödeme, canlı araç takibi ve para hareketi yoktur; her şey örnek veriyle çalışır.</SimNote>
      </section>
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
        <Link to="/" className="loginbrand"><Emblem size={56} light /><span>FORADAŞ</span></Link>
        <h1>81 il, bir kart,<br />hep beraber.</h1>
        <p>Ulaşım kartınızı ve bakiyenizi katılımcı şehirlerde tek hesaptan kullanın.</p>
        <ul>
          <li>Tek bakiye, tüm katılımcı şehirlerde</li>
          <li>Rota planlama ve canlı olmayan örnek sefer bilgisi</li>
          <li>Her şehir kendi tarifesini korur</li>
        </ul>
        <small>Prototip: gerçek ödeme ve kimlik doğrulama yoktur.</small>
      </aside>
      <main className="loginmain" id="main">
        <div className="loginbox">
          <div className="loginmobilebrand"><Emblem size={44} /><b>FORADAŞ</b><div className="sp" /><LangSwitch /></div><div className="loginlang"><LangSwitch /></div>
          <h2>Tekrar hoş geldiniz</h2>
          <p className="muted">Hesabınıza giriş yapın.</p>
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
                  <span aria-hidden="true">{d.icon}</span><b>{d.label}</b><small>{d.role}</small>
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
