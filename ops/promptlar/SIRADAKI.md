# FAZ 2 — Yeniden kullanılabilir 3D bileşenler
Önce ops/PLAN.md oku. Dal: claude/faz-2 (bu dalın ucundan). Dokunma: src/data/tour, src/data/real, docs/VERI_*.
0. Doğrula: Türkiye turu sayfasında "Tur oluştur" donmuyor (1 dk, playwright).
1. src/sunum/Stage3D.tsx ve scenes.tsx'i oku; mevcut işi koru.
2. src/sunum/three/ altında paylaşılan sistem: sahne/ışık/kamera yöneticisi (hedefe yumuşak geçiş), animasyon zaman çizelgesi (duraklat/devam, adım ileri-geri, tekrar), bileşen inceleme (tıkla: ad+işlev etiketi), gerçek↔teknik görünüm anahtarı.
3. Yeniden kullanılabilir prosedürel modeller: AkıllıKart (çip+anten sarımı katmanlı), KartOkuyucu/Validatör (alan halkaları), Otobüs ve POS iskeleti (Faz 4-5'te doldurulacak).
4. Her nesne: ad, işlev, GERÇEK/TASARIM/SİMÜLASYON etiketi (tek veri tablosu).
5. Mevcut kart okutma slaydına bağla; eski görünümleri silme.
6. Test: zaman çizelgesi birim testleri + npm test + npm run build + playwright ile kontroller çalışıyor mu.
7. ops/raporlar/faz-2.md yaz, claude/faz-2 dalına it, dur. Kısa çalış.
