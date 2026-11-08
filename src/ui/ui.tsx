import { savedLang, setLanguage, type Lang } from '../app/i18n'
import { Icon } from './icons'
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'

export function Badge({ tone = 'mute', children }: { tone?: 'ok' | 'warn' | 'bad' | 'info' | 'mute'; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function Card({ title, right, children, className = '' }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card flat ${className}`}>
      {(title || right) && (
        <div className="row" style={{ marginBottom: '0.8rem' }}>
          {title && <h3>{title}</h3>}
          <div className="sp" />
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="pagehead">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="sp" />
      {actions}
    </header>
  )
}

export function SimNote({ children }: { children?: ReactNode }) {
  return <p className="sim" role="note"><b>Prototip simülasyonu:</b> {children ?? 'Bu işlem gerçek değildir; veriler örnektir.'}</p>
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="statbox">
      <h3>{label}</h3>
      <p className="v">{value}</p>
      {sub && <p className="hint">{sub}</p>}
    </div>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: string; children: (p: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId()
  const did = `${id}-d`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? did : undefined })}
      {error ? <p className="err" id={did} role="alert">{error}</p> : hint ? <p className="hint" id={did}>{hint}</p> : null}
    </div>
  )
}

export function TextField(props: { label: string; value: string; onChange: (v: string) => void; type?: string; error?: string | null; hint?: string; placeholder?: string; autoComplete?: string; inputMode?: 'numeric' | 'decimal' | 'text' }) {
  return (
    <Field label={props.label} error={props.error} hint={props.hint}>
      {(a) => <input {...a} className="input" type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} autoComplete={props.autoComplete} inputMode={props.inputMode} onChange={(e) => props.onChange(e.target.value)} />}
    </Field>
  )
}

export function SelectField({ label, value, onChange, options, error }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string | null }) {
  return (
    <Field label={label} error={error}>
      {(a) => (
        <select {...a} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={value === i.id} className="tab" onClick={() => onChange(i.id)}>{i.label}</button>
      ))}
    </div>
  )
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modalback" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: '0.8rem' }}>
          <h3>{title}</h3>
          <div className="sp" />
          <button className="iconbtn" onClick={onClose} aria-label="Kapat"><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><p style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{title}</p>{children && <p>{children}</p>}</div>
}
export function Loading() { return <div className="stack" aria-busy="true" aria-label="Yükleniyor"><div className="skeleton" /><div className="skeleton" style={{ width: '70%' }} /></div> }
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="card" role="alert" style={{ borderColor: 'var(--color-bad)' }}><p className="err">{message}</p>{onRetry && <button className="btn sm" onClick={onRetry}>Tekrar dene</button>}</div>
}

export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; sort?: (a: T, b: T) => number }
/** Arama, sıralama ve sayfalama yapan tablo. */
export function DataTable<T>({ rows, cols, rowKey, searchText, empty = 'Kayıt bulunamadı.', pageSize = 10, filters }: {
  rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; searchText?: (r: T) => string; empty?: string; pageSize?: number; filters?: ReactNode
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)
  const filtered = useMemo(() => {
    let r = rows
    if (q.trim() && searchText) { const n = q.trim().toLocaleLowerCase('tr'); r = r.filter((x) => searchText(x).toLocaleLowerCase('tr').includes(n)) }
    if (sort) { const c = cols.find((x) => x.key === sort.k); if (c?.sort) r = [...r].sort((a, b) => c.sort!(a, b) * sort.dir) }
    return r
  }, [rows, q, sort, cols, searchText])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const view = filtered.slice(cur * pageSize, cur * pageSize + pageSize)
  return (
    <div className="stack">
      <div className="row">
        {searchText && (
          <div style={{ flex: '1 1 220px' }}>
            <label className="small muted" htmlFor="tbl-q">Ara</label>
            <input id="tbl-q" className="input" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Ad, kod veya anahtar kelime" />
          </div>
        )}
        {filters}
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>{cols.map((c) => (
              <th key={c.key} aria-sort={sort?.k === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                {c.sort ? <button onClick={() => setSort(sort?.k === c.key ? { k: c.key, dir: (sort.dir * -1) as 1 | -1 } : { k: c.key, dir: 1 })}>{c.label}{sort?.k === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</button> : c.label}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {view.length === 0 ? <tr><td colSpan={cols.length}><Empty title={empty} /></td></tr> : view.map((r) => <tr key={rowKey(r)}>{cols.map((c) => <td key={c.key}>{c.render(r)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="row small muted">
        <span>{filtered.length} kayıt</span>
        <div className="sp" />
        {pages > 1 && <>
          <button className="btn sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Önceki</button>
          <span>{cur + 1} / {pages}</span>
          <button className="btn sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Sonraki</button>
        </>}
      </div>
    </div>
  )
}

export function Emblem({ size = 64, light = false }: { size?: number; light?: boolean }) {
  const a = light ? '#fff' : 'currentColor'
  return (
    <svg viewBox="0 0 120 90" width={size} height={size * 0.75} aria-hidden="true">
      <circle cx="30" cy="11" r="9" fill={a} /><circle cx="90" cy="11" r="9" fill="var(--signal, #FF5A1F)" />
      <path d="M60 58 C47 28 9 28 9 59 C9 90 47 88 60 58" fill="none" stroke={a} strokeWidth="11" strokeLinecap="round" />
      <path d="M60 58 C73 28 111 28 111 59 C111 90 73 88 60 58" fill="none" stroke="var(--signal, #FF5A1F)" strokeWidth="11" strokeLinecap="round" />
    </svg>
  )
}


export function LangSwitch() {
  const [lang, setLang] = useState<Lang>(savedLang)
  useEffect(() => { setLanguage(lang) }, [lang])
  return (
    <div className="langsw" role="group" aria-label="Dil / Language">
      {(['tr', 'en'] as Lang[]).map((l) => <button key={l} type="button" className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
    </div>
  )
}

export type ThemePref = 'system' | 'light' | 'dark'
export function applyTheme(t: ThemePref) {
  const r = document.documentElement
  if (t === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', t)
}
export function savedTheme(): ThemePref {
  try { const v = localStorage.getItem('foradas-theme'); return v === 'light' || v === 'dark' ? v : 'system' } catch { return 'system' }
}
export function ThemeSwitch() {
  const [t, setT] = useState<ThemePref>(savedTheme)
  useEffect(() => { applyTheme(t) }, [t])
  const dark = t === 'dark' || (t === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)
  const flip = () => {
    const n: ThemePref = dark ? 'light' : 'dark'
    setT(n)
    try { localStorage.setItem('foradas-theme', n) } catch { /* yoksay */ }
  }
  return <button type="button" className="iconbtn" onClick={flip} aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>
}
