# Faz 2 raporu: yeniden kullanılabilir 3D temel (src/sunum/three/)

## Ne yapıldı
- `timeline.ts`: Timeline (duraklat/devam, adım ileri-geri, tekrar; elle adımlama oynatmayı durdurur).
- `camera.ts`: CameraRig (yumuşak geçiş; yarıda yeni hedef verilirse mevcut konumdan devam eder, sıçrama yok).
- `registry.ts`: tek nesne tablosu (ad, işlev, PHYSICAL/DESIGN/SIMULATED etiketi) + `isPartId`.
- `models.ts`: SmartCard (gövde+anten+çip katmanlı), Validator, KartOkuyucu, Bus, POS, Karakter, Sokak, VeriAkisi (radyo / yazılım verisi / ödeme yetkisi / ücret doğrulama / mutabakat ayrı renkli şeritler, aynı anda biri).
- `SceneManager.ts` (renderer, ışık, kamera, tıklama seçimi) ve `Viewer3D.tsx` (kontroller, gerçek↔teknik görünüm, kalite anahtarı, derin açıklama paneli, nesne inceleme).
- `bench.ts` + `BenchView.tsx`: kart + okuyucu tezgahı; "card-anatomy" slaydına eklendi (eski CardScene korunuyor).
- Sunum.tsx: `.sn-3d` üzerindeki tıklama artık slaytı ilerletmiyor (inceleme tıklamasıyla çakışıyordu).
- vite.config.ts: testTimeout 60 sn (yavaş makinede 3 test 5 sn'de zaman aşımına düşüyordu).

## Test çıktısı
- `vitest`: 6 dosya, 62 test geçti (10 yeni: timeline, kamera, kayıt tablosu, modeller, veri-akışı şeritleri).
- `npm run build` (tsc -b + vite build): yeşil.
- Playwright: Step ▶ / ◀ Step / Replay / Pause↔Play / Real↔Technical çalıştı, tıklama kart antenini ve okuyucu gövdesini adlandırdı, boş alan tıklaması etiketi sıfırladı, konsol hatası 0.

## Eksikler / not
- Teknik görünüm şu an yalnızca kart katmanlarını açıyor (adım 2); diğer sahnelerde Faz 3+ kullanacak.
- Mevcut `tap` slaydının eski Stage3D'si değişmedi; Faz 3'te yeni sistemle değiştirilecek.
- Bu makinede Node 22.14 jsdom/undici ile uyumsuz: testler `npx -p node@22.22.2 node node_modules/vitest/vitest.mjs run` ile koşturuldu (`npm test` Node 22.14'te worker başlatamıyor; proje ayarı değil, ortam sorunu).
- Faz 1'in "Tur oluştur" doğrulaması bu fazda yapılmadı.
