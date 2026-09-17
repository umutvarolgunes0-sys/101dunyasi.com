# 101dunyasi.com — Professional DJ Radio

## Local Windows setup

> For the most reliable local development, use a normal folder such as `C:\101dunyasi.com` instead of a OneDrive-synced folder. The app now retries Windows file locking, but a sync client can still hold runtime files open.

1. Extract the project to `C:\101dunyasi.com`.
2. Open PowerShell in the project folder.
3. Run `npm.cmd install`.
4. Run `npm.cmd run dev`.
5. Open `http://localhost:3000/setup`.
6. Create your own Webmaster username and password.

If you intentionally want a fresh local installation:

```powershell
npm.cmd run reset:local
npm.cmd run dev
```

Do not use the reset command after the site contains data you need.

## Core radio flow

- The station is always in either `DJ` or `AUTO` mode.
- A DJ starts a live session from the DJ Studio and grants browser microphone access.
- The browser sends WebM/Opus microphone chunks to the Node.js radio server over Socket.IO.
- The server converts that input to a shared MP3 stream at `/radio/live.mp3`.
- Listeners hear the same station stream instead of separate peer-to-peer WebRTC calls.
- If the DJ socket disconnects, the configured fallback timer starts. The server then switches to the local automatic playlist and keeps `/radio/live.mp3` alive.
- The default automatic playlist contains `Blok3 - Sebebi Yar` from `public/music/blok3-sebebi-yar.mp3`.
- When the DJ returns and starts a new broadcast, the station switches back to the DJ stream.

## DJ Studio

DJ, Admin and Webmaster can:

- start/stop the live broadcast
- mute/unmute the microphone while staying live
- edit the program title and announcement
- upload MP3/WAV/OGG/WEBM/M4A files
- manage a local music library
- create playlists
- handle song requests
- view online listeners
- toggle Disco Mode
- keep chat open while operating the studio

## Chat and community

- realtime chat
- online users/presence
- moderation delete/clear
- emoji reactions
- GOLD fireworks effect
- song requests
- profile and biography
- role and custom permissions

## Administration

- Webmaster Control Center
- role/permission matrix
- user search and per-user permission modal
- password changes
- GOLD status
- ban/unban
- DJ management
- radio controls
- site settings
- audit log
- mobile-friendly management screens

## Security / production notes

- No demo credentials are shipped.
- The first Webmaster is created during `/setup`.
- Set a strong `JWT_SECRET` in production.
- Use HTTPS in production.
- Store media in persistent/object storage for production rather than a local filesystem.
- A production database should replace the local JSON store for multi-instance deployments.
- Any third-party station stream must be licensed for redistribution before use.
