import {NextResponse} from 'next/server';
import {readData,writeData,audit} from '@/lib/store';
import {hash,sign} from '@/lib/auth';

export async function POST(req){
  const body=await req.json();
  const name=String(body.username||'').trim();
  const password=String(body.password||'');
  const data=await readData();
  if(!data.settings.registrationEnabled) return NextResponse.json({error:'Yeni üyelikler şu anda kapalı.'},{status:403});
  if(data.settings.maintenance) return NextResponse.json({error:'Site bakım modunda.'},{status:503});
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(name)||password.length<8) return NextResponse.json({error:'Kullanıcı adı 3-24 karakter, şifre en az 8 karakter olmalı.'},{status:400});
  if(data.users.some(u=>u.username.toLowerCase()===name.toLowerCase())) return NextResponse.json({error:'Bu kullanıcı adı zaten kayıtlı.'},{status:409});
  const user={id:`u-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,username:name,passwordHash:await hash(password),role:'USER',status:'active',permissions:[],createdAt:new Date().toISOString(),bio:'',avatar:'',gold:false,xp:0,level:1};
  data.users.push(user);
  audit(data,name,'register','user');
  await writeData(data);
  const res=NextResponse.json({user:{id:user.id,username:user.username,role:user.role,gold:false}},{status:201});
  res.cookies.set('token',sign(user),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*7,path:'/'});
  return res;
}
