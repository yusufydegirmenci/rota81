# Faz 4 raporu: tek karakter, sürekli yolculuk, arıza + kurtarma

## Ne yapıldı
- `three/journey.ts` + `JourneyView.tsx`: 14 adım (uyanma → telefon/bakiye → rota → mahalle yürüyüşü → durak → kalabalık+erişilebilirlik → otobüs gelişi → rampa/kuyruk → validatör arızası → teknisyen → kurtarma → otobüs içi (kabuk kesit) → metro girişi → sistem sistem arıza/kurtarma özeti). `journey` slaytına eklendi (eski SVG sokak sahnesi korundu).
- `three/world.ts`: Person (boy/kıyafet/ten farklı, yürüme animasyonu), Wheelchair, Shelter (ekranı canvas ile çizilir), MetroEntrance + kapı okuyucu, Phone (uygulama ekranı, "SIMULATION" etiketi), House, BusInterior.
- Tek ana karakter tek nesne: yalnızca hedefe yürür (lerp), yatışı ayakta duruşa dönüş rotasyonla; ışınlanma yok. Kamera her adımda başka bir fikri izler. Teknik görünümde adım başına etiket çıkar.
- Arıza: kırmızı led + "Out of service" → teknisyen yürüyerek gelir → yeşil; idempotency ve kurtarma yolu açıklamada. Tüm kritik sistemler için arıza/kurtarma son adımda.
- Erişilebilirlik: tekerlekli sandalye, rampa, dokunsal şerit, farklı boyda yolcular.

## Kararlar
- Otobüsün kapı yüzü kaldırıma (-z) bakacak şekilde 180° döndürüldü; kapı-validatör kaldırım tarafında.
- Yeni parçalar nesne tablosuna eklendi (12 yeni kayıt).
- Çocuk (kalabalık[0]) otobüs içi adımda gizlenir (iç mekân kalabalığı sadeleştirildi).
- Instancing kullanılmadı (≈10 kişi); sahne düşük kalitede de akıcı olmalı, bloom/gölge kapanır.

## Test
- Yeni `journey.test.ts` (5 test: alan doluluğu, ışınlanma yok, arıza→teknisyen→kurtarma sırası, otobüs-rampa sırası, SIMULATION etiketi) + önceki testler yeşil; tip kontrolü yeşil.
- Playwright: adımlar ilerledi, durak ve arıza görüntüleri alındı: `ops/raporlar/img/faz-4-stop.png`, `faz-4-fault.png`. Konsol hatası 0.

## Eksikler
- H5 kadar zengin değil: viyadük, gökdelen silueti, farklı yürüme/binme animasyonları ve gerçek (glTF) insan modelleri yok; insanlar stilize kapsül.
- Otobüs içi sade (koltuk, tutamak, validatör). Metro peronu yok, yalnızca giriş + kapı.
- Telefon ekranı canvas ile; animasyonlu sayaç yok.
