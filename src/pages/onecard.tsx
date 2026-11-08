import { useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import type { ModeId } from '../domain/types'
import { MODE_LABEL, TL } from '../services/api'
import { Badge, Card, PageHeader, SelectField, SimNote, Tabs } from '../ui/ui'

const MODES: ModeId[] = ['metro', 'tram', 'ferry', 'rail', 'bus']

interface Result { cityName: string; mode: ModeId; operator: string; fare: number; left: number; at: string }

/** "Tek kart" kanıtı: aynı kart ve aynı bakiye ile 81 ilin herhangi birinde okutma denemesi. */
export function OneCard() {
  const { api, session, run } = useApp()
  const cities = api.catalog.cities()
  const [cityId, setCityId] = useState('34')
  const [pax, setPax] = useState<'full' | 'student'>('full')
  const [mode, setMode] = useState<ModeId>('bus')
  const [last, setLast] = useState<Result | null>(null)
  const seq = useRef(0)
  const w = api.wallet.get(session)
  const avail = useMemo(() => MODES.filter((m) => api.fareFor(cityId, m, 'full')), [api, cityId])
  const m = avail.includes(mode) ? mode : avail[avail.length - 1]
  const spends = w.transactions.filter((t) => t.type === 'spend' && t.status === 'completed' && t.cityId)
  const used = new Set(spends.map((t) => t.cityId))
  const tap = () => {
    const fv = api.fareFor(cityId, m, pax)
    if (!fv) return
    const city = cities.find((c) => c.id === cityId)!
    const op = api.catalog.operators(cityId).find((o) => o.modes.includes(m))?.name ?? 'İşletmeci'
    seq.current += 1
    const tx = run(() => api.wallet.spend(session, fv.amount, `${city.name} · ${MODE_LABEL[m]} geçişi`, `tap-${Date.now()}-${seq.current}`, { cityId, fareVersionId: fv.id }))
    if (tx) setLast({ cityName: city.name, mode: m, operator: op, fare: fv.amount, left: api.wallet.get(session).wallet.balance, at: new Date().toLocaleTimeString('tr-TR') })
  }
  return (
    <div className="stack">
      <PageHeader title="Tek kart denemesi" sub="Aynı kart, aynı bakiye: istediğiniz ili seçin, kartı okutun." />
      <div className="grid2">
        <div className="stack">
          <SelectField label="Şehir (81 ilden biri)" value={cityId} onChange={setCityId} options={cities.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))} />
          <Tabs value={m} onChange={setMode} items={avail.map((x) => ({ id: x, label: MODE_LABEL[x] }))} />
          <SelectField label="Yolcu türü" value={pax} onChange={(v) => setPax(v as 'full' | 'student')} options={[{ value: 'full', label: 'Tam' }, { value: 'student', label: 'Öğrenci' }]} />
          <div className="row"><button className="btn accent" onClick={tap}>Kartı okut</button><span className="muted small">Ücret: <span className="money">{TL(api.fareFor(cityId, m, pax)?.amount ?? 0)}</span> · bakiye <span className="money">{TL(w.wallet.balance)}</span></span></div>
          <SimNote>Okutma simülasyondur; gerçek ödeme ve doğrulayıcı cihaz yoktur. Ücretler örnek tarifedir.</SimNote>
        </div>
        <div className="stack">
          <div className="validator" aria-live="polite">
            {last ? (<>
              <p className="eyebrow">GEÇİŞ ONAYLANDI</p>
              <h2>{last.cityName} · {MODE_LABEL[last.mode]}</h2>
              <p className="balance" style={{ fontSize: '2.6rem' }}>−{TL(last.fare)}</p>
              <p className="muted small">Kalan ortak bakiye <span className="money">{TL(last.left)}</span> · {last.at}</p>
              <div className="clearing">
                <h3>Mahsuplaşma (arka planda)</h3>
                <p className="small">{TL(last.fare)} günlük kapanışta <b>{last.operator}</b> hesabına yazılır. Yolcu yeni kart almaz, ayrı bakiye yüklemez.</p>
              </div>
            </>) : (<>
              <p className="eyebrow">BEKLİYOR</p>
              <h2>Kartı okutun</h2>
              <p className="muted">Sol taraftan bir il ve araç türü seçip “Kartı okut”a basın.</p>
            </>)}
          </div>
        </div>
      </div>
      <Card title={`Bu kartla geçtiğiniz iller · ${used.size} / 81`} right={<Badge tone={used.size >= 3 ? 'ok' : 'mute'}>{used.size >= 3 ? 'Tek kart çalışıyor' : 'Birkaç il deneyin'}</Badge>}>
        <div className="cityGrid" role="img" aria-label={`81 ilden ${used.size} tanesinde kullanıldı`}>
          {cities.map((c) => <span key={c.id} className={used.has(c.id) ? 'on' : ''} title={c.name}>{c.id}</span>)}
        </div>
      </Card>
    </div>
  )
}
