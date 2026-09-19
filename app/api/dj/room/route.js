export const runtime='nodejs';
import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit} from '@/lib/store';

export async function POST(req){
  const user=getUserFromCookies(req.cookies);
  if(!user||!['DJ','ADMIN','WEBMASTER'].includes(user.role))return NextResponse.json({error:'DJ yetkisi gerekli.'},{status:403});
  const body=await req.json();const data=await readData();const live=body.live===undefined?data.radio.live:!!body.live;
  const autoUrl=data.music.find(m=>m.enabled!==false&&m.url)?.url||'/music/blok3-sebebi-yar.mp3';
  data.radio={...data.radio,live,mode:live?'DJ':'AUTO',dj:live?user.username:null,currentSource:live?'DJ_METADATA':'AUTO_RADIO',
    title:String(body.title??data.radio.title).slice(0,120),announcement:String(body.announcement??data.radio.announcement).slice(0,300),
    startedAt:live?(data.radio.startedAt||new Date().toISOString()):null,disco:!!body.disco,streamUrl:autoUrl};
  audit(data,user.username,live?'dj_live_start':'dj_live_stop','radio');
  await writeData(data);return NextResponse.json(data.radio);
}
