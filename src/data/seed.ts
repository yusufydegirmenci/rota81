import { GEO } from './turkiye'
import type { AppData, FareProduct, FareVersion, ModeId, Operator, Route, Stop } from '../domain/types'
import { DEMO_CITY_IDS, PROVINCES } from './provinces'

// TÜM VERİLER SİMÜLEDİR. Hat, durak, ücret ve operatör bilgileri resmî değildir.

interface LineDef {
  code: string
  name: string
  mode: ModeId
  operator: string
  stops: [string, number][] // [durak adı, bir önceki duraktan dakika]
  headway: number
}
interface CityDef {
  lat: number
  lon: number
  operators: { name: string; modes: ModeId[] }[]
  fares: Partial<Record<ModeId, number>> // kuruş
  lines: LineDef[]
  inaccessible?: string[]
}

const slug = (s: string) =>
  s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const DEFS: Record<string, CityDef> = {
  '06': {
    lat: 39.92, lon: 32.85,
    operators: [{ name: 'Ankara Metro (örnek)', modes: ['metro'] }, { name: 'Şehir Otobüs İşletmesi (örnek)', modes: ['bus'] }],
    fares: { metro: 2500, bus: 2500 },
    lines: [
      { code: 'A1', name: 'AŞTİ – Ulus', mode: 'metro', operator: 'Ankara Metro (örnek)', stops: [['AŞTİ', 0], ['Maltepe', 4], ['Kızılay', 4], ['Sıhhiye', 3], ['Ulus', 3]], headway: 5 },
      { code: 'M1', name: 'Batıkent – Ulus', mode: 'metro', operator: 'Ankara Metro (örnek)', stops: [['Batıkent', 0], ['Ostim', 8], ['Ulus', 6]], headway: 6 },
      { code: 'B1', name: 'Kızılay – Dikmen', mode: 'bus', operator: 'Şehir Otobüs İşletmesi (örnek)', stops: [['Kızılay', 0], ['Çankaya', 8], ['Dikmen', 10]], headway: 12 },
    ],
    inaccessible: ['Ostim'],
  },
  '34': {
    lat: 41.01, lon: 28.97,
    operators: [{ name: 'İstanbul Raylı Sistem (örnek)', modes: ['metro', 'tram'] }, { name: 'Boğaz Vapurları (örnek)', modes: ['ferry'] }, { name: 'Şehir Otobüsleri (örnek)', modes: ['bus'] }],
    fares: { metro: 3000, tram: 2700, ferry: 3200, bus: 2700 },
    lines: [
      { code: 'M2', name: 'Yenikapı – Levent', mode: 'metro', operator: 'İstanbul Raylı Sistem (örnek)', stops: [['Yenikapı', 0], ['Taksim', 6], ['Şişli', 5], ['Levent', 4]], headway: 5 },
      { code: 'M4', name: 'Kadıköy – Üsküdar – Yenikapı', mode: 'metro', operator: 'İstanbul Raylı Sistem (örnek)', stops: [['Kadıköy', 0], ['Üsküdar', 6], ['Yenikapı', 9]], headway: 6 },
      { code: 'T1', name: 'Bakırköy – Kabataş', mode: 'tram', operator: 'İstanbul Raylı Sistem (örnek)', stops: [['Bakırköy', 0], ['Yenikapı', 14], ['Karaköy', 7], ['Kabataş', 5]], headway: 6 },
      { code: 'V3', name: 'Kadıköy – Karaköy', mode: 'ferry', operator: 'Boğaz Vapurları (örnek)', stops: [['Kadıköy', 0], ['Karaköy', 22]], headway: 20 },
    ],
  },
  '35': {
    lat: 38.42, lon: 27.14,
    operators: [{ name: 'İzmir Raylı Sistem (örnek)', modes: ['metro', 'tram'] }, { name: 'Körfez Vapurları (örnek)', modes: ['ferry'] }, { name: 'Ege Ulaşım A.Ş. (örnek)', modes: ['bus'] }],
    fares: { metro: 2400, tram: 2400, ferry: 2600, bus: 2400 },
    lines: [
      { code: 'M1', name: 'F. Altay – Bornova', mode: 'metro', operator: 'İzmir Raylı Sistem (örnek)', stops: [['F. Altay', 0], ['Konak', 5], ['Basmane', 4], ['Halkapınar', 5], ['Bornova', 12]], headway: 5 },
      { code: 'T1', name: 'Karşıyaka – Bostanlı', mode: 'tram', operator: 'İzmir Raylı Sistem (örnek)', stops: [['Karşıyaka', 0], ['Bostanlı', 9]], headway: 8 },
      { code: 'V1', name: 'Konak – Karşıyaka', mode: 'ferry', operator: 'Körfez Vapurları (örnek)', stops: [['Konak', 0], ['Karşıyaka', 20]], headway: 20 },
      { code: '202', name: 'Otogar – Alsancak', mode: 'bus', operator: 'Ege Ulaşım A.Ş. (örnek)', stops: [['Otogar', 0], ['Halkapınar', 14], ['Alsancak', 12]], headway: 10 },
    ],
  },
  '16': {
    lat: 40.19, lon: 29.06,
    operators: [{ name: 'Bursa Raylı Sistem (örnek)', modes: ['metro', 'tram'] }, { name: 'Bursa Otobüs (örnek)', modes: ['bus'] }],
    fares: { metro: 2500, tram: 2200, bus: 2200 },
    lines: [
      { code: 'M1', name: 'Emek – Görükle', mode: 'metro', operator: 'Bursa Raylı Sistem (örnek)', stops: [['Emek', 0], ['Kent Meydanı', 6], ['Terminal', 7], ['Görükle', 9]], headway: 7 },
      { code: 'T1', name: 'Heykel – Kent Meydanı', mode: 'tram', operator: 'Bursa Raylı Sistem (örnek)', stops: [['Heykel', 0], ['Kent Meydanı', 7]], headway: 10 },
      { code: '38', name: 'Terminal – Heykel', mode: 'bus', operator: 'Bursa Otobüs (örnek)', stops: [['Terminal', 0], ['Heykel', 16]], headway: 12 },
    ],
  },
  '07': {
    lat: 36.89, lon: 30.7,
    operators: [{ name: 'Antalya Tramvay (örnek)', modes: ['tram'] }, { name: 'Antalya Otobüs (örnek)', modes: ['bus'] }],
    fares: { tram: 2100, bus: 2300 },
    lines: [
      { code: 'T1', name: 'Müze – Meydan – Fatih', mode: 'tram', operator: 'Antalya Tramvay (örnek)', stops: [['Müze', 0], ['Meydan', 6], ['Fatih', 8]], headway: 10 },
      { code: '600', name: 'Otogar – Meydan', mode: 'bus', operator: 'Antalya Otobüs (örnek)', stops: [['Otogar', 0], ['Fatih', 12], ['Meydan', 10]], headway: 12 },
      { code: 'HVL', name: 'Havalimanı – Meydan', mode: 'bus', operator: 'Antalya Otobüs (örnek)', stops: [['Havalimanı', 0], ['Meydan', 35]], headway: 30 },
    ],
  },
  '26': {
    lat: 39.78, lon: 30.52,
    operators: [{ name: 'Eskişehir Tramvay (örnek)', modes: ['tram'] }, { name: 'Eskişehir Otobüs (örnek)', modes: ['bus'] }],
    fares: { tram: 2000, bus: 2000 },
    lines: [
      { code: 'T1', name: 'Adalar – Çarşı – Otogar', mode: 'tram', operator: 'Eskişehir Tramvay (örnek)', stops: [['Adalar', 0], ['Çarşı', 7], ['Otogar', 9]], headway: 8 },
      { code: 'T2', name: 'Osmangazi Üni. – Çarşı', mode: 'tram', operator: 'Eskişehir Tramvay (örnek)', stops: [['Osmangazi Üni.', 0], ['Espark', 8], ['Çarşı', 6]], headway: 8 },
      { code: '25', name: 'Köprübaşı – Espark', mode: 'bus', operator: 'Eskişehir Otobüs (örnek)', stops: [['Köprübaşı', 0], ['Espark', 11]], headway: 15 },
    ],
  },
}


export function createSeed(now: () => Date = () => new Date()): AppData {
  const t0 = now().toISOString()
  const data: AppData = {
    users: [], cities: [], operators: [], stops: [], routes: [], fareProducts: [], fareVersions: [],
    cards: [], wallets: [], transactions: [], alerts: [], audit: [], notifications: [], favorites: [], policies: [], integrations: [], journeys: [],
  }

  PROVINCES.forEach((p) => {
    const demo = DEMO_CITY_IDS.includes(p.id)
    data.cities.push({ id: p.id, name: p.name, region: p.region, status: demo ? 'pilot' : 'planned', population: GEO[p.id]?.p, hasDemoData: demo })
  })

  Object.entries(DEFS).forEach(([cityId, def]) => {
    const stopMap = new Map<string, Stop>()
    const opMap = new Map<string, Operator>()
    def.operators.forEach((o, i) => {
      const op: Operator = { id: `op-${cityId}-${i + 1}`, cityId, name: o.name, modes: o.modes, status: 'active' }
      opMap.set(o.name, op)
      data.operators.push(op)
    })
    let n = 0
    def.lines.forEach((l) => {
      l.stops.forEach(([name]) => {
        if (!stopMap.has(name)) {
          const k = n++
          stopMap.set(name, {
            id: `st-${cityId}-${slug(name)}`, cityId, name,
            lat: Number((def.lat + ((k * 37) % 17) * 0.004 - 0.03).toFixed(4)),
            lon: Number((def.lon + ((k * 53) % 19) * 0.005 - 0.04).toFixed(4)),
            accessible: !(def.inaccessible ?? []).includes(name),
          })
        }
      })
    })
    data.stops.push(...stopMap.values())
    def.lines.forEach((l) => {
      const route: Route = {
        id: `rt-${cityId}-${slug(l.code)}`, cityId, operatorId: opMap.get(l.operator)!.id, code: l.code, name: l.name, mode: l.mode,
        stopIds: l.stops.map(([s]) => stopMap.get(s)!.id), minutesBetween: l.stops.slice(1).map(([, m]) => m), headwayMin: l.headway, status: 'active',
      }
      data.routes.push(route)
    })
    ;(Object.entries(def.fares) as [ModeId, number][]).forEach(([mode, amount]) => {
      ;[['full', 'Tam', amount], ['student', 'Öğrenci', Math.round(amount / 2)]].forEach(([k, label, amt]) => {
        const product: FareProduct = { id: `fp-${cityId}-${mode}-${k}`, cityId, mode, name: String(label) }
        const v: FareVersion = {
          id: `fv-${product.id}-1`, productId: product.id, cityId, version: 1, amount: Number(amt),
          validFrom: '2026-01-01T00:00:00.000Z', validTo: null, status: 'approved', createdBy: 'u-zeynep', createdAt: '2025-12-15T09:00:00.000Z', note: 'Başlangıç tarifesi (simüle)',
        }
        data.fareProducts.push(product)
        data.fareVersions.push(v)
      })
    })
  })

  const admins: [string, string, string, string][] = [
    ['u-mehmet', 'Mehmet Kaya', 'mehmet.kaya@ankara.rota81.example', '06'],
    ['u-deniz', 'Deniz Arda', 'deniz.arda@istanbul.rota81.example', '34'],
    ['u-selin', 'Selin Aydın', 'selin.aydin@izmir.rota81.example', '35'],
    ['u-elif', 'Elif Sarı', 'elif.sari@bursa.rota81.example', '16'],
    ['u-hasan', 'Hasan Öz', 'hasan.oz@antalya.rota81.example', '07'],
    ['u-derya', 'Derya Koç', 'derya.koc@eskisehir.rota81.example', '26'],
  ]
  admins.forEach(([id, name, email, cityId]) => {
    data.users.push({ id, name, email, role: 'cityAdmin', cityId, status: 'active', createdAt: t0 })
    data.cities.find((c) => c.id === cityId)!.adminUserId = id
  })
  data.users.push({ id: 'u-zeynep', name: 'Zeynep Arslan', email: 'zeynep.arslan@merkez.rota81.example', role: 'nationalAdmin', status: 'active', createdAt: t0 })
  data.users.push({ id: 'u-ayse', name: 'Ayşe Gür', email: 'ayse.gur@example.com', role: 'citizen', status: 'active', createdAt: t0 })
  data.users.push({ id: 'u-murat', name: 'Murat Gür', email: 'murat.gur@example.com', role: 'citizen', status: 'active', createdAt: t0 })

  ;['u-ayse', 'u-murat'].forEach((uid, i) => {
    data.cards.push({ id: `card-${uid}`, userId: uid, number: `R81 ${4821 + i * 1111} 0073 ${6190 - i * 321}`, status: 'active', createdAt: t0 })
    data.wallets.push({ id: `wal-${uid}`, userId: uid, balance: 0 })
  })
  const w = data.wallets[0]
  w.balance = 20000
  data.transactions.push({ id: 'tx-seed-1', walletId: w.id, type: 'topup', amount: 20000, status: 'completed', description: 'İlk yükleme (simülasyon)', idempotencyKey: 'seed-1', createdAt: t0, simulated: true })
  data.wallets[1].balance = 10000
  data.transactions.push({ id: 'tx-seed-2', walletId: data.wallets[1].id, type: 'topup', amount: 10000, status: 'completed', description: 'İlk yükleme (simülasyon)', idempotencyKey: 'seed-2', createdAt: t0, simulated: true })

  data.alerts.push(
    { id: 'al-1', cityId: '35', title: 'Hat bakımı', body: 'M1 hattında hafta sonu bazı seferler 10 dakika gecikebilir. (örnek duyuru)', severity: 'warning', createdAt: t0, createdBy: 'u-selin' },
    { id: 'al-2', cityId: '06', title: 'Yeni tarife dönemi', body: 'Tarife değişiklikleri onay sürecinden geçer. (örnek duyuru)', severity: 'info', createdAt: t0, createdBy: 'u-mehmet' },
  )
  data.policies.push(
    { id: 'pol-1', title: 'Tarife yetkisi', body: 'Her il kendi tarifesini belirler; değişiklikler ulusal onaydan geçer.', updatedAt: t0 },
    { id: 'pol-2', title: 'Veri gizliliği', body: 'Kişisel veri asgari düzeyde işlenir; yönetim kayıtlarında kimlik numarası tutulmaz.', updatedAt: t0 },
    { id: 'pol-3', title: 'Afet durumunda ulaşım', body: 'Ücretsiz ulaşım kararı yalnızca yetkili kurumlarca verilir.', updatedAt: t0 },
  )
  data.integrations.push(
    { id: 'int-gtfs', name: 'GTFS içe aktarma', status: 'planned', note: 'Belediyelerden statik hat verisi alınacak. Henüz uygulanmadı.' },
    { id: 'int-rt', name: 'GTFS-Realtime araç konumu', status: 'planned', note: 'Canlı araç verisi yok; ekranlardaki konumlar simülasyondur.' },
    { id: 'int-pay', name: 'Ödeme sağlayıcı (lisanslı kuruluş)', status: 'unavailable', note: 'Gerçek ödeme yapılmaz. Yüklemeler simülasyondur.' },
    { id: 'int-oidc', name: 'Kimlik doğrulama (OAuth 2.0 / OIDC)', status: 'planned', note: 'Prototipte demo oturum kullanılır.' },
    { id: 'int-map', name: 'Harita sağlayıcı', status: 'simulated', note: 'Şematik harita; değiştirilebilir arayüz arkasında.' },
    { id: 'int-route', name: 'Rota hesaplama servisi', status: 'simulated', note: 'Yerel Dijkstra; ileride gerçek servis takılır.' },
  )
  return data
}
