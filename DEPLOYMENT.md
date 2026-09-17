# Deployment notes

## Local

Use Node.js 20+ and run `npm.cmd install`, then `npm.cmd run dev`.
For Windows development, a non-OneDrive folder is recommended.

## Production

This build still uses a local JSON store and filesystem media by default. That is appropriate for a single-node self-hosted deployment, not a multi-instance serverless setup.

For internet production, use:

- a persistent Node.js host for `server.js`
- HTTPS/reverse proxy
- a strong `JWT_SECRET`
- persistent media/object storage
- PostgreSQL for multi-instance data
- Redis for shared presence/rate-limit/realtime state
- a TURN service if WebRTC compatibility is needed elsewhere

The shared DJ stream itself is server-generated from browser microphone chunks and exposed at `/radio/live.mp3`.
