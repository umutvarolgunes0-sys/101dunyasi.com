import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { readData, writeData } from '@/lib/store';
export async function POST(req) {
  const user = getUserFromCookies(req.cookies);
  if (!user || !['DJ', 'ADMIN', 'WEBMASTER'].includes(user.role)) return NextResponse.json({ error: 'DJ yetkisi gerekli.' }, { status: 403 });
  const body = await req.json();
  const data = readData();
  const live = body.live === undefined ? data.radio.live : !!body.live;
  data.radio = {
    ...data.radio,
    live,
    dj: live ? (body.dj || user.username) : null,
    title: String(body.title ?? data.radio.title).slice(0, 120),
    announcement: String(body.announcement ?? data.radio.announcement).slice(0, 300),
    startedAt: live ? (data.radio.startedAt || new Date().toISOString()) : null
  };
  writeData(data);
  return NextResponse.json(data.radio);
}
