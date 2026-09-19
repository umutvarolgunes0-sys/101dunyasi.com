import {NextResponse} from 'next/server';import {getUserFromCookies} from '@/lib/auth';import {readData} from '@/lib/store';
export async function GET(req){const u=getUserFromCookies(req.cookies);if(!u||u.role!=='WEBMASTER')return NextResponse.json({error:'Webmaster yetkisi gerekli.'},{status:403});return NextResponse.json({logs:(await readData()).auditLogs.slice(-200).reverse()})}
