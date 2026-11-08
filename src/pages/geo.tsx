import { useState } from 'react'
import { PROVINCES } from '../data/provinces'
import { OSM_INDEX } from '../data/seed'
import { DISTRICT_COUNT, GEO } from '../data/turkiye'
import { Badge, Card, DataTable, Modal, PageHeader, SelectField, SimNote, Stat } from '../ui/ui'

const nf = (n: number) => n.toLocaleString('tr-TR')

/** Bir ilin künyesi ve ilçe listesi. */
export function CityInfo({ id }: { id: string }) {
  const g = GEO[id]
  if (!g) return <p className="muted">Bu il için coğrafi veri yok.</p>
  const total = g.d.reduce((s, x) => s + x[1], 0)
  const info = OSM_INDEX.il[id]
  const missing = new Set((id === '34' ? [] : info?.ilceDurakYok ?? []).map((x) => x.toLocaleLowerCase('tr')))
  return (
    <div className="stack">
      <div className="grid3">
        <Stat label="Nüfus (il)" value={nf(g.p)} />
        <Stat label="Yüzölçümü" value={`${nf(g.a)} km²`} />
        <Stat label="İlçe" value={g.d.length} />
      </div>
      <p className="small"><b>Ulaşım verisi:</b> {id === '34' ? 'İETT açık verisi (10.350 durak, 747 hat) ve OpenStreetMap raylı sistem/vapur.' : `OpenStreetMap: ${info?.durak ?? 0} durak, ${info?.hat ?? 0} hat.`} Gerçek veri olmayan yer, uydurma yerine "veri yok" olarak işaretlenir.</p>
      <p className="small muted">Bölge: {g.r} · Alan kodu: {g.t} · İlçe nüfus toplamı: {nf(total)}</p>
      {g.i.lastIndexOf('.') > 40 && <p>{g.i.slice(0, g.i.lastIndexOf('.') + 1)}</p>}
      <DataTable rows={g.d} rowKey={(d) => d[0]} searchText={(d) => d[0]} pageSize={8}
        cols={[
          { key: 'n', label: 'İlçe', render: (d) => <b>{d[0]}</b>, sort: (a, b) => a[0].localeCompare(b[0], 'tr') },
          { key: 'v', label: 'Durak verisi', render: (d) => (missing.has(d[0].toLocaleLowerCase('tr')) ? <Badge tone="warn">veri yok</Badge> : <Badge tone="ok">var</Badge>) },
          { key: 'p', label: 'Nüfus', render: (d) => nf(d[1]), sort: (a, b) => a[1] - b[1] },
          { key: 's', label: 'İl içindeki pay', render: (d) => `%${((d[1] / total) * 100).toFixed(1).replace('.', ',')}` },
        ]} />
    </div>
  )
}

/** Tüm iller ve ilçeler rehberi (vatandaş sayfası). */
export function CitiesGuide() {
  const [region, setRegion] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const regions = Array.from(new Set(Object.values(GEO).map((g) => g.r))).sort((a, b) => a.localeCompare(b, 'tr'))
  const rows = PROVINCES.filter((p) => region === 'all' || GEO[p.id]?.r === region)
  return (
    <div className="stack">
      <PageHeader title="İller ve ilçeler" sub={`${PROVINCES.length} il, ${DISTRICT_COUNT} ilçe`} />
      <SimNote>Nüfus ve yüzölçümü açık bir veri setinden alınmıştır (TÜİK'e dayalı) ve resmî kayıtlarla tek tek doğrulanmamıştır. Durak ve hatlar gerçek kaynaklardan gelir (İstanbul: İETT, diğer iller: OpenStreetMap); verisi olmayan ilçe "veri yok" olarak gösterilir.</SimNote>
      <Card>
        <DataTable rows={rows} rowKey={(p) => p.id} searchText={(p) => `${p.name} ${p.id} ${GEO[p.id]?.d.map((d) => d[0]).join(' ')}`} pageSize={12}
          filters={<div style={{ minWidth: 190 }}><SelectField label="Bölge" value={region} onChange={setRegion} options={[{ value: 'all', label: 'Tümü' }, ...regions.map((r) => ({ value: r, label: r }))]} /></div>}
          cols={[
            { key: 'id', label: 'Plaka', render: (p) => p.id, sort: (a, b) => a.id.localeCompare(b.id) },
            { key: 'n', label: 'İl', render: (p) => <b>{p.name}</b>, sort: (a, b) => a.name.localeCompare(b.name, 'tr') },
            { key: 'r', label: 'Bölge', render: (p) => GEO[p.id]?.r },
            { key: 'pop', label: 'Nüfus', render: (p) => nf(GEO[p.id]?.p ?? 0), sort: (a, b) => (GEO[a.id]?.p ?? 0) - (GEO[b.id]?.p ?? 0) },
            { key: 'd', label: 'İlçe', render: (p) => <Badge tone="mute">{GEO[p.id]?.d.length}</Badge>, sort: (a, b) => (GEO[a.id]?.d.length ?? 0) - (GEO[b.id]?.d.length ?? 0) },
            { key: 'x', label: '', render: (p) => <button className="btn sm" onClick={() => setOpen(p.id)}>İlçeler</button> },
          ]} />
      </Card>
      <Modal open={!!open} title={open ? `${open} · ${PROVINCES.find((p) => p.id === open)?.name}` : ''} onClose={() => setOpen(null)}>
        {open && <CityInfo id={open} />}
      </Modal>
    </div>
  )
}
