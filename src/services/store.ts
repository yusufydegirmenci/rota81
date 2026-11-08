import type { AppData } from '../domain/types'
import { createSeed } from '../data/seed'

// Prototip veri deposu: bellek içi + localStorage. Gerçek sistemde bu katman PostgreSQL erişimidir.
// Tüm servisler yalnızca bu arayüz üzerinden veri okur/yazar; arayüz (UI) deponun içine doğrudan yazmaz.

const KEY = 'rota81-proto-data-v2'
const SESSION_KEY = 'rota81-proto-session-v1'

export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() }

export class Store {
  data: AppData
  private seq = 0
  private listeners = new Set<() => void>()
  clock: Clock
  private persist: boolean
  constructor(clock: Clock = systemClock, persist = true, initial?: AppData) {
    this.clock = clock
    this.persist = persist
    this.data = initial ?? this.load() ?? createSeed(() => clock.now())
  }
  private load(): AppData | null {
    if (!this.persist) return null
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as AppData) : null
    } catch { return null }
  }
  id(prefix: string): string {
    this.seq += 1
    return `${prefix}-${this.clock.now().getTime().toString(36)}-${this.seq}-${Math.random().toString(36).slice(2, 6)}`
  }
  nowIso(): string { return this.clock.now().toISOString() }
  commit(): void {
    if (this.persist) { try { localStorage.setItem(KEY, JSON.stringify(this.data)) } catch { /* depolama kapalı olabilir */ } }
    this.listeners.forEach((l) => l())
  }
  subscribe(fn: () => void): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  reset(): void {
    this.data = createSeed(() => this.clock.now())
    this.commit()
  }
  // Oturum: yalnızca kullanıcı kimliği saklanır. Rol ve il, her işlemde kullanıcı kaydından okunur (istemciye güvenilmez).
  loadSession(): string | null {
    if (!this.persist) return null
    try { return localStorage.getItem(SESSION_KEY) } catch { return null }
  }
  saveSession(userId: string | null): void {
    if (!this.persist) return
    try { if (userId) localStorage.setItem(SESSION_KEY, userId); else localStorage.removeItem(SESSION_KEY) } catch { /* yoksay */ }
  }
}
