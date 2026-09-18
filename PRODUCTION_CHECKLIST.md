# 101dunyasi.com production checklist

## Application
- Node.js 20+
- `JWT_SECRET` set to a long random value
- `NODE_ENV=production`
- HTTPS enabled
- Secure cookies enabled automatically in production

## Radio
- `ffmpeg` installed (the included Dockerfile installs it)
- DJ WebRTC configured
- TURN server configured with `NEXT_PUBLIC_TURN_*` for NAT-restricted listeners
- Auto radio music stored in persistent storage or included in the deployment image
- Uploaded DJ music moved to object storage before using ephemeral hosting

## Data
- Development: JSON store under `data/`
- Production recommendation: move the store to PostgreSQL and use Redis for presence/rate limiting before scaling horizontally
- Never commit `.env`, `data/`, or uploaded music

## Deployment
- Use Docker / VPS / Node Web Service that supports a long-running Node process and the `/radio/live.mp3` stream.
- Do not deploy this custom-server build as a serverless-only function set.
