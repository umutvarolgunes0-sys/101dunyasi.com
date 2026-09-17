import { NextResponse } from 'next/server';
import { readData } from '@/lib/store';
export async function GET() { return NextResponse.json(readData().radio); }
