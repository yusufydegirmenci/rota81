import { beforeEach, describe, expect, it } from 'vitest'
import { PROVINCES } from '../data/provinces'
import { AuthError } from './authz'
import { createApi } from './api'
import { Store } from './store'

let store: Store
let api: ReturnType<typeof createApi>
let now = new Date('2026-03-01T10:00:00Z')
const clock = { now: () => now }
const login = (email: string) => api.auth.login(email, 'demo1234')
const ankara = () => login('mehmet.kaya@ankara.rota81.example')
const national = () => login('zeynep.arslan@merkez.rota81.example')
const ayse = () => login('ayse.gur@example.com')

beforeEach(() => {
  now = new Date('2026-03-01T10:00:00Z')
  store = new Store(clock, false)
  api = createApi(store)
})

const throwsCode = (fn: () => unknown, code: AuthError['code']) => {
  try { fn() } catch (e) { expect(e).toBeInstanceOf(AuthError); expect((e as AuthError).code).toBe(code); return }
  throw new Error('Hata bekleniyordu')
}

describe('81 il veri modeli', () => {
  it('81 benzersiz il içerir', () => {
    expect(PROVINCES).toHaveLength(81)
    expect(new Set(PROVINCES.map((p) => p.id)).size).toBe(81)
    expect(store.data.cities).toHaveLength(81)
    expect(PROVINCES.find((p) => p.id === '06')?.name).toBe('Ankara')
    expect(PROVINCES.find((p) => p.id === '34')?.name).toBe('İstanbul')
  })
  it('6 ilde ayrıntılı, diğer tüm illerde otomatik üretilmiş örnek ulaşım verisi var', () => {
    expect(store.data.cities.filter((c) => c.status === 'pilot')).toHaveLength(6)
    expect(store.data.cities.filter((c) => c.hasDemoData)).toHaveLength(81)
    expect(store.data.routes.filter((r) => r.cityId === '65').length).toBeGreaterThan(0)
    expect(api.catalog.routes('06').length).toBeGreaterThan(0)
    expect(api.catalog.routes('01').length).toBeGreaterThan(0)
  })
})

describe('yetkilendirme ve il izolasyonu', () => {
  it('Ankara yöneticisi kendi ilinin panosunu görür', () => {
    expect(api.city.dashboard(ankara(), '06').city.name).toBe('Ankara')
  })
  it('Ankara yöneticisi İstanbul kayıtlarını okuyamaz ve yazamaz; denetim kaydı düşer', () => {
    const s = ankara()
    throwsCode(() => api.city.dashboard(s, '34'), 'forbidden')
    throwsCode(() => api.city.addStop(s, '34', 'Deneme Durağı', 41, 29, true), 'forbidden')
    throwsCode(() => api.city.history(s, '34'), 'forbidden')
    expect(store.data.audit.filter((a) => a.result === 'denied' && a.cityId === '34').length).toBeGreaterThanOrEqual(3)
  })
  it('başka ilin hattını id ile değiştirmeye çalışmak reddedilir', () => {
    const route = api.catalog.routes('34')[0]
    throwsCode(() => api.city.setRouteStatus(ankara(), route.id, 'closed'), 'forbidden')
    expect(store.data.routes.find((r) => r.id === route.id)!.status).toBe('active')
  })
  it('istemci rolü uyduramaz: oturum yalnızca kullanıcı kimliği taşır', () => {
    const s = ayse()
    throwsCode(() => api.national.overview(s), 'forbidden')
    throwsCode(() => api.city.dashboard(s, '06'), 'forbidden')
    throwsCode(() => api.fares.decide(s, 'x', true), 'forbidden')
  })
  it('vatandaş başkasının cüzdanına erişemez (yalnızca kendi cüzdanı)', () => {
    const w = api.wallet.get(ayse())
    expect(w.wallet.userId).toBe('u-ayse')
    const murat = login('murat.gur@example.com')
    expect(api.wallet.get(murat).wallet.userId).toBe('u-murat')
  })
  it('ulusal yönetici tüm illeri okuyabilir ama il verisi yazamaz', () => {
    const s = national()
    expect(api.city.dashboard(s, '35').city.name).toBe('İzmir')
    throwsCode(() => api.city.addStop(s, '35', 'X Durağı', 38.4, 27.1, true), 'forbidden')
  })
  it('oturumsuz ve askıdaki kullanıcı reddedilir', () => {
    throwsCode(() => api.wallet.get(null), 'unauthenticated')
    const s = national()
    api.national.setUserStatus(s, 'u-ayse', 'suspended')
    throwsCode(() => api.wallet.get({ userId: 'u-ayse' }), 'unauthenticated')
    throwsCode(() => login('ayse.gur@example.com'), 'forbidden')
  })
  it('yanlış parola reddedilir', () => {
    throwsCode(() => api.auth.login('ayse.gur@example.com', 'yanlis'), 'unauthenticated')
  })
})

describe('kayıt ve doğrulama', () => {
  it('geçerli kayıt cüzdan ve kart oluşturur', () => {
    const s = api.auth.register('Selim Demir', 'selim@example.com', 'sifre1234')
    const w = api.wallet.get(s)
    expect(w.wallet.balance).toBe(0)
    expect(w.card.status).toBe('active')
  })
  it('geçersiz girdiler reddedilir', () => {
    throwsCode(() => api.auth.register('Al', 'a@b.co', 'sifre1234'), 'validation')
    throwsCode(() => api.auth.register('Selim Demir', 'gecersiz', 'sifre1234'), 'validation')
    throwsCode(() => api.auth.register('Selim Demir', 'x@y.co', 'kisa'), 'validation')
    throwsCode(() => api.auth.register('Ayşe Gür', 'ayse.gur@example.com', 'sifre1234'), 'conflict')
  })
})

describe('cüzdan', () => {
  it('yükleme bakiyeyi artırır ve tekrar eden anahtar çift işlem yapmaz (idempotency)', () => {
    const s = ayse()
    const before = api.wallet.get(s).wallet.balance
    api.wallet.topUp(s, 5000, 'k1')
    api.wallet.topUp(s, 5000, 'k1')
    expect(api.wallet.get(s).wallet.balance).toBe(before + 5000)
  })
  it('yükleme sınırlarını denetler', () => {
    const s = ayse()
    throwsCode(() => api.wallet.topUp(s, 500, 'a'), 'validation')
    throwsCode(() => api.wallet.topUp(s, 250000, 'b'), 'validation')
    throwsCode(() => api.wallet.topUp(s, 12.5 as number, 'c'), 'validation')
  })
  it('harcama, yetersiz bakiye ve dondurulmuş kartta reddedilir', () => {
    const s = ayse()
    throwsCode(() => api.wallet.spend(s, 99999999, 'x', 'big'), 'validation')
    api.wallet.setCardFrozen(s, true)
    throwsCode(() => api.wallet.spend(s, 2500, 'x', 'frz'), 'validation')
    api.wallet.setCardFrozen(s, false)
    expect(api.wallet.spend(s, 2500, 'x', 'ok').status).toBe('completed')
  })
  it('iade yalnızca bir kez yapılır ve bakiyeyi geri verir', () => {
    const s = ayse()
    const b0 = api.wallet.get(s).wallet.balance
    const tx = api.wallet.spend(s, 2500, 'test', 'sp1')
    api.wallet.refund(s, tx.id, 'rf1')
    expect(api.wallet.get(s).wallet.balance).toBe(b0)
    throwsCode(() => api.wallet.refund(s, tx.id, 'rf2'), 'conflict')
  })
  it('defter bakiyesi cüzdan bakiyesiyle tutarlı kalır', () => {
    const s = ayse()
    api.wallet.topUp(s, 3000, 't')
    const tx = api.wallet.spend(s, 1000, 'a', 's')
    api.wallet.refund(s, tx.id, 'r')
    api.wallet.spend(s, 2500, 'b', 's2')
    expect(api.wallet.ledgerBalance(s)).toBe(api.wallet.get(s).wallet.balance)
  })
})

describe('tarife iş akışı ve geçmiş', () => {
  const product = 'fp-06-metro-full'
  it('il yöneticisi taslak oluşturur, onaya gönderir; ulusal yönetici onaylar', () => {
    const m = ankara()
    const v = api.fares.createDraft(m, product, 3000, 'Zam')
    expect(v.status).toBe('draft')
    expect(api.fareFor('06', 'metro', 'full')!.amount).toBe(2500) // taslak yürürlükte değil
    api.fares.submit(m, v.id)
    api.fares.decide(national(), v.id, true)
    expect(api.fareFor('06', 'metro', 'full')!.amount).toBe(3000)
  })
  it('il yöneticisi kendi tarifesini onaylayamaz, başka ile taslak açamaz', () => {
    const m = ankara()
    const v = api.fares.createDraft(m, product, 3000, '')
    api.fares.submit(m, v.id)
    throwsCode(() => api.fares.decide(m, v.id, true), 'forbidden')
    throwsCode(() => api.fares.createDraft(m, 'fp-34-metro-full', 1000, ''), 'forbidden')
  })
  it('eski tarife sürümü korunur; eski yolculuk eski sürüme bağlı kalır', () => {
    const s = ayse()
    api.wallet.topUp(s, 10000, 'top')
    const stops = api.catalog.stops('06')
    const id = (n: string) => stops.find((x) => x.name === n)!.id
    const [j] = api.journeys.plan('06', id('Kızılay'), id('Ulus'), { modes: ['metro'] })
    const oldVid = j.legs[0].fareVersionId!
    api.journeys.complete(s, j, 'jr1')
    now = new Date('2026-03-02T10:00:00Z')
    const m = ankara(); const v = api.fares.createDraft(m, product, 4000, ''); api.fares.submit(m, v.id)
    now = new Date('2026-03-03T10:00:00Z')
    api.fares.decide(national(), v.id, true)
    const rec = store.data.journeys.find((x) => x.userId === 'u-ayse')!
    expect(rec.fareVersionIds).toContain(oldVid)
    const versions = store.data.fareVersions.filter((x) => x.productId === product)
    expect(versions.map((x) => x.status).sort()).toEqual(['approved', 'superseded'])
    expect(api.fareAt(product, new Date('2026-03-01T12:00:00Z'))!.amount).toBe(2500)
    expect(api.fareAt(product, new Date('2026-03-04T12:00:00Z'))!.amount).toBe(4000)
  })
  it('red gerekçe ister ve sürüm yürürlüğe girmez', () => {
    const m = ankara(); const v = api.fares.createDraft(m, product, 3500, ''); api.fares.submit(m, v.id)
    throwsCode(() => api.fares.decide(national(), v.id, false, ''), 'validation')
    api.fares.decide(national(), v.id, false, 'Oran yüksek')
    expect(api.fareFor('06', 'metro', 'full')!.amount).toBe(2500)
  })
  it('geçersiz tutar reddedilir', () => {
    throwsCode(() => api.fares.createDraft(ankara(), product, -5, ''), 'validation')
    throwsCode(() => api.fares.createDraft(ankara(), product, 99999999, ''), 'validation')
  })
})

describe('rota planlama', () => {
  it('alternatifleri ve aktarmaları döndürür', () => {
    const stops = api.catalog.stops('06')
    const id = (n: string) => stops.find((x) => x.name === n)!.id
    const js = api.journeys.plan('06', id('AŞTİ'), id('Batıkent'), {})
    expect(js.length).toBeGreaterThan(0)
    expect(js[0].transfers).toBeGreaterThanOrEqual(1) // AŞTİ→Ulus→Batıkent
    expect(js[0].totalFare).toBeGreaterThan(0)
    expect(js[0].totalMinutes).toBeGreaterThan(0)
  })
  it('kapalı hat rotadan çıkarılır', () => {
    const stops = api.catalog.stops('06')
    const id = (n: string) => stops.find((x) => x.name === n)!.id
    api.city.setRouteStatus(ankara(), 'rt-06-b1', 'closed')
    const js = api.journeys.plan('06', id('Kızılay'), id('Dikmen'), {})
    js.forEach((j) => j.legs.forEach((l) => expect(l.routeId).not.toBe('rt-06-b1')))
  })
  it('geçersiz giriş reddedilir', () => {
    throwsCode(() => api.journeys.plan('06', 'yok', 'yok2', {}), 'validation')
  })
  it('öğrenci tarifesi daha ucuzdur', () => {
    const stops = api.catalog.stops('06')
    const id = (n: string) => stops.find((x) => x.name === n)!.id
    const full = api.journeys.plan('06', id('Kızılay'), id('Ulus'), { modes: ['metro'] })[0]
    const stu = api.journeys.plan('06', id('Kızılay'), id('Ulus'), { modes: ['metro'], passenger: 'student' })[0]
    expect(stu.totalFare).toBeLessThan(full.totalFare)
  })
})

describe('il yönetimi doğrulamaları', () => {
  it('durak ekleme doğrulaması', () => {
    const m = ankara()
    throwsCode(() => api.city.addStop(m, '06', 'A', 39.9, 32.8, true), 'validation')
    throwsCode(() => api.city.addStop(m, '06', 'Yeni Durak', 10, 10, true), 'validation')
    throwsCode(() => api.city.addStop(m, '06', 'Kızılay', 39.9, 32.8, true), 'conflict')
    expect(api.city.addStop(m, '06', 'Yeni Durak', 39.9, 32.8, true).cityId).toBe('06')
  })
  it('hatta bağlı durak silinemez', () => {
    const kz = api.catalog.stops('06').find((x) => x.name === 'Kızılay')!
    throwsCode(() => api.city.removeStop(ankara(), kz.id), 'conflict')
  })
  it('sefer aralığı sınırları', () => {
    throwsCode(() => api.city.setHeadway(ankara(), 'rt-06-a1', 1), 'validation')
    api.city.setHeadway(ankara(), 'rt-06-a1', 8)
    expect(store.data.routes.find((r) => r.id === 'rt-06-a1')!.headwayMin).toBe(8)
  })
  it('değişiklik geçmişi ve denetim kaydı', () => {
    const m = ankara()
    api.city.publishAlert(m, '06', 'Bakım', 'Hafta sonu bakım yapılacak.', 'info')
    expect(api.city.history(m, '06').some((a) => a.action === 'alert.publish')).toBe(true)
    expect(api.national.audit(national()).length).toBeGreaterThan(0)
  })
})

describe('ulusal yönetim', () => {
  it('genel bakış 81 ili içerir', () => {
    const o = api.national.overview(national())
    expect(o.provinces).toBe(81)
    expect(o.cities).toHaveLength(81)
  })
  it('il yöneticisi atama rol ve ili günceller; yalnızca ulusal yönetici yapar', () => {
    throwsCode(() => api.national.assignCityAdmin(ankara(), 'u-ayse', '07'), 'forbidden')
    api.national.assignCityAdmin(national(), 'u-ayse', '07')
    expect(store.data.users.find((u) => u.id === 'u-ayse')).toMatchObject({ role: 'cityAdmin', cityId: '07' })
  })
  it('kendi hesabını askıya alamaz', () => {
    throwsCode(() => api.national.setUserStatus(national(), 'u-zeynep', 'suspended'), 'validation')
  })
})

describe('tarife ürünü yönetimi', () => {
  it('yeni ürün taslak olarak açılır, onaya kadar yürürlükte değildir', () => {
    const m = ankara()
    const v = api.fares.createProduct(m, '06', 'bus', 'Yaşlı', 0)
    expect(v.status).toBe('draft')
    expect(api.fareAt(v.productId, now)).toBeUndefined()
    api.fares.submit(m, v.id); api.fares.decide(national(), v.id, true)
    expect(api.fareAt(v.productId, new Date(now.getTime() + 1000))!.amount).toBe(0)
  })
  it('başka il adına ürün açılamaz', () => {
    throwsCode(() => api.fares.createProduct(ankara(), '34', 'bus', 'Test', 100), 'forbidden')
  })
})
