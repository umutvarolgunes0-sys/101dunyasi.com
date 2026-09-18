export const runtime='nodejs';
import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit} from '@/lib/store';
const radioEngine=require('@/lib/radioEngine');
const djStream=require('@/lib/djStream');

export async function POST(req){
  const user=getUserFromCookies(req.cookies);
  if(!user||!['DJ','ADMIN','WEBMASTER'].includes(user.role))return NextResponse.json({error:'DJ yetkisi gerekli.'},{status:403});
  const body=await req.json();
  const data=readData();
  const live=body.live===undefined?data.radio.live:!!body.live;
  if(live){
    radioEngine.stop();
    djStream.start(user.username);
    data.radio={...data.radio,live:true,mode:'DJ',dj:user.username,currentSource:'DJ_SERVER_STREAM',title:String(body.title??data.radio.title).slice(0,120),announcement:String(body.announcement??data.radio.announcement).slice(0,300),startedAt:data.radio.startedAt||new Date().toISOString(),disco:!!body.disco,streamUrl:'/radio/live.mp3'};
    audit(data,user.username,'dj_live_start','radio');
  }else{
    djStream.stop();
    data.radio={...data.radio,live:false,mode:'AUTO',dj:null,currentSource:'AUTO_RADIO',title:'101dunyasi.com Otomatik Yayın',announcement:String(body.announcement??data.radio.announcement).slice(0,300),startedAt:null,disco:!!body.disco,streamUrl:'/radio/live.mp3'};
    const tracks=data.music.filter(m=>m.enabled!==false&&m.url);
    radioEngine.setQueue(tracks.length?tracks:[{id:'seed-blok3',name:'Blok3 - Sebebi Yar',url:'/music/blok3-sebebi-yar.mp3'}]);
    radioEngine.start();
    audit(data,user.username,'dj_live_stop','radio');
  }
  writeData(data);
  return NextResponse.json(data.radio);
}
