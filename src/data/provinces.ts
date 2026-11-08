// Türkiye'nin 81 ili (plaka koduna göre) ve coğrafi bölgeleri.
export const PROVINCES: { id: string; name: string; region: string }[] = [
  ['01', 'Adana', 'Akdeniz'], ['02', 'Adıyaman', 'Güneydoğu Anadolu'], ['03', 'Afyonkarahisar', 'Ege'], ['04', 'Ağrı', 'Doğu Anadolu'],
  ['05', 'Amasya', 'Karadeniz'], ['06', 'Ankara', 'İç Anadolu'], ['07', 'Antalya', 'Akdeniz'], ['08', 'Artvin', 'Karadeniz'],
  ['09', 'Aydın', 'Ege'], ['10', 'Balıkesir', 'Marmara'], ['11', 'Bilecik', 'Marmara'], ['12', 'Bingöl', 'Doğu Anadolu'],
  ['13', 'Bitlis', 'Doğu Anadolu'], ['14', 'Bolu', 'Karadeniz'], ['15', 'Burdur', 'Akdeniz'], ['16', 'Bursa', 'Marmara'],
  ['17', 'Çanakkale', 'Marmara'], ['18', 'Çankırı', 'İç Anadolu'], ['19', 'Çorum', 'Karadeniz'], ['20', 'Denizli', 'Ege'],
  ['21', 'Diyarbakır', 'Güneydoğu Anadolu'], ['22', 'Edirne', 'Marmara'], ['23', 'Elazığ', 'Doğu Anadolu'], ['24', 'Erzincan', 'Doğu Anadolu'],
  ['25', 'Erzurum', 'Doğu Anadolu'], ['26', 'Eskişehir', 'İç Anadolu'], ['27', 'Gaziantep', 'Güneydoğu Anadolu'], ['28', 'Giresun', 'Karadeniz'],
  ['29', 'Gümüşhane', 'Karadeniz'], ['30', 'Hakkâri', 'Doğu Anadolu'], ['31', 'Hatay', 'Akdeniz'], ['32', 'Isparta', 'Akdeniz'],
  ['33', 'Mersin', 'Akdeniz'], ['34', 'İstanbul', 'Marmara'], ['35', 'İzmir', 'Ege'], ['36', 'Kars', 'Doğu Anadolu'],
  ['37', 'Kastamonu', 'Karadeniz'], ['38', 'Kayseri', 'İç Anadolu'], ['39', 'Kırklareli', 'Marmara'], ['40', 'Kırşehir', 'İç Anadolu'],
  ['41', 'Kocaeli', 'Marmara'], ['42', 'Konya', 'İç Anadolu'], ['43', 'Kütahya', 'Ege'], ['44', 'Malatya', 'Doğu Anadolu'],
  ['45', 'Manisa', 'Ege'], ['46', 'Kahramanmaraş', 'Akdeniz'], ['47', 'Mardin', 'Güneydoğu Anadolu'], ['48', 'Muğla', 'Ege'],
  ['49', 'Muş', 'Doğu Anadolu'], ['50', 'Nevşehir', 'İç Anadolu'], ['51', 'Niğde', 'İç Anadolu'], ['52', 'Ordu', 'Karadeniz'],
  ['53', 'Rize', 'Karadeniz'], ['54', 'Sakarya', 'Marmara'], ['55', 'Samsun', 'Karadeniz'], ['56', 'Siirt', 'Güneydoğu Anadolu'],
  ['57', 'Sinop', 'Karadeniz'], ['58', 'Sivas', 'İç Anadolu'], ['59', 'Tekirdağ', 'Marmara'], ['60', 'Tokat', 'Karadeniz'],
  ['61', 'Trabzon', 'Karadeniz'], ['62', 'Tunceli', 'Doğu Anadolu'], ['63', 'Şanlıurfa', 'Güneydoğu Anadolu'], ['64', 'Uşak', 'Ege'],
  ['65', 'Van', 'Doğu Anadolu'], ['66', 'Yozgat', 'İç Anadolu'], ['67', 'Zonguldak', 'Karadeniz'], ['68', 'Aksaray', 'İç Anadolu'],
  ['69', 'Bayburt', 'Karadeniz'], ['70', 'Karaman', 'İç Anadolu'], ['71', 'Kırıkkale', 'İç Anadolu'], ['72', 'Batman', 'Güneydoğu Anadolu'],
  ['73', 'Şırnak', 'Güneydoğu Anadolu'], ['74', 'Bartın', 'Karadeniz'], ['75', 'Ardahan', 'Doğu Anadolu'], ['76', 'Iğdır', 'Doğu Anadolu'],
  ['77', 'Yalova', 'Marmara'], ['78', 'Karabük', 'Karadeniz'], ['79', 'Kilis', 'Güneydoğu Anadolu'], ['80', 'Osmaniye', 'Akdeniz'],
  ['81', 'Düzce', 'Karadeniz'],
].map(([id, name, region]) => ({ id, name, region }))

// Gösterim amaçlı örnek ulaşım verisi bulunan iller (gerçek belediye verisi değildir).
export const DEMO_CITY_IDS = ['06', '34', '35', '16', '07', '26']
