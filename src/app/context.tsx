import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { Journey, Role, Session, User } from '../domain/types'
import { createApi, type Api } from '../services/api'
import { AuthError } from '../services/authz'
import { Store } from '../services/store'

const store = new Store()
const api = createApi(store)

interface Toast { id: number; text: string; bad?: boolean }
interface Ctx {
  api: Api
  store: Store
  session: Session | null
  user: User | null
  signIn: (s: Session) => void
  signOut: () => void
  toast: (text: string, bad?: boolean) => void
  toasts: Toast[]
  /** Servis çağrısını güvenle çalıştırır; hata olursa kullanıcıya gösterir. */
  run: <T,>(fn: () => T, ok?: string) => T | undefined
  journey: Journey | null
  setJourney: (j: Journey | null) => void
}
const C = createContext<Ctx | null>(null)

let ver = 0
const subscribe = (cb: () => void) => store.subscribe(() => { ver += 1; cb() })

export function AppProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribe, () => ver)
  const [session, setSession] = useState<Session | null>(() => {
    const id = store.loadSession()
    return id && store.data.users.some((u) => u.id === id && u.status === 'active') ? { userId: id } : null
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [journey, setJourney] = useState<Journey | null>(null)
  const toast = useCallback((text: string, bad?: boolean) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, bad }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])
  const user = session ? store.data.users.find((u) => u.id === session.userId && u.status === 'active') ?? null : null
  useEffect(() => { if (session && !user) setSession(null) }, [session, user])
  const run = useCallback(<T,>(fn: () => T, ok?: string): T | undefined => {
    try { const r = fn(); if (ok) toast(ok); return r } catch (e) {
      toast(e instanceof AuthError ? e.message : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', true)
      if (!(e instanceof AuthError)) console.error(e)
      return undefined
    }
  }, [toast])
  const value = useMemo<Ctx>(() => ({
    api, store, session, user, toasts, toast, run, journey, setJourney,
    signIn: (s) => setSession(s),
    signOut: () => { api.auth.logout(); setSession(null); setJourney(null) },
  }), [session, user, toasts, toast, run, journey])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useApp(): Ctx {
  const c = useContext(C)
  if (!c) throw new Error('AppProvider eksik')
  return c
}

export const ROLE_HOME: Record<Role, string> = { citizen: '/vatandas', cityAdmin: '/il', nationalAdmin: '/ulusal' }
export const ROLE_LABEL: Record<Role, string> = { citizen: 'Vatandaş', cityAdmin: 'İl yöneticisi', nationalAdmin: 'Ulusal yönetici' }
