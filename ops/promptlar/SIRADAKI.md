# FAZ 1 — "Tur oluştur" donması
Önce ops/PLAN.md kurallarını oku. Dal: claude/faz-1 (mevcut claude/project-thread-qm3gnw'dan aç).
Yap:
1. src/pages/tour.tsx ve ilgili servis/veri kodunda "Tur oluştur" akışını incele: olay bağlantısı, eksik veri, async/await, durum güncelleme döngüsü (render döngüsü/sonsuz effect), API hatası, kullanıcı geri bildirimi (yükleniyor/hata/boş).
2. Kök nedeni düzelt (butonu gizleme/değiştirme yok). Oluşan tur gerçekten kullanılabilir olsun (durak/yer/adım listesi).
3. Yükleniyor ve hata durumu ekle; regresyon testi yaz.
4. `npm test` ve `npm run build` geçsin; tarayıcıda (playwright) butona basıp donmadığını doğrula.
5. ops/raporlar/faz-1.md yaz (kök neden, değişen dosyalar, test çıktısı). faz-1 dalına it, dur. main'e alma.
Kısa çalış, gereksiz açıklama yazma.
