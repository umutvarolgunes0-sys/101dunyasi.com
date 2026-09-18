import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { readData, writeData } from '@/lib/store';
export async function GET() { return NextResponse.json({ messages: readData().messages.slice(-100) }); }
export async function DELETE(req) {
  const user = getUserFromCookies(req.cookies);
  if (!user || !['ADMIN', 'DJ'].includes(user.role)) return NextResponse.json({ error: 'Yetki gerekli.' }, { status: 403 });
  const { id } = await req.json();
  const data = readData(); data.messages = data.messages.filter(m => String(m.id) !== String(id)); writeData(data); return NextResponse.json({ ok: true });
}
