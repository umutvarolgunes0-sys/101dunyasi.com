import {NextResponse} from 'next/server';
import {getUserFromCookies,hash} from '@/lib/auth';
import {readData,writeData,publicUser,roleLevel,audit} from '@/lib/store';

export async function PATCH(req){
  const actor=getUserFromCookies(req.cookies);
  if(!actor||!['ADMIN','WEBMASTER'].includes(actor.role))return NextResponse.json({error:'Yönetim yetkisi gerekli.'},{status:403});
  const {id,role,status,password,bio,gold,permissions}=await req.json();
  const data=await readData();
  const target=data.users.find(u=>String(u.id)===String(id));
  if(!target)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  if(actor.role==='ADMIN' && roleLevel(target.role)>=4 && target.id!==actor.id)return NextResponse.json({error:'Admin, Webmaster/Admin yetkisine sahip hesabı değiştiremez.'},{status:403});
  if(target.id===actor.id && role && role!==target.role)return NextResponse.json({error:'Kendi rolünü değiştiremezsin.'},{status:400});
  if(role&&!['USER','MODERATOR','DJ','ADMIN','WEBMASTER'].includes(role))return NextResponse.json({error:'Geçersiz rol.'},{status:400});
  if(actor.role==='ADMIN'&&role==='WEBMASTER')return NextResponse.json({error:'Webmaster rolünü yalnızca Webmaster verebilir.'},{status:403});
  if(role)target.role=role;
  if(status)target.status=status==='banned'?'banned':'active';
  if(password!==undefined){if(String(password).length<8)return NextResponse.json({error:'Şifre en az 8 karakter olmalı.'},{status:400});target.passwordHash=await hash(String(password));}
  if(bio!==undefined)target.bio=String(bio).slice(0,500);
  if(gold!==undefined)target.gold=!!gold;
  if(Array.isArray(permissions))target.permissions=permissions.slice(0,100);
  audit(data,actor.username,'admin_user_update',target.username,{role:target.role,status:target.status,gold:!!target.gold});
  await writeData(data);
  return NextResponse.json({user:publicUser(target)})
}

export async function DELETE(req){
  const actor=getUserFromCookies(req.cookies);
  if(!actor||!['ADMIN','WEBMASTER'].includes(actor.role))return NextResponse.json({error:'Yönetim yetkisi gerekli.'},{status:403});
  const {id}=await req.json();
  if(String(id)===String(actor.id))return NextResponse.json({error:'Kendi hesabını silemezsin.'},{status:400});
  const data=await readData();const target=data.users.find(u=>String(u.id)===String(id));
  if(!target)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  if(actor.role==='ADMIN'&&roleLevel(target.role)>=4)return NextResponse.json({error:'Bu hesap Admin yetkisinin üstünde.'},{status:403});
  data.users=data.users.filter(u=>String(u.id)!==String(id));audit(data,actor.username,'user_delete',target.username);await writeData(data);return NextResponse.json({ok:true});
}
