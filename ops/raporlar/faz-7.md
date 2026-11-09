# Faz 7 raporu: araba kiralama (kartla, SİMÜLASYON)

## Ne yapıldı
- `three/rental.ts`: saf ücret motoru `quote(minutes)`: açma ücreti + dakika ücreti (dakika yukarı yuvarlanır), günlük tavan, ön provizyon (hold) iadesi ve ek yetki; demo tarife `TARIFF` (Rental Operator A, TRY). Açıklama metinleri 9 adım.
- `three/rentalScene.ts` + `RentalView.tsx`: 9 adım 3D: bul (kuşbakışı, 4 elektrikli araç, tabela) → seç (fiyat listesi HUD) → kartla kilit aç (kapı okuyucusu, alan halkaları, radyo) → arka uç (operatör platformu + veren, ön provizyon 50.00) → kilit açık (farlar yanıp söner, LED yeşil) → sür (araç döngüde gerçekten gider, sayaç dakika+ücret) → iade (aynı yuvaya park, tekrar tap) → nihai tahsilat (ücret yakalanır, kalan hold serbest) → mutabakat (gri şerit). 
- `usecases` slaydına eklendi (mevcut içerik korundu).
- Şeritler ayrı: radyo, yazılım verisi, yetki, mutabakat.

## Kararlar
- Slayt olarak mevcut "usecases" seçildi (genişleme/yeni kullanım alanları).
- Araç dönüş yolu yuvada biter, böylece iade adımında ışınlanma yok; araç bir yay boyunca yürür.
- Tüm tutarlar demo ve "SIMULATION" etiketli; firma adı yalnız "Rental Operator A".

## Test
- `rental.test.ts` (5 test): ücret hesabı, hold iadesi, tavan + ek yetki, monotonluk, SIMULATION/jenerik ad. Süit yeşil, tip kontrolü yeşil. Playwright: sürüş adımı sayaçla doğrulandı (26 dk = 10.10 TRY). Görüntü `ops/raporlar/img/faz-7-drive.png`. Konsol hatası 0.

## Eksikler
- Araba stilize kutu; iç mekân yok, kapı açılmaz. Harita arayüzü yok (kuşbakışı sahne).
- Gündüz sürüşünde hasar/yakıt/ceza akışları kapsam dışı.
