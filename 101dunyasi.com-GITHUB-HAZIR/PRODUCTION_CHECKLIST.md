# Production checklist

- Configure PostgreSQL and run migrations.
- Configure Redis for sessions, rate limits and realtime fan-out.
- Configure persistent media/object storage for music and images.
- Configure the licensed radio/stream server and fallback sources.
- Set a strong JWT_SECRET and production environment variables.
- Enable HTTPS and secure cookies.
- Configure WebSocket/Socket.IO behind the production reverse proxy.
- Configure scheduled backups and restore testing.
- Verify moderation, reporting and audit logging.
