# Sunum Faz 2-10: özet

Dal: `claude/project-thread-qm3gnw` (canlıya: `claude/project-thread-nd1pet` ile merge). Deste 42 slayt (40 eski + `tours` + `design-city`), eski özellik ve slayt silinmedi.

| Faz | Sonuç | Rapor |
|---|---|---|
| 2 | 3D temel: Timeline, CameraRig, nesne tablosu, modeller, Viewer3D | faz-2.md |
| 3 | Kart okutma 3D lab (11 adım, 5 renk şeridi), görsel yükseltme, hoş geldin şeridi, hero görseller | faz-3.md |
| 4 | Tek karakter sürekli yolculuk (14 adım), arıza + teknisyen kurtarması, erişilebilirlik | faz-4.md |
| 5 | Restoran 3D + POS ödemesi (yetki ≠ mutabakat), menü fotoğrafları lisanslı | faz-5.md |
| 6 | Transaction replay lab (5 hata senaryosu, neon mimari, ileri/geri) | faz-6.md |
| 7 | Araba kiralama (SİMÜLASYON, ücret motoru, hold/capture/release) | faz-7.md |
| 8 | 4 hazır tur + 3 rehber seçeneği | faz-8.md |
| 9 | Design-your-city, 6 harita modu, gerçek veri salt okunur | faz-9.md |
| 10 | QA, erişilebilirlik, performans, canlıya alma | bu dosya |

## Faz 10: QA sonucu
- Playwright: 42 slaytın tamamı ileri tuşuyla gezildi, çalışma zamanı hatası 0 (window error/unhandledrejection/console.error kancalı). Her 3D sahne ayrıca ilgili fazda elle denendi.
- `vitest` 97 test + `npm run build` yeşil (Node 22.22 ile; bu makinedeki Node 22.14 jsdom/undici ile uyumsuz, ortam sorunu).
- Erişilebilirlik: 3D alanı klavye odaklanır, Enter nesneler arasında dolaşır ve ad+işlevi okur (`role=status`); tüm kontroller gerçek düğme; `prefers-reduced-motion` açıkken kamera uçmaz, kesme yapar; sesli rehber/bip isteğe bağlı; renkler açık/koyu zeminde okunur (etiketler koyu zeminde beyaz).
- Performans: kalite anahtarı (Auto/Low/High) her görüntüleyicide; Auto, ilk 2 sn ortalaması 24 fps altındaysa bloom ve gölgeyi kapatır; düşük kalite DPR 1, gölge/bloom/ortam haritası kapalı.

## Bilinen sınırlar (dürüst liste)
- Görsel çıta (ops/hedef h1-h5) tam yakalanmadı: sahneler prosedürel, stilize insanlar; serbest lisanslı glTF/HDRI eklenmedi (GORSEL_KAYNAKLAR.md). Hero görseller yedek olarak slaytlarda "Concept illustration" etiketiyle.
- Hoş geldin şeridi TR; ortak dil anahtarı olmadığından EN metin config'te hazır ama kullanılmıyor.
- Ekran görüntüleri yalnızca bu makinenin yazılım WebGL'iyle alındı, mobil gerçek cihazda denenmedi.
- Teknik görünüm "teknik çizim" render modu değil; etiketler, X-ray ve katman ayrımı.

## Canlı
Adres: https://yusufydegirmenci.github.io/rota81/#/sunum (Pages, nd1pet d6adeb0). Actions: build (npm test + build) ve deploy başarılı. Canlıda 3D lab ve 42 slayt doğrulandı.

## Düzeltme turu
Ayrıntı: duzeltme.md. Görsel kalite çıtası (hedef görseller) KISMEN karşılandı; dürüst eksikler orada.
