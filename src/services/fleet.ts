import type { ModeId, Route } from '../domain/types'

// SİMÜLASYON: gerçek araç konumu ve kart okutma verisi yoktur. Aşağıdaki değerler saate ve hatta göre
// belirlenimli (deterministik) olarak üretilir; gerçek sistemde bu bilgi AVL (araç konum) ve validatör (kart okutma) akışından gelir.

export const CAPACITY: Record<ModeId, number> = { bus: 90, tram: 220, metro: 900, ferry: 350, rail: 600 }
export type Crowd = 'low' | 'mid' | 'high' | 'full'
export const CROWD_LABEL: Record<Crowd, string> = { low: 'Rahat', mid: 'Orta', high: 'Kalabalık', full: 'Çok dolu' }

const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10000) / 10000
}

/** Günün saatine göre talep çarpanı (0-1). Sabah ve akşam tepe saatleri. */
export function demandAt(minuteOfDay: number): number {
  const h = minuteOfDay / 60
  const bump = (c: number, w: number) => Math.exp(-(((h - c) / w) ** 2))
  return Math.min(1, 0.12 + 0.95 * bump(8, 1.3) + 0.9 * bump(17.7, 1.6) + 0.45 * bump(13, 2.2))
}
export const serviceActive = (minuteOfDay: number): boolean => minuteOfDay >= 5 * 60 && minuteOfDay < 24 * 60

export interface VehicleState {
  id: string
  routeId: string
  dir: 1 | -1
  segment: number // 0..n-2: iki durak arası (yön fark etmeksizin hat sırasındaki alt durak indeksi)
  atStop: boolean
  stopIndex: number // en son geçilen (veya durulan) durak indeksi
  nextIndex: number
  etaNextMin: number
  taps: number // araca şu ana kadar kart okutan yolcu (simüle)
  onboard: number
  capacity: number
  pct: number
  crowd: Crowd
}

export const crowdOf = (pct: number): Crowd => (pct < 35 ? 'low' : pct < 65 ? 'mid' : pct < 90 ? 'high' : 'full')

/** Hattın duraklarındaki simüle kart okutma (biniş) sayısı bir araç turu için. */
function boardings(route: Route, stopIdx: number, minuteOfDay: number, dir: 1 | -1): { board: number; alight: number } {
  const w = 0.4 + hash(`${route.id}:${stopIdx}`) * 1.2
  const base = CAPACITY[route.mode] * 0.34 * w * (0.2 + 0.8 * demandAt(minuteOfDay))
  const board = Math.round(base * (0.8 + hash(`${route.id}:${stopIdx}:${dir}`) * 0.4))
  const last = dir === 1 ? route.stopIds.length - 1 : 0
  return { board, alight: stopIdx === last ? Infinity : Math.round(base * (0.9 + 0.5 * hash(`a:${route.id}:${stopIdx}`))) }
}

export function vehiclesOn(route: Route, now: Date): VehicleState[] {
  const n = route.stopIds.length
  if (n < 2) return []
  const minute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  if (!serviceActive(minute) || route.status !== 'active') return []
  const seg = route.minutesBetween.map((m) => Math.max(1, m))
  const oneWay = seg.reduce((a, b) => a + b, 0)
  const dwell = 3
  const cycle = 2 * (oneWay + dwell)
  const count = Math.max(1, Math.min(8, Math.round(cycle / route.headwayMin)))
  const cap = CAPACITY[route.mode]
  const out: VehicleState[] = []
  for (let v = 0; v < count; v++) {
    const phase = (((minute - (v * cycle) / count) % cycle) + cycle) % cycle
    const dir: 1 | -1 = phase < oneWay + dwell ? 1 : -1
    const t = dir === 1 ? phase : phase - (oneWay + dwell)
    // dir=-1 için hat tersten gezilir
    const order = dir === 1 ? seg : [...seg].reverse()
    let acc = 0, i = 0
    let atStop = false
    if (t >= oneWay) { i = order.length; atStop = true } else {
      for (; i < order.length; i++) { if (t < acc + order[i]) break; acc += order[i] }
    }
    const idxInDir = i
    const stopIndex = dir === 1 ? idxInDir : n - 1 - idxInDir
    const nextIdxInDir = Math.min(n - 1, idxInDir + 1)
    const nextIndex = dir === 1 ? nextIdxInDir : n - 1 - nextIdxInDir
    const etaNext = atStop ? 0 : Math.max(0.5, acc + order[idxInDir] - t)
    // yük: hat başından şu ana kadar simüle biniş - iniş
    let load = Math.round(cap * 0.3 * demandAt(minute) * (0.6 + hash(`${route.id}:${v}`) * 0.8)), taps = 0
    for (let k = 0; k <= idxInDir && k < n; k++) {
      const si = dir === 1 ? k : n - 1 - k
      const b = boardings(route, si, minute, dir)
      load = Math.max(0, load - (b.alight === Infinity ? load : b.alight) + b.board)
      taps += b.board
    }
    const onboard = Math.min(Math.round(cap * 1.05), load)
    const pct = Math.round((onboard / cap) * 100)
    out.push({ id: `${route.code}-${v + 1}`, routeId: route.id, dir, segment: Math.min(idxInDir, n - 2), atStop, stopIndex, nextIndex, etaNextMin: Math.round(etaNext), taps, onboard, capacity: cap, pct: Math.min(100, pct), crowd: crowdOf(pct) })
  }
  return out
}

export interface Arrival { route: Route; vehicle: VehicleState; etaMin: number; towards: number }

/** Bir durağa yaklaşan araçlar (en yakın ETA'dan başlayarak). Uç duraklarda dönüş yapan araçlar da, yeni yönleriyle listelenir. */
export function arrivalsAt(stopId: string, routes: Route[], now: Date): Arrival[] {
  const res: Arrival[] = []
  for (const r of routes) {
    const idx = r.stopIds.indexOf(stopId)
    if (idx < 0) continue
    const last = r.stopIds.length - 1
    const seg = r.minutesBetween.map((m) => Math.max(1, m))
    const span = (from: number, to: number) => { let t = 0; for (let k = Math.min(from, to); k < Math.max(from, to); k++) t += seg[k]; return t }
    for (const v of vehiclesOn(r, now)) {
      const here = v.atStop && idx === v.stopIndex
      const ahead = v.dir === 1 ? idx >= v.nextIndex : idx <= v.nextIndex
      if (here || ahead) {
        const eta = here ? 0 : v.etaNextMin + (idx === v.nextIndex ? 0 : span(v.nextIndex, idx))
        res.push({ route: r, vehicle: v, etaMin: eta, towards: v.dir === 1 ? last : 0 })
      }
      // uç durakta dönüş: araç hattın ucuna doğru gidiyorsa, ucta yönünü değiştirir
      const terminal = idx === 0 || idx === last
      if (terminal && ahead && ((idx === last && v.dir === 1) || (idx === 0 && v.dir === -1)) && !here) {
        const eta = v.etaNextMin + (idx === v.nextIndex ? 0 : span(v.nextIndex, idx)) + 1
        const dir: 1 | -1 = idx === 0 ? 1 : -1
        const pct = Math.round(v.pct * 0.25)
        res.push({ route: r, vehicle: { ...v, dir, stopIndex: idx, nextIndex: idx === 0 ? 1 : last - 1, atStop: false, pct, onboard: Math.round(v.onboard * 0.25), crowd: crowdOf(pct) }, etaMin: eta, towards: dir === 1 ? last : 0 })
      }
    }
  }
  return res.sort((a, b) => a.etaMin - b.etaMin)
}

export interface Outlook { pctNow: number; pctDest: number; peak: number; trend: 'azalacak' | 'artacak' | 'benzer'; stopsLeft: number; etaMin: number; profile: { stopIndex: number; pct: number }[] }

/** Bir araç için, biniş durağından varış durağına kadar tahmini doluluk seyri (simüle). */
export function tripOutlook(route: Route, v: VehicleState, boardIdx: number, destIdx: number, now: Date): Outlook | null {
  const n = route.stopIds.length
  if ((v.dir === 1 && destIdx <= boardIdx) || (v.dir === -1 && destIdx >= boardIdx)) return null
  const minute = now.getHours() * 60 + now.getMinutes()
  const cap = v.capacity
  const seg = route.minutesBetween.map((m) => Math.max(1, m))
  let load = v.onboard
  const profile: { stopIndex: number; pct: number }[] = [{ stopIndex: boardIdx, pct: v.pct }]
  let eta = 0
  const step = v.dir
  for (let i = boardIdx; i !== destIdx; i += step) {
    const nx = i + step
    eta += seg[Math.min(i, nx)]
    const b = boardings(route, nx, minute, v.dir)
    load = Math.max(0, load - (b.alight === Infinity ? load : b.alight) + b.board)
    profile.push({ stopIndex: nx, pct: Math.min(100, Math.round((load / cap) * 100)) })
  }
  void n
  const pctDest = profile[profile.length - 1].pct
  const peak = Math.max(...profile.map((p) => p.pct))
  const diff = pctDest - v.pct
  return { pctNow: v.pct, pctDest, peak, trend: diff > 5 ? 'artacak' : diff < -5 ? 'azalacak' : 'benzer', stopsLeft: Math.abs(destIdx - boardIdx), etaMin: eta, profile }
}

/** Bir araç şu anki durağından hedef durağa uzaklıkça ilerliyor mu (aynı yönde, önünde mi)? */
export const vehicleHeadsTo = (v: VehicleState, idx: number): boolean => (v.dir === 1 ? idx >= v.nextIndex : idx <= v.nextIndex)
