import {NextResponse} from 'next/server';
import {put, del} from '@vercel/blob';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData} from '@/lib/store';

const allowed=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/webm','audio/mp4'];
export const runtime='nodejs';

export async function GET(){
  const d=await readData();
  return NextResponse.json({music:d.music});
}

export async function POST(req){
  const u=getUserFromCookies(req.cookies);
  if(!u||!['DJ','ADMIN','WEBMASTER'].includes(u.role)) return NextResponse.json({error:'DJ yetkisi gerekli.'},{status:403});
  const form=await req.formData();
  const file=form.get('file');
  if(!file||typeof file.arrayBuffer!=='function') return NextResponse.json({error:'Ses dosyası seçilmedi.'},{status:400});
  if(file.type&&!allowed.includes(file.type)) return NextResponse.json({error:'MP3, WAV, OGG, WEBM veya M4A yükleyebilirsin.'},{status:400});
  const d=await readData();
  const max=(d.settings.maxUploadMb||50)*1024*1024;
  if(file.size>max) return NextResponse.json({error:`Dosya en fazla ${d.settings.maxUploadMb||50} MB olabilir.`},{status:400});
  const safe=`music/${Date.now().toString(36)}-${crypto.randomUUID()}-${String(file.name||'track.mp3').replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const blob=await put(safe,file,{access:'public',addRandomSuffix:false});
  const item={id:crypto.randomUUID(),name:String(file.name).slice(0,120),url:blob.url,size:file.size,uploadedBy:u.username,createdAt:new Date().toISOString(),enabled:true};
  d.music.push(item);
  await writeData(d);
  return NextResponse.json({music:item});
}

export async function DELETE(req){
  const u=getUserFromCookies(req.cookies);
  if(!u||!['DJ','ADMIN','WEBMASTER'].includes(u.role)) return NextResponse.json({error:'Yetki gerekli.'},{status:403});
  const {id}=await req.json();
  const d=await readData();
  const item=d.music.find(x=>x.id===String(id));
  if(!item) return NextResponse.json({error:'Parça bulunamadı.'},{status:404});
  if(item.url?.startsWith('http')) { try { await del(item.url); } catch {} }
  d.music=d.music.filter(x=>x.id!==String(id));
  await writeData(d);
  return NextResponse.json({ok:true});
}
