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

## Prototip ≠ üretim
Parola özeti zayıftır, oturum yereldir, QR sahtedir, rota motoru örnek Dijkstra'dır. Üretim için: sunucu tarafı kimlik (OIDC), çift taraflı muhasebe defteri, mutabakat, hız sınırı, PostgreSQL/PostGIS, gerçek harita ve işletmeci entegrasyonları gerekir.
