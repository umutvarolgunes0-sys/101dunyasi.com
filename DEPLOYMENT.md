# 101dunyasi.com — Vercel sürümü

Bu sürüm Next.js App Router + Vercel Functions + Neon Postgres + Vercel Blob için hazırlanmıştır.

## Gerekli Vercel bağlantıları

- Neon Postgres: projeye bağlı olmalı.
- Vercel Blob: `101dunyasi-music` store bağlı olmalı.
- `DATABASE_URL` ve `BLOB_READ_WRITE_TOKEN` environment variables Vercel tarafından projeye eklenmiş olmalı.
- `JWT_SECRET` üretip Vercel Project Settings → Environment Variables bölümüne ekleyin.

## Deploy

GitHub'a bu sürümü push ettikten sonra Vercel otomatik olarak `npm run build` çalıştırır.

`node_modules/` GitHub'a yüklenmemelidir.

## Önemli

Vercel sürümünde kalıcı veriler Neon'a, müzik dosyaları Blob'a yazılır. Eski `server.js`, yerel `db.json` ve FFmpeg tabanlı sürekli yayın motoru kullanılmaz.

Otomatik müzik oynatma tarayıcı tarafında Blob/public URL üzerinden yapılır. Gerçek zamanlı DJ mikrofon yayını için ayrı bir sürekli çalışan yayın servisi gerekir; bu sürümde DJ durumu ve yönetim API'leri Vercel üzerinde çalışır.
