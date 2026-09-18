import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData} from '@/lib/store';
export async function GET(req){const u=getUserFromCookies(req.cookies);if(!u)return NextResponse.json({notifications:[]});return NextResponse.json({notifications:readData().notifications.filter(n=>String(n.userId)===String(u.id)).slice(0,100)})}
export async function PATCH(req){const u=getUserFromCookies(req.cookies);if(!u)return NextResponse.json({error:'Giriş gerekli.'},{status:401});const {id}=await req.json();const d=readData();const n=d.notifications.find(x=>x.id===String(id)&&String(x.userId)===String(u.id));if(n)n.read=true;writeData(d);return NextResponse.json({ok:true})}
