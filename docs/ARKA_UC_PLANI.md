# FORADAŞ arka uç planı (ASP.NET Core + PostgreSQL)

Bu belge, prototipin (tarayıcıda çalışan simülasyon) gerçek bir sisteme dönüşmesi için önerilen planı anlatır. **Henüz hiçbir arka uç kodu yazılmadı.**

## 1. Mevcut durum
- `src/services/api.ts` arayüzü sunucu API'sinin sözleşmesi gibi davranır; arayüz yalnızca bu katmanı çağırır.
- Yetki, il izolasyonu, tarife sürümleme, idempotency ve denetim kaydı kuralları testlerle (42 test) tanımlıdır.
- Araç doluluğu, rota motoru ve şehirler arası süre/ücret simülasyondur.

## 2. Hedef mimari
| Katman | Seçim | Not |
|---|---|---|
| API | ASP.NET Core 8 (minimal API + MediatR veya klasik controller) | OpenAPI şeması, sürümlü uçlar |
| Veritabanı | PostgreSQL 16 + PostGIS | Durak/hat coğrafi sorguları, `ST_DWithin` ile yürüme mesafesi |
| Önbellek / kuyruk | Redis | Oturum, hız sınırı, canlı araç konumu |
| Kimlik | OIDC (Keycloak veya Entra ID), kısa ömürlü JWT | Rol ve il bilgisi sunucuda jetondan ve kullanıcı kaydından okunur |
| Canlı veri | MQTT/Kafka → Redis → SignalR | Araç konumu (AVL) ve validatör okutmaları |
| Ödeme | Lisanslı ödeme kuruluşu API'si | Kart verisi sistemde tutulmaz (PCI kapsamı dışı) |

## 3. Veri modeli (özet)
`city, district, operator, stop (geography), route, route_stop, trip/timetable, fare_product, fare_version (valid_from/to, status), card, wallet_account, ledger_entry (çift taraflı), journey, journey_leg, validation_event, vehicle_position, alert, audit_log, user, role_assignment (il kapsamlı)`.

Kritik kurallar:
- Para birimi `bigint` kuruş; **çift taraflı defter** (`ledger_entry` borç/alacak toplamı sıfır). Bakiye türetilir veya mutabakatla doğrulanır.
- Yükleme ve harcama uçları `Idempotency-Key` zorunlu; tekrar eden istek aynı sonucu döndürür.
- `fare_version` değiştirilemez (immutable); yeni sürüm eklenir, `journey` kendi sürümüne bağlı kalır.
- İl yöneticisi yetkisi sorgu düzeyinde zorlanır (`WHERE city_id = @userCity`), PostgreSQL satır düzeyi güvenlik (RLS) ikinci savunma hattıdır.

## 4. Canlı doluluk (gerçek sistem)
1. Araçlardan AVL konumu (5-10 sn) ve validatör okutma olayı gelir.
2. Okutma sayısı − iniş tahmini (iniş okutması varsa gerçek, yoksa model) = araçtaki yolcu tahmini.
3. Doluluk % = yolcu / kapasite; kapasite araç tipine bağlıdır.
4. Kişisel bildirim: kullanıcı biniş yaptığında hedef durak biliniyorsa, kalan duraklardaki tahmini yoğunluk push bildirimi olarak gönderilir.
5. Gizlilik: yalnızca toplu sayı yayımlanır; kart numarası konumla birlikte saklanmaz veya kısa sürede anonimleştirilir (KVKK).

## 5. Şehirler arası ve gezi
Gerçek veri için firma/bilet API'leri (EBS, Obilet vb.) veya GTFS/GTFS-Realtime akışları gerekir. Sözleşme ve lisans kararı gereklidir. Gezilecek yer verisi için kültür-turizm kurumlarının açık verisi veya doğrulanmış bir içerik ekibi gerekir.

## 6. Güvenlik ve uyum
OIDC + MFA (yöneticiler), hız sınırı, denetim kaydı değişmez depoda, sırlar için vault, KVKK aydınlatma ve silme akışı, bağımlılık taraması, sızma testi. Resmî kurum amblemleri izinsiz kullanılmaz.

## 7. Aşamalar
1. **Faz A (2-3 hf):** kimlik, kullanıcı/rol/il, katalog (hat/durak) API'si; arayüz `api.ts` yerine HTTP istemcisine bağlanır.
2. **Faz B (3-4 hf):** cüzdan, defter, idempotency, tarife sürümleme ve onay akışı, denetim kaydı.
3. **Faz C (3-4 hf):** rota motoru (RAPTOR/CSA, GTFS içe aktarma), PostGIS.
4. **Faz D (4+ hf):** canlı veri hattı, doluluk, bildirimler, mobil istemci.
5. **Faz E:** pilot il, yük ve güvenlik testi, uyum incelemesi.

Tahminler kaba tahmindir; ekip büyüklüğü ve entegrasyon sözleşmelerine bağlıdır.
