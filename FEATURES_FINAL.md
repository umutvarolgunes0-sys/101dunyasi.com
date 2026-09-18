# 101dunyasi.com — Implemented core feature set

## Live radio core
- Shared station endpoint: `/radio/live.mp3`
- Browser microphone → Socket.IO binary audio → server ffmpeg → shared MP3 stream
- Automatic playlist engine using local music files
- Automatic fallback after DJ socket disconnect
- DJ return switches station back to DJ mode
- Current source/title shown in the main chat area

## DJ
- Start/stop live broadcast
- Microphone mute/unmute while staying live
- Program title + announcement
- Music upload (MP3/WAV/OGG/WEBM/M4A)
- Music archive
- Playlist creation
- Song request management
- Listener presence
- Disco mode
- Embedded chat

## Community
- Realtime chat
- Realtime online presence
- Emoji reactions with floating animation
- GOLD fireworks effect
- User profile biography
- Song requests

## Administration
- Webmaster Control Center
- Admin panel
- Moderator panel
- Per-user permission modal
- Role management
- GOLD status
- Ban/unban
- Password changes
- Site settings
- Radio settings
- Audit log

## First-run security
- No demo accounts are created
- First Webmaster is created at `/setup`
- Passwords are hashed with bcrypt
- JWT stored in an HTTP-only cookie
- `JWT_SECRET` can be set for production

## Local reliability
- Windows/OneDrive-safe write fallback for the local JSON store
- `npm run reset:local` for disposable local resets
- `ffmpeg-static` dependency so local radio conversion does not require a system ffmpeg installation
