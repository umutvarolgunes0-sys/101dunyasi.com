import {NextResponse} from 'next/server';
import {getUserFromCookies} from '@/lib/auth';
import {readData,writeData,audit} from '@/lib/store';
export async function PATCH(req){
 const u=getUserFromCookies(req.cookies);if(!u||u.role!=='WEBMASTER')return NextResponse.json({error:'Webmaster yetkisi gerekli.'},{status:403});
 const b=await req.json(),d=readData();
 for(const k of ['stationName','welcome','siteNotice'])if(b[k]!==undefined)d.settings[k]=String(b[k]).slice(0,300);
 for(const k of ['autoFallback','requestEnabled','registrationEnabled','maintenance','giphyEnabled'])if(typeof b[k]==='boolean')d.settings[k]=b[k];
 if(Number.isFinite(Number(b.maxUploadMb)))d.settings.maxUploadMb=Math.max(5,Math.min(200,Number(b.maxUploadMb)));
 if(Number.isFinite(Number(b.slowModeSec)))d.settings.slowModeSec=Math.max(0,Math.min(30,Number(b.slowModeSec)));
 if(typeof b.badWords==='string')d.settings.badWords=b.badWords.slice(0,1000);
 audit(d,u.username,'settings_update','site');writeData(d);return NextResponse.json({settings:d.settings});
}
