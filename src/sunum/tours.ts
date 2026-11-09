import { PLACES, TOUR, type TourStep } from '../data/tour'

/** Ready-made tours cut from the existing tour data (read only). Nothing here is invented: places, minutes, food prices and rail fares come from src/data/tour.ts; photos and credits from facts.json. */
interface Fact { baslik: string; resim_dosya: string; yazar: string; lisans: string }
const FACTS = (Object.values(import.meta.glob('../data/tour/facts.json', { eager: true, import: 'default' }))[0] ?? {}) as Record<string, Fact>
const IMGS = import.meta.glob('../data/tour/img/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const photoOf = (id: string) => { const f = FACTS[id]; const url = f && Object.entries(IMGS).find(([k]) => k.endsWith('/' + f.resim_dosya))?.[1]; return url && f ? { url, credit: `${f.yazar}, ${f.lisans}` } : null }

export type GuideId = 'audio' | 'local' | 'self'
export interface Guide { id: GuideId; name: string; what: string; pace: string; price: string }
export const GUIDES: Guide[] = [
  { id: 'audio', name: 'Audio guide', what: 'Reads the English text of each stop aloud (your browser voice, when available).', pace: 'You move on when you press Next.', price: 'No guide fee in this demo.' },
  { id: 'local', name: 'Local guide', what: 'A human guide meets the group at the first stop and adds stories, directions and food advice.', pace: 'The guide keeps the listed minutes per stop and adapts to the group.', price: 'Set by the guide at booking. Not part of the tour data, so no price is shown (SIMULATION).' },
  { id: 'self', name: 'Self-paced', what: 'Text and photos only. No audio, no guide.', pace: 'Entirely your own pace.', price: 'No guide fee.' },
]

export type Stop =
  | { kind: 'leg'; modes: string[]; min: number; to: string; note: string; fare?: number; est?: boolean }
  | { kind: 'sight' | 'food'; id: string; title: string; text: string; min: number; amount?: number; item?: string }
export interface ReadyTour { id: string; title: string; blurb: string; city: string; stops: Stop[]; minutes: number; foodKurus: number; railKurus: number; guides: GuideId[] }

const MODE_EN: Record<string, string> = { tram: 'Tram', metro: 'Metro', bus: 'Bus', ferry: 'Ferry', rail: 'Rail' }
const dest = (to: string | [number, number]) => (typeof to === 'string' ? PLACES[to]?.title ?? to : 'the next stop')

function toStop(s: TourStep): Stop | null {
  switch (s.k) {
    case 'topup': return null
    case 'local': return { kind: 'leg', modes: s.prefer.map((m) => MODE_EN[m]), min: s.min, to: dest(s.to), note: 'Fare: city tariff, charged by the platform (not in the tour data).' }
    case 'scenario': return { kind: 'leg', modes: [MODE_EN[s.mode]], min: s.min, to: s.to, note: `${s.operator}, ${s.from} → ${s.to}. Stations are real; time and fare are an estimate.`, fare: s.fare, est: true }
    case 'sight': return { kind: 'sight', id: s.place, title: PLACES[s.place]?.title ?? s.place, text: PLACES[s.place]?.en ?? '', min: s.min }
    case 'food': return { kind: 'food', id: s.place, title: PLACES[s.place]?.title ?? s.place, text: PLACES[s.place]?.en ?? '', min: s.min, amount: s.amount, item: `${s.item} (${s.merchant})` }
  }
}
const slice = (a: number, b: number) => TOUR.slice(a, b + 1).map(toStop).filter((x): x is Stop => !!x)
const make = (id: string, title: string, blurb: string, city: string, a: number, b: number): ReadyTour => {
  const stops = slice(a, b)
  return { id, title, blurb, city, stops, minutes: stops.reduce((n, s) => n + s.min, 0), foodKurus: stops.reduce((n, s) => n + (s.kind === 'food' ? s.amount ?? 0 : 0), 0), railKurus: stops.reduce((n, s) => n + (s.kind === 'leg' ? s.fare ?? 0 : 0), 0), guides: GUIDES.map((g) => g.id) }
}
// Index ranges refer to the existing TOUR array (day 1 Istanbul, day 2 Kocaeli, day 3 Ankara, day 4 Konya).
export const READY_TOURS: ReadyTour[] = [
  make('istanbul', 'Istanbul Classics', 'Blue Mosque, Hagia Sophia, a fish sandwich on the waterfront, Galata Tower and baklava, using tram and metro.', '34', 1, 8),
  make('kocaeli', 'Marmaray to İzmit', 'Under the Bosphorus by Marmaray, then Gebze’s historic sites and İzmit’s clock tower with local sweets and fish.', '41', 9, 16),
  make('ankara', 'Ankara in a Day', 'Metro to Anıtkabir, the museum and the castle, with Ankara tava and a simit.', '06', 18, 24),
  make('konya', 'Konya by High-Speed Rail', 'Ankara–Konya by rail, then Alâeddin Hill, the Mevlana Museum and Konya’s oven dishes.', '42', 26, 33),
]
export const tryText = (kurus: number) => `${(kurus / 100).toFixed(2)} TRY`
