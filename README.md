# Linktree Tarzı Profil Sitesi

Modern, responsive ve şık bir Linktree tarzı profil sitesi. YouTube ve Kick canlı yayın durumu kontrolü, müzik çalma, sosyal medya linkleri, video galerisi ve detaylı analytics özellikleriyle donatılmıştır.

## 🚀 Özellikler

- 🌙 **Koyu Tema** - Modern dark mode tasarım
- 🎨 **Glassmorphism** - Cam efekti ile şık görünüm
- ✨ **Animasyonlar** - Hover efektleri ve glow animasyonları
- 📱 **Tam Responsive** - Mobil, tablet ve masaüstü uyumlu
- 🎵 **Müzik Çalma** - YouTube müzik desteği
- 🔴 **Canlı Yayın Durumu** - YouTube ve Kick canlı yayın kontrolü (API kullanmadan)
- 👤 **Admin Paneli** - Kolay içerik yönetimi
- 🎬 **Video Galerisi** - Son videolar bölümü
- 🔐 **Şifre Korumalı Admin** - Güvenli admin paneli
- 📊 **Dashboard & Analytics** - Detaylı görüntülenme ve tıklama istatistikleri
- 🛡️ **Spam Koruması** - Bot ve aşırı tıklama koruması
- 🔄 **Şifre Yönetimi** - Admin panelinden şifre değiştirme

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Git

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/TheOrderx/StreamLink/tree/main
cd ste
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
# Windows
copy .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

Sonra `.env.local` dosyasını düzenleyin:

```bash
# Admin Panel Şifresi
NEXT_PUBLIC_ADMIN_PASSWORD=1234567

# YouTube API Key (Video bilgileri için - opsiyonel)
# Canlı yayın kontrolü API kullanmaz, bu yüzden zorunlu değildir.
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Not:** 
- YouTube API key sadece admin panelinde video bilgilerini otomatik çekmek için kullanılır (opsiyonel).
- Canlı yayın kontrolü API kullanmaz, bu yüzden YouTube API key zorunlu değildir.
- Admin şifresini mutlaka değiştirin!

### 4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### 5. İlk Kurulum

1. Ana sayfayı kontrol edin: [http://localhost:3000](http://localhost:3000)
2. Admin paneline giriş yapın: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Şifre: `.env.local` dosyasındaki `NEXT_PUBLIC_ADMIN_PASSWORD` değeri
3. Profil bilgilerinizi güncelleyin
4. Sosyal medya linklerinizi ekleyin
5. Videolarınızı ekleyin
6. Admin panelinden şifrenizi değiştirin (Güvenlik menüsü)

### 6. Production Build

```bash
npm run build
npm start
```

## 📁 Proje Yapısı

```
ste/
├── app/
│   ├── admin/              # Admin paneli
│   │   ├── login/         # Admin giriş sayfası
│   │   └── page.tsx       # Admin ana sayfa (Dashboard, Profil, Sosyal Medya, Videolar, Güvenlik)
│   ├── api/               # API routes
│   │   ├── admin/         # Admin işlemleri
│   │   │   └── password/  # Şifre değiştirme
│   │   ├── analytics/     # Analytics işlemleri
│   │   │   ├── track/     # Görüntülenme takibi
│   │   │   └── link-click/ # Link tıklama takibi
│   │   ├── kick/          # Kick canlı yayın kontrolü
│   │   ├── links/         # Veri yönetimi
│   │   └── youtube/       # YouTube işlemleri
│   │       ├── live-status/ # Canlı yayın kontrolü (API kullanmadan)
│   │       └── route.ts   # Video bilgileri
│   ├── page.tsx           # Ana profil sayfası
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global stiller
│   ├── error.tsx          # Hata sayfası
│   ├── not-found.tsx      # 404 sayfası
│   ├── global-error.tsx   # Global hata sayfası
│   └── loading.tsx        # Yükleme sayfası
├── data/
│   ├── links.json         # İçerik verileri
│   └── analytics.json     # Analytics verileri (gitignore'da)
├── public/                # Statik dosyalar
└── package.json           # Bağımlılıklar
```

## ⚙️ Yapılandırma

### Admin Paneline Giriş

1. Tarayıcınızda `/admin` adresine gidin
2. Şifre: `.env.local` dosyasındaki `NEXT_PUBLIC_ADMIN_PASSWORD` değeri
3. Varsayılan şifre: `1234567`
4. İlk girişten sonra şifrenizi değiştirmeniz önerilir (Güvenlik menüsü)

### İçerik Yönetimi

Admin panelinden şunları yönetebilirsiniz:

#### Dashboard
- Görüntülenme istatistikleri (Son 24 saat, 7 gün, 30 gün, Toplam)
- En çok tıklanan linkler istatistikleri
- İstatistikleri sıfırlama

#### Profil Bilgileri
- İsim
- Profil fotoğrafı URL
- YouTube Kanal ID (UC... formatında)
- Kick Kullanıcı Adı
- Çevrimdışı mesajları (YouTube ve Kick için ayrı)
- Müzik URL

#### Sosyal Medya Linkleri
- Platform adı
- URL
- İkon seçimi
- Renk özelleştirme (border ve glow)

#### Videolar
- Video başlığı
- Tarih
- Thumbnail URL
- Video URL (YouTube otomatik thumbnail ve tarih desteği)

#### Güvenlik
- Admin şifresi değiştirme

### YouTube Kanal ID Nasıl Bulunur?

1. YouTube'da kanal sayfanıza gidin
2. URL'deki `UC...` ile başlayan 22 karakterlik kısım kanal ID'nizdir
3. Örnek: `https://www.youtube.com/channel/UC12345678901234567890`
   - Kanal ID: `UC12345678901234567890`

### Kick Kullanıcı Adı Nasıl Bulunur?

1. Kick profil sayfanıza gidin
2. URL'deki `kick.com/kullaniciadi` kısmındaki kullanıcı adınızı girin
3. Örnek: `https://kick.com/orderflex`
   - Kullanıcı adı: `orderflex`

## 🎨 Özelleştirme

### Renkler ve Tema

Renkleri `app/globals.css` dosyasından özelleştirebilirsiniz:

- Arka plan gradient: `bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black`
- Glassmorphism efektleri: `.glass` class'ı
- Glow efektleri: `.glow-red`, `.glow-red-strong` class'ları

### Sosyal Medya Butonları

Admin panelinden her buton için:
- Border rengi (RGBA formatında)
- Glow rengi (RGBA formatında)
- İkon rengi (Tailwind class)

## 🔧 API Routes

### `/api/links`
- `GET`: Tüm içeriği getirir
- `PUT`: İçeriği günceller

### `/api/youtube/live-status`
- `GET`: YouTube canlı yayın durumunu kontrol eder (API kullanmadan)
- Parametre: `channelId` (YouTube kanal ID)
- Cache: 5 dakika

### `/api/kick/live`
- `GET`: Kick canlı yayın durumunu kontrol eder
- Parametre: `username` (Kick kullanıcı adı)

### `/api/youtube`
- `GET`: YouTube video bilgilerini getirir (admin paneli için)
- Parametre: `videoId` (YouTube video ID)

### `/api/analytics/track`
- `POST`: Görüntülenme kaydı oluşturur
- `GET`: Görüntülenme istatistiklerini getirir
- `DELETE`: Görüntülenme istatistiklerini sıfırlar

### `/api/analytics/link-click`
- `POST`: Link tıklama kaydı oluşturur (spam koruması ile)
- `GET`: Link tıklama istatistiklerini getirir
- `DELETE`: Link tıklama istatistiklerini sıfırlar

### `/api/admin/password`
- `GET`: Şifre varlığını kontrol eder
- `PUT`: Şifreyi günceller

## 📝 Veri Yapısı

### `data/links.json`

```json
{
  "socialLinks": [
    {
      "id": 1,
      "name": "YouTube",
      "url": "https://www.youtube.com",
      "icon": "Youtube",
      "iconColor": "text-red-500",
      "borderColor": "rgba(239, 68, 68, 0.4)",
      "glowColor": "rgba(239, 68, 68, 0.3)"
    }
  ],
  "videos": [
    {
      "id": 1234567890,
      "title": "Video Başlığı",
      "date": "1 Şubat 2025",
      "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ],
  "profile": {
    "name": "Kullanıcı Adı",
    "image": "https://example.com/profile.jpg",
    "musicUrl": "https://www.youtube.com/watch?v=MUSIC_ID",
    "youtubeChannelId": "UC...",
    "kickUsername": "kullaniciadi",
    "youtubeOfflineMessage": "İyi ki canlı yayında değiliz. 😛",
    "kickOfflineMessage": "Şimdilik Kick'te değiliz. 😊"
  },
  "adminPassword": "1234567"
}
```

### `data/analytics.json` (Otomatik oluşturulur)

```json
{
  "views": [
    {
      "timestamp": 1234567890,
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "linkClicks": [
    {
      "linkId": 1,
      "linkName": "YouTube",
      "timestamp": 1234567890,
      "ip": "192.168.1.1"
    }
  ]
}
```
## 🔒 Güvenlik

- Admin paneli şifre korumalıdır
- Şifre `.env.local` dosyasında veya `data/links.json` içinde saklanır (Git'e commit edilmez)
- SessionStorage kullanarak oturum yönetimi yapılır
- 24 saatlik oturum süresi
- Spam koruması: Bot filtreleme ve rate limiting
- IP bazlı duplicate kontrolü

## 📊 Analytics Özellikleri

### Görüntülenme İstatistikleri
- Son 24 saat, 7 gün, 30 gün ve toplam görüntülenme sayıları
- Her benzersiz IP'den 5 dakikada bir sayılır
- Botlar ve crawler'lar otomatik filtrelenir
- Aynı kullanıcı sayfayı yenilerse 5 dakika içinde tekrar sayılmaz

### Link Tıklama İstatistikleri
- En çok tıklanan linkler (Son 24 saat ve tüm zamanlar)
- Toplam tıklama sayıları
- Spam koruması:
  - Aynı IP'den aynı linke 10 saniye içinde tekrar tıklama engellenir
  - Aynı IP'den 1 dakika içinde 10'dan fazla farklı linke tıklama engellenir
  - Bot ve crawler filtreleme

### İstatistikleri Sıfırlama
- Dashboard'dan tüm istatistikleri tek seferde sıfırlama
- Link tıklama istatistiklerini ayrı sıfırlama

## 🎯 Özellikler Detayı

### Canlı Yayın Kontrolü
- **YouTube**: API kullanmadan, kanal sayfasından kontrol edilir
- **Kick**: Kick API v2 kullanılarak kontrol edilir
- Her 20 saniyede bir otomatik kontrol
- 5 dakika cache süresi
- Bağımsız kontrol (bir platform offline olsa bile diğeri çalışır)

### Müzik Çalma
- YouTube URL desteği
- Otomatik çalma (tarayıcı politikalarına göre)
- Play/Pause kontrolü
- Düşük ses seviyesi (50%)

### Responsive Tasarım
- Mobil: Tek sütun, kompakt görünüm
- Tablet: 2 sütun grid
- Desktop: 3 sütun grid (sosyal medya), 2 sütun grid (videolar)

### Admin Paneli
- **Dashboard**: İstatistikler ve en çok tıklanan linkler
- **Profil**: Temel bilgiler, canlı yayın ayarları, mesajlar, medya
- **Sosyal Medya**: Link ekleme, düzenleme, silme, renk özelleştirme
- **Videolar**: Video ekleme, düzenleme, silme, YouTube otomatik bilgi çekme
- **Güvenlik**: Şifre değiştirme

## 🐛 Bilinen Sorunlar

- YouTube canlı yayın kontrolü bazen gecikebilir (cache nedeniyle)
- Müzik otomatik çalma bazı tarayıcılarda çalışmayabilir (tarayıcı politikaları)
- Analytics verileri `.gitignore`'da olduğu için Git'e commit edilmez (her deployment'ta sıfırlanır)

## 🔄 Güncellemeler

### v2.0.0
- Dashboard ve analytics özellikleri
- Link tıklama istatistikleri
- Spam koruması
- Şifre değiştirme özelliği
- İstatistikleri sıfırlama

### v1.0.0
- İlk stabil sürüm
- YouTube ve Kick canlı yayın kontrolü
- Admin paneli
- Müzik çalma özelliği
- Responsive tasarım

## 📄 Lisans

Bu proje özel kullanım içindir.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 Destek

Sorularınız için issue açabilirsiniz.
