# Görsel kaynaklar ve lisanslar

| Varlık | Kaynak | Lisans |
|---|---|---|
| Tüm 3D modeller (kart, okuyucu, otobüs, POS, karakter, sokak, ağaç, lamba, arka uç blokları) | Bu depoda prosedürel olarak üretildi (`src/sunum/three/models.ts`) | Proje lisansı; üçüncü taraf varlık yok |
| Ortam ışığı | three.js `RoomEnvironment` (kod içi, doku dosyası yok) | MIT (three.js) |
| Ahşap/cephe/gökyüzü dokuları | Canvas ile çalışma zamanında üretilir | Proje |
| `public/hedef/*.jpg` hero görseller | `ops/hedef/*.png` (kullanıcı tarafından sağlandı, yapay zekâ üretimi olabilir) küçültüldü | Kullanıcı sağlamı; "Concept illustration" etiketi |

Serbest lisanslı glTF/HDRI (Kenney, Quaternius, Poly Haven, ambientCG) henüz eklenmedi. Eklenirse her dosya için ad, yazar, URL ve lisans buraya yazılır.

## Eklenen serbest lisanslı varlıklar (2026-11-09, düzeltme turu)
| Varlık | Kaynak | Yazar | Lisans | Kullanım |
|---|---|---|---|---|
| `public/tex/venice_sunset_1k.hdr` | https://polyhaven.com/a/venice_sunset | Poly Haven | CC0 | Ortam ışığı/yansıma (SceneManager, `assets.ts`); okunamazsa RoomEnvironment'a düşer |
| `public/models/CesiumMan.glb` | https://github.com/KhronosGroup/glTF-Sample-Assets (Models/CesiumMan) | Cesium | CC BY 4.0 | Animasyonlu yaya (yolculuk sahnesi); yüklenemezse prosedürel kalabalık kalır |

Not: Kenney (kenney.nl 403 verdi, indirme bağlantısı kararsız) ve Quaternius paketleri bu turda indirilemedi; otobüs, durak, restoran, kart ve okuyucu hâlâ prosedürel modellerdir. Hedef görsellere (ops/hedef) "açıkça yakın" kalite BU TURDA sağlanmadı; ayrıntı duzeltme.md.
