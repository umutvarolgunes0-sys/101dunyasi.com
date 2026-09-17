import { NextResponse } from 'next/server';
import { readData } from '@/lib/store';
export async function GET() { return NextResponse.json({ users: readData().users.filter(u => u.status !== 'banned').map(u => ({ id: u.id, username: u.username, role: u.role })) }); }
