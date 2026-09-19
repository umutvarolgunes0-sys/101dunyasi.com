import {NextResponse} from 'next/server';
import {readData,writeData,audit} from '@/lib/store';
import {hash,sign} from '@/lib/auth';

export async function GET(){
  const d=await readData();
  return NextResponse.json({required:!d.setup.completed && d.users.length===0,completed:d.setup.completed});
}

export async function POST(req){
  const d=await readData();
  if(d.setup.completed || d.users.length>0) return NextResponse.json({error:'İlk kurulum zaten tamamlandı.'},{status:409});
  const body=await req.json();
  const username=String(body.username||'').trim();
  const password=String(body.password||'');
  const siteName=String(body.siteName||'101dunyasi.com').trim().slice(0,80)||'101dunyasi.com';
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return NextResponse.json({error:'Webmaster kullanıcı adı 3-24 karakter olmalı.'},{status:400});
  if(password.length<10) return NextResponse.json({error:'Webmaster şifresi en az 10 karakter olmalı.'},{status:400});
  const now=new Date().toISOString();
  const user={id:`wm-${Date.now()}`,username,passwordHash:await hash(password),role:'WEBMASTER',status:'active',permissions:[],createdAt:now,bio:'101dunyasi.com site kurucusu',avatar:'',gold:true};
  d.users.push(user);
  d.setup={completed:true,createdAt:now};
  d.settings.stationName=siteName;
  audit(d,user.username,'initial_setup','system');
  await writeData(d);
  const res=NextResponse.json({ok:true,user:{id:user.id,username:user.username,role:user.role,gold:true}});
  res.cookies.set('token',sign(user),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*7,path:'/'});
  return res;
}
