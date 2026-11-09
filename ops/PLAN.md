# ROTA81 Sunum — Faz Planı
Kurallar: faz-N dalı (claude/faz-N), önceki işi bozma, her faz sonunda `npm test` + `npm run build` geçmeli, simülasyonlar "SİMÜLASYON" etiketli, uydurma firma/istatistik yok, örnek verilerde "Can" adı yok. Tasarım ilkesi: her animasyonun amacı, her kameranın anlatımı, her nesnenin işlevi olsun; teknik doğruluk > gösteriş. Sunucu: duraklat/devam, adım ileri-geri, tekrar, bileşen inceleme, gerçek↔teknik görünüm.
Bilgi: src/sunum/ var (slayt motoru, 40 slayt, SVG sahneleri, Stage3D.tsx three.js kamera görünümü). DOKUNMA: src/data/tour, src/data/real, docs/VERI_* (PC oturumu yazıyor).

| Faz | İçerik |
|---|---|
| 1 | ✅ "Tur oluştur" donması (5.000 TL yükleme sınırı) eski thread'de düzeltildi; Faz 2 başında 1 dakikalık doğrulama |
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
