# 101dunyasi.com V4 Professional Radio Platform

## Kurulum

```powershell
npm.cmd install
npm.cmd run dev
```

Tarayıcı: http://localhost:3000

## Roller
- WEBMASTER: site kurucusu, tüm sistem ve yetki yönetimi
- ADMIN: operasyon, ekip ve moderasyon
- DJ: canlı yayın, mikrofon, müzik arşivi ve istekler
- MODERATOR: topluluk güvenliği
- USER: dinleme, sohbet ve şarkı isteği

## Webmaster
`/webmaster` içinde ekip, yetki matrisi, yayın kaynakları, fallback, playlist, program, site ve audit yönetimi bulunur.

## Otomatik yayın
DJ bağlantısı kesildiğinde sistem otomatik moda geçer. İnternet yedek kaynakları Webmaster > Radyo bölümünden tanımlanabilir. FM frekansı tek başına tarayıcıya ses vermez; internet stream URL gerekir.

## Müzik
DJ, ana sohbet ekranındaki Çalışma Alanı > Müzik bölümünden ses dosyası yükleyebilir. Dosyalar `public/music/uploads` altında tutulur.

## Production notu
Gerçek yayında PostgreSQL/Redis, HTTPS, TURN, rate limit ve güvenli environment secret kullanın. Başka bir radyonun stream'ini yeniden yayınlamak için gerekli izin/lisanslar ayrıca sağlanmalıdır.
