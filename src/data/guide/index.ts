import type { CityGuideData, GuideItem } from './types'

const files = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<string, CityGuideData>
const imgs = import.meta.glob('./img/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

/** plaka -> rehber verisi. Verisi olmayan il için undefined döner; arayüz "veri yok" gösterir. */
export const GUIDE: Record<string, CityGuideData> = {}
for (const [path, v] of Object.entries(files)) {
  const m = path.match(/\.\/(\d{2})\.json$/)
  if (m && v && Array.isArray(v.sights)) GUIDE[m[1]] = { ...v, culture: v.culture ?? [], foods: v.foods ?? [], streets: v.streets ?? [] }
}
export const guideImg = (plate: string, id: string): string | undefined => imgs[`./img/${plate}-${id}.jpg`]
export const guideItems = (g: CityGuideData): GuideItem[] => [...g.sights, ...g.foods, ...g.streets, ...g.culture]
export type { CityGuideData, GuideItem } from './types'
