import type {
  City, FareVersion, Journey, JourneyLeg, ModeId, Route, ServiceAlert, Session, Stop, User, WalletTransaction,
} from '../domain/types'
import { AuthError, actorOf, audit, requireCityAccess, requirePermission } from './authz'
import type { Store } from './store'

export const TL = (kurus: number) => (kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
export const MODE_LABEL: Record<ModeId, string> = { bus: 'Otobüs', metro: 'Metro', tram: 'Tramvay', ferry: 'Vapur', rail: 'Tren' }

const fail = (msg: string, code: AuthError['code'] = 'validation'): never => { throw new AuthError(msg, code) }

export type Criterion = 'fastest' | 'fewest' | 'cheapest'
export interface RoutingService {
  plan(cityId: string, fromStopId: string, toStopId: string, opts: { modes?: ModeId[]; passenger?: 'full' | 'student' }): Journey[]
}

// PROTOTİP: güvenli olmayan basit özet. Gerçek sistemde parola sunucuda Argon2id ile saklanır / OIDC kullanılır.
const weakHash = (pw: string) => { let h = 2166136261; for (const c of 'rota81:' + pw) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0).toString(16) }

export function createApi(store: Store) {
  const d = () => store.data

  // ---------- fare lookup (sürümlü) ----------
  const fareAt = (productId: string, at: Date): FareVersion | undefined =>
    d().fareVersions.find((v) => v.productId === productId && (v.status === 'approved' || v.status === 'superseded') && v.validFrom !== null && new Date(v.validFrom) <= at && (v.validTo === null || at < new Date(v.validTo)))
  const fareFor = (cityId: string, mode: ModeId, passenger: 'full' | 'student', at = store.clock.now()) =>
    fareAt(`fp-${cityId}-${mode}-${passenger === 'student' ? 'student' : 'full'}`, at)

  // ---------- routing ----------
  const haversine = (a: Stop, b: Stop) => {
    const R = 6371000, r = Math.PI / 180
    const dl = (b.lat - a.lat) * r, dg = (b.lon - a.lon) * r
    const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(x))
  }
  const routing: RoutingService = {
    plan(cityId, from, to, opts) {
      const stops = d().stops.filter((s) => s.cityId === cityId)
      const byId = new Map(stops.map((s) => [s.id, s]))
      if (!byId.has(from) || !byId.has(to)) return fail('Başlangıç veya varış durağı bu ilde bulunamadı.')
      if (from === to) return fail('Başlangıç ve varış durağı aynı olamaz.')
      const modes = opts.modes?.length ? opts.modes : undefined
      const routes = d().routes.filter((r) => r.cityId === cityId && r.status === 'active' && (!modes || modes.includes(r.mode)))
      const passenger = opts.passenger ?? 'full'
      const boardFare = (m: ModeId) => fareFor(cityId, m, passenger)?.amount ?? 0
      type Edge = { to: string; kind: 'ride' | 'walk'; routeId?: string; min: number }
      const adj = new Map<string, Edge[]>()
      const add = (k: string, e: Edge) => { (adj.get(k) ?? adj.set(k, []).get(k)!).push(e) }
      routes.forEach((r) => r.stopIds.forEach((sid, i) => {
        if (i < r.stopIds.length - 1) {
          add(`${sid}|${r.id}`, { to: `${r.stopIds[i + 1]}|${r.id}`, kind: 'ride', routeId: r.id, min: r.minutesBetween[i] })
          add(`${r.stopIds[i + 1]}|${r.id}`, { to: `${sid}|${r.id}`, kind: 'ride', routeId: r.id, min: r.minutesBetween[i] })
        }
      }))
      const routeById = new Map(routes.map((r) => [r.id, r]))
      const results: Journey[] = []
      const seen = new Set<string>()
      ;(['fastest', 'fewest', 'cheapest'] as Criterion[]).forEach((crit) => {
        // durum: `${stop}|${route veya ''}`
        const dist = new Map<string, number>(), prev = new Map<string, { k: string; e: Edge | 'board' | 'walk' }>()
        const start = `${from}|`
        dist.set(start, 0)
        const Q = [start]
        const relax = (k: string, c: number, p: string, e: Edge | 'board' | 'walk') => { if (!dist.has(k) || c < dist.get(k)!) { dist.set(k, c); prev.set(k, { k: p, e }); Q.push(k) } }
        const done = new Set<string>()
        let goal: string | null = null
        while (Q.length) {
          let bi = 0
          for (let i = 1; i < Q.length; i++) if (dist.get(Q[i])! < dist.get(Q[bi])!) bi = i
          const k = Q.splice(bi, 1)[0]
          if (done.has(k)) continue
          done.add(k)
          const [sid, rid] = k.split('|')
          const c = dist.get(k)!
          if (!rid && sid === to) { goal = k; break }
          if (!rid) {
            routes.forEach((r) => { if (r.stopIds.includes(sid)) {
              const boardCost = crit === 'fastest' ? r.headwayMin / 2 : crit === 'fewest' ? 1000 + r.headwayMin / 2 : boardFare(r.mode) + 0.1
              relax(`${sid}|${r.id}`, c + boardCost, k, 'board')
            } })
            stops.forEach((o) => {
              if (o.id !== sid) { const m = haversine(byId.get(sid)!, o); if (m <= 450) relax(`${o.id}|`, c + m / 75 * (crit === 'cheapest' ? 0.1 : 1), k, 'walk') }
            })
          } else {
            ;(adj.get(k) ?? []).forEach((e) => relax(e.to, c + e.min * (crit === 'cheapest' ? 0.02 : 1), k, e))
            relax(`${sid}|`, c, k, 'walk') // araçtan iniş
          }
        }
        if (!goal) return
        const chain: { k: string; e: Edge | 'board' | 'walk' | null }[] = []
        for (let q: string | undefined = goal; q; q = prev.get(q)?.k) chain.unshift({ k: q, e: prev.get(q)?.e ?? null })
        const legs: JourneyLeg[] = []
        let cur: JourneyLeg | null = null
        const now = store.clock.now()
        chain.forEach((step, i) => {
          if (i === 0) return
          const [sid, rid] = step.k.split('|'); const [psid, prid] = chain[i - 1].k.split('|')
          if (step.e && typeof step.e === 'object' && step.e.kind === 'ride') {
            if (!cur || cur.routeId !== rid) {
              const r = routeById.get(rid)!
              const fv = fareFor(cityId, r.mode, passenger, now)
              cur = { kind: 'ride', routeId: rid, mode: r.mode, fromStopId: psid, toStopId: sid, minutes: 0, fare: fv?.amount ?? 0, fareVersionId: fv?.id }
              legs.push(cur)
            }
            cur.toStopId = sid; cur.minutes += step.e.min
          } else if (step.e === 'walk' && !prid && psid !== sid) {
            const m = Math.max(1, Math.round(haversine(byId.get(psid)!, byId.get(sid)!) / 75))
            legs.push({ kind: 'walk', fromStopId: psid, toStopId: sid, minutes: m, fare: 0 }); cur = null
          } else if (step.e === 'walk') { cur = null }
        })
        // bekleme/aktarma süresini ekle
        const rides = legs.filter((l) => l.kind === 'ride')
        rides.forEach((l) => { l.minutes += Math.round((routeById.get(l.routeId!)!.headwayMin) / 2) })
        const j: Journey = {
          cityId, legs, totalMinutes: legs.reduce((a, l) => a + l.minutes, 0), totalFare: legs.reduce((a, l) => a + l.fare, 0), transfers: Math.max(0, rides.length - 1),
        }
        const key = legs.map((l) => (l.kind === 'ride' ? l.routeId : 'w')).join('>')
        if (!seen.has(key)) { seen.add(key); results.push(j) }
      })
      return results
    },
  }

  // ---------- auth ----------
  const auth = {
    login(email: string, password: string): Session {
      const u = d().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      // PROTOTİP: tüm demo hesapların parolası "demo1234". Gerçek sistemde parola özetlenir, OIDC kullanılır.
      if (!u || !(u.secret ? u.secret === weakHash(password) : password === 'demo1234')) return fail('E-posta veya parola hatalı.', 'unauthenticated')
      if (u.status !== 'active') return fail('Hesap askıya alınmış.', 'forbidden')
      audit(store, u, 'login', 'success'); store.commit()
      store.saveSession(u.id)
      return { userId: u.id }
    },
    register(name: string, email: string, password: string): Session {
      name = name.trim(); email = email.trim().toLowerCase()
      if (name.length < 3) return fail('Ad soyad en az 3 karakter olmalı.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Geçerli bir e-posta adresi girin.')
      if (password.length < 8) return fail('Parola en az 8 karakter olmalı.')
      if (d().users.some((x) => x.email === email)) return fail('Bu e-posta ile kayıtlı bir hesap var.', 'conflict')
      const u: User = { id: store.id('u'), name, email, role: 'citizen', status: 'active', createdAt: store.nowIso(), secret: weakHash(password) }
      d().users.push(u)
      d().cards.push({ id: store.id('card'), userId: u.id, number: `R81 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`, status: 'active', createdAt: store.nowIso() })
      d().wallets.push({ id: store.id('wal'), userId: u.id, balance: 0 })
      audit(store, u, 'register', 'success'); store.commit()
      store.saveSession(u.id)
      return { userId: u.id }
    },
    logout() { store.saveSession(null) },
    me(s: Session | null) { return actorOf(store, s) },
  }

  // ---------- cüzdan ve kart (yalnızca kendi) ----------
  const walletOf = (u: User) => d().wallets.find((w) => w.userId === u.id)!
  const cardOf = (u: User) => d().cards.find((c) => c.userId === u.id)!
  const existingTx = (walletId: string, key: string) => d().transactions.find((t) => t.walletId === walletId && t.idempotencyKey === key)
  const MAX_BALANCE = 500000
  const wallet = {
    get(s: Session | null) {
      const u = actorOf(store, s); requirePermission(store, u, 'wallet:own', 'wallet.get')
      const w = walletOf(u)
      return { wallet: w, card: cardOf(u), transactions: d().transactions.filter((t) => t.walletId === w.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
    },
    /** Defter tutarlılığı: bakiye = Σ işlemler. */
    ledgerBalance(s: Session | null): number {
      const u = actorOf(store, s); const w = walletOf(u)
      return d().transactions.filter((t) => t.walletId === w.id && t.status !== 'failed').reduce((acc, t) => acc + (t.type === 'spend' ? -t.amount : t.amount), 0)
    },
    topUp(s: Session | null, amount: number, key: string): WalletTransaction {
      const u = actorOf(store, s); requirePermission(store, u, 'wallet:own', 'wallet.topUp')
      const w = walletOf(u)
      const ex = existingTx(w.id, key); if (ex) return ex
      if (!Number.isInteger(amount) || amount < 1000 || amount > 200000) return fail('Yükleme tutarı 10 ₺ ile 2.000 ₺ arasında olmalı.')
      if (w.balance + amount > MAX_BALANCE) return fail('Bakiye üst sınırı 5.000 ₺. Daha az tutar yükleyin.')
      w.balance += amount
      const tx: WalletTransaction = { id: store.id('tx'), walletId: w.id, type: 'topup', amount, status: 'completed', description: 'Bakiye yükleme (prototip simülasyonu, gerçek ödeme yok)', idempotencyKey: key, createdAt: store.nowIso(), simulated: true }
      d().transactions.push(tx); notify(u.id, `${TL(amount)} yükleme yapıldı (simülasyon).`); audit(store, u, 'wallet.topUp', 'success', { target: tx.id }); store.commit()
      return tx
    },
    spend(s: Session | null, amount: number, description: string, key: string, meta: { cityId?: string; fareVersionId?: string } = {}): WalletTransaction {
      const u = actorOf(store, s); requirePermission(store, u, 'wallet:own', 'wallet.spend')
      const w = walletOf(u)
      const ex = existingTx(w.id, key); if (ex) return ex
      if (cardOf(u).status === 'frozen') return fail('Kartınız dondurulmuş. Önce kartı çözün.')
      if (!Number.isInteger(amount) || amount <= 0) return fail('Geçersiz tutar.')
      if (amount > w.balance) return fail('Bakiye yetersiz.')
      w.balance -= amount
      const tx: WalletTransaction = { id: store.id('tx'), walletId: w.id, type: 'spend', amount, status: 'completed', description, idempotencyKey: key, createdAt: store.nowIso(), simulated: true, ...meta }
      d().transactions.push(tx); if (w.balance < 3000) notify(u.id, `Bakiyen azaldı: ${TL(w.balance)}.`); audit(store, u, 'wallet.spend', 'success', { target: tx.id, cityId: meta.cityId }); store.commit()
      return tx
    },
    refund(s: Session | null, txId: string, key: string): WalletTransaction {
      const u = actorOf(store, s); requirePermission(store, u, 'wallet:own', 'wallet.refund')
      const w = walletOf(u)
      const ex = existingTx(w.id, key); if (ex) return ex
      const orig = d().transactions.find((t) => t.id === txId && t.walletId === w.id)
      if (!orig) return fail('İşlem bulunamadı.', 'not_found')
      if (orig.type !== 'spend' || orig.status !== 'completed') return fail('Yalnızca tamamlanmış harcamalar iade edilebilir.', 'conflict')
      orig.status = 'refunded'; w.balance += orig.amount
      const tx: WalletTransaction = { id: store.id('tx'), walletId: w.id, type: 'refund', amount: orig.amount, status: 'completed', description: `İade: ${orig.description}`, idempotencyKey: key, relatedTxId: orig.id, createdAt: store.nowIso(), simulated: true, cityId: orig.cityId }
      d().transactions.push(tx); notify(u.id, `${TL(orig.amount)} iade edildi.`); audit(store, u, 'wallet.refund', 'success', { target: tx.id }); store.commit()
      return tx
    },
    setCardFrozen(s: Session | null, frozen: boolean) {
      const u = actorOf(store, s); requirePermission(store, u, 'card:own', 'card.freeze')
      cardOf(u).status = frozen ? 'frozen' : 'active'
      audit(store, u, frozen ? 'card.freeze' : 'card.unfreeze', 'success'); store.commit()
    },
  }

  const notify = (userId: string, text: string) => { d().notifications.unshift({ id: store.id('n'), userId, text, at: store.nowIso(), read: false }); if (d().notifications.length > 300) d().notifications.length = 300 }
  const me = {
    notifications(s: Session | null) { const u = actorOf(store, s); return d().notifications.filter((n) => n.userId === u.id) },
    notify(s: Session | null, text: string) { const u = actorOf(store, s); notify(u.id, text); store.commit() },
    favoriteStops(s: Session | null) { const u = actorOf(store, s); return (d().favoriteStops ?? []).filter((f) => f.userId === u.id) },
    toggleFavoriteStop(s: Session | null, cityId: string, stopId: string, label = '') {
      const u = actorOf(store, s)
      if (!d().favoriteStops) d().favoriteStops = []
      const i = d().favoriteStops.findIndex((f) => f.userId === u.id && f.stopId === stopId)
      if (i >= 0) d().favoriteStops.splice(i, 1)
      else { if (!d().stops.some((x) => x.id === stopId && x.cityId === cityId)) fail('Durak bulunamadı.'); d().favoriteStops.push({ userId: u.id, cityId, stopId, label: label.trim().slice(0, 30) }) }
      store.commit()
    },
    renameFavoriteStop(s: Session | null, stopId: string, label: string) {
      const u = actorOf(store, s); const f = (d().favoriteStops ?? []).find((x) => x.userId === u.id && x.stopId === stopId)
      if (f) { f.label = label.trim().slice(0, 30); store.commit() }
    },
    markAllRead(s: Session | null) { const u = actorOf(store, s); d().notifications.filter((n) => n.userId === u.id).forEach((n) => { n.read = true }); store.commit() },
    favorites(s: Session | null) { const u = actorOf(store, s); return d().favorites.filter((f) => f.userId === u.id) },
    addFavorite(s: Session | null, cityId: string, fromStopId: string, toStopId: string) {
      const u = actorOf(store, s)
      if (fromStopId === toStopId) return fail('Başlangıç ve varış aynı olamaz.')
      if (d().favorites.some((f) => f.userId === u.id && f.cityId === cityId && f.fromStopId === fromStopId && f.toStopId === toStopId)) return fail('Bu rota zaten favorilerde.', 'conflict')
      d().favorites.push({ userId: u.id, cityId, fromStopId, toStopId }); store.commit()
    },
    removeFavorite(s: Session | null, cityId: string, fromStopId: string, toStopId: string) {
      const u = actorOf(store, s); d().favorites = d().favorites.filter((f) => !(f.userId === u.id && f.cityId === cityId && f.fromStopId === fromStopId && f.toStopId === toStopId)); store.commit()
    },
    updateName(s: Session | null, name: string) {
      const u = actorOf(store, s); name = name.trim()
      if (name.length < 3 || name.length > 60) return fail('Ad soyad 3 ile 60 karakter arasında olmalı.')
      u.name = name; audit(store, u, 'profile.update', 'success'); store.commit()
    },
    /** PROTOTİP: parola kaydı yoktur; gerçek sistemde OIDC sağlayıcısında değişir. Yalnızca doğrulama kuralları gösterilir. */
    checkPassword(pw: string) { return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw) },
  }

  // ---------- yolculuk ----------
  const journeys = {
    plan: (cityId: string, from: string, to: string, opts: Parameters<RoutingService['plan']>[3] = {}) => routing.plan(cityId, from, to, opts),
    /** Yolculuğu tamamlar: ücret, planlama anındaki geçerli tarife sürümlerine bağlı olarak tahsil edilir. */
    complete(s: Session | null, j: Journey, key: string) {
      const u = actorOf(store, s); requirePermission(store, u, 'wallet:own', 'journey.complete')
      const vids = j.legs.filter((l) => l.fareVersionId).map((l) => l.fareVersionId!)
      const tx = wallet.spend(s, j.totalFare, `Yolculuk (${d().cities.find((c) => c.id === j.cityId)?.name})`, key, { cityId: j.cityId, fareVersionId: vids[0] })
      if (!d().journeys.some((x) => x.id === tx.id)) {
        d().journeys.push({ id: tx.id, userId: u.id, at: store.nowIso(), cityId: j.cityId, totalFare: j.totalFare, fareVersionIds: vids, legs: j.legs.length }); store.commit()
      }
      return tx
    },
    mine(s: Session | null) { const u = actorOf(store, s); return d().journeys.filter((x) => x.userId === u.id) },
  }

  // ---------- genel okuma (giriş yapmış herkes) ----------
  const catalog = {
    cities: (): Pick<City, 'id' | 'name' | 'region' | 'status' | 'hasDemoData'>[] => d().cities.map(({ id, name, region, status, hasDemoData }) => ({ id, name, region, status, hasDemoData })),
    stops: (cityId: string) => d().stops.filter((x) => x.cityId === cityId),
    routes: (cityId: string) => d().routes.filter((x) => x.cityId === cityId),
    operators: (cityId: string) => d().operators.filter((x) => x.cityId === cityId),
    alerts: (cityId?: string) => d().alerts.filter((a) => !cityId || a.cityId === cityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    fareTable: (cityId: string) => d().fareProducts.filter((p) => p.cityId === cityId).map((p) => ({ product: p, current: fareAt(p.id, store.clock.now()) })),
  }

  // ---------- il yönetimi ----------
  const city = {
    dashboard(s: Session | null, cityId: string) {
      const u = actorOf(store, s); requireCityAccess(store, u, cityId, 'read', 'city.dashboard')
      const routes = d().routes.filter((r) => r.cityId === cityId)
      const js = d().journeys.filter((j) => j.cityId === cityId)
      return {
        city: d().cities.find((c) => c.id === cityId)!,
        routes: routes.length, activeRoutes: routes.filter((r) => r.status === 'active').length,
        stops: d().stops.filter((x) => x.cityId === cityId).length, operators: d().operators.filter((o) => o.cityId === cityId).length,
        journeys: js.length, revenue: js.reduce((a, j) => a + j.totalFare, 0),
        pendingFares: d().fareVersions.filter((v) => v.cityId === cityId && v.status === 'pending').length,
        draftFares: d().fareVersions.filter((v) => v.cityId === cityId && v.status === 'draft').length,
        byMode: routes.reduce<Record<string, number>>((a, r) => ({ ...a, [r.mode]: (a[r.mode] ?? 0) + 1 }), {}),
      }
    },
    addStop(s: Session | null, cityId: string, name: string, lat: number, lon: number, accessible: boolean): Stop {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'stop.add'); requireCityAccess(store, u, cityId, 'write', 'stop.add')
      name = name.trim()
      if (name.length < 2) return fail('Durak adı en az 2 karakter olmalı.')
      if (!(lat >= 35 && lat <= 43 && lon >= 25 && lon <= 45)) return fail('Koordinatlar Türkiye sınırları içinde olmalı.')
      if (d().stops.some((x) => x.cityId === cityId && x.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) return fail('Bu adda bir durak zaten var.', 'conflict')
      const maxCode = Math.max(0, ...d().stops.filter((x) => x.cityId === cityId).map((x) => Number(x.code.slice(2)) || 0))
      const st: Stop = { id: store.id(`st-${cityId}`), cityId, code: `${cityId}${String(maxCode + 1).padStart(3, '0')}`, name, lat, lon, accessible }
      d().stops.push(st); audit(store, u, 'stop.add', 'success', { cityId, target: st.id }); store.commit(); return st
    },
    removeStop(s: Session | null, stopId: string) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'stop.remove')
      const st = d().stops.find((x) => x.id === stopId); if (!st) return fail('Durak bulunamadı.', 'not_found')
      requireCityAccess(store, u, st.cityId, 'write', 'stop.remove')
      if (d().routes.some((r) => r.stopIds.includes(stopId))) return fail('Bu durak bir hatta bağlı; önce hattı güncelleyin.', 'conflict')
      d().stops = d().stops.filter((x) => x.id !== stopId); audit(store, u, 'stop.remove', 'success', { cityId: st.cityId, target: stopId }); store.commit()
    },
    setRouteStatus(s: Session | null, routeId: string, status: Route['status']) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'route.status')
      const r = d().routes.find((x) => x.id === routeId); if (!r) return fail('Hat bulunamadı.', 'not_found')
      requireCityAccess(store, u, r.cityId, 'write', 'route.status')
      r.status = status; audit(store, u, 'route.status', 'success', { cityId: r.cityId, target: `${r.code}:${status}` }); store.commit()
    },
    setHeadway(s: Session | null, routeId: string, minutes: number) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'route.headway')
      const r = d().routes.find((x) => x.id === routeId); if (!r) return fail('Hat bulunamadı.', 'not_found')
      requireCityAccess(store, u, r.cityId, 'write', 'route.headway')
      if (!Number.isInteger(minutes) || minutes < 2 || minutes > 120) return fail('Sefer aralığı 2 ile 120 dakika arasında olmalı.')
      r.headwayMin = minutes; audit(store, u, 'route.headway', 'success', { cityId: r.cityId, target: `${r.code}:${minutes}dk` }); store.commit()
    },
    addRoute(s: Session | null, cityId: string, input: { code: string; name: string; mode: ModeId; operatorId: string; stopIds: string[]; minutes: number }): Route {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'route.add'); requireCityAccess(store, u, cityId, 'write', 'route.add')
      const code = input.code.trim().toUpperCase()
      if (!code || input.name.trim().length < 3) return fail('Hat kodu ve adı gerekli.')
      if (input.stopIds.length < 2) return fail('Bir hat en az 2 durak içermeli.')
      const cityStops = new Set(d().stops.filter((x) => x.cityId === cityId).map((x) => x.id))
      if (!input.stopIds.every((x) => cityStops.has(x))) return fail('Duraklar bu ile ait olmalı.', 'forbidden')
      const op = d().operators.find((o) => o.id === input.operatorId && o.cityId === cityId)
      if (!op) return fail('İşletici bu ile ait olmalı.', 'forbidden')
      if (!op.modes.includes(input.mode)) return fail('İşletici bu ulaşım türünde hizmet vermiyor.')
      if (d().routes.some((r) => r.cityId === cityId && r.code === code)) return fail('Bu hat kodu zaten var.', 'conflict')
      const r: Route = { id: store.id(`rt-${cityId}`), cityId, operatorId: op.id, code, name: input.name.trim(), mode: input.mode, stopIds: input.stopIds, minutesBetween: input.stopIds.slice(1).map(() => Math.max(1, input.minutes)), headwayMin: 15, status: 'active' }
      d().routes.push(r); audit(store, u, 'route.add', 'success', { cityId, target: r.code }); store.commit(); return r
    },
    addOperator(s: Session | null, cityId: string, name: string, modes: ModeId[]) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'operator.add'); requireCityAccess(store, u, cityId, 'write', 'operator.add')
      if (name.trim().length < 3 || !modes.length) return fail('İşletici adı ve en az bir ulaşım türü gerekli.')
      d().operators.push({ id: store.id(`op-${cityId}`), cityId, name: name.trim(), modes, status: 'active' }); audit(store, u, 'operator.add', 'success', { cityId, target: name }); store.commit()
    },
    setOperatorStatus(s: Session | null, operatorId: string, status: 'active' | 'suspended') {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'operator.status')
      const o = d().operators.find((x) => x.id === operatorId); if (!o) return fail('İşletici bulunamadı.', 'not_found')
      requireCityAccess(store, u, o.cityId, 'write', 'operator.status')
      o.status = status; audit(store, u, 'operator.status', 'success', { cityId: o.cityId, target: `${o.name}:${status}` }); store.commit()
    },
    publishAlert(s: Session | null, cityId: string, title: string, body: string, severity: ServiceAlert['severity']) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:write:own', 'alert.publish'); requireCityAccess(store, u, cityId, 'write', 'alert.publish')
      if (title.trim().length < 3 || body.trim().length < 5) return fail('Başlık ve metin çok kısa.')
      d().alerts.unshift({ id: store.id('al'), cityId, title: title.trim(), body: body.trim(), severity, createdAt: store.nowIso(), createdBy: u.id })
      audit(store, u, 'alert.publish', 'success', { cityId, target: title }); store.commit()
    },
    history(s: Session | null, cityId: string) {
      const u = actorOf(store, s); requireCityAccess(store, u, cityId, 'read', 'city.history')
      return d().audit.filter((a) => a.cityId === cityId)
    },
  }

  // ---------- tarife iş akışı ----------
  const fares = {
    list(s: Session | null, cityId: string) {
      const u = actorOf(store, s); requireCityAccess(store, u, cityId, 'read', 'fare.list')
      return d().fareProducts.filter((p) => p.cityId === cityId).map((p) => ({ product: p, versions: d().fareVersions.filter((v) => v.productId === p.id).sort((a, b) => b.version - a.version) }))
    },
    createDraft(s: Session | null, productId: string, amount: number, note: string): FareVersion {
      const u = actorOf(store, s); requirePermission(store, u, 'tariff:draft:own', 'fare.draft')
      const p = d().fareProducts.find((x) => x.id === productId); if (!p) return fail('Tarife ürünü bulunamadı.', 'not_found')
      requireCityAccess(store, u, p.cityId, 'write', 'fare.draft')
      if (!Number.isInteger(amount) || amount < 0 || amount > 50000) return fail('Ücret 0 ₺ ile 500 ₺ arasında olmalı.')
      const all = d().fareVersions.filter((v) => v.productId === productId)
      if (all.some((v) => v.status === 'draft' || v.status === 'pending')) return fail('Bu ürün için bekleyen bir taslak/onay var.', 'conflict')
      const v: FareVersion = { id: store.id('fv'), productId, cityId: p.cityId, version: Math.max(...all.map((x) => x.version)) + 1, amount, validFrom: null, validTo: null, status: 'draft', createdBy: u.id, createdAt: store.nowIso(), note }
      d().fareVersions.push(v); audit(store, u, 'fare.draft', 'success', { cityId: p.cityId, target: `${p.id} v${v.version}` }); store.commit(); return v
    },
    createProduct(s: Session | null, cityId: string, mode: ModeId, name: string, amount: number): FareVersion {
      const u = actorOf(store, s); requirePermission(store, u, 'tariff:draft:own', 'fare.product')
      requireCityAccess(store, u, cityId, 'write', 'fare.product')
      name = name.trim()
      if (name.length < 2) return fail('Ürün adı en az 2 karakter olmalı.')
      if (!Number.isInteger(amount) || amount < 0 || amount > 50000) return fail('Ücret 0 ₺ ile 500 ₺ arasında olmalı.')
      if (d().fareProducts.some((p) => p.cityId === cityId && p.mode === mode && p.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) return fail('Bu ürün zaten var.', 'conflict')
      const p = { id: store.id(`fp-${cityId}`), cityId, mode, name }
      d().fareProducts.push(p)
      const v: FareVersion = { id: store.id('fv'), productId: p.id, cityId, version: 1, amount, validFrom: null, validTo: null, status: 'draft', createdBy: u.id, createdAt: store.nowIso(), note: 'Yeni ürün' }
      d().fareVersions.push(v); audit(store, u, 'fare.product', 'success', { cityId, target: p.id }); store.commit(); return v
    },
    submit(s: Session | null, versionId: string) {
      const u = actorOf(store, s); requirePermission(store, u, 'tariff:draft:own', 'fare.submit')
      const v = d().fareVersions.find((x) => x.id === versionId); if (!v) return fail('Sürüm bulunamadı.', 'not_found')
      requireCityAccess(store, u, v.cityId, 'write', 'fare.submit')
      if (v.status !== 'draft') return fail('Yalnızca taslaklar onaya gönderilebilir.', 'conflict')
      v.status = 'pending'; audit(store, u, 'fare.submit', 'success', { cityId: v.cityId, target: v.id }); store.commit()
    },
    decide(s: Session | null, versionId: string, approve: boolean, reason = '') {
      const u = actorOf(store, s); requirePermission(store, u, 'tariff:approve', 'fare.decide')
      const v = d().fareVersions.find((x) => x.id === versionId); if (!v) return fail('Sürüm bulunamadı.', 'not_found')
      if (v.status !== 'pending') return fail('Yalnızca onay bekleyen sürümler karara bağlanır.', 'conflict')
      if (!approve) {
        if (reason.trim().length < 3) return fail('Red gerekçesi yazın.')
        v.status = 'rejected'; v.note = `${v.note ?? ''} | Red: ${reason}`
      } else {
        const now = store.nowIso()
        d().fareVersions.filter((x) => x.productId === v.productId && x.status === 'approved' && x.validTo === null).forEach((x) => { x.status = 'superseded'; x.validTo = now })
        v.status = 'approved'; v.validFrom = now
      }
      audit(store, u, approve ? 'fare.approve' : 'fare.reject', 'success', { cityId: v.cityId, target: v.id }); store.commit()
    },
    pendingAll(s: Session | null) {
      const u = actorOf(store, s); requirePermission(store, u, 'tariff:approve', 'fare.pending')
      return d().fareVersions.filter((v) => v.status === 'pending')
    },
    productName: (productId: string) => d().fareProducts.find((p) => p.id === productId),
  }

  // ---------- ulusal yönetim ----------
  const national = {
    overview(s: Session | null) {
      const u = actorOf(store, s); requirePermission(store, u, 'city:read:all', 'national.overview')
      return {
        provinces: d().cities.length, pilot: d().cities.filter((c) => c.status === 'pilot').length, planned: d().cities.filter((c) => c.status === 'planned').length,
        users: d().users.length, citizens: d().users.filter((x) => x.role === 'citizen').length, journeys: d().journeys.length,
        revenue: d().journeys.reduce((a, j) => a + j.totalFare, 0), pendingFares: d().fareVersions.filter((v) => v.status === 'pending').length,
        cities: d().cities,
      }
    },
    users(s: Session | null) { const u = actorOf(store, s); requirePermission(store, u, 'users:manage', 'users.list'); return d().users },
    setUserStatus(s: Session | null, userId: string, status: User['status']) {
      const u = actorOf(store, s); requirePermission(store, u, 'users:manage', 'user.status')
      const t = d().users.find((x) => x.id === userId); if (!t) return fail('Kullanıcı bulunamadı.', 'not_found')
      if (t.id === u.id) return fail('Kendi hesabınızı askıya alamazsınız.')
      t.status = status; audit(store, u, 'user.status', 'success', { target: `${t.name}:${status}` }); store.commit()
    },
    assignCityAdmin(s: Session | null, userId: string, cityId: string) {
      const u = actorOf(store, s); requirePermission(store, u, 'users:manage', 'user.assign')
      const t = d().users.find((x) => x.id === userId); const c = d().cities.find((x) => x.id === cityId)
      if (!t || !c) return fail('Kullanıcı veya il bulunamadı.', 'not_found')
      if (t.role === 'nationalAdmin') return fail('Ulusal yönetici il yöneticisi yapılamaz.', 'conflict')
      d().cities.forEach((x) => { if (x.adminUserId === t.id) x.adminUserId = undefined })
      t.role = 'cityAdmin'; t.cityId = cityId; c.adminUserId = t.id
      audit(store, u, 'user.assign', 'success', { cityId, target: t.name }); store.commit()
    },
    setCityStatus(s: Session | null, cityId: string, status: City['status']) {
      const u = actorOf(store, s); requirePermission(store, u, 'config:manage', 'city.status')
      const c = d().cities.find((x) => x.id === cityId); if (!c) return fail('İl bulunamadı.', 'not_found')
      c.status = status; audit(store, u, 'city.status', 'success', { cityId, target: status }); store.commit()
    },
    updatePolicy(s: Session | null, id: string, body: string) {
      const u = actorOf(store, s); requirePermission(store, u, 'config:manage', 'policy.update')
      const p = d().policies.find((x) => x.id === id); if (!p) return fail('Politika bulunamadı.', 'not_found')
      if (body.trim().length < 10) return fail('Politika metni çok kısa.')
      p.body = body.trim(); p.updatedAt = store.nowIso(); audit(store, u, 'policy.update', 'success', { target: p.title }); store.commit()
    },
    audit(s: Session | null) { const u = actorOf(store, s); requirePermission(store, u, 'audit:read:all', 'audit.read'); return d().audit },
    policies: () => d().policies,
    integrations: () => d().integrations,
  }

  return { auth, me, wallet, journeys, catalog, city, fares, national, routing, fareAt, fareFor }
}
export type Api = ReturnType<typeof createApi>
