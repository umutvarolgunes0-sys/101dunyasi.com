import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData} from '@/lib/store';
import presence from '@/lib/presence';
export async function GET(req){const u=getUserFromCookies(req.cookies);if(!u||!['ADMIN','WEBMASTER'].includes(u.role))return NextResponse.json({error:'Yönetim yetkisi gerekli.'},{status:403});const d=readData();return NextResponse.json({users:d.users.length,admins:d.users.filter(x=>x.role==='ADMIN').length,djs:d.users.filter(x=>x.role==='DJ').length,moderators:d.users.filter(x=>x.role==='MODERATOR').length,messages:d.messages.length,banned:d.users.filter(x=>x.status==='banned').length,music:d.music.length,requests:d.requests.length,radio:{...d.radio,listeners:presence.list().length},settings:d.settings})}
