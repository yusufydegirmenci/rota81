import { useMemo, useState } from 'react'
import { PROVINCES } from '../data/provinces'
import { GUIDE, guideImg, type GuideItem } from '../data/guide'
import { Card, PageHeader, SimNote } from '../ui/ui'

function Item({ plate, it, lang }: { plate: string; it: GuideItem; lang: 'tr' | 'en' }) {
  const src = guideImg(plate, it.id)
  return (
    <article className="gcard">
      {src ? <figure className="pic"><img src={src} alt={it.title_en} loading="lazy" />{it.image && <figcaption>{it.image.author} · {it.image.licence} · <a href={it.image.source_url} target="_blank" rel="noreferrer">kaynak</a></figcaption>}</figure>
        : <div className="pic ph" aria-hidden="true"><span>FOTOĞRAF YOK</span><b>{lang === 'en' ? it.title_en : it.title_tr}</b></div>}
      <div>
        <h4>{lang === 'en' ? it.title_en : it.title_tr}{it.local_name ? <span className="muted small"> · {it.local_name}</span> : null}</h4>
        <p className="small">{lang === 'en' ? it.text_en : it.text_tr}</p>
        {it.ingredients_en && <p className="small"><b>{lang === 'en' ? 'Ingredients' : 'İçindekiler'}:</b> {it.ingredients_en}</p>}
        {it.where_en && <p className="small"><b>{lang === 'en' ? 'Where' : 'Nerede'}:</b> {it.where_en}</p>}
        {(lang === 'en' ? it.culture_en : it.culture_tr) && <p className="small"><b>{lang === 'en' ? 'Culture' : 'Kültür'}:</b> {lang === 'en' ? it.culture_en : it.culture_tr}</p>}
        <p className="small muted">Metin kaynağı: <a href={it.source_url} target="_blank" rel="noreferrer">{it.text_licence}</a></p>
      </div>
    </article>
  )
}

/** Şehir rehberi: gerçek yerler, yemekler, kültür notları ve sokaklar; kaynak ve lisansla. Verisi olmayan ilde güvenli "veri yok". */
export function CityGuidePage() {
  const withData = useMemo(() => PROVINCES.filter((p) => GUIDE[p.id]), [])
  const [plate, setPlate] = useState(withData[0]?.id ?? '34')
  const [lang, setLang] = useState<'tr' | 'en'>('en')
  const g = GUIDE[plate]
  return (
    <div className="stack">
      <PageHeader title="Şehir rehberi" sub="Gezilecek yerler, yerel yemekler, kültür ve sokaklar. Metinler ve fotoğraflar lisanslı kaynaklardan; her birinin künyesi yanında." actions={
        <div className="row"><div className="langsw" role="group" aria-label="Dil"><button className={lang === 'tr' ? 'on' : ''} onClick={() => setLang('tr')}>TR</button><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button></div>
          <select aria-label="İl" value={plate} onChange={(e) => setPlate(e.target.value)}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.name}{GUIDE[p.id] ? '' : ' (veri yok)'}</option>)}</select></div>} />
      {!g ? <Card title="Bu il için rehber verisi henüz yok"><p className="muted">Uydurma içerik eklenmez. Veri, serbest lisanslı kaynaklardan toplandıkça burada görünür.</p></Card> : (
        <>
          <p>{lang === 'en' ? g.intro_en : g.intro_tr}</p>
          {g.culture.length > 0 && <section className="guide"><h3>{lang === 'en' ? 'Culture and customs' : 'Kültür ve gelenekler'}</h3><div className="ggrid">{g.culture.map((c) => <Item key={c.id} plate={plate} it={c} lang={lang} />)}</div></section>}
          <section className="guide"><h3>{lang === 'en' ? 'Places to see' : 'Gezilecek yerler'}</h3><div className="ggrid">{g.sights.map((c) => <Item key={c.id} plate={plate} it={c} lang={lang} />)}</div></section>
          {g.foods.length > 0 && <section className="guide"><h3>{lang === 'en' ? 'Local food' : 'Yerel yemekler'}</h3><div className="ggrid">{g.foods.map((c) => <Item key={c.id} plate={plate} it={c} lang={lang} />)}</div></section>}
          {g.streets.length > 0 && <section className="guide"><h3>{lang === 'en' ? 'Streets and neighbourhoods' : 'Sokaklar ve semtler'}</h3><div className="ggrid">{g.streets.map((c) => <Item key={c.id} plate={plate} it={c} lang={lang} />)}</div></section>}
        </>
      )}
      <SimNote>Rehber içeriği bilgi amaçlıdır; yemek fiyatları ve işletme bilgileri örnektir. Fotoğraflar Wikimedia Commons gibi serbest lisanslı kaynaklardandır.</SimNote>
    </div>
  )
}
