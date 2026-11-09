# Faz 3 raporu: kart okutma 3D (tap sahnesi) + görsel yükseltme

## Ne yapıldı
- `three/tap.ts` + `TapView.tsx`: 11 adım (sokak → validatör → alan → anten enerjisi → çip → radyo → yazılım verisi → ücret doğrulama → yetki + mutabakat → yanıt/onay → gerçek dünya). Her adımın kamerası, şeridi ve açıklaması ayrı; yanıt adımında led+ekran yeşil ve bip. Slayt `tap` içinde yeni "3D lab" sekmesi; eski "3D camera (classic)" korundu.
- Görsel: ACES, ortam haritası (RoomEnvironment), yumuşak gölge, bloom (yalnız alan/led/şerit), PBR+clearcoat, yumuşak köşeli mavi metalik kart, mat siyah pahlı okuyucu + NFC yazısı/daire, hareketli RGB led şeridi, kablo, el (stilize), X-ray kart (bakır bobin + altın çip pedi), dokulu cepheli sokak, ağaç, lamba, durak levhası, gradyan gökyüzü, arka uç cam bloklar (tıklanabilir).
- 5 şerit rengi ayrı: radyo (cyan), yazılım verisi (turuncu), ücret doğrulama (sarı), yetki (mor), mutabakat (gri).
- Hoş geldin şeridi: `src/config/welcome.ts` + `src/ui/WelcomeBanner.tsx` (Ayşe notu, bir kez, kapatılır, /sunum'da gizli).
- Hero görseller: `public/hedef/*.jpg` (küçültülmüş), `HeroFigure` ile tap, card-anatomy, nfc-physics, arch, journey slaytlarında "Concept illustration" etiketiyle.

## Kararlar (belirsizlikte kendim seçtim)
- Hoş geldin şeridi dili: ortak dil anahtarı bulunmadı, TR gösteriliyor; EN metin config'te hazır.
- Serbest lisanslı glTF/HDRI indirmedim (ağ + lisans doğrulama maliyeti); prosedürel zengin geometri kullandım. Hero görseller kullanıcı sağlamı, 3D'nin yedeği. Bkz. GORSEL_KAYNAKLAR.md.
- Teknik görünümde kart glassy olur, etiketler açılır; ayrı "teknik çizim" render modu yapılmadı.
- Canvas'a tıklama slaytı ilerletmez (inceleme ile çakışıyordu).

## Test
- vitest: 7 dosya; tap adım tutarlılığı (radyo yalnız alan açıkken, radyo tek başına, yanıt backend'den sonra) dahil. build yeşil.
- Playwright: 3D lab açılır, adımlar ilerler, X-ray adımında bobin+çip görünür, şerit/hero yüklenir, konsol hatası 0.
- Görüntüler: `ops/raporlar/img/faz-3-*.png`.

## Eksikler
- H1 kadar fotogerçekçi değil (doku/foto yok, stilize el, düşük poligon insan/otobüs). Gerçek glTF varlıklar sonraki iyileştirme.
- Okuyucu üstünde HTML overlay etiket çizgisi yok (sprite etiketler var).
