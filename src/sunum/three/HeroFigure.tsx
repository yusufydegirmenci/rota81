/** Concept illustrations supplied by the author (may be AI-generated). They never replace the 3D/technical views; they guarantee a clear picture of the goal on each slide. */
const HERO: Record<string, { file: string; alt: string }> = {
  tap: { file: 'h1-nfc-okuyucu-el', alt: 'A hand holds a blue contactless card over a black NFC reader with a rainbow LED edge' },
  'card-anatomy': { file: 'h3-kart-patlatilmis', alt: 'Exploded view of a smart card: chip module layer, bonding layer, antenna coil layer' },
  'nfc-physics': { file: 'h2-pos-kart-semasi', alt: 'POS terminal and a transparent card showing antenna coil and secure chip, energy and data via NFC' },
  arch: { file: 'h4-mimari-neon', alt: 'Layered system architecture with gateway, auth, notification, queue, databases and storage' },
  journey: { file: 'h5-durak-sahnesi', alt: 'Evening bus stop with an electric bus, mixed crowd including a wheelchair user, and a skyline' },
}
export const hasHero = (slideId: string) => slideId in HERO

export function HeroFigure({ slideId }: { slideId: string }) {
  const h = HERO[slideId]; if (!h) return null
  return (
    <details open className="sn-hero" style={{ margin: '0 0 10px' }}>
      <summary>Concept picture (the goal this scene aims for)</summary>
      <figure style={{ margin: '8px 0 0' }}>
        <img src={`${import.meta.env.BASE_URL}hedef/${h.file}.jpg`} alt={h.alt} loading="lazy" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12 }} />
        <figcaption className="sn-hint">Concept illustration (supplied by the author, may be AI-generated). Technical accuracy lives in the 3D and technical views below.</figcaption>
      </figure>
    </details>
  )
}
