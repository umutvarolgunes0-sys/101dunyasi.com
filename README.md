# DJ Radio Platform PRO

Full-stack starter for a live DJ/radio platform.

## Included
- Next.js web UI
- PostgreSQL schema
- JWT authentication
- Roles: USER / DJ / ADMIN
- Socket.IO realtime chat/presence/signaling
- WebRTC microphone signaling
- TURN/STUN environment configuration
- Persistent users, rooms, messages, bans and moderation logs
- DJ panel
- Admin panel
- Rate limiting hook
- Docker Compose for PostgreSQL + Redis

## Setup
1. Copy `.env.example` to `.env.local`.
2. Start infrastructure:
   `docker compose up -d postgres redis`
3. Install:
   `npm install`
4. Initialize DB:
   `npm run db:push`
5. Start:
   `npm run dev`
6. Start realtime server separately:
   `npm run realtime`

## Important production notes
- Set a long random JWT_SECRET.
- Configure real TURN credentials. STUN alone is not sufficient for all NATs.
- Put the app behind HTTPS.
- Replace the development login seed with a real registration/email verification flow.
- Add a reverse proxy and secure CORS/Origin allowlist.
- Do not trust role values from the browser; authorization is server-side.
