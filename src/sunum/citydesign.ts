/** Design-your-city engine for the fictional city Marisa. Pure functions. The populations and trip rates are SCENARIO inputs (design assumptions), not statistics. Map is 960 × 440 px; 1 px = 8.3 m (design scale). */
export interface District { n: string; x: number; y: number; c: string; pop: number; d: string }
export interface DStop { id: number; x: number; y: number }
export type LineMode = 'bus' | 'tram' | 'metro'
export interface DLine { id: number; name: string; color: string; mode: LineMode; headway: number; stops: number[] }

export const DISTRICTS: District[] = [
  { n: 'Old Town', x: 420, y: 200, c: '#e9c9a0', pop: 250000, d: 'Stone arcades, restaurants, museum quarter.' },
  { n: 'Harbour', x: 700, y: 330, c: '#bcd9dd', pop: 150000, d: 'Ferry pier, waterfront promenade, fish market.' },
  { n: 'Uptown', x: 220, y: 110, c: '#d4dcc0', pop: 300000, d: 'Residential hills; Derya lives here.' },
  { n: 'Campus', x: 150, y: 330, c: '#d9cfe6', pop: 100000, d: 'University and library.' },
  { n: 'Business Bay', x: 650, y: 110, c: '#cfd7de', pop: 200000, d: 'Offices and metro hub.' },
]
export const PX_M = 8.3
export const WALK_PX = 60 // full coverage within about 500 m
export const FAR_PX = 120 // no coverage beyond about 1 km
export const TRIPS_PER_PERSON_PEAK = 0.015 // design assumption: peak-hour transit trips per covered resident
export const CAPACITY: Record<LineMode, number> = { bus: 100, tram: 250, metro: 1000 } // passengers per vehicle (design values)
export const SPEED_KMH: Record<LineMode, number> = { bus: 18, tram: 22, metro: 32 }

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const cover = (d: number) => (d <= WALK_PX ? 1 : d >= FAR_PX ? 0 : 1 - (d - WALK_PX) / (FAR_PX - WALK_PX))

export interface LineResult { id: number; name: string; km: number; minutes: number; ridersPerHour: number; capacityPerHour: number; load: number; status: 'light' | 'ok' | 'overloaded' | 'incomplete' }
export interface Result {
  coveredPop: number; coverage: number; unserved: number
  districts: { n: string; pop: number; share: number }[]
  lines: LineResult[]; components: number; transferStops: number; connected: boolean
}

export function evaluate(districts: District[], stops: DStop[], lines: DLine[]): Result {
  const byId = new Map(stops.map((s) => [s.id, s]))
  const usable = lines.filter((l) => l.stops.filter((id) => byId.has(id)).length >= 2)
  const served = new Set(usable.flatMap((l) => l.stops)); const servedStops = stops.filter((s) => served.has(s.id))
  const per = districts.map((d) => ({ n: d.n, pop: d.pop, share: servedStops.reduce((m, s) => Math.max(m, cover(dist(d, s))), 0) }))
  const coveredPop = Math.round(per.reduce((n, p) => n + p.pop * p.share, 0)); const total = districts.reduce((n, d) => n + d.pop, 0)
  // each district's riders split equally among the lines that reach it
  const riders = new Map<number, number>()
  districts.forEach((d, i) => {
    const reach = usable.filter((l) => l.stops.some((id) => { const s = byId.get(id); return s && cover(dist(d, s)) > 0 }))
    reach.forEach((l) => riders.set(l.id, (riders.get(l.id) ?? 0) + (per[i].pop * per[i].share * TRIPS_PER_PERSON_PEAK) / reach.length))
  })
  const res: LineResult[] = lines.map((l) => {
    const pts = l.stops.map((id) => byId.get(id)).filter((s): s is DStop => !!s)
    const km = pts.slice(1).reduce((n, s, i) => n + dist(pts[i], s), 0) * PX_M / 1000
    const cap = (60 / Math.max(l.headway, 1)) * CAPACITY[l.mode]; const r = riders.get(l.id) ?? 0; const load = cap > 0 ? r / cap : 0
    const status = pts.length < 2 ? 'incomplete' : load > 1 ? 'overloaded' : load < 0.5 ? 'light' : 'ok'
    return { id: l.id, name: l.name, km: Math.round(km * 10) / 10, minutes: Math.round((km / SPEED_KMH[l.mode]) * 60), ridersPerHour: Math.round(r), capacityPerHour: Math.round(cap), load: Math.round(load * 100) / 100, status }
  })
  // connectivity: lines that share a stop form one component
  const parent = new Map<number, number>(); const find = (x: number): number => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!))
  usable.forEach((l) => parent.set(l.id, l.id))
  const owner = new Map<number, number>(); let transfer = 0; const count = new Map<number, number>()
  usable.forEach((l) => new Set(l.stops).forEach((sid) => { count.set(sid, (count.get(sid) ?? 0) + 1); const o = owner.get(sid); if (o === undefined) owner.set(sid, l.id); else parent.set(find(l.id), find(o)) }))
  count.forEach((c) => { if (c > 1) transfer++ })
  const components = new Set(usable.map((l) => find(l.id))).size
  return { coveredPop, coverage: total ? coveredPop / total : 0, unserved: total - coveredPop, districts: per, lines: res, components, transferStops: transfer, connected: usable.length > 0 && components === 1 }
}

/** A sample network built from Marisa's story: bus 12, tram T2, metro M1, sharing Old Town and Central Station. */
export function sampleNetwork(): { stops: DStop[]; lines: DLine[] } {
  const stops: DStop[] = [{ id: 1, x: 240, y: 140 }, { id: 2, x: 440, y: 230 }, { id: 3, x: 420, y: 320 }, { id: 4, x: 170, y: 340 }, { id: 5, x: 710, y: 350 }, { id: 6, x: 650, y: 140 }]
  return { stops, lines: [
    { id: 1, name: 'Bus 12', color: '#ef5f26', mode: 'bus', headway: 2, stops: [1, 2, 3] },
    { id: 2, name: 'Tram T2', color: '#0e7c86', mode: 'tram', headway: 3, stops: [4, 3, 5] },
    { id: 3, name: 'Metro M1', color: '#7b5cc4', mode: 'metro', headway: 4, stops: [6, 2, 3] },
  ] }
}
export const LINE_COLORS = ['#ef5f26', '#0e7c86', '#7b5cc4', '#c0392b', '#1f5fa8', '#2e8b57']
