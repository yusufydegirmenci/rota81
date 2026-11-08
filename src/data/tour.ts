import type { ModeId } from '../domain/types'

/** Türkiye turu senaryosu. Kaynak etiketleri: GERÇEK = OSM/İETT verisindeki durak ve hat; TAHMİN = mesafeden/örnek; SENARYO = doğrulanmamış hat, ürün fikri. */
export type Source = 'GERÇEK' | 'TAHMİN' | 'SENARYO'

export interface Place { id: string; city: string; title: string; lat: number; lon: number; tr: string; en: string; kind: 'sight' | 'food' }
export type TourStep =
  | { k: 'topup'; city: string; title: string; amount: number; note: string }
  | { k: 'local'; city: string; title: string; to: string | [number, number]; prefer: ModeId[]; min: number; note: string }
  | { k: 'scenario'; city: string; title: string; mode: ModeId; operator: string; from: string; to: string; fare: number; min: number; src: Source; note: string }
  | { k: 'sight'; city: string; place: string; min: number }
  | { k: 'food'; city: string; place: string; merchant: string; item: string; amount: number; min: number }

export const CITY_LABEL: Record<string, string> = { '34': 'İstanbul', '41': 'Kocaeli', '06': 'Ankara', '42': 'Konya' }

export const PLACES: Record<string, Place> = {
  sultanahmet: { id: 'sultanahmet', city: '34', title: 'Sultanahmet Camii', lat: 41.0054, lon: 28.9768, kind: 'sight',
    tr: "1616'da I. Ahmed için tamamlanan cami, altı minaresi ve İznik çinileriyle \"Mavi Cami\" diye anılır. Mimarı Sedefkâr Mehmed Ağa'dır; eski Roma Hipodromu'nun hemen yanındadır.",
    en: 'Completed in 1616 for Sultan Ahmed I, the "Blue Mosque" is named for its İznik tiles and has six minarets. Architect: Sedefkâr Mehmed Ağa. It stands beside the old Roman Hippodrome.' },
  ayasofya: { id: 'ayasofya', city: '34', title: 'Ayasofya', lat: 41.0086, lon: 28.9802, kind: 'sight',
    tr: "MS 537'de Justinianus döneminde katedral olarak açıldı; 1453'te camiye çevrildi, 1934'te müze oldu, 2020'de yeniden ibadete açıldı. Dev kubbesiyle mimarlık tarihinin dönüm noktalarından biridir.",
    en: 'Opened as a cathedral in 537 CE under Justinian I, converted to a mosque in 1453, a museum from 1934 and a mosque again since 2020. Its vast dome is a turning point in the history of architecture.' },
  galata: { id: 'galata', city: '34', title: 'Galata Kulesi', lat: 41.0256, lon: 28.9744, kind: 'sight',
    tr: "1348'de Cenevizliler tarafından Galata surlarının en yüksek noktası olarak yapıldı. Üst katından Haliç, Boğaz ve tarihî yarımada görülür; İstanbul'un en romantik gün batımı noktalarından biridir.",
    en: "Built by the Genoese in 1348 as the high point of the Galata walls. From the top you see the Golden Horn, the Bosphorus and the historic peninsula; it is one of the city's most romantic sunset spots." },
  'balik-ekmek': { id: 'balik-ekmek', city: '34', title: 'Balık ekmek', lat: 41.0176, lon: 28.9740, kind: 'food',
    tr: 'Eminönü rıhtımında ekmek arasında ızgara balık: İstanbul sokak yemeği klasiği. Yanına turşu suyu içilir.',
    en: 'Grilled fish in a bread roll on the Eminönü waterfront, an Istanbul street-food classic, traditionally washed down with pickle juice.' },
  baklava: { id: 'baklava', city: '34', title: 'Baklava', lat: 41.0234, lon: 28.9744, kind: 'food',
    tr: 'İnce açılmış yufka, ceviz veya antep fıstığı ve şerbetle yapılan tatlı. Karaköy tatlıcıları bu geleneği sürdürür.',
    en: 'Paper-thin layers of dough with walnuts or pistachios and syrup. Dessert shops in Karaköy keep the tradition alive.' },
  coban: { id: 'coban', city: '41', title: 'Çoban Mustafa Paşa Külliyesi', lat: 40.7985, lon: 29.4310, kind: 'sight',
    tr: "Gebze'de, 1520'lerde Çoban Mustafa Paşa'nın yaptırdığı külliye; cami, medrese, türbe ve hamam birlikte durur. Marmaray'ın son durağına yürüme mesafesindedir.",
    en: "A complex in Gebze built in the 1520s by Çoban Mustafa Pasha, with a mosque, madrasa, tomb and bath together. It is within walking distance of the Marmaray terminus." },
  hannibal: { id: 'hannibal', city: '41', title: "Hannibal'in Mezarı", lat: 40.7930, lon: 29.4120, kind: 'sight',
    tr: "Kartacalı komutan Hannibal, MÖ 183'te Libyssa'da (bugünkü Gebze) hayatına son verdi. Anıt mezar, antik çağın en ünlü komutanlarından birinin son durağını anlatır.",
    en: 'The Carthaginian general Hannibal died in 183 BCE at Libyssa (modern Gebze). The memorial tomb marks the last stop of one of antiquity\'s most famous commanders.' },
  'izmit-saat': { id: 'izmit-saat', city: '41', title: 'İzmit Saat Kulesi', lat: 40.7654, lon: 29.9408, kind: 'sight',
    tr: "Osmanlı döneminde 1901'de yapılan saat kulesi, İzmit çarşısının simgesidir. İzmit, antik çağda Nikomedya adıyla Bitinya Krallığı'nın ve Roma'nın doğu başkentlerinden biriydi.",
    en: "The clock tower, built in 1901 during the Ottoman era, is the symbol of İzmit's old bazaar. In antiquity İzmit was Nicomedia, capital of Bithynia and one of Rome's eastern capitals." },
  pismaniye: { id: 'pismaniye', city: '41', title: 'Pişmaniye', lat: 40.7662, lon: 29.9410, kind: 'food',
    tr: 'Un, tereyağı ve şekerle yapılan, tel tel yumuşak bir tatlı; Kocaeli yöresinin tanınmış lezzeti.',
    en: 'A soft, thread-like sweet made from flour, butter and sugar, a well-known specialty of the Kocaeli region.' },
  'korfez-balik': { id: 'korfez-balik', city: '41', title: 'Körfez balığı', lat: 40.7620, lon: 29.9170, kind: 'food',
    tr: 'İzmit Körfezi kıyısında balık lokantaları: mevsime göre hamsi, istavrit veya levrek. (Yerel yemek örneği.)',
    en: 'Fish restaurants on the İzmit Gulf shore serve anchovy, horse mackerel or sea bass depending on the season. (A representative local meal.)' },
  'ankara-anitkabir': { id: 'ankara-anitkabir', city: '06', title: 'Anıtkabir', lat: 39.9250, lon: 32.8369, kind: 'sight',
    tr: "Atatürk'ün anıt mezarı; mimarları Emin Onat ve Orhan Arda. 1953'te tamamlandı. Aslanlı Yol, tören alanı ve müzesiyle Cumhuriyet'in hafızasıdır.",
    en: "The mausoleum of Atatürk, by architects Emin Onat and Orhan Arda, completed in 1953. Its Lion Road, ceremonial square and museum hold the memory of the Republic." },
  'ankara-muze': { id: 'ankara-muze', city: '06', title: 'Anadolu Medeniyetleri Müzesi', lat: 39.9366, lon: 32.8627, kind: 'sight',
    tr: "Restore edilmiş 15. yüzyıl Mahmut Paşa Bedesteni ve Kurşunlu Han'da Paleolitik'ten Hitit ve Frig dönemlerine Anadolu'nun tarihini anlatır. 1997'de Avrupa'da \"Yılın Müzesi\" seçildi.",
    en: "Housed in restored 15th-century Ottoman buildings, it tells Anatolia's story from the Paleolithic to the Hittites and Phrygians. It was named European Museum of the Year in 1997." },
  'ankara-kale': { id: 'ankara-kale', city: '06', title: 'Ankara Kalesi', lat: 39.9410, lon: 32.8644, kind: 'sight',
    tr: 'Roma ve Bizans izleri taşıyan, Selçuklu ve Osmanlı döneminde onarılan kale. İç kale sokakları, eski evler ve şehir manzarası yürüyüş için güzeldir.',
    en: "A fortress with Roman and Byzantine roots, repaired under the Seljuks and Ottomans. Its lanes, old houses and city views make it a good walk." },
  'ankara-tava': { id: 'ankara-tava', city: '06', title: 'Ankara tava', lat: 39.9380, lon: 32.8620, kind: 'food',
    tr: "Kuzu eti ve mevsim sebzelerinin tavada pişirildiği Ankara yemeği. Hamamönü'nün restore evlerinde yemek, şehir hafızasıyla buluşmaktır.",
    en: "A dish of lamb and seasonal vegetables cooked in a pan. Eating it in the restored houses of Hamamönü is a meeting with the city's memory." },
  simit: { id: 'simit', city: '06', title: 'Ankara simidi', lat: 39.9208, lon: 32.8541, kind: 'food',
    tr: 'Susamlı, çıtır halkalar: Ankara\'da sabah ve ara öğünün vazgeçilmezi. Kızılay\'da seyyar tezgâhlardan alınır.',
    en: 'Crisp sesame rings, an everyday morning and snack staple in Ankara, bought from street stalls around Kızılay.' },
  mevlana: { id: 'mevlana', city: '42', title: 'Mevlana Müzesi', lat: 37.8714, lon: 32.5047, kind: 'sight',
    tr: "Mevlana Celaleddin-i Rumi'nin 1273'te vefatından sonra türbesinin yapıldığı Selçuklu dergâhı. Turkuaz çinili \"Yeşil Kubbe\", sema ve aşk anlatısıyla Konya'nın kalbidir; her yıl 17 Aralık'ta Şeb-i Arus törenleri yapılır.",
    en: "The Seljuk-era lodge where Rumi was buried after his death in 1273. Its turquoise-tiled \"Green Dome\" is the heart of Konya, a place of whirling, love and poetry; the Şeb-i Arus commemoration takes place every 17 December." },
  alaeddin: { id: 'alaeddin', city: '42', title: 'Alâeddin Tepesi ve Camii', lat: 37.8728, lon: 32.4859, kind: 'sight',
    tr: "Selçuklu başkenti Konya'nın yüksek tepesindeki Alâeddin Camii, 12. yüzyılda başlayıp 1220 dolaylarında Alâeddin Keykubad döneminde tamamlanan Anadolu Selçuklu yapısıdır. Tepe, şehrin eski kalbidir.",
    en: "On the hill at the heart of the Seljuk capital, the Alâeddin Mosque was begun in the 12th century and completed around 1220 under Alâeddin Keykubad. The hill is the old heart of Konya." },
  'ince-minare': { id: 'ince-minare', city: '42', title: 'İnce Minare Medresesi', lat: 37.8736, lon: 32.4851, kind: 'sight',
    tr: "1260'lı yıllarda Selçuklu vezirinin yaptırdığı medrese; zengin taş kapısı Anadolu taş işçiliğinin zirvesi sayılır. Bugün Taş ve Ahşap Eserler Müzesi olarak gezilir.",
    en: "A madrasa built in the 1260s by a Seljuk vizier; its richly carved stone portal is considered a peak of Anatolian stonework. Today it is the Museum of Stone and Wood Carving." },
  'etli-ekmek': { id: 'etli-ekmek', city: '42', title: 'Etli ekmek', lat: 37.8720, lon: 32.4900, kind: 'food',
    tr: 'Kayık biçimli ince hamurun üstüne kıyma ve baharat: Konya\'nın en bilinen yemeklerinden. Yanında ayran içilir.',
    en: "Boat-shaped thin dough topped with minced meat and spices, one of Konya's best-known dishes, served with ayran." },
  'firin-kebabi': { id: 'firin-kebabi', city: '42', title: 'Fırın kebabı', lat: 37.8740, lon: 32.4930, kind: 'food',
    tr: 'Odun ateşli fırında saatlerce pişen kuzu: Konya sofrasının gelenek yemeği.',
    en: "Lamb roasted for hours in a wood-fired oven, a traditional centrepiece of the Konya table." },
}

export const TOUR: TourStep[] = [
  { k: 'topup', city: '34', title: 'Yolcu kartına bakiye yükleme', amount: 500000, note: 'Turist, yabancı banka kartıyla havalimanında veya uygulamadan yükler (simülasyon).' },
  // —— GÜN 1: İSTANBUL (tramvay + metro) ——
  { k: 'local', city: '34', title: 'Tramvayla Sultanahmet\'e (T1)', to: 'sultanahmet', prefer: ['tram'], min: 25, note: 'En yakın tramvay durağı gerçek duraklardan seçilir.' },
  { k: 'sight', city: '34', place: 'sultanahmet', min: 40 },
  { k: 'sight', city: '34', place: 'ayasofya', min: 50 },
  { k: 'local', city: '34', title: 'Eminönü\'ne tramvay', to: 'balik-ekmek', prefer: ['tram', 'ferry'], min: 12, note: '' },
  { k: 'food', city: '34', place: 'balik-ekmek', merchant: 'Eminönü rıhtım tezgâhı (örnek)', item: 'Balık ekmek + ayran', amount: 17500, min: 30 },
  { k: 'local', city: '34', title: 'Metroyla Galata\'ya (M2)', to: 'galata', prefer: ['metro'], min: 20, note: 'Metro İstanbul hatları OSM\'de gerçek.' },
  { k: 'sight', city: '34', place: 'galata', min: 45 },
  { k: 'food', city: '34', place: 'baklava', merchant: 'Karaköy tatlıcısı (örnek)', item: '1 porsiyon baklava', amount: 21000, min: 20 },
  // —— GÜN 2: İSTANBUL → KOCAELİ (Marmaray) ——
  { k: 'local', city: '34', title: 'Marmaray ile Gebze yönüne', to: [41.003, 28.951], prefer: ['rail'], min: 70, note: 'Marmaray (TCDD Taşımacılık) OSM\'de gerçek hat. Kart tek geçişte İstanbul–Kocaeli arasında çalışır.' },
  { k: 'local', city: '41', title: 'Gebze\'de otobüsle Çoban Mustafa Paşa\'ya', to: 'coban', prefer: ['bus'], min: 15, note: '' },
  { k: 'sight', city: '41', place: 'coban', min: 40 },
  { k: 'sight', city: '41', place: 'hannibal', min: 30 },
  { k: 'local', city: '41', title: 'İzmit\'te tramvayla çarşıya', to: 'izmit-saat', prefer: ['tram'], min: 25, note: 'Kocaeli tramvayı (Ulaşım Park) OSM\'de gerçek.' },
  { k: 'sight', city: '41', place: 'izmit-saat', min: 30 },
  { k: 'food', city: '41', place: 'pismaniye', merchant: 'İzmit pişmaniyeci (örnek)', item: 'Pişmaniye 250 g', amount: 9000, min: 15 },
  { k: 'food', city: '41', place: 'korfez-balik', merchant: 'Körfez balık lokantası (örnek)', item: 'Balık menü', amount: 42000, min: 50 },
  // —— İZMİT → ANKARA (hızlı tren) ——
  { k: 'scenario', city: '41', title: 'Hızlı trenle Ankara\'ya', mode: 'rail', operator: 'TCDD Taşımacılık', from: 'İzmit garı', to: 'Ankara garı', fare: 60000, min: 190, src: 'TAHMİN', note: 'İstasyonlar gerçek; sefer saati ve ücret mesafeden tahmindir.' },
  // —— GÜN 3: ANKARA (metro + otobüs) ——
  { k: 'local', city: '06', title: 'Metroyla Anıtkabir yönüne', to: 'ankara-anitkabir', prefer: ['metro', 'tram'], min: 30, note: 'EGO hatları OSM\'de gerçek.' },
  { k: 'sight', city: '06', place: 'ankara-anitkabir', min: 75 },
  { k: 'local', city: '06', title: 'Otobüsle Ulus\'a, müzeye', to: 'ankara-muze', prefer: ['bus'], min: 25, note: '' },
  { k: 'sight', city: '06', place: 'ankara-muze', min: 70 },
  { k: 'sight', city: '06', place: 'ankara-kale', min: 45 },
  { k: 'food', city: '06', place: 'ankara-tava', merchant: 'Hamamönü lokantası (örnek)', item: 'Ankara tava + ayran', amount: 32000, min: 45 },
  { k: 'food', city: '06', place: 'simit', merchant: 'Kızılay simit tezgâhı (örnek)', item: 'Simit + çay', amount: 4500, min: 10 },
  // —— ANKARA → KONYA (hızlı tren) ——
  { k: 'scenario', city: '06', title: 'Hızlı trenle Konya\'ya', mode: 'rail', operator: 'TCDD Taşımacılık', from: 'Ankara garı', to: 'Konya garı', fare: 45000, min: 105, src: 'TAHMİN', note: 'Ankara–Konya yüksek hızlı tren ilişkisi; istasyonlar gerçek, saat ve ücret tahmin.' },
  // —— GÜN 4: KONYA (tramvay + otobüs) ——
  { k: 'local', city: '42', title: 'Tramvayla Alâeddin Tepesi\'ne', to: 'alaeddin', prefer: ['tram'], min: 20, note: 'Konya Büyükşehir tramvayı OSM\'de gerçek.' },
  { k: 'sight', city: '42', place: 'alaeddin', min: 40 },
  { k: 'sight', city: '42', place: 'ince-minare', min: 35 },
  { k: 'local', city: '42', title: 'Otobüsle Mevlana Müzesi\'ne', to: 'mevlana', prefer: ['bus', 'tram'], min: 15, note: '' },
  { k: 'sight', city: '42', place: 'mevlana', min: 70 },
  { k: 'food', city: '42', place: 'etli-ekmek', merchant: 'Konya etli ekmek salonu (örnek)', item: 'Etli ekmek + ayran', amount: 24000, min: 35 },
  { k: 'food', city: '42', place: 'firin-kebabi', merchant: 'Konya fırın kebabı lokantası (örnek)', item: 'Fırın kebabı', amount: 52000, min: 50 },
  // —— DÖNÜŞ (aynı yöntemlerle, aynı kart) ——
  { k: 'scenario', city: '42', title: 'Hızlı trenle Ankara\'ya dönüş', mode: 'rail', operator: 'TCDD Taşımacılık', from: 'Konya garı', to: 'Ankara garı', fare: 45000, min: 105, src: 'TAHMİN', note: 'Gidişle aynı kart, aynı bakiye.' },
  { k: 'scenario', city: '06', title: 'Hızlı trenle İzmit\'e dönüş', mode: 'rail', operator: 'TCDD Taşımacılık', from: 'Ankara garı', to: 'İzmit garı', fare: 60000, min: 190, src: 'TAHMİN', note: 'Saat ve ücret tahmin.' },
  { k: 'local', city: '41', title: 'Gebze\'ye (Marmaray başlangıcı)', to: [40.7937, 29.4307], prefer: ['rail', 'bus'], min: 45, note: 'İzmit–Gebze: Kocaeli yerel ulaşımı.' },
  { k: 'local', city: '34', title: 'Marmaray ile İstanbul\'a dönüş', to: [41.003, 28.951], prefer: ['rail'], min: 70, note: 'Marmaray Gebze–Halkalı hattı gerçek.' },
]

export const TOUR_CITIES = ['34', '41', '06', '42']
