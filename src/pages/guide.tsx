import { Link } from 'react-router-dom'
import { Card, PageHeader, SimNote } from '../ui/ui'

const PAIN: { problem: string; evidence: string; fix: string; to: string; label: string }[] = [
  { problem: 'Yetersiz bakiye korkusu', evidence: 'Mastercard araştırması (2018): yolcuların en büyük endişesi. Bakiyesi yetmediğini fark edenlerin 10’dan 6’sı yabancıdan kart istemeyi rahatsız edici buluyor.', fix: 'Bakiye 30 ₺’nin altına inince ana sayfada uyarı çıkar. Kartı okutmadan önce hızlı yükleme yapılır.', to: '/vatandas/yukle', label: 'Bakiye yükle' },
  { problem: 'Kart yükleme noktasına gitmek ve sıra beklemek', evidence: 'Aynı araştırma: yükleme ortalama 3,5 dakika sürüyor; nokta azlığı ve araç kaçırma şikâyeti var.', fix: 'Telefondan, simülasyonda tek ekranda yükleme. Gerçek sistemde ödeme sağlayıcı entegrasyonu gerekir.', to: '/vatandas/yukle', label: 'Yükleme ekranı' },
  { problem: 'Ücret ödeme kolaylığı', evidence: 'İETT 2015 anketi (2.177 kişi, Gökaşar ve ark. 2018): en düşük memnuniyet maddesi (5 üzerinden ortalama 1,99).', fix: 'Tek kart, tek bakiye: katılımcı şehirlerin hepsinde ortak cüzdan.', to: '/vatandas/cuzdan', label: 'Cüzdan' },
  { problem: 'Bilgi alma ve güzergâh değiştirme zorluğu', evidence: 'Aynı anket: bilgi alma kolaylığı ve güzergâh değiştirebilme ortalamanın (3) altında.', fix: 'Hangi durağa hangi hattın geldiği, güzergâhı ve rota planlayıcı tek yerde.', to: '/vatandas/duraklar', label: 'Duraklar' },
  { problem: 'Kalabalık ve belirsiz bekleme', evidence: 'Aynı çalışma: sıklık ve dakiklik yolcular için en önemli konu. (Kalabalık için ayrı yüzde bulunamadı.)', fix: 'Araç doluluğu ve yaklaşan araçların süresi canlı görünür; kalabalık olmayan seçenek “Önerilen” olur.', to: '/vatandas/canli', label: 'Canlı doluluk' },
]

export function Guide() {
  return (
    <div className="stack guide">
      <PageHeader title="Kullanım kılavuzu" sub="FORADAŞ prototipini adım adım tanıyın" />
      <SimNote>Bu bir prototiptir: ödeme, araç konumu ve kart okutma verisi simülasyondur.</SimNote>
      <Card title="Hızlı başlangıç">
        <ol className="steps2">
          <li><span>Giriş ekranından bir demo kişiye dokunun (parola <b>demo1234</b>).</span></li>
          <li><span><Link to="/vatandas/yukle">Bakiye yükleyin</Link>. 10 ₺ ile 2.000 ₺ arasında, simülasyondur.</span></li>
          <li><span><Link to="/vatandas/rota">Rota</Link> sayfasında şehri, başlangıç ve varış durağını seçin; en hızlı, en az aktarmalı veya en ucuz yolu görün.</span></li>
          <li><span><Link to="/vatandas/canli">Canlı doluluk</Link> sayfasında “Yolculuğum” sekmesinden kartınızı okutun; iniş durağınıza kadar yoğunluk tahmini ve bildirim alın.</span></li>
          <li><span><Link to="/vatandas/gezi">Gezi planla</Link> ile başka şehre günübirlik gezi planlayın ve canlı takip edin.</span></li>
        </ol>
      </Card>
      <Card title="Sayfalar ne işe yarar?">
        <ul>
          <li><b>Kartım:</b> dijital kart ve sahte QR; kartı dondurma <Link to="/vatandas/kart-yonetimi">Kart yönetimi</Link>’nde.</li>
          <li><b>Cüzdan ve işlem geçmişi:</b> bakiye, yükleme, harcama ve iadeler.</li>
          <li><b>Hatlar ve duraklar:</b> bir durağa dokunup “Hatlar ve güzergâhlar”ı açın.</li>
          <li><b>İller ve ilçeler:</b> 81 il ve 973 ilçe; nüfus ve yüzölçümü açık veri setinden, doğrulanmamıştır.</li>
          <li><b>Bildirimler:</b> kart okutma, iniş durağı ve gezi adımı mesajları buraya düşer.</li>
        </ul>
      </Card>
      <Card title="Yolcuların en sık yaşadığı sorunlar ve bu sitenin çözümü">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Sorun</th><th>Kaynak / bulgu</th><th>Çözüm</th></tr></thead>
            <tbody>
              {PAIN.map((p) => (
                <tr key={p.problem}><td><b>{p.problem}</b></td><td>{p.evidence}</td><td>{p.fix} <Link to={p.to}>{p.label}</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: '.6rem' }}>Kaynaklar: <a href="https://www.diken.com.tr/?p=593735" target="_blank" rel="noreferrer">Diken / MasterCard araştırması (2018)</a>; <a href="https://dergipark.org.tr/tr/download/article-file/598834" target="_blank" rel="noreferrer">Gökaşar, Buran, Dündar (2018), Pamukkale Üniv. Müh. Bil. Derg.</a> Veriler eskidir (2015 ve 2018); bugünün durumunu göstermez.</p>
      </Card>
      <Card title="Sık sorulanlar">
        <details><summary>Veriler gerçek mi?</summary><p>Hayır. Hat, durak, ücret, doluluk ve gezilecek yerler örnektir. İl ve ilçe adları gerçek, nüfus değerleri açık veri setinden alınmıştır.</p></details>
        <details><summary>Konumum kullanılıyor mu?</summary><p>Gezi sayfasında konum simüle edilir; gerçek konum izni istenmez. Konumunuzu “en yakın durak” listesinden seçersiniz.</p></details>
        <details><summary>Verilerim saklanıyor mu?</summary><p>Yalnızca bu tarayıcıda (localStorage). Sunucuya gönderilmez. Gerçek sistemde kimlik doğrulama ve veri saklama sunucuda olur.</p></details>
        <details><summary>Neden bazı illerde yalnızca otobüs var?</summary><p>Ayrıntılı örnek ağı yalnızca Ankara, İstanbul, İzmir, Bursa, Antalya ve Eskişehir’de var. Diğer illerde ilçe merkezlerinden üretilmiş örnek otobüs hatları vardır.</p></details>
      </Card>
    </div>
  )
}
