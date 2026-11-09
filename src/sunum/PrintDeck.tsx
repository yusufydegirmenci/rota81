import { SLIDES } from './slides'
import { heroOf } from './three/HeroFigure'

/** One slide per page, static pictures instead of 3D, so the deck can be saved as a PDF and opened with no internet (Print, then Save as PDF). */
export default function PrintDeck() {
  return (
    <div lang="en" className="pd">
      <div className="pd-bar"><button className="btn accent" onClick={() => window.print()}>Print / Save as PDF</button> <a href="#/sunum">Back to the presentation</a></div>
      {SLIDES.map((s, i) => {
        const h = heroOf(s.id)
        return (
          <section key={s.id} className="pd-page">
            <p className="pd-ch">{s.chapter} · {i + 1} / {SLIDES.length}</p>
            <h1>{s.title}</h1>
            <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            {h && <img src={`${import.meta.env.BASE_URL}hedef/${h.file}.jpg`} alt={h.alt} />}
            <h2>Spoken script</h2>
            <p>{s.script.join(' ')}</p>
          </section>
        )
      })}
    </div>
  )
}
