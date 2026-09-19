import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,publicUser} from '@/lib/store';
export async function GET(req){
  const tokenUser=getUserFromCookies(req.cookies);
  if(!tokenUser) return NextResponse.json({user:null});
  const me=(await readData()).users.find(u=>String(u.id)===String(tokenUser.id));
  return NextResponse.json({user:publicUser(me)||null});
}
