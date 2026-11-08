import { CENTROIDS } from '../data/places'

// SİMÜLASYON: şehirler arası otobüs süresi ve ücreti, il merkezleri arasındaki kuş uçuşu mesafeden tahmin edilir.
// Gerçek sefer saati, firma ve fiyat bilgisi yoktur.
export function distanceKm(a: string, b: string): number {
  const [la1, lo1] = CENTROIDS[a] ?? [39, 35], [la2, lo2] = CENTROIDS[b] ?? [39, 35]
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(la2 - la1) / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
export interface IntercityLeg { km: number; roadKm: number; minutes: number; fareKurus: number }
export function intercity(from: string, to: string): IntercityLeg | null {
  if (from === to) return null
  const km = distanceKm(from, to)
  const roadKm = Math.round(km * 1.3) // yol, kuş uçuşundan uzundur
  const minutes = Math.round((roadKm / 90) * 60 + 20) // ortalama hız + mola ve kalkış payı
  const fareKurus = Math.round((80 + roadKm * 1.3) / 5) * 5 * 100 // tahmini TL, 5 TL'ye yuvarlanır
  return { km: Math.round(km), roadKm, minutes, fareKurus }
}
