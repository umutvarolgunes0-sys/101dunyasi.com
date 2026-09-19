import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData} from '@/lib/store';

export async function GET(){return NextResponse.json({messages:(await readData()).messages.slice(-100)});}

export async function POST(req){
 const user=getUserFromCookies(req.cookies);
 if(!user) return NextResponse.json({error:'Giriş gerekli.'},{status:401});
 const d=await readData();
 const me=d.users.find(x=>String(x.id)===String(user.id));
 if(!me||me.status==='banned') return NextResponse.json({error:'Hesap kullanılamıyor.'},{status:403});
 if(me.mutedUntil&&new Date(me.mutedUntil).getTime()>Date.now()) return NextResponse.json({error:'Susturuldun.'},{status:403});
 const body=await req.json();
 let text=String(body.text||'').replace(/\s+/g,' ').trim().slice(0,500);
 if(!text) return NextResponse.json({error:'Mesaj boş.'},{status:400});
 const bad=String(d.settings.badWords||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(bad.some(w=>text.toLowerCase().includes(w))) return NextResponse.json({error:'Mesaj filtreye takıldı.'},{status:400});
 const m={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,userId:me.id,username:me.username,role:me.role,gold:!!me.gold,text,createdAt:new Date().toISOString()};
 d.messages.push(m);d.messages=d.messages.slice(-800);await writeData(d);
 return NextResponse.json({message:m});
}
export async function DELETE(req){
 const user=getUserFromCookies(req.cookies);
 if(!user||!['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user.role)) return NextResponse.json({error:'Yetki gerekli.'},{status:403});
 const {id}=await req.json();const data=await readData();data.messages=data.messages.filter(m=>String(m.id)!==String(id));await writeData(data);return NextResponse.json({ok:true});
}
