import {NextResponse} from 'next/server';
import {readData,writeData,audit} from '@/lib/store';
import {compare,sign} from '@/lib/auth';

export async function POST(req){
  const body=await req.json();
  const username=String(body.username||'').trim();
  const password=String(body.password||'');
  const data=readData();
  const user=data.users.find(u=>u.username.toLowerCase()===username.toLowerCase());
  if(!user || !(await compare(password,user.passwordHash))) return NextResponse.json({error:'Kullanıcı adı veya şifre hatalı.'},{status:401});
  if(user.status==='banned') return NextResponse.json({error:'Bu hesap engellendi.'},{status:403});
  user.lastLoginAt=new Date().toISOString();
  audit(data,user.username,'login','session');
  writeData(data);
  const res=NextResponse.json({user:{id:user.id,username:user.username,role:user.role,gold:!!user.gold}});
  res.cookies.set('token',sign(user),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*7,path:'/'});
  return res;
}
