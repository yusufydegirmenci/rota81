# Faz 6 raporu: transaction replay lab

## Ne yapıldı
- `three/replay.ts`: saf iz motoru (`buildTrace(fault)`): bir dokunuş → sıralı adımlar (reader → gateway → auth → fare → NoSQL → SQL ledger → queue → bildirim/arşiv → yanıt). 5 senaryo: normal, düşük bakiye, çevrimdışı (yerel kural + store-and-forward), kara liste (ağdan önce reddet), zaman aşımı (aynı anahtarla güvenli yeniden deneme, tek tahsilat).
- `three/replayScene.ts` + `ReplayLab.tsx`: H4 neon mimari görünüm: koyu ızgara zemin, 3 katman (Application / Business logic / Data) + tel kafes çekirdek, 9 tıklanabilir servis kutusu, akan ışıklı çizgi, aktif düğüm parlar, hata düğümü kırmızı, uyarı amber. Adım ileri/geri, duraklat, tekrar (Viewer3D kontrolleri), hata seçici sekmeler.
- Gerçek görünüm: sade adlar ("Front door", "Price calculator"); Teknik görünüm: gerçek bileşen adları, ve tıklanınca her bileşenin hata durumu ("Failure: ...").
- `lab` slaydına eklendi (mevcut hata laboratuvarı korundu), h4 hero görseli de orada.

## Kararlar
- Geri oynatma = adım dizinini azaltmak (iz saf veridir, durum yok), bu yüzden her yönde tutarlı.
- Ledger yazımı yalnız `ledgerCommit` adımında; testler düşük bakiye/kara listede 0, diğerlerinde tam 1 olduğunu doğrular.
- Sahne hata değişince yeniden kurulur (anahtar `key={fault}`), bu 100 ms'den kısa.

## Test
- `replay.test.ts` (6 test) yeşil; tüm süit yeşil, tip kontrolü yeşil. Playwright: düşük bakiye ve zaman aşımı oynatıldı, geri adım ve görünüm anahtarı denendi. Görüntüler `ops/raporlar/img/faz-6-*.png`. Konsol hatası 0.

## Eksikler
- Ayrı "fiziksel" gerçek görünüm (otobüs/okuyucu fotoğrafı) yok; gerçek görünüm yalnız sade adlandırma.
- Tek hata aynı anda enjekte edilir (birleşik hata yok).
