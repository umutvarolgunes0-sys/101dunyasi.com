import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,publicUser} from '@/lib/store';
export async function GET(req){const user=getUserFromCookies(req.cookies);if(!user||!['ADMIN','WEBMASTER'].includes(user.role))return NextResponse.json({error:'Yönetim yetkisi gerekli.'},{status:403});return NextResponse.json({users:readData().users.map(publicUser)})}
