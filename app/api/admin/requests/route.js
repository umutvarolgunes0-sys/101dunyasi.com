import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit} from '@/lib/store';
export async function PATCH(req){const u=getUserFromCookies(req.cookies);if(!u||!['ADMIN','WEBMASTER','DJ'].includes(u.role))return NextResponse.json({error:'İstek yönetimi yetkisi gerekli.'},{status:403});const {id,status}=await req.json();if(!['pending','approved','rejected','played'].includes(status))return NextResponse.json({error:'Geçersiz durum.'},{status:400});const d=await readData(),r=d.requests.find(x=>String(x.id)===String(id));if(!r)return NextResponse.json({error:'İstek bulunamadı.'},{status:404});r.status=status;audit(d,u.username,'request_status',r.song,{status});await writeData(d);return NextResponse.json({request:r})}
