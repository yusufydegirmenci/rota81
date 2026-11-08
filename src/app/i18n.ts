// Hafif çeviri katmanı: ekrandaki Türkçe metinleri çalışma anında İngilizceye çevirir.
// Kapsam: menüler, giriş/açılış, ana sayfa, cüzdan, rota, canlı doluluk, gezi. Çevrilmeyen metin Türkçe kalır.
export type Lang = 'tr' | 'en'
const EN: Record<string, string> = {
  'Ana sayfa': 'Home', 'Kartım': 'My card', 'Cüzdan': 'Wallet', 'Rota': 'Route', 'Gezi planla': 'Plan a trip', 'Bakiye yükle': 'Top up',
  'İşlem geçmişi': 'History', 'Canlı doluluk': 'Live crowding', 'Hatlar': 'Lines', 'Duraklar': 'Stops', 'İller ve ilçeler': 'Provinces & districts',
  'Bildirimler': 'Notifications', 'Kart yönetimi': 'Card settings', 'Profilim': 'Profile', 'Güvenlik': 'Security', 'Kullanım kılavuzu': 'User guide', 'Yardım': 'Help',
  'Çıkış': 'Sign out', 'Giriş yap': 'Sign in', 'Hesap oluştur': 'Create account', 'Vatandaş': 'Citizen',
  '81 il, bir kart,': '81 provinces, one card,', 'hep beraber.': 'all together.',
  'Ulaşım kartınızı ve bakiyenizi katılımcı şehirlerde tek hesaptan kullanın. Her şehir kendi tarifesini ve işletmecisini korur.': 'Use your transit card and balance in every participating city with one account. Each city keeps its own fares and operators.',
  'Ortak ulaşım ağı · prototip': 'Shared transit network · prototype',
  'Vatandaşlar için': 'For citizens', 'İl yönetimleri için': 'For city administrations', 'Ulusal yönetim için': 'For national administration',
  'Tekrar hoş geldiniz': 'Welcome back', 'Hesabınıza giriş yapın.': 'Sign in to your account.', 'E-posta': 'Email', 'Parola': 'Password', 'Göster': 'Show', 'Gizle': 'Hide',
  'Hızlı demo girişi': 'Quick demo sign-in', 'Hesap özetiniz': 'Your account summary', 'Güncel bakiye': 'Current balance', 'Hızlı bakiye yükleme': 'Quick top-up',
  'Son işlemler': 'Recent transactions', 'Favori rotalar': 'Favorite routes', 'Tümü': 'All', 'Rota planla': 'Plan route', 'Kartımı göster': 'Show my card',
  'AKTİF': 'ACTIVE', 'DONDURULDU': 'FROZEN', 'Gezi': 'Trip', 'Kılavuz': 'Guide', 'Hemen yükle': 'Top up now',
  'Canlı araç doluluğu': 'Live vehicle crowding', 'Hat görünümü': 'Line view', 'Durak panosu': 'Stop board', 'Yolculuğum': 'My ride',
  'Test saati': 'Test time', 'Şehir': 'City', 'Hat': 'Line', 'Şu an': 'Now', 'Hatta araç': 'Vehicles on line', 'Ortalama doluluk': 'Average crowding', 'Kart okutma (simüle)': 'Card taps (simulated)',
  'Kartımı okuttum': 'I tapped my card', 'Bindiğim durak': 'Boarding stop', 'İneceğim durak': 'Exit stop', 'Kartı okut (simülasyon)': 'Tap card (simulation)', 'Takibi bitir': 'Stop tracking',
  'Bulunduğum durak': 'My stop', 'Gideceğim durak (isteğe bağlı)': 'Destination stop (optional)', 'Seçilmedi': 'Not selected', 'Önerilen': 'Recommended',
  'Rahat': 'Comfortable', 'Orta': 'Moderate', 'Kalabalık': 'Crowded', 'Çok dolu': 'Very full', 'Yaklaşan araç yok': 'No approaching vehicles', 'Durakta': 'At stop',
  'Gezi planla ': 'Plan a trip', 'Bulunduğum il': 'My province', 'Konumum (en yakın durak)': 'My location (nearest stop)', 'Gideceğim il': 'Destination province',
  'Toplam süre': 'Total time', 'Tahmini ücret': 'Estimated fare', 'Adım': 'Steps', 'Canlı takibi başlat': 'Start live tracking',
  'Yolculuk planla': 'Plan a journey', 'Yolculuk bul': 'Find journey', 'Nereden': 'From', 'Nereye': 'To', 'Yolcu türü': 'Passenger type', 'Tam': 'Full', 'Öğrenci': 'Student',
  'En hızlı': 'Fastest', 'En az aktarma': 'Fewest transfers', 'En ekonomik': 'Cheapest', 'Ayrıntılar': 'Details',
  'Bakiye yükle ': 'Top up', 'Devam et': 'Continue', 'Onayla': 'Confirm', 'Tutar (₺)': 'Amount (₺)',
  'Prototip simülasyonu:': 'Prototype simulation:', 'Prototip:': 'Prototype:', 'Hesabınız yok mu?': 'No account?',
  'Merhaba': 'Hello', 'Pano': 'Dashboard', 'İstatistikler': 'Statistics', 'Filo doluluğu': 'Fleet crowding', 'İşleticiler': 'Operators', 'Tarifeler ve onay': 'Fares & approval',
  'Sefer çizelgesi': 'Timetables', 'Duyurular': 'Announcements', 'Raporlar': 'Reports', 'Değişiklik geçmişi': 'Change history',
  'tüm veriler simülasyondur; gerçek ödeme, canlı araç verisi ve belediye entegrasyonu yoktur.': 'all data is simulated; there are no real payments, live vehicle data or municipal integrations.',
  'Bu ekran simülasyondur: kart okutma sayıları ve araç konumları saate ve hatta göre üretilir. Gerçek sistemde araç konum (AVL) ve kart okutucu (validatör) verisinden hesaplanır.': 'This screen is a simulation: card taps and vehicle positions are generated from the time of day and the line. In a real system they come from vehicle location (AVL) and card validator data.',
  'Gezilecek yerler örnek listedir. Şehirler arası süre ve ücret kuş uçuşu mesafeden tahmin edilir; gerçek sefer, firma ve fiyat verisi yoktur. Konumunuz simüle edilir (gerçek konum izni istenmez).': 'Places are a sample list. Intercity time and fare are estimated from straight-line distance; there is no real timetable, operator or price data. Your location is simulated (no real location permission is requested).',
  'Başka şehre günübirlik gezi: otogardan gezilecek yere, canlı takipli': 'Day trip to another city: from the bus station to the sights, with live tracking',
  'Bakiyeniz düşük': 'Your balance is low', 'Hızlı ve kalabalık olmayan yolu bul': 'Find the fast, uncrowded way',
  'Hesabınız yok mu? ': 'No account? ', 'Hesap oluşturun': 'Create one', 'Giriş yap ': 'Sign in',
  'Araç': 'Vehicle', 'gidiş': 'outbound', 'dönüş': 'return', 'Bu hatta şu an araç yok': 'No vehicles on this line right now', 'Şu an sefer yok': 'No service right now',
  'Bu iki durak arasındaki seçenekler': 'Options between these two stops', 'Aktarmalı seçenek:': 'Option with transfers:',
  'Hedefe ulaştınız': 'You have arrived',
  'Kullanım kılavuzu ': 'User guide', 'Hızlı başlangıç': 'Quick start', 'Sayfalar ne işe yarar?': 'What does each page do?', 'Sık sorulanlar': 'FAQ',
  '81 il': '81 provinces', 'İl yöneticileri': 'City administrators', 'Kullanıcılar': 'Users', 'Roller': 'Roles', 'Politikalar': 'Policies', 'Tarife onayı': 'Fare approval',
  'Denetim': 'Audit', 'Entegrasyonlar': 'Integrations', 'Yapılandırma': 'Configuration', 'Genel bakış': 'Overview',
  'Hatlar ve güzergâhlar': 'Lines & routes', 'Ara': 'Search', 'Bölge': 'Region', 'Nüfus': 'Population', 'İlçe': 'District', 'Plaka': 'Plate', 'İl': 'Province',
}
// Değişken içeren kalıplar
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Merhaba, (.+)$/, (m) => `Hello, ${m[1]}`],
  [/^Bakiyeniz düşük \((.+)\)\.$/, (m) => `Your balance is low (${m[1]}).`],
  [/^Güncelleme: (.+) · her 5 sn$/, (m) => `Updated: ${m[1]} · every 5 s`],
  [/^(\d+) il, (\d+) ilçe$/, (m) => `${m[1]} provinces, ${m[2]} districts`],
  [/^(\d+) dk$/, (m) => `${m[1]} min`],
  [/^(\d+) sa (\d+) dk$/, (m) => `${m[1]} h ${m[2]} min`],
  [/^(.+) durağına yaklaşanlar$/, (m) => `Approaching ${m[1]}`],
  [/^(.+) yönü$/, (m) => `towards ${m[1]}`],
]
export const translate = (s: string, lang: Lang): string => {
  if (lang === 'tr') return s
  const t = s.trim()
  if (!t) return s
  const hit = EN[t]
  if (hit) return s.replace(t, hit)
  for (const [re, f] of RULES) { const m = t.match(re); if (m) return s.replace(t, f(m)) }
  return s
}

const orig = new WeakMap<Node, string>()
const origAttr = new WeakMap<Element, Record<string, string>>()
const ATTRS = ['aria-label', 'placeholder', 'title']
function apply(root: Node, lang: Lang): void {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let n: Node | null = root
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const cur = n.nodeValue ?? ''
      if (lang === 'en') {
        const prev = orig.get(n)
        if (!(prev !== undefined && translate(prev, 'en') === cur)) {
          const out = translate(cur, 'en')
          if (out !== cur) { orig.set(n, cur); n.nodeValue = out } else orig.delete(n)
        }
      } else if (orig.has(n)) { n.nodeValue = orig.get(n)!; orig.delete(n) }
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element
      for (const a of ATTRS) {
        const v = el.getAttribute(a)
        if (v === null) continue
        const store = origAttr.get(el) ?? {}
        if (lang === 'en') { const b = store[a] ?? v; const out = translate(b, 'en'); if (out !== v) { store[a] = b; origAttr.set(el, store); el.setAttribute(a, out) } }
        else if (store[a] !== undefined) { el.setAttribute(a, store[a]); delete store[a] }
      }
    }
    n = w.nextNode()
  }
}
let obs: MutationObserver | null = null
export function setLanguage(lang: Lang): void {
  try { localStorage.setItem('foradas-lang', lang) } catch { /* yoksay */ }
  document.documentElement.lang = lang
  obs?.disconnect()
  apply(document.body, lang)
  if (lang === 'en') {
    obs = new MutationObserver((muts) => {
      obs?.disconnect()
      for (const m of muts) { if (m.type === 'characterData') apply(m.target, 'en'); m.addedNodes.forEach((x) => apply(x, 'en')); if (m.type === 'attributes') apply(m.target, 'en') }
      obs?.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS })
    })
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS })
  }
}
export const savedLang = (): Lang => { try { return localStorage.getItem('foradas-lang') === 'en' ? 'en' : 'tr' } catch { return 'tr' } }
