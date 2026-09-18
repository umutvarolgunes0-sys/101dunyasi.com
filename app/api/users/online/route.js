import {NextResponse} from 'next/server';
import presence from '@/lib/presence';
export async function GET(){return NextResponse.json({users:presence.list()})}
