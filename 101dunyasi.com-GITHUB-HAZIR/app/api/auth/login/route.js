import { NextResponse } from 'next/server';
import { readData } from '@/lib/store';
import { compare, sign } from '@/lib/auth';
export async function POST(req) {
  const { username, password } = await req.json();
  const user = readData().users.find(u => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
  if (!user || !(await compare(String(password || ''), user.passwordHash))) return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
  if (user.status === 'banned') return NextResponse.json({ error: 'Bu hesap engellendi.' }, { status: 403 });
  const res = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
  res.cookies.set('token', sign(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
