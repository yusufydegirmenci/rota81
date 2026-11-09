import type { Place } from '../data/tour'

export interface Fact { baslik: string; ozet_en: string; resim_dosya: string; yazar: string; lisans: string; kaynak_url: string }
export const FACTS = (Object.values(import.meta.glob('../data/tour/facts.json', { eager: true, import: 'default' }))[0] ?? {}) as Record<string, Fact>
const IMGS = import.meta.glob('../data/tour/img/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const imgOf = (id: string) => IMGS[`../data/tour/img/${id}.jpg`]

export function Picture({ id, p }: { id: string; p: Place }) {
  const src = imgOf(id)
  const f = FACTS[id]
  if (src) return <figure className="pic"><img src={src} alt={p.title} loading="lazy" />{f && <figcaption>{f.yazar} · {f.lisans} · <a href={f.kaynak_url} target="_blank" rel="noreferrer">kaynak</a></figcaption>}</figure>
  return <div className="pic ph" aria-hidden="true"><span>{p.kind === 'food' ? 'YEMEK' : 'GEZİ'}</span><b>{p.title}</b></div>
}

