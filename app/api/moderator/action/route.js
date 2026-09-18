import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit,roleLevel} from '@/lib/store';

export async function PATCH(req){
  const actor=getUserFromCookies(req.cookies);
  if(!actor||!['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(actor.role))
    return NextResponse.json({error:'Moderasyon yetkisi gerekli.'},{status:403});
  const {id,action,durationSec}=await req.json();
  const data=readData();
  const target=data.users.find(u=>String(u.id)===String(id));
  if(!target)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  if(String(target.id)===String(actor.id))return NextResponse.json({error:'Kendine müdahale edemezsin.'},{status:400});
  const actorLevel=roleLevel(actor.role),targetLevel=roleLevel(target.role);
  if(actorLevel<=targetLevel)return NextResponse.json({error:'Bu kullanıcıya bu seviyede müdahale edemezsin.'},{status:403});

  if(action==='mute'){
    const sec=Math.max(10,Math.min(86400,Number(durationSec||300)));
    target.mutedUntil=new Date(Date.now()+sec*1000).toISOString();
    audit(data,actor.username,'user_mute',target.username,{durationSec:sec});
  } else if(action==='unmute'){
    target.mutedUntil=null;
    audit(data,actor.username,'user_unmute',target.username);
  } else if(action==='ban'){
    if(actor.role==='MODERATOR'&&targetLevel>=roleLevel('DJ'))return NextResponse.json({error:'Moderatör bu rol seviyesini banlayamaz.'},{status:403});
    target.status='banned';
    audit(data,actor.username,'user_ban',target.username);
  } else if(action==='unban'){
    target.status='active';
    audit(data,actor.username,'user_unban',target.username);
  } else if(action==='gold'){
    if(!['ADMIN','WEBMASTER'].includes(actor.role))return NextResponse.json({error:'Gold yetkisi Admin/Webmaster içindir.'},{status:403});
    target.gold=!target.gold;
    audit(data,actor.username,'user_gold',target.username,{gold:!!target.gold});
  } else {
    return NextResponse.json({error:'Geçersiz işlem.'},{status:400});
  }
  writeData(data);
  return NextResponse.json({ok:true,user:{id:target.id,username:target.username,role:target.role,status:target.status,gold:!!target.gold,mutedUntil:target.mutedUntil||null}});
}
