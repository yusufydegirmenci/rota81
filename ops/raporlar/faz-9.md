# Faz 9 raporu: Design-your-city + harita modları

## Ne yapıldı
- `src/sunum/citydesign.ts`: saf motor. Marisa'nın 5 ilçesi (nüfus SENARYO girdisi, toplam ≈ 1,0 milyon), durak/hat tasarımı, kapsama (≈500 m tam, ≈1 km'de sıfır), hat başına km/dk/yolcu/kapasite/yük, bağlı ağ sayısı, aktarma durakları. Örnek ağ: Bus 12, Tram T2, Metro M1.
- `CityDesigner.tsx` + yeni `design-city` slaydı (42. slayt, `city` sonrası): 6 mod: **2D design** (durak ekle/hat çiz/durak sil, yeni hat, hat modu + sefer aralığı, ilçe başına klavye düğmeleri), **Network** (şematik), **District** (ilçe yakınlaştırma, nüfus, en yakın durak), **3D** (nüfusa göre kuleler, deniz, hatlar, hareketli araçlar; adım/duraklat/tekrar/inceleme), **Street** (seçilen durakta yoğun saat; kalabalık talebe göre), **Real data**.
- Real data: `src/data/real/osm/*.json` ve `OSM_INDEX` yalnız OKUNUR; il seçilir, gerçek duraklar çizilir, durağı olmayan ilçeler listelenir; veri yoksa "veri yok" yazılır, hiçbir şey uydurulmaz.

## Kararlar
- Nüfus, tepe saat yolculuk oranı (%1,5) ve araç kapasiteleri SENARYO/tasarım değeri olarak etiketlendi, istatistik değil.
- Örnek ağda Bus 12 bilerek aşırı yüklü kalıyor (oyuncunun düzeltmesi için hedef): sefer aralığı, ek hat veya araç büyüklüğüyle çözülür.
- 3D ve Street sahneleri durum değişince yeniden kurulur; Viewer3D kontrolleri tüm modlarda aynı.

## Test
- `citydesign.test.ts` (6 test): boş ağ, 2+ durak şartı, kapsama düşüşü, bağlantı, sefer aralığı/kapasite, örnek ağ. Süit 97 test yeşil, tip yeşil.
- Playwright: tüm modlar gezildi (2D/Network/District/3D/Street/Real data), Ankara 6.102 gerçek durak, Adıyaman'da az veri notu, 3D ve sokak görüntüleri `ops/raporlar/img/faz-9-*.png`. Konsol hatası 0.

## Eksikler
- Gerçek veri yalnız gösterilir, Marisa tasarımıyla karıştırılmaz (ayrı harita).
- Hat çizimi düz çizgi; yol ağı veya zaman çizelgesi hesabı yok.
