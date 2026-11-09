import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WELCOME } from '../config/welcome'
import { savedLang, setLanguage, type Lang } from '../app/i18n'

export const LANG_EVENT = 'foradas-lang-change'
const seen = () => { try { return localStorage.getItem(WELCOME.storageKey) === '1' } catch { return false } }

/** Dismissible note at the top of the site that points to the presentation. Shown once per visitor (storage unavailable → shown every time). */
export function WelcomeBanner() {
  const [hidden, setHidden] = useState(seen)
  const [lang, setLang] = useState<Lang>(savedLang)
  useEffect(() => { const h = () => setLang(savedLang()); window.addEventListener(LANG_EVENT, h); return () => window.removeEventListener(LANG_EVENT, h) }, [])
  const { pathname } = useLocation()
  if (!WELCOME.enabled || hidden || pathname.startsWith('/sunum')) return null
  const t = WELCOME[lang]
  const pick = (l: Lang) => { setLanguage(l); setLang(l); window.dispatchEvent(new Event(LANG_EVENT)) }
  const close = () => { try { localStorage.setItem(WELCOME.storageKey, '1') } catch { /* ignore */ } setHidden(true) }
  return (
    <section role="region" aria-label={t.region} style={{ position: 'sticky', top: 0, zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center', padding: '10px 14px', background: '#0d2029', color: '#fff', fontSize: 14, lineHeight: 1.4 }}>
      <span style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}>{t.message(WELCOME.name, WELCOME.time)}</span>
      <Link to="/sunum" style={{ background: '#ef5f26', color: '#fff', padding: '6px 14px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>{t.open}</Link>
      <div role="group" aria-label="TR | EN" style={{ display: 'flex', border: '1px solid #ffffff55', borderRadius: 999, overflow: 'hidden' }}>
        {(['tr', 'en'] as Lang[]).map((l) => <button key={l} type="button" aria-pressed={lang === l} onClick={() => pick(l)} style={{ background: lang === l ? '#ffffff22' : 'transparent', color: '#fff', border: 0, minWidth: 36, minHeight: 28, padding: '0 8px', fontWeight: 700, cursor: 'pointer' }}>{l.toUpperCase()}</button>)}
      </div>
      <button type="button" onClick={close} aria-label={t.close} style={{ background: 'transparent', color: '#fff', border: '1px solid #ffffff55', borderRadius: 999, width: 28, height: 28, cursor: 'pointer' }}>×</button>
    </section>
  )
}
