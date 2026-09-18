const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const radioStream = require('./radioStream');

let ffmpegStatic = null;
try { ffmpegStatic = require('ffmpeg-static'); } catch {}

class RadioEngine extends EventEmitter {
  constructor() {
    super();
    this.ffmpeg = null;
    this.current = null;
    this.queue = [];
    this.index = 0;
    this.running = false;
  }

  setQueue(tracks) {
    this.queue = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
    if (this.index >= this.queue.length) this.index = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startNext();
  }

  stop() {
    this.running = false;
    if (this.ffmpeg) {
      try { this.ffmpeg.kill('SIGTERM'); } catch {}
      this.ffmpeg = null;
    }
    this.current = null;
  }

  startNext() {
    if (!this.running) return;
    if (!this.queue.length) {
      this.running = false;
      this.emit('idle');
      return;
    }

    const track = this.queue[this.index % this.queue.length];
    this.index = (this.index + 1) % Math.max(this.queue.length, 1);
    const file = track.url?.startsWith('/') ? path.join(process.cwd(), 'public', track.url) : track.url;

    if (!file || !fs.existsSync(file)) {
      setImmediate(() => this.startNext());
      return;
    }

    this.current = { id: track.id, name: track.name, url: track.url, startedAt: new Date().toISOString() };
    this.emit('track', this.current);

    const binary = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
    const args = [
      '-hide_banner', '-loglevel', 'error',
      '-re', '-i', file,
      '-vn', '-ac', '2', '-ar', '44100',
      '-c:a', 'libmp3lame', '-b:a', '128k',
      '-f', 'mp3', 'pipe:1'
    ];

    try {
      this.ffmpeg = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.ffmpeg.stdout.on('data', chunk => radioStream.broadcast(chunk));
      this.ffmpeg.stderr.on('data', () => {});
      this.ffmpeg.on('error', () => {
        this.ffmpeg = null;
        if (this.running) setImmediate(() => this.startNext());
      });
      this.ffmpeg.on('close', () => {
        this.ffmpeg = null;
        if (this.running) setImmediate(() => this.startNext());
      });
    } catch {
      this.ffmpeg = null;
      if (this.running) setImmediate(() => this.startNext());
    }
  }

  addSubscriber(res) { radioStream.addSubscriber(res); }
}

const key = Symbol.for('101dunyasi.radioEngine');
if (!globalThis[key]) globalThis[key] = new RadioEngine();
module.exports = globalThis[key];
