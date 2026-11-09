# Yeniden kurulum: temiz hikâye sunumu (STRATEJİ A + C, B kısmen)

Canlı: `#/sunum` (15 slayt), eski 42 slayt: `#/sunum/ek` (Appendix, silinmedi). PDF: `rota81-sunum.pdf` (15 hikâye + 43 sayfa ek = 58 sayfa).

## Ne yapıldı
- **A) Yeni ana sunum** (`src/sunum/Hikaye.tsx`, `hikaye.css`): 15 slayt, FORA marka renkleri (lacivert #0B2D6B, turuncu #FF7A00) ve FORADAŞ logoları (`public/marka/`, `ops/marka/assets` kopyası, c2pa metadata temizlendi). Tek başlık fontu (Bricolage Grotesque) + tek gövde fontu (Geist), tek ölçü birimi (`--u`) ile tüm slaytlar aynı ızgarada. Her slaytta tek fikir, başlık = mesaj cümlesi, en çok 3 madde, sade İngilizce.
  Akış: Açılış (bu ne / hangi sorun) → Gündem → Sorun → Çözüm → Kart → Dokunuş (7 adım) → Arka uç (5 katman) → Güvenlik/gizlilik → Yolcu → Restoran/POS → Turizm (gerçek foto + künye) → Araba kiralama/tur → Ekonomi → Sonuç (3 mesaj) → Teşekkürler + sözlük (NFC, Validator, Ledger).
- Kontroller: ←/→, PageUp/Down, Space/Enter, Backspace, Home/End, F tam ekran, S konuşma metni (her slayt için 3-5 kısa İngilizce cümle), dokunmatik kaydırma, `?s=N` ile doğrudan slayt, ilerleme çubuğu, "n / 15".
- **PDF yedek**: `#/sunum/pdf` artık önce 15 hikâye slaytını (1280x720, bir slayt bir sayfa), sonra ekleri basar.
- **B) 3D "Derin bakış"**: ana akış 3D'siz eksiksiz. Derin bakış bağlantıları (5 slayt) **varsayılan gizli**; yalnız `?deep=1` ile görünür. Eski sahneler "tasarımcı kabul eder" testini geçtiği kanıtlanmadığı için gizlendi (silinmedi).
- **C) Ekran görüntüleri**: `ops/raporlar/img/yeniden-NN.png` (tur 1, 1280x720), `yeniden-NN-m.png` (tur 1, 390x844), `*-r5.png` (son tur). Toplam 5 tur eleştiri + düzeltme (aşağıda), otomatik taşma denetimi (öğe slayt dışına çıkıyor mu, yatay kaydırma var mı): son turda 0 bulgu, konsol hatası 0.

## Eleştiri turları (ne bulundu, ne düzeldi)
1. Tur 1: başlıkla içerik çakışıyor (S3, S5, S11), h3 büyük harf, hub diyagramında "Car rental" kırpıldı, mobilde gündem kartları taştı.
2. Tur 2: kartlar küçük ve boşluk çok (S2, S8, S13, S14), S12 başlık 2 satır ve altına değiyor, S14 etiket satırında DESIGN rozeti lacivert-üstü-lacivert görünmüyordu.
3. Tur 3: gündem kartları fazla büyütülünce başlığı örttü → ayrı "mid" ölçüsü.
4. Tur 4: mobilde kontrol düğmeleri alt bilgiyi örtüyordu → alt bilgi akışa alındı; rozet+metin satırları dar ekranda sütuna bölünüyordu → `hk-note` satırı.
5. Tur 5 (son): masaüstü ve mobil tüm slaytlar taşmasız.

## DÜRÜST eksikler (hâlâ zayıf)
- Ana görsellerin çoğu **konsept çizim** (yazarın verdiği, yapay zekâ üretimi olabilir; slaytta etiketli): açılış, kart, yolcu. Gerçek lisanslı foto yalnız turizm slaytında (Ayasofya, Galata, baklava; yazar+lisans görünür). Restoran/POS/araba için foto yok; diyagram var.
- Dokunuş, arka uç ve restoran/kiralama slaytları **sade HTML kutu diyagramı**; temiz ama animasyonsuz. Bir grafik tasarımcı "iyi ama sıradan" der; 3D sahne seviyesinde bir etki beklentisini karşılamaz.
- Gündem, ekonomi ve güvenlik slaytlarında kart altı boşluk kalıyor; bilinçli sadelik ama "seyrek" hissedebilir.
- Mobilde 14 slayt dikeyde 844 px'i aşıyor (en uzun 1377 px): kaydırma gerekiyor, tek ekrana sığmıyor.
- Yazı tipleri Google Fonts'tan gelir: internet yoksa sistem yazı tipine düşer (düzen bozulmaz ama görünüm değişir). PDF yazı tiplerini gömülü taşır.
- 3D sahneler: tek tek tasarımcı testinden geçirilmedi; hepsi gizli. Hangisinin geçeceği ayrı bir tur ister.
- İngilizce metin B1-B2 hedefiyle yazıldı ama bu turda ayrı denetim tablosu (ingilizce-denetim.md) güncellenmedi. Slayt metinleri 10 sn testi için kendim okudum; bağımsız bir okuyucu denemedi.
- Eski sunucu penceresi (`/sunum/sunucu`) hâlâ 42 slaytlık eski sunumu izler; yeni 15 slayt için sunucu görünümü yok (yerine `S` ile konuşma metni).
- Kalan işler (strateji sırası): tur sayfası düzeltmeleri, güvenli mod/prova güncellemesi, İngilizce denetimi, veri, mobil tur sayfası; bu turda yapılmadı.
