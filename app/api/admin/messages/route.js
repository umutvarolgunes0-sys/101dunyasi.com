import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit} from '@/lib/store';
export async function DELETE(req){const user=getUserFromCookies(req.cookies);if(!user||!['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user.role))return NextResponse.json({error:'Yetki gerekli.'},{status:403});const {id}=await req.json();const data=await readData();data.messages=data.messages.filter(m=>String(m.id)!==String(id));audit(data,user.username,'delete_message',String(id));await writeData(data);return NextResponse.json({ok:true})}
