# Düzeltme turu raporu (2026-11-09)

| Madde | Karar / sonuç | Kanıt |
|---|---|---|
| 0 Tur sayfası sunum gibi | Veri sorunu veri thread'inin CityGuide'ı ile çözüldü (nd1pet merge). `/vatandas/tur` artık varsayılan **Sunum modu**: 45 sahne, yer/yemek/foto+künye, sunumun 3D bileşenleri (`tap`, `journey`, `restaurant`, `rental`) `Viewer3D` dilimleriyle yeniden kullanılır (kopya yok); fade geçişi, ilerleme çubuğu+noktalar, ok/boşluk/PageUp-Down/Home/End, P duraklat, F tam ekran, Esc çıkış, kaydırma, "Detay" paneli, Liste görünümüne geçiş. Verisiz yer: yer tutucu + "veri yok"; sonda araba kiralama ve rehber seçeneği. | `src/pages/TourShow.tsx`, `tourshow.test.tsx`, `img/duzeltme-tur-1.png`, `-2.png`, `-liste.png` |
| 1 Görsel kalite | **KISMEN.** Poly Haven HDRI (CC0) ortam ışığı ve CesiumMan glTF (CC BY 4.0, animasyonlu) yük­leme+geri düşme ile eklendi. Kenney kenney.nl 403 verdi, Quaternius paketleri indirilemedi: insanlar/otobüs/durak/restoran hâlâ prosedürel. 5 hedef görsele "açıkça yakın" kalite SAĞLANMADI ve 3 tur karşılaştırma yapılmadı. | `assets.ts`, `GORSEL_KAYNAKLAR.md` |
| 2 TR/EN şerit | Tamam: şeritte TR\|EN, `foradas-lang` ile site dili ortak. | `welcome.test.tsx` |
| 3 Canlı kontrol | Yerel: 42 slayt × (normal, güvenli mod) gezildi, boş slayt/yatay taşma/konsol hatası 0; tur Liste modu 39 adım baştan sona, 4 şehir rehberi (5'er kart). Canlı adres aşağıda. Düğmelerin tamamı tek tek denenmedi. | playwright çalışmaları |
| 4 Mobil | 390×844 ve 768×1024: yatay kaydırma yok; dokunma hedefleri ≥44 px CSS'i eklendi; 3D'yi dokunmayla döndürme YAPILMADI. | `duzeltme-mobil-*.png` |
| 4b Güvenlik | Güvenli mod (düğme, `?safe=1`, localStorage, WebGL yok/düşük FPS'de öneri; 3D yerine metin/SVG/hero), PowerPoint tuşları (←/→, PgUp/PgDn, Space/Enter, Backspace, Home/End, F, Esc, B/., sayı+Enter), sunucu görünümü (şimdiki+sonraki slayt, süre, konuşma metni, prova), PDF (`/#/sunum/pdf`, `public/rota81-sunum.pdf`, `npm run export:pdf`), `ops/PROVA.md`, 5 yeni soru-cevap (35), İngilizce denetim. `file://` açılışı denenmedi (base './', HashRouter: olmalı). | `safe.ts`, `PrintDeck.tsx`, `prova.ts`, `ingilizce-denetim.md` |
| 0+ İçerik | Hazır tur sayısı 4 → 8 (gastronomi, tarih, kültür, tek gün). Doğa/aile/hafta sonu turları ve rehber profilleri/yorumlar YAPILMADI (veri yok; uydurma eklenmedi). | `tours.ts` |

Kalan eksikler: glTF insan/otobüs/durak modelleri, hedef görsel kıyası, kalan GUIDE verisinin tura bağlanması, rehber profilleri, mobilde 3D döndürme, slayt başı ekran görüntüsü denetimi.
