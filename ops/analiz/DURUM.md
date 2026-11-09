# ROTA 81 / FORADAŞ: ortak durum notu (iki thread için)

Son güncelleme: 2026-11-09 (Türkiye tur + veri thread'i). Kural: ortak bilgi buraya yazılır, aynı dosyalara iki thread aynı anda dokunmaz.

## Thread sahipliği
| Alan | Sahip | Dal |
|---|---|---|
| Veri, fotoğraf, durak/hat verisi, tur sayfası (`src/pages/tour.tsx`, `src/data/tour*`, `src/data/real/**`, `scripts/**`, `docs/VERI_*`) | "Araştır ve prototiple tek ulaşım kartı" thread'i | `claude/project-thread-nd1pet` |
| Sunum modülü (`src/sunum/**`, `/sunum` rotası, 3D, araba kiralama, hazır turlar) | "Build cinematic 3D smart city presentation" thread'i | `claude/project-thread-qm3gnw` (nd1pet'ten başlatılmalı) |

Sunum dalı, `claude/project-thread-nd1pet` üzerinden açılsın: `git fetch origin claude/project-thread-nd1pet && git checkout -B claude/project-thread-qm3gnw origin/claude/project-thread-nd1pet`. Sunum 1. aşaması (40 slayt, 3D kamera) zaten nd1pet'te canlıda.

## Veri sözleşmesi (sunum thread'inin kullanabileceği)
- Gezilecek yer/yemek metni ve resim künyesi: `src/data/tour/facts.json`, şema `{id: {baslik, ozet_en, resim_dosya, yazar, lisans, kaynak_url}}`.
- Resimler: `src/data/tour/img/<id>.jpg` (en çok 1200 px, serbest lisanslı; Vite ile satır içine gömülür, `assetsInlineLimit` 200000).
- Resmi olmayan id için arayüz yer tutucu ("ph") gösterir; çökmez. Lisanssız resim eklenmez.
- Durak/hat verisi: `src/data/real/osm/{01..81}.json` (`{s:[[ad,lat,lon,ilçe,kod,modHarfi]], l:[[ref,ad,mod,işletmeci,[durak indeksleri],[from,to]?]]}`) ve `src/data/real/istanbul.json`. Verisi olmayan ilçede "veri yok" yazılır; uydurma durak/hat eklenmez.
- Rota dayanıklılığı: `findBoarding` durak yoksa `null` döner; `processIntercity` durak yoksa "Durak bulunamadı" adımı ekler. Test: `src/services/robust.test.ts`.
- Kaynak ve lisans kayıtları: `docs/VERI_KAYNAKLARI.md`, sonuç raporu `docs/VERI_RAPORU.md` (PC oturumu yazıyor).

## Sunum tarafı (özet)
`src/sunum/`: `Sunum.tsx` (modlar, sunucu penceresi `/sunum/sunucu`), `scenes.tsx` (SVG sahneler), `Stage3D.tsx` (three.js), `content1-4.ts` (slaytlar), `terms.ts`, `qa.ts`, `slides.ts`. Fotoğraflar için sunum tarafı `facts.json` okuyabilir ama dosyayı değiştirmez; yeni kayıt istenirse veri thread'ine yazılır.

## Açık işler (veri thread'i)
- PC oturumu: kalan 12 fotoğraf, ilçe durak genişletmesi, EGO/ESHOT vb. açık veri (çalışıyor).
- Her şehir için yer/yemek/sokak fotoğrafı genişletmesi (sunum için restoran yemek fotoğrafları dahil).

## Sunum fazları (sunum thread'i)
Plan: ops/PLAN.md, aktif prompt: ops/promptlar/SIRADAKI.md. Faz 1 (tur donması) veri thread'inde bitti. Sıradaki: Faz 2 (yeniden kullanılabilir 3D bileşenler, src/sunum/three/). Sunum dalı nd1pet tabanını içeriyor (merge edildi). facts.json'a sunum yazmaz; yeni kayıt gerekirse veri thread'ine yazılır.

- 2026-11-09 Sunum thread: Faz 2-10 tek prompt ops/promptlar/HEPSI.md (kullanıcı PC'de akıtacak). Canlı: nd1pet'e merge (main yok).

- 2026-11-09 Sunum Faz 2 TAMAM: src/sunum/three/ (Timeline, CameraRig, PARTS tablosu, modeller, Viewer3D); rapor ops/raporlar/faz-2.md. Siradaki: Faz 3.

- 2026-11-09 Sunum thread: görsel kalite çıtası eklendi (HEPSI.md, 5 hedef görsel: NFC okuyucu+el, POS+kart şeması, patlatılmış kart, neon mimari, durak sahnesi). Hedef görseller ops/hedef/.

- 2026-11-09 02:00 Sunum: Faz 2 bitti. HEPSI.md'ye 'durma/sorma' kuralı ve canlıya alma onayı eklendi. Sıradaki Faz 3.

- 2026-11-09 02:02 Sunum: görsel kalite ÖNCELİK 1 (glTF/CC0 modeller, HDRI, hero görsel yedeği, faz başına ekran görüntüsü kontrolü) HEPSI.md'ye eklendi.

- 2026-11-09 02:03 Sunum: görsel zenginlik (Proofpath animasyonlarını uyarla, parçacık, akan çizgiler, sayaç, geçiş, parallax, ses/titreşim, kalite anahtarı, reduced-motion) HEPSI.md'ye eklendi.

- 2026-11-09 02:05 Sunum: hoş geldin notu (Ayşe, src/config/welcome.ts) HEPSI.md'ye eklendi, Faz 3 başında yapılacak.

- 2026-11-09 Sunum Faz 3 TAMAM: tap 3D lab (11 adim, 5 serit), yeni gorsel (ACES/bloom/PBR/golge), hos geldin seridi, hero gorseller. Rapor ops/raporlar/faz-3.md. Siradaki: Faz 4.
- 2026-11-09 02:07 Sunum: Şehir Gezgini (yerler, yemekler, fotoğraflar, künye, güvenli yedek) ve turların bu veriye dayanması HEPSI.md'ye eklendi.
