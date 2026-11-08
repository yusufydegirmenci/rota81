# Tek kart: A'dan Z'ye işleyiş

Bu belge, uygulamadaki "Tek kart: nasıl işler?" sayfasının (src/services/cardflow.ts) çalıştırdığı algoritmayı anlatır. Prototipte ödeme ve doğrulayıcı cihaz simülasyondur; duraklar ve hatlar gerçek veridir (İstanbul: İETT, diğer iller: OpenStreetMap). Tarifeler, aktarma indirimi ve iller arası ücret/süre örnek/tahmindir.

## Ana fikir
Kart değil **hesap** tektir. Para kartın çipinde değil ortak cüzdandadır; kart, telefon veya QR yalnızca hesabı tanıtır. Her il kendi tarifesini ve işletmecisini korur; ulusal katman onay ve denetim yapar. Böylece şehir değiştirmek yeni kart, yeni bakiye veya eski kartta unutulan para anlamına gelmez.

## Bir okutmanın adımları (tek biniş)
1. **Kart okunur.** Kart durumu kontrol edilir; dondurulmuşsa geçiş reddedilir, para düşülmez.
2. **Durak ve il belirlenir.** Doğrulayıcı hangi durakta/araçta olduğunu bilir; il (plaka) ondan çıkar, kullanıcı il seçmez.
3. **Hat ve işletmeci.** Durağa uğrayan hat bulunur; parayı kimin alacağı belli olur.
4. **Şehir tarifesi.** O ilin, o anda yürürlükteki tarife sürümü (mod + tam/öğrenci) okunur.
5. **Aktarma kuralı.** Hesabın son geçişinden bu yana `POLICY.transferWindowMin` (90 dk, örnek) geçmediyse `transferDiscountPct` (%50, örnek) indirim uygulanır. Bu iki sayı bir politika parametresidir; ulusal ayarla değiştirilir.
6. **Bakiye kontrolü.** Yeterli bakiye yoksa geçiş reddedilir. Bakiye tek olduğu için hangi ilde olunduğunun önemi yoktur.
7. **Defter kaydı.** Tekil anahtarla (idempotency) cüzdandan düşülür; aynı okutma iki kez gelirse ikinci kez düşülmez. Tutarlar kuruş cinsinden tamsayıdır.
8. **Mahsuplaşma (gün sonu).** O gün toplanan ücretler işletmeci ve il bazında ayrıştırılır; her işletmecinin alacağı hesaplanır ve lisanslı bir ödeme kuruluşu üzerinden aktarılır. Yolcu bir şey yapmaz.
9. **Makbuz ve bildirim.** Kalan bakiye gösterilir; düşükse uyarı gelir.

## İller arası yolculuk
Yolculuk bacaklara bölünür: çıkış ilinde yerel biniş, iller arası bacak, varış ilinde yerel biniş. Her bacak yukarıdaki zincirden ayrı geçer: her il kendi tarifesini uygular, ücret kendi işletmecisine yazılır. İller arası bacağın süresi ve ücreti prototipte il merkezleri arası mesafeden tahmin edilir (src/services/intercity.ts); gerçek sefer ve firma verisi yoktur. Yolculuk başlamadan, üç bacağın tahmini toplamı için bakiye ön kontrolü yapılır; yetersizse hiçbir bacak başlatılmaz.

## Gerçekte olması gerekenler
- **Hesap tabanlı çift taraflı defter** ve günlük mutabakat; hata ve iade akışları.
- **Lisanslı ödeme/elektronik para kuruluşu** (bakiye saklama ve yükleme).
- **Belediyelerle protokol:** tarife yetkisi, işletmeci verisi ve gelir payı kuralları.
- **Doğrulayıcı entegrasyonu:** çevrimdışı doğrulama, kara liste, imzalı kısa ömürlü QR/NFC kimliği.
- **Pilot:** önce birkaç büyükşehir, sonra kademeli yayılım.

## Veri kaynakları ve sınırlar
- İstanbul otobüs durak ve hatları: İETT, İBB Açık Veri Portalı (CC BY 4.0). Seyrek sıklık/süre değerleri tahmindir.
- Diğer iller ve İstanbul raylı sistem/vapur: © OpenStreetMap contributors (ODbL), `src/data/real/osm/`. OSM'de Türkiye şehir içi otobüs verisi seyrektir; verisi olmayan il/ilçe "veri yok" gösterilir, hat uydurulmaz.
- Ankara, İzmir, Bursa, Antalya ve Eskişehir'deki elle yazılmış örnek hatlar `real` işareti taşımaz ve "(örnek)" etiketlidir.
