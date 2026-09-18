import {NextResponse} from 'next/server';
import {readData} from '@/lib/store';
import presence from '@/lib/presence';
export async function GET(){const d=readData();return NextResponse.json({...d.radio,listeners:presence.list().length,streamUrl:'/radio/live.mp3',sourceLabel:d.radio.live?`🎙️ DJ ${d.radio.dj||''}`.trim():'🎵 101dunyasi.com Otomatik Yayın'})}
