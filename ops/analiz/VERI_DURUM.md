# ROTA 81: veri ve fotoğraf durumu (veri thread'i yazar; ortak ana not: ops/analiz/DURUM.md, sunum dalında)

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

## 2026-11-09: Türkiye turu sayfasında "Şehir rehberi"
- `/vatandas/tur` artık tur başlamadan önce de şehir sekmeleriyle (İstanbul, Kocaeli, Ankara, Konya) gezilecek yerleri ve yemekleri gösterir (`CityGuide`, `src/pages/tour.tsx`).
- Kaynaklar: `PLACES` (`src/data/tour.ts`, şema `Place {id, city, title, lat, lon, tr, en, kind: 'sight'|'food'}`), `facts.json` (İngilizce özet, yazar, lisans, kaynak_url) ve `img/<id>.jpg`. Yemeğin işletme adı ve fiyatı `TOUR` içindeki `food` adımından okunur.
- Güvenli yedek: resmi olmayan yer "yer tutucu" kartı ve "serbest lisanslı görsel henüz bulunamadı" notuyla görünür; şehirde kayıt yoksa "kayıtlı yer yok" yazar. Şu an fotoğrafsız: korfez-balik (Kocaeli), firin-kebabi (Konya).
- Sunum dalı bu bileşeni kullanabilir ya da kendi 3D sahnelerini `PLACES` id'leriyle eşleştirebilir. `src/sunum/` dosyalarına dokunulmadı.

## 2026-11-09: Şehir rehberi veri şeması (yeni, sunum thread'i bunu okur)
- Tip: `src/data/guide/types.ts` (`CityGuideData`, `GuideItem`, `GuideImage`). Yükleyici: `src/data/guide/index.ts` (`GUIDE[plaka]`, `guideImg(plaka, id)`, `guideItems`).
- Dosyalar: `src/data/guide/<plaka>.json` (iki haneli plaka, örn. `42.json`) ve resimler `src/data/guide/img/<plaka>-<id>.jpg`.
- Alanlar: `plate, name, intro_en, intro_tr, culture[], sights[], foods[], streets[]`. Her öğe: `id, title_en, title_tr, text_en, text_tr, source_url, text_licence`, isteğe bağlı `lat, lon, local_name, ingredients_en, where_en, culture_en, culture_tr, image {file, author, licence, source_url}`.
- Sayfa: `/vatandas/rehber` (`src/pages/rehber.tsx`). Verisi olmayan ilde "veri yok" kartı gösterir; fotoğrafı olmayan öğe yer tutucu gösterir. Uydurma içerik yok; her metnin kaynağı ve lisansı öğede yazılı.
- Dolum: PC oturumu (Wikipedia, Wikivoyage, Wikimedia Commons; yalnızca serbest lisanslı). Sunum thread'i `GUIDE` verisini dinamik okuyabilir; dosya yoksa boş gelir.
- Rehber (kişi) profilleri ve örnek yorumlar sunum thread'inin işi; kurgusal ve "simülasyon" etiketli olmalı, gerçek kişi/yorum uydurulmaz.
