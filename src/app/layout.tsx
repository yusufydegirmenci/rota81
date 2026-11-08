import { useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../domain/types'
import { Badge } from '../ui/ui'
import { ROLE_HOME, ROLE_LABEL, useApp } from './context'

export interface NavItem { to: string; label: string; icon: string; bottom?: boolean }

export function Toasts() {
  const { toasts } = useApp()
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.bad ? 'bad' : ''}`}>{t.text}</div>)}</div>
}

export function Shell({ role, nav, admin }: { role: Role; nav: NavItem[]; admin?: boolean }) {
  const { user, signOut } = useApp()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  if (!user) return <Navigate to="/giris" replace state={{ from: loc.pathname }} />
  if (user.role !== role) return <Forbidden role={role} />
  const links = (cls: string) => nav.map((n) => (
    <NavLink key={n.to} to={n.to} end={n.to.split('/').length <= 2} className={cls} onClick={() => setOpen(false)}>
      <span aria-hidden="true">{n.icon}</span> {n.label}
    </NavLink>
  ))
  const cityName = user.cityId ? user.cityId : null
  return (
    <div className={`shell ${admin ? 'admin' : ''}`}>
      <header className="topbar">
        <button className="btn sm menubtn" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }} aria-expanded={open} onClick={() => setOpen(!open)}>☰ Menü</button>
        <NavLink to={ROLE_HOME[role]} className="brand"><i>81</i> ROTA 81</NavLink>
        <Badge tone="info">{ROLE_LABEL[role]}{cityName ? ` · İl ${cityName}` : ''}</Badge>
        <div className="sp" />
        <span className="small">{user.name}</span>
        <button className="btn sm" onClick={signOut}>Çıkış</button>
      </header>
      <div className="content">
        <p className="sim small" style={{ marginBottom: '1rem' }} role="note"><b>Prototip:</b> tüm veriler simülasyondur; gerçek ödeme, canlı araç verisi ve belediye entegrasyonu yoktur.</p>
        <div className="withside">
          <nav className="sidenav" aria-label="Ana menü">{links('navlink')}</nav>
          <div>
            {open && <nav className="drawer" aria-label="Menü">{links('navlink')}</nav>}
            <main id="main"><Outlet /></main>
          </div>
        </div>
      </div>
      {role === 'citizen' && (
        <nav className="bottomnav" aria-label="Hızlı menü">
          {nav.filter((n) => n.bottom).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to.split('/').length <= 2}><span className="nav-ic" aria-hidden="true">{n.icon}</span>{n.label}</NavLink>
          ))}
          <a href="#menu" onClick={(e) => { e.preventDefault(); setOpen(!open); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="nav-ic" aria-hidden="true">☰</span>Menü</a>
        </nav>
      )}
      <Toasts />
    </div>
  )
}

export function Forbidden({ role }: { role: Role }): ReactNode {
  const { user, signOut } = useApp()
  return (
    <div className="content">
      <div className="card" role="alert">
        <h2>Bu sayfaya erişim yetkiniz yok</h2>
        <p className="muted" style={{ margin: '0.6rem 0 1rem' }}>Bu alan yalnızca "{ROLE_LABEL[role]}" hesapları içindir. Yetki kontrolü sunucu tarafı servislerde de yapılır; menüyü gizlemek tek koruma değildir.</p>
        <div className="row">
          {user && <NavLink className="btn primary" to={ROLE_HOME[user.role]}>Kendi panelime git</NavLink>}
          <button className="btn" onClick={signOut}>Çıkış yap</button>
        </div>
      </div>
    </div>
  )
}
