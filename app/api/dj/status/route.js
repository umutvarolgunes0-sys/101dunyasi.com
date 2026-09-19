import {NextResponse} from 'next/server';
import {readData} from '@/lib/store';
import presence from '@/lib/presence';
export async function GET(){const d=await readData();return NextResponse.json({...d.radio,listeners:presence.list().length,streamUrl:(d.radio.mode==='AUTO'?(d.music.find(m=>m.enabled!==false&&m.url)?.url||'/music/blok3-sebebi-yar.mp3'):'/radio/live.mp3'),sourceLabel:d.radio.live?`🎙️ DJ ${d.radio.dj||''}`.trim():'🎵 101dunyasi.com Otomatik Yayın'})}
