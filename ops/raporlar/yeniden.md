# Yeniden kurulum: A0 hikâyesi (tek gezgin, 5 şehir, 22 slayt)

Canlı: `#/sunum` (22 slayt). Eski 42 slayt: `#/sunum/ek` (Appendix, silinmedi). PDF: `rota81-sunum.pdf` (22 hikâye slaytı + 43 sayfa ek).
Kaynak: `ops/kaynak/chatgpt-tek-ulasim-karti-sunum-plani.pdf` (22 slayt planı) + DUZELTME.md A0/A/B/C. Önceki 15 slaytlık sürüm bu planla değiştirildi.

## Ne yapıldı
- **Hikâye (A0):** "81 CITIES. ONE JOURNEY." Tek gezgin, elinde tek kart: Ankara → Eskişehir → İstanbul → İzmir → Antalya. 7 bölüm: Açılış 1-4, Rota 5, Ankara 6-7, Eskişehir 8-10, İstanbul 11-13, İzmir-Antalya 14-17, Final 18-22. Planın slayt sırası, başlıkları ve anlatıcı cümleleri İngilizceye çevrilip korundu.
- **4 teknoloji durağı** hikâyenin içinde (7: kart okutma/NFC, 9: belediyeler arası entegrasyon, 12: çoklu operatör+ödeme katmanı, 15: güvenlik/veri). Ayrı teknik bölüm yok. Kart her slaytta değil, yalnız doğal yerlerde (4, 7, 13, 21).
- **Şehirler arası yolculuk ayrı** (slayt 10: tren, "intercity travel is separate; the card is for transport inside a city"). Harita ve slayt 5/18'de aynı not var.
- **Mevcut / öneri ayrımı** (slayt 18): "REAL: Türkiye Kart (PTT) anlaşmalı belediyelerde çalışıyor" ve "PROPOSAL: 81 ilde yaygın, bütünleşik, yolcu odaklı". 81 il hedefi "canlı entegrasyon değil" diye etiketli. İstatistik uydurulmadı. Entegrasyon/işletim slaytları PROPOSAL, tutarlar ILLUSTRATIVE etiketli.
- **Gerçek foto:** 13 lisanslı Wikimedia Commons fotoğrafı `public/foto/` (Kapadokya CC0, Ankara Hamamönü, Eskişehir Porsuk CC0 + Odunpazarı + tramvay, İzmir Kordon + Saat Kulesi, Antalya Kaleiçi + Hadrian Kapısı + Düden, YHT treni, İstanbul Boğaz + vapur) + depodaki tur fotoları (Galata, simit, Ankara kale, Ankara tava). Her slaytın altında yazar + lisans + "Wikimedia Commons"; künye tablosu `src/sunum/foto.ts` (yazar, lisans, kaynak sayfa). Lisanssız foto yok; `hikaye.test.tsx` her fotonun künyesini ve dosyasını denetler.
- **Görsel dil:** FORA lacivert #0B2D6B + turuncu #FF7A00 + teknoloji durağında turkuaz (#3FD0C9) vurgu, kırık beyaz. Tek başlık fontu (Bricolage Grotesque) + tek gövde fontu (Geist). Her şehir kendi vurgu rengi ve kendi yerleşimine sahip (Ankara: solda metin; Eskişehir/Antalya: altta metin + 2 küçük foto; İstanbul/İzmir: sağda metin), tek şablon+foto değiştirme değil. Üstte gezgin rota şeridi (kaç şehir geçildi).
- **Harita:** 81 il merkezinden (CENTROIDS) nokta haritası + kaba Türkiye silueti; rota 5 şehri bağlar. Slayt 18'de 81 nokta sırayla yanar.
- **Kart:** Slayt 4 ve 21'de kendi çizdiğim SVG ürün render'ı (FORADAŞ renkleri, çip, temassız dalgalar), "symbolic design" etiketli. Gerçek ulaşım markası/cihazı kullanılmadı. PDF'teki görseller (yapay zekâ/telifli) kullanılmadı.
- **Yollar:** Full (22), 10 dk (14 slayt), 3 dk (6 slayt); kontrol çubuğunda düğme, `?p=10` / `?p=3`. Kontroller: ←/→, PageUp/Down, Space/Enter, Backspace, Home/End, F, S (konuşma metni, her slayt 1-2 kısa cümle), dokunmatik kaydırma, `?s=N`.
- **B) 3D "Derin bakış":** ana akış 3D'siz eksiksiz. 3D bağlantıları (4 teknoloji durağında) varsayılan **gizli**, yalnız `?deep=1` ile açılır; hiçbiri tasarımcı testinden geçirilmediği için. Eski 42 slayt ve 3D labları Ek'te duruyor.
- **PDF yedek:** `#/sunum/pdf` 22 slaytı (1280x720, 1 slayt = 1 sayfa) + eki basar. Dosya: `public/rota81-sunum.pdf` (~14 MB).
- **C) Ekran görüntüleri:** `ops/raporlar/img/yeniden-NN.png` (1280x720) ve `yeniden-NN-m.png` (390x844), 22'şer adet, son tur.

## Eleştiri turları (acımasız grafik tasarımcı gözüyle)
1. İlk render: şehir slaytlarında metin/foto/başlık tamamen yanlış yerde (CSS özgüllük hatası: relative kuralı absolute'u eziyordu) → düzeltildi.
2. Kapak logosu H1 ile çakışıyordu; kart yelpazesi etiketleri kırpılıyordu (kart genişletildi); S9 kutusunda "Shared integration layer" taşıyordu; teknoloji durağı adımları 2 sn sonra görünüyor (animasyon) diye ilk görüntüde soluktu → bekleme artırıldı.
3. İstanbul slaytında 3 küçük foto metne biniyordu → küçültüldü. Telefon çerçevesi başlığa biniyordu → küçültüldü.
4. **İzmir "Kordon" hero fotoğrafı sahil değil sokaktı** (ilk seçim kötüydü) → gerçek sahil yürüyüşü fotoğrafıyla değiştirildi (özgün dosya hâlâ yazar/lisans künyeli).
5. Mobil: alt bilgi/kredi taşması, 3 küçük fotonun taşması, kontrol düğmelerinin alt bilgiyi örtmesi → düzeltildi. Son turda masaüstü taşma 0 (kasıtlı bulanık kolaj hariç), konsol hatası üretim önizlemesinde 0 (geliştirme sunucusunda yalnız Vite HMR websocket uyarısı).

## DÜRÜST eksikler (hâlâ zayıf, olduğundan iyi gösterilmiyor)
- **Fotoğraf kalitesi eşit değil.** Kapadokya kapağı güçlü ama rota dışı (Kapadokya hikâyede yok, "Türkiye manzarası" olarak kullanıldı). Eskişehir Odunpazarı küçük fotosu sönük; İzmir Kordon hero koyulaştırılmış ve kalabalık sırtı dönük (yolcuyu andırıyor ama gezgin değil); İstanbul Boğaz fotosu bulanıkça. Planın "sinematik, her şehre özgün atmosfer" çıtasının altında; ücretsiz lisanslı fotoğraflarla bu kadar.
- **Gezgin görünmüyor.** Plan "yolcu arkası dönük ufka bakıyor" diyor; lisanslı gerçek bir "tek gezgin" fotosu bulamadım ve uydurmadım. Gezgin yalnız rota şeridi ve metinle var.
- **Yemekler** (çibörek, met helva, boyoz, kumru, Antalya piyazı, tahinli kabak tatlısı) metin olarak var; fotoğrafsız. Veri thread'inden foto istenebilir (VERİ İSTEĞİ).
- **İstanbul'da 3 küçük foto**tan biri (vapur) gerçek işletme markası içeriyor olabilir; Commons künyeli ama marka kullanımı ayrıca denetlenmedi.
- Teknoloji durakları (7, 9, 12, 15) temiz ama **sade HTML/SVG kutu diyagramı**; animasyon yalnız giriş. Slayt 12 katman şeması planın "her katman sırayla açılır" isteğini yalnız giriş animasyonuyla karşılıyor.
- Harita siluet bir **kaba çokgen** (21-32 nokta), sınır doğruluğu yok; "schematic" etiketli ama tasarımcı "çocuk işi" diyebilir. Rota animasyonu (çizilme) yok, noktalı çizgi sabit.
- Slayt 13 telefon ekranı basit HTML maketi; gerçek uygulama ekranı değil.
- Mobilde 12'den fazla slayt 844 px'i aşıp kaydırma gerektiriyor (kapaklar ve şehir slaytları tek ekrana sığıyor).
- Yazı tipleri Google Fonts: internet yoksa sistem yazı tipine düşer. PDF yazı tiplerini gömülü taşır.
- **Türkiye Kart (PTT) cümlesi** plandaki ChatGPT notundan alındı, resmî kaynaklardan (PTT SSS, Ulaştırma Bakanlığı) benim tarafımdan doğrulanmadı. Sunumdan önce resmî metinle karşılaştırılmalı (sunucu notunda da var).
- İngilizce metin B1-B2 hedefiyle yazıldı; bağımsız denetim ve "10 saniye testi" yapılmadı. `ingilizce-denetim.md` bu turda güncellenmedi.
- Eski sunucu penceresi (`/sunum/sunucu`) hâlâ 42 slaytlık eskiyi izler.
- Kalan işler (strateji sırası): tur sayfası düzeltmeleri, güvenli mod/prova güncellemesi, İngilizce denetimi, veri, mobil tur sayfası; bu turda yapılmadı.
