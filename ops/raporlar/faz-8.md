# Faz 8 raporu: hazır turlar + rehber seçenekleri

## Ne yapıldı
- `src/sunum/tours.ts`: 4 hazır tur, mevcut `TOUR` dizisinin dilimlerinden (salt okunur): Istanbul Classics, Marmaray to İzmit, Ankara in a Day, Konya by High-Speed Rail. Yer metinleri `PLACES.en`, fotoğraf+yazar+lisans `facts.json`/`img` (yazılmaz). Her turda gezilecek yerler, yemekler, ulaşım türleri, süreler, yemek fiyatları (veri demo fiyatı); toplam süre ve bilinen maliyet.
- Rehber seçenekleri (her turda 3): Audio guide (tarayıcı sesiyle okur, yoksa metin yedeği), Local guide (insan rehber; fiyat tur verisinde olmadığı için gösterilmez), Self-paced.
- `ToursView.tsx` + yeni `tours` slaydı (`content5.ts`, 41. slayt, `rest-pay` sonrası). 40 slayt silinmedi. Kontroller: tur/rehber sekmeleri, durak noktaları, ◀ Previous / Next ▶ / Replay, durak başına fotoğraf kredisi.

## Kararlar
- Yerel ulaşım ücretleri turda yok (şehir tarifesi), uydurulmadı; yalnız tren ücretleri `TAHMİN` olarak gösterilir. Yerel rehber fiyatı uydurulmadı.
- Metin dili İngilizce; yer adları özel isim olarak Türkçe kaldı. `TOUR` adım başlıkları Türkçe olduğundan bacak (leg) metni modlardan üretildi.
- 4 tur seçildi (≥3 şartı); tur 4 tek günlük Konya hızlı tren.

## Test
- `tours.test.ts` (5 test): ≥3 tur, her birinde 3 rehber, tüm yer kimlikleri gerçek ve metinli, süre toplamı, tren ücreti tahmin etiketli, yerel ücret uydurulmamış, "Can" adı yok. Süit 91 test yeşil, tip yeşil.
- Playwright: 4 tur baştan sona gezildi (8/8/7/8 durak, boş adım 0, fotoğraf kredisi görünür), Audio guide düğmesi çıktı. Görüntü `ops/raporlar/img/faz-8-tours.png`. Konsol hatası 0.

## Eksikler
- 3D yok, 2D arayüz; rota haritası ve gerçek rehber rezervasyonu yok (SİMÜLASYON).
- Bazı duraklarda fotoğraf yok (veri thread'inde kalan fotoğraflar); "No photo available" yazılır.
