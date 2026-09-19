import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,publicUser,audit} from '@/lib/store';
export async function PATCH(req){const tokenUser=getUserFromCookies(req.cookies);if(!tokenUser)return NextResponse.json({error:'Giriş gerekli.'},{status:401});const b=await req.json(),d=await readData(),me=d.users.find(x=>String(x.id)===String(tokenUser.id));if(!me)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});me.bio=String(b.bio||'').slice(0,500);audit(d,me.username,'profile_update',me.username);await writeData(d);return NextResponse.json({user:publicUser(me)})}
