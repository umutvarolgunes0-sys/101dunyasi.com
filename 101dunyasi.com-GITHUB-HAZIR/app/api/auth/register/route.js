import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/store';
import { hash, sign } from '@/lib/auth';
export async function POST(req) {
  const { username, password } = await req.json();
  const name = String(username || '').trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(name) || String(password || '').length < 6) return NextResponse.json({ error: 'Kullanıcı adı 3-24 karakter, şifre en az 6 karakter olmalı.' }, { status: 400 });
  const data = readData();
  if (data.users.some(u => u.username.toLowerCase() === name.toLowerCase())) return NextResponse.json({ error: 'Bu kullanıcı adı zaten kayıtlı.' }, { status: 409 });
  const user = { id: String(Date.now()), username: name, passwordHash: await hash(password), role: 'USER', status: 'active', createdAt: new Date().toISOString() };
  data.users.push(user); writeData(data);
  const res = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } }, { status: 201 });
  res.cookies.set('token', sign(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
