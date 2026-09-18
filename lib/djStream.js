const { spawn } = require('child_process');
const EventEmitter = require('events');
const radioStream = require('./radioStream');

let ffmpegStatic = null;
try { ffmpegStatic = require('ffmpeg-static'); } catch {}

class DJStreamEngine extends EventEmitter {
  constructor() {
    super();
    this.ffmpeg = null;
    this.active = false;
    this.owner = null;
    this.startedAt = null;
    this.lastAudioAt = null;
  }

  start(owner) {
    this.active = true;
    this.owner = owner || this.owner || null;
    this.startedAt = this.startedAt || new Date().toISOString();
    this.ensureProcess();
  }

  ensureProcess() {
    if (!this.active || this.ffmpeg) return;
    const binary = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
    const args = [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'webm', '-i', 'pipe:0',
      '-vn', '-ac', '2', '-ar', '44100',
      '-c:a', 'libmp3lame', '-b:a', '128k',
      '-f', 'mp3', 'pipe:1'
    ];
    try {
      this.ffmpeg = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      this.ffmpeg.stdout.on('data', chunk => radioStream.broadcast(chunk));
      this.ffmpeg.stderr.on('data', () => {});
      this.ffmpeg.on('error', err => {
        this.emit('error', err);
        this.ffmpeg = null;
      });
      this.ffmpeg.on('close', () => {
        this.ffmpeg = null;
        if (this.active) setTimeout(() => this.ensureProcess(), 150);
      });
      this.emit('started', { owner: this.owner, startedAt: this.startedAt });
    } catch (err) {
      this.ffmpeg = null;
      this.emit('error', err);
    }
  }

  push(chunk) {
    if (!this.active || !chunk) return;
    this.lastAudioAt = new Date().toISOString();
    this.ensureProcess();
    try {
      if (this.ffmpeg?.stdin?.writable) this.ffmpeg.stdin.write(chunk);
    } catch {}
  }

  stop() {
    this.active = false;
    this.owner = null;
    this.startedAt = null;
    this.lastAudioAt = null;
    if (this.ffmpeg) {
      try { this.ffmpeg.stdin.end(); } catch {}
      try { this.ffmpeg.kill('SIGTERM'); } catch {}
      this.ffmpeg = null;
    }
    this.emit('stopped');
  }

  isLive() { return this.active; }
  status() {
    return {
      active: this.active,
      owner: this.owner,
      startedAt: this.startedAt,
      lastAudioAt: this.lastAudioAt
    };
  }
}

const key = Symbol.for('101dunyasi.djStream');
if (!globalThis[key]) globalThis[key] = new DJStreamEngine();
module.exports = globalThis[key];
