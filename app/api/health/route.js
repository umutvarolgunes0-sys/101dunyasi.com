import {NextResponse} from 'next/server';
import {readData} from '@/lib/store';
export async function GET(){const d=readData();return NextResponse.json({ok:true,site:d.settings.stationName,setup:d.setup.completed,radio:d.radio.mode,users:d.users.length,time:new Date().toISOString()})}
