import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { readData, writeData, publicUser } from '@/lib/store';

export async function PATCH(req) {
  const actor = getUserFromCookies(req.cookies);
  if (!actor || !['ADMIN','WEBMASTER'].includes(actor.role)) return NextResponse.json({ error: 'Admin yetkisi gerekli.' }, { status: 403 });
  const { id, role, status } = await req.json();
  const data = readData();
  const target = data.users.find(u => u.id === String(id));
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  if (role && !['USER', 'MODERATOR', 'DJ', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Geçersiz rol.' }, { status: 400 });
  if (target.id === actor.id && role && role !== 'ADMIN') return NextResponse.json({ error: 'Kendi admin yetkini kaldıramazsın.' }, { status: 400 });
  if (role) target.role = role;
  if (status) target.status = status === 'banned' ? 'banned' : 'active';
  writeData(data);
  return NextResponse.json({ user: publicUser(target) });
}

export async function DELETE(req) {
  const actor = getUserFromCookies(req.cookies);
  if (!actor || !['ADMIN','WEBMASTER'].includes(actor.role)) return NextResponse.json({ error: 'Admin yetkisi gerekli.' }, { status: 403 });
  const { id } = await req.json();
  if (String(id) === String(actor.id)) return NextResponse.json({ error: 'Kendi hesabını silemezsin.' }, { status: 400 });
  const data = readData();
  const before = data.users.length;
  data.users = data.users.filter(u => u.id !== String(id));
  if (before === data.users.length) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  writeData(data);
  return NextResponse.json({ ok: true });
}
