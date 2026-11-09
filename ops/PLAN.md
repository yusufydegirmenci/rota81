# ROTA81 Sunum — Faz Planı
Kurallar: faz-N dalı (claude/faz-N), önceki işi bozma, her faz sonunda `npm test` + `npm run build` geçmeli, simülasyonlar "SİMÜLASYON" etiketli, uydurma firma/istatistik yok, örnek verilerde "Can" adı yok. Tasarım ilkesi: her animasyonun amacı, her kameranın anlatımı, her nesnenin işlevi olsun; teknik doğruluk > gösteriş. Sunucu: duraklat/devam, adım ileri-geri, tekrar, bileşen inceleme, gerçek↔teknik görünüm.
Bilgi: src/sunum/ (slayt motoru, 40 slayt, kart okutma/restoran/teknisyen sahneleri 2.5D SVG) zaten var; Three.js yok.

| Faz | İçerik |
|---|---|
| 1 | "Tur oluştur" donmasını bul ve düzelt (src/pages/tour.tsx), geri bildirim + test |
| 2 | Three.js temeli + yeniden kullanılabilir 3D: kart, okuyucu, validatör, kamera/kontrol sistemi |
| 3 | Kart okutma 3D sahnesi: alan→anten→çip→okuma→backend→onay, adım adım, duraklatılabilir |
| 4 | Sokak, otobüs, ana karakter, mahalle; kamera geçişleri (kart→çip→anten→validatör→backend) |
| 5 | Restoran 3D (dış, giriş, iç, menü, personel, POS, ödeme→finansal akış) |
| 6 | Transaction replay lab + gerçek/teknik görünüm anahtarı |
| 7 | Araba kiralama (kartla, SİMÜLASYON, 3D/animasyon) |
| 8 | Hazır turlar + rehber seçenekleri (çoklu, eksiksiz, gezilecek yer/yemek/araç) |
| 9 | Design-your-city + harita modları (2D/3D/ilçe/sokak/ulaşım) |
| 10 | Genel QA, erişilebilirlik, performans, main'e alma + canlı (Pages) |
Durak/hat verisi (OSM/EGO/ESHOT/GTFS, ilçe başı ≥40 durak araştırması): eski ROTA thread'inde.
