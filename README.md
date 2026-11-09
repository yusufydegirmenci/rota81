# ROTA 81 — Ortak Ulaşım Ağı (prototip)

81 ilde tek ulaşım kartı fikrinin çalışan prototipi. **Gerçek ödeme, gerçek kimlik doğrulama ve canlı veri yoktur**; her şey tarayıcıda simüle edilir.

## Çalıştırma
```
npm install
npm run dev        # geliştirme
npm test           # 35 servis testi (vitest)
npm run build      # tsc + vite build
```
Demo hesapların parolası `demo1234` (giriş ekranında hazır butonlar var).

## Mimari
- `src/domain`: tipler. `src/data`: 81 il + 6 demo ilin (Ankara, İstanbul, İzmir, Bursa, Antalya, Eskişehir) örnek verisi.
- `src/services`: Store (bellek + localStorage) → `authz` (rol/izin, il izolasyonu, denetim kaydı) → `api` (iş kuralları). Rol ve il her çağrıda kullanıcı kaydından okunur; istemciden gelmez. Arayüz yalnızca `api`yi çağırır, yani ileride gerçek sunucuyla değiştirilebilir.
- Para kuruş cinsinden tamsayıdır; yüklemeler idempotency anahtarlıdır; defter tutarlılığı kontrol edilir.
- Tarifeler sürümlüdür (taslak → onay bekliyor → onaylı/reddedildi/yerine geçti); yolculuklar kendi tarife sürümünü saklar.
- `src/pages`: vatandaş (`/vatandas`), il yönetimi (`/il`), ulusal yönetim (`/ulusal`).

## Sunum (`/#/sunum`)
42 slaytlık, dokundukça ilerleyen sunum (otomatik ilerleme yok). `src/sunum/`: slayt içeriği (`content1-5.ts`), SVG sahneler (`scenes.tsx`), sunucu penceresi (`/#/sunum/sunucu`).
- `src/sunum/three/`: yeniden kullanılabilir 3D temel (Timeline, CameraRig, SceneManager, Viewer3D, nesne tablosu `registry.ts`, modeller `models.ts`/`world.ts`) ve sahneler: kart okutma, yolculuk, restoran + ödeme, transaction replay, araba kiralama, şehir tasarımı.
- Her 3D sahnede: duraklat/devam, adım ileri-geri, tekrar, tıklayarak veya Enter ile nesne inceleme (ad + işlev + GERÇEK/TASARIM/SİMÜLASYON etiketi), gerçek↔teknik görünüm, derin açıklama paneli, kalite anahtarı. Her şey SİMÜLASYON; ödeme gerçek değildir.
- Test: `npm test` Node ≥ 22.22 ister (jsdom/undici). Eski Node'da: `npx -p node@22.22.2 node node_modules/vitest/vitest.mjs run`.
- Raporlar: `ops/raporlar/` (özet: `ÖZET.md`), görsel kaynaklar: `GORSEL_KAYNAKLAR.md`.

## Prototip ≠ üretim
Parola özeti zayıftır, oturum yereldir, QR sahtedir, rota motoru örnek Dijkstra'dır. Üretim için: sunucu tarafı kimlik (OIDC), çift taraflı muhasebe defteri, mutabakat, hız sınırı, PostgreSQL/PostGIS, gerçek harita ve işletmeci entegrasyonları gerekir.
