# Faz 5 raporu: restoran 3D + POS ile ödeme

## Ne yapıldı
- `three/restaurant.ts` + `RestaurantView.tsx`: 11 adım. `rest-tour` slaydı ilk 5 adımı (dış, giriş, iç, açık ocak, menü), `rest-pay` slaydı kalan 6 adımı (hesap + POS, temas, veri, yetki, onay, mutabakat) gösterir. Mevcut SVG sahneler korundu, 3D altına eklendi.
- Sahne: taş kemerli bina + mavi çini tabela, tonoz tavan + kaburgalar, ocak (titreşen ateş + ışık), 5 masa, farklı boy/kıyafetli müşteriler, garson (yürür), kasa, sarkıt lambalar, menü panosu, komşu binalar, sokak.
- Menü fotoğrafları `src/data/tour/facts.json` + `img/` içinden OKUNUR (yazılmaz): etli-ekmek, ankara-tava, baklava; yazar+lisans adım metninde. Dosya yoksa gri yer tutucu.
- Ödeme: radyo (POS↔kart) / yazılım verisi (POS→işlemci) / yetki (işlemci→ağ→veren) / mutabakat (gece toplu, gri şerit) ayrı renkli şeritler; onay adımında veri+yetki ters yönde döner. Mutabakat yetkiden ayrı adımda, para onaydan sonra hareket eder. Her şey SİMÜLASYON etiketli, firma adı yok (generic: processor, network, issuer; "Kemer Sofrası" mevcut slaytın kurgusal adı).
- 9 yeni parça nesne tablosunda.

## Kararlar
- Önceki slaytın 14 adımlı SVG ödeme akışı değişmedi; 3D, 6 adımda aynı kavram ayrımını görsel yapar.
- Teknik görünümde adım başına etiket; teknik çizim modu yok.
- Garson ve masa POS’u tek sahnede; fatura tutarı demo (480.00 TRY, SIMULATION).

## Test
- `restaurant.test.ts` (4 test: adım alanları, radyo yalnız başına, yetki<mutabakat sırası, SIMULATION etiketi) + önceki testler. Playwright: iç mekân ve POS temas adımı görüntüleri `ops/raporlar/img/faz-5-*.png`; konsol hatası 0.

## Eksikler
- Yemek 3D modeli yok, yalnız menü fotoğrafı; garson tepsi taşımaz. İnsanlar stilize kapsül.
- POS ekranı kamera uzaktayken okunmaz (yakın kadrajda canvas çiziliyor, ayrıca doğrulanmadı).
