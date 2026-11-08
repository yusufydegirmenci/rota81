import type { ModeId, Stop } from '../domain/types'
import { MODE_LABEL, TL } from './api'
import type { createApi } from './api'
import { intercity } from './intercity'

type Api = ReturnType<typeof createApi>

export interface Step { n: number; title: string; detail: string; state: 'ok' | 'warn' | 'fail' | 'info' }
export interface TapInput { cityId: string; stopId: string; routeId?: string; passenger: 'full' | 'student'; asLeg?: string }
export interface TapResult { ok: boolean; steps: Step[]; paid: number; fare: number; discount: number; cityId: string; cityName: string; operator: string; mode: ModeId | null; left: number }

/** ÖRNEK POLİTİKA (parametre): aynı hesapla bu süre içinde yapılan ikinci biniş indirimli sayılır. */
export const POLICY = { transferWindowMin: 90, transferDiscountPct: 50 }

const SOURCE = (s: Stop) => (s.real ? (s.cityId === '34' && /^\d{6}$/.test(s.code) ? 'İETT açık verisi' : 'OpenStreetMap') : 'örnek veri')

/**
 * Bir kart okutmanın A'dan Z'ye işlenişi. Her adım gerçekten çalıştırılır; arayüz sonucu adım adım gösterir.
 * Üretimde adım 1-4 doğrulayıcı/sunucu, 5-8 ödeme ve defter servisi, 9-10 mahsuplaşma servisidir.
 */
export function processTap(api: Api, session: Parameters<Api['wallet']['get']>[0], input: TapInput, key: string): TapResult {
  const steps: Step[] = []
  const add = (title: string, detail: string, state: Step['state'] = 'ok') => { steps.push({ n: steps.length + 1, title, detail, state }) }
  const w = api.wallet.get(session)
  const cityName = api.catalog.cities().find((c) => c.id === input.cityId)?.name ?? input.cityId
  const stop = api.catalog.stops(input.cityId).find((s) => s.id === input.stopId)
  const base: TapResult = { ok: false, steps, paid: 0, fare: 0, discount: 0, cityId: input.cityId, cityName, operator: '', mode: null, left: w.wallet.balance }
  const fail = (title: string, detail: string): TapResult => { add(title, detail, 'fail'); return base }

  // 1. Kart
  if (w.card.status !== 'active') return fail('Kart okunur', `Kart ${w.card.number} dondurulmuş. Geçiş reddedildi; para düşülmedi.`)
  add('Kart okunur', `Kart ${w.card.number} aktif. Kart yalnızca hesabı tanıtır; para kartta değil ortak cüzdandadır.`)

  // 2. Konum -> il
  if (!stop) return fail('Konum çözülür', 'Durak bulunamadı.')
  add('Durak ve il belirlenir', `${stop.name} (${stop.code}) → ${cityName} (plaka ${input.cityId}). Kaynak: ${SOURCE(stop)}. Doğrulayıcı hangi ilde olduğunu kendi tanımından bilir; kullanıcı il seçmez.`)

  // 3. Hat / işletmeci / mod
  const routes = api.catalog.routes(input.cityId).filter((r) => r.stopIds.includes(stop.id))
  const route = routes.find((r) => r.id === input.routeId) ?? routes[0]
  const mode: ModeId = route?.mode ?? 'bus'
  const op = route ? api.catalog.operators(input.cityId).find((o) => o.id === route.operatorId)?.name ?? 'İşletmeci' : api.catalog.operators(input.cityId)[0]?.name ?? 'İşletmeci'
  add('Hat ve işletmeci', route ? `${MODE_LABEL[route.mode]} hattı ${route.code} · ${route.name}. İşletmeci: ${op}.` : `Bu durakta kayıtlı hat yok; ${MODE_LABEL[mode]} varsayıldı. İşletmeci: ${op}.`, route ? 'ok' : 'warn')

  // 4. Tarife
  const fv = api.fareFor(input.cityId, mode, input.passenger)
  if (!fv) return fail('Tarife', `${cityName} için ${MODE_LABEL[mode]} tarifesi tanımlı değil.`)
  add('Şehir tarifesi', `${cityName} belediyesinin yürürlükteki ${MODE_LABEL[mode]} tarifesi (${input.passenger === 'student' ? 'öğrenci' : 'tam'}, sürüm ${fv.version}): ${TL(fv.amount)}. Her il kendi tarifesini belirler; ulusal katman onaylar.`, 'info')

  // 5. Aktarma
  const recent = w.transactions.filter((t) => t.type === 'spend' && t.status === 'completed').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const mins = recent ? (Date.now() - new Date(recent.createdAt).getTime()) / 60000 : Infinity
  const discount = mins <= POLICY.transferWindowMin ? Math.round((fv.amount * POLICY.transferDiscountPct) / 100) : 0
  add('Aktarma kuralı', discount ? `Son geçişten ${Math.max(1, Math.round(mins))} dk geçti (pencere ${POLICY.transferWindowMin} dk): %${POLICY.transferDiscountPct} indirim = −${TL(discount)}. (Örnek politika parametresi; platform ayarlarından değişir.)` : `Son ${POLICY.transferWindowMin} dk içinde geçiş yok; indirim uygulanmaz.`, discount ? 'ok' : 'info')
  const pay = fv.amount - discount

  // 6. Bakiye
  if (w.wallet.balance < pay) return { ...fail('Bakiye kontrolü', `Gerekli ${TL(pay)}, bakiye ${TL(w.wallet.balance)}. Yetersiz bakiye: geçiş reddedildi.`), fare: fv.amount, discount }
  add('Bakiye kontrolü', `Gerekli ${TL(pay)}, mevcut ${TL(w.wallet.balance)}: yeterli. Bakiye aynıdır, hangi ilde olursanız olun tek cüzdandan düşer.`)

  // 7. Defter
  const tx = api.wallet.spend(session, pay, `${cityName} · ${MODE_LABEL[mode]} geçişi${route ? ` (${route.code})` : ''}`, key, { cityId: input.cityId, fareVersionId: fv.id })
  add('Defter kaydı', `İşlem ${tx.id.slice(0, 14)}… yazıldı. Aynı anahtar ikinci kez gelirse tekrar düşülmez (idempotency). Para kuruş cinsinden tamsayıdır.`)

  // 8. Mahsuplaşma
  add('Mahsuplaşma (gün sonu)', `${TL(pay)}, günlük kapanışta ${op} (${cityName}) alacağına yazılır. Yolcu hiçbir şey yapmaz; işletmeciler kendi gelirini görür ve ödeme lisanslı ödeme kuruluşu üzerinden aktarılır.`, 'info')

  // 9. Bildirim
  const left = api.wallet.get(session).wallet.balance
  add('Makbuz ve bildirim', `Kalan bakiye ${TL(left)}. Bakiye ${TL(3000)} altına inerse uygulama uyarır.`)
  return { ok: true, steps, paid: pay, fare: fv.amount, discount, cityId: input.cityId, cityName, operator: op, mode, left }
}

export interface IntercityPlan { from: string; to: string; km: number; minutes: number; fare: number }
export function planIntercity(from: string, to: string): IntercityPlan | null {
  const i = intercity(from, to)
  return i ? { from, to, km: i.roadKm, minutes: i.minutes, fare: i.fareKurus } : null
}

export interface LegTrace { title: string; result: TapResult }
/** İller arası yolculuk: çıkış ilinde yerel biniş, iller arası bacak (mesafeden tahmin), varış ilinde yerel biniş. Her bacak kendi ilinin tarifesiyle ve kendi işletmecisine yazılır. */
export function processIntercity(api: Api, session: Parameters<Api['wallet']['get']>[0], from: string, to: string, passenger: 'full' | 'student', key: string): { legs: LegTrace[]; total: number; ok: boolean } {
  const pick = (cityId: string) => {
    const stops = api.catalog.stops(cityId)
    const withRoute = api.catalog.routes(cityId).find((r) => r.real) ?? api.catalog.routes(cityId)[0]
    const stop = withRoute ? stops.find((s) => s.id === withRoute.stopIds[0]) : stops[0]
    return stop ? { cityId, stopId: stop.id, routeId: withRoute?.id, passenger } : null
  }
  const legs: LegTrace[] = []
  const a = pick(from), b = pick(to)
  const plan = planIntercity(from, to)
  const name = (id: string) => api.catalog.cities().find((c) => c.id === id)?.name ?? id
  let ok = true, total = 0
  const run = (title: string, inp: TapInput | null, cityId: string, k: string) => {
    if (!inp) {
      legs.push({ title, result: { ok: false, steps: [{ n: 1, title: 'Durak bulunamadı', detail: `${name(cityId)} için kayıtlı durak yok; bu ilde yerel biniş atlandı (uydurma durak eklenmez).`, state: 'warn' }], paid: 0, fare: 0, discount: 0, cityId, cityName: name(cityId), operator: '', mode: null, left: api.wallet.get(session).wallet.balance } })
      return
    }
    const r = processTap(api, session, inp, k); legs.push({ title, result: r }); total += r.paid; if (!r.ok) ok = false
  }
  if (plan && api.wallet.get(session).wallet.balance < plan.fare + 6000) {
    const bal = api.wallet.get(session).wallet.balance
    legs.push({ title: 'Yolculuk başlamadan kontrol', result: { ok: false, steps: [{ n: 1, title: 'Bakiye ön kontrolü', detail: `Üç bacağın tahmini toplamı ${TL(plan.fare + 6000)}, bakiye ${TL(bal)}. Yetersiz olduğu için yolculuk hiç başlatılmadı ve para düşülmedi. Önce "Bakiye yükle" ile yükleyin.`, state: 'fail' }], paid: 0, fare: 0, discount: 0, cityId: from, cityName: name(from), operator: '', mode: null, left: bal } })
    return { legs, total: 0, ok: false }
  }
  run(`1. bacak · ${name(from)} içi`, a, from, `${key}-a`)
  if (ok && plan) {
    const w = api.wallet.get(session)
    const steps: Step[] = []
    const add = (title: string, detail: string, state: Step['state'] = 'ok') => { steps.push({ n: steps.length + 1, title, detail, state }) }
    add('İller arası bacak', `${name(from)} → ${name(to)}: yaklaşık ${plan.km} km, ${Math.floor(plan.minutes / 60)} sa ${plan.minutes % 60} dk (kuş uçuşu mesafeden TAHMİN; gerçek sefer ve firma verisi yok).`, 'warn')
    add('Tarife kuralı', `Şehirlerarası ücret, çıkış ilinin belediyesi/otogar işletmecisi ve ulusal onaylı mesafe tarifesine göre hesaplanır: ${TL(plan.fare)} (tahmin).`, 'info')
    if (w.wallet.balance < plan.fare) { add('Bakiye kontrolü', `Gerekli ${TL(plan.fare)}, bakiye ${TL(w.wallet.balance)}: yetersiz.`, 'fail'); ok = false } else {
      api.wallet.spend(session, plan.fare, `${name(from)} → ${name(to)} şehirlerarası`, `${key}-x`, { cityId: from })
      add('Defter ve mahsuplaşma', `${TL(plan.fare)} düşüldü; gün sonunda çıkış ilindeki şehirlerarası işletmeci alacağına yazılır. Aynı kart, aynı bakiye.`)
      total += plan.fare
    }
    legs.push({ title: `2. bacak · ${name(from)} → ${name(to)}`, result: { ok, steps, paid: plan.fare, fare: plan.fare, discount: 0, cityId: from, cityName: name(from), operator: 'Şehirlerarası işletmeci (tahmin)', mode: null, left: api.wallet.get(session).wallet.balance } })
  }
  if (ok) run(`3. bacak · ${name(to)} içi`, b, to, `${key}-b`)
  return { legs, total, ok }
}
