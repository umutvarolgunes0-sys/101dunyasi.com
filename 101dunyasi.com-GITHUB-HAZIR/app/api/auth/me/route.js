import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
export async function GET(req) { const user = getUserFromCookies(req.cookies); return NextResponse.json({ user: user ? { id: user.id, username: user.username, role: user.role } : null }); }
