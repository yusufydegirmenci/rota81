import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROLE_HOME, useApp } from '../app/context'
import { Toasts } from '../app/layout'
import { AuthError } from '../services/authz'
import { Card, SimNote, TextField } from '../ui/ui'

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand"><i>81</i> ROTA 81</Link>
        <div className="sp" />
        <Link className="btn sm" to="/giris">Giriş yap</Link>
      </header>
      <main className="content" id="main">{children}</main>
      <Toasts />
    </div>
  )
}

export function Welcome() {
  const { user } = useApp()
  return (
    <PublicFrame>
      <div className="stack" style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1>81 Şehir. Tek Kart. Tek Hesap. Ortak Ulaşım Ağı.</h1>
        <p style={{ fontSize: 'var(--step-1)' }} className="muted">ROTA 81, ulaşım kartınızı ve bakiyenizi katılımcı şehirlerde tek hesaptan kullanmanız için tasarlanmış ortak ulaşım ağıdır. Her şehir kendi tarifesini ve işletmecisini korur.</p>
        <div className="row">
          {user ? <Link className="btn primary" to={ROLE_HOME[user.role]}>Panelime git</Link> : <>
            <Link className="btn primary" to="/giris">Giriş yap</Link>
            <Link className="btn" to="/kayit">Hesap oluştur</Link>
          </>}
        </div>
        <SimNote>Bu bir prototiptir. Gerçek belediye entegrasyonu, NFC ödeme, canlı araç takibi ve para hareketi yoktur; her şey örnek veriyle çalışır.</SimNote>
        <div className="grid3">
          <Card title="Vatandaşlar için"><p>Dijital kart, bakiye, rota planlama ve hat bilgileri. Büyük yazı ve sade menüler.</p></Card>
          <Card title="İl yönetimleri için"><p>Yalnızca kendi ilinizin hat, durak, tarife ve duyuru yönetimi.</p></Card>
          <Card title="Ulusal yönetim için"><p>81 ilin izlenmesi, tarife onayı, kullanıcı ve denetim kayıtları.</p></Card>
        </div>
      </div>
    </PublicFrame>
  )
}

const DEMO: { label: string; email: string }[] = [
  { label: 'Vatandaş (Ayşe Gür)', email: 'ayse.gur@example.com' },
  { label: 'Ankara il yöneticisi', email: 'mehmet.kaya@ankara.rota81.example' },
  { label: 'İzmir il yöneticisi', email: 'selin.aydin@izmir.rota81.example' },
  { label: 'Ulusal yönetici', email: 'zeynep.arslan@merkez.rota81.example' },
]

export function Login() {
  const { api, signIn, store } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    try {
      const s = api.auth.login(email, pw)
      signIn(s)
      const u = store.data.users.find((x) => x.id === s.userId)!
      nav(ROLE_HOME[u.role], { replace: true })
    } catch (x) { setErr(x instanceof AuthError ? x.message : 'Giriş yapılamadı.') }
  }
  return (
    <PublicFrame>
      <div className="stack" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Giriş yap</h1>
        <form className="card flat stack" onSubmit={submit} noValidate>
          <TextField label="E-posta" type="email" value={email} onChange={setEmail} autoComplete="username" />
          <TextField label="Parola" type="password" value={pw} onChange={setPw} autoComplete="current-password" />
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary" type="submit">Giriş yap</button>
          <p className="small">Hesabınız yok mu? <Link to="/kayit">Hesap oluşturun</Link></p>
        </form>
        <Card title="Demo hesapları">
          <p className="hint" style={{ marginBottom: '0.6rem' }}>Prototipte tüm demo hesapların parolası <b>demo1234</b>. Bir hesaba dokunarak bilgileri doldurun.</p>
          <div className="stack">
            {DEMO.map((d) => <button key={d.email} className="btn" onClick={() => { setEmail(d.email); setPw('demo1234') }}>{d.label}</button>)}
          </div>
        </Card>
      </div>
    </PublicFrame>
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
