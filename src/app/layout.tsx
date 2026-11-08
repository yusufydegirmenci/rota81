import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Role } from '../domain/types'
import { Icon } from '../ui/icons'
import { Emblem, LangSwitch, ThemeSwitch } from '../ui/ui'
import { ROLE_HOME, ROLE_LABEL, useApp } from './context'

export interface NavItem { to: string; label: string; icon: string; bottom?: boolean }

export function Toasts() {
  const { toasts } = useApp()
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.bad ? 'bad' : ''}`}>{t.text}</div>)}</div>
}

/** Ctrl/⌘ + K: sayfalara hızlı geçiş. */
function Palette({ nav, onClose }: { nav: NavItem[]; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const go = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const items = useMemo(() => {
    const n = q.trim().toLocaleLowerCase('tr')
    return nav.filter((x) => !n || x.label.toLocaleLowerCase('tr').includes(n))
  }, [nav, q])
  const pick = (x?: NavItem) => { if (x) { go(x.to); onClose() } }
  return (
    <div className="palback" onMouseDown={onClose}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Sayfa ara" onMouseDown={(e) => e.stopPropagation()}>
        <input ref={ref} value={q} placeholder="Sayfa ara…" onChange={(e) => { setQ(e.target.value); setI(0) }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(v + 1, items.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(v - 1, 0)) }
            if (e.key === 'Enter') pick(items[i])
          }} />
        <ul>
          {items.length === 0 && <li className="hint" style={{ padding: 14 }}>Sonuç yok</li>}
          {items.map((x, k) => (
            <li key={x.to}><button aria-selected={k === i} onMouseEnter={() => setI(k)} onClick={() => pick(x)}><Icon name={x.icon} size={18} />{x.label}</button></li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Shell({ role, nav, admin }: { role: Role; nav: NavItem[]; admin?: boolean }) {
  const { user, signOut } = useApp()
  const [sheet, setSheet] = useState(false)
  const [pal, setPal] = useState(false)
  const loc = useLocation()
  useEffect(() => { setSheet(false) }, [loc.pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((v) => !v) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  if (!user) return <Navigate to="/giris" replace state={{ from: loc.pathname }} />
  if (user.role !== role) return <Forbidden role={role} />
  const end = (to: string) => to.split('/').length <= 2
  const links = nav.map((n) => (
    <NavLink key={n.to} to={n.to} end={end(n.to)} className="navlink"><Icon name={n.icon} size={18} />{n.label}</NavLink>
  ))
  const current = nav.find((n) => (end(n.to) ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <div className={`shell ${admin ? 'admin' : ''}`}>
      <aside className="rail">
        <NavLink to={ROLE_HOME[role]} className="brand"><Emblem size={34} /><span>FORADAŞ<small>{ROLE_LABEL[role].toUpperCase()}</small></span></NavLink>
        <nav className="sidenav" aria-label="Ana menü">{links}</nav>
        <div className="railfoot">
          <div className="who"><span className="avatar" aria-hidden="true">{initials}</span><div><b>{user.name}</b><span>{user.cityId ? `İl ${user.cityId}` : ROLE_LABEL[role]}</span></div></div>
          <button className="btn sm" onClick={signOut}>Çıkış</button>
        </div>
      </aside>
      <header className="topbar">
        <NavLink to={ROLE_HOME[role]} className="brand mobilebrand"><Emblem size={30} /><span>FORADAŞ</span></NavLink>
        <span className="crumb">{ROLE_LABEL[role]} / <b>{current?.label ?? ''}</b></span>
        <div className="sp" />
        <button className="searchbtn" onClick={() => setPal(true)} aria-label="Sayfa ara"><Icon name="search" size={16} /><span className="lbl sp">Ara…</span><span className="kbd">Ctrl K</span></button>
        <LangSwitch />
        <ThemeSwitch />
      </header>
      <div className="content">
        <p className="sim" role="note"><b>Prototip.</b> Veriler örnektir; gerçek ödeme ve canlı araç verisi yoktur. İstanbul otobüs durak ve hatları İETT açık verisidir.</p>
        <main id="main"><Outlet /></main>
      </div>
      <nav className="bottomnav" aria-label="Hızlı menü">
        {nav.filter((n) => n.bottom).slice(0, 4).map((n) => (
          <NavLink key={n.to} to={n.to} end={end(n.to)}><Icon name={n.icon} size={22} />{n.label.replace('Otobüs nerede?', 'Durak')}</NavLink>
        ))}
        <button onClick={() => setSheet(true)} aria-label="Tüm menü"><Icon name="menu" size={22} />Menü</button>
      </nav>
      {sheet && (
        <>
          <div className="sheetback" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-label="Menü">
            <div className="row"><b>Menü</b><div className="sp" /><LangSwitch /><button className="iconbtn" onClick={() => setSheet(false)} aria-label="Kapat"><Icon name="x" size={18} /></button></div>
            <nav className="sidenav">{links}</nav>
            <button className="btn" onClick={signOut}>Çıkış</button>
          </div>
        </>
      )}
      {pal && <Palette nav={nav} onClose={() => setPal(false)} />}
      <Toasts />
    </div>
  )
}

export function Forbidden({ role }: { role: Role }): ReactNode {
  const { user, signOut } = useApp()
  return (
    <div className="content" style={{ margin: '0 auto' }}>
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
