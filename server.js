const http=require('http');
const next=require('next');
const {Server}=require('socket.io');
const jwt=require('jsonwebtoken');
const {readData,writeData,audit}=require('./lib/store');
const radioEngine=require('./lib/radioEngine');
const djStream=require('./lib/djStream');
const radioStream=require('./lib/radioStream');
const presenceStore=require('./lib/presence');

const dev=process.env.NODE_ENV!=='production';
const app=next({dev});
const handle=app.getRequestHandler();
const port=Number(process.env.PORT||3000);
const secret=process.env.JWT_SECRET || (dev?'local-dev-secret-change-before-production':null);
const fallbackTimers=new Map();

function userFromSocket(socket){
  const a=socket.handshake.auth?.token;
  const c=socket.handshake.headers?.cookie||'';
  const ct=c.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
  const t=a||ct;
  if(!t||!secret)return null;
  try{return jwt.verify(decodeURIComponent(t),secret)}catch{return null}
}
function clean(u){return u?{id:u.id,username:u.username,role:u.role,gold:!!u.gold,socketId:u.socketId}:null}
function radioState(){return readData().radio}
function broadcastRadio(io){io.to('radio').emit('radio:status',radioState())}
function cancelFallback(username){
  const timer=fallbackTimers.get(username);
  if(timer){clearTimeout(timer);fallbackTimers.delete(username)}
}
function autoTracks(d){
  const active=d.playlists?.find(p=>p.enabled!==false&&p.name==='Otomatik Yayın')||d.playlists?.find(p=>p.enabled!==false);
  const ids=new Set(active?.trackIds||[]);
  const tracks=ids.size?d.music.filter(m=>ids.has(String(m.id))&&m.enabled!==false&&m.url):d.music.filter(m=>m.enabled!==false&&m.url);
  return tracks.length?tracks:[{id:'seed-blok3',name:'Blok3 - Sebebi Yar',url:'/music/blok3-sebebi-yar.mp3'}];
}
function syncAutoEngine(){
  const d=readData();
  if(d.radio.mode!=='AUTO')return;
  radioEngine.setQueue(autoTracks(d));
  radioEngine.start();
}
function setAutoFallback(io,reason,username){
  const d=readData();
  if(!d.settings.autoFallback)return;
  const delay=Math.max(0,Math.min(60,Number(d.settings.fallbackDelaySec||5)))*1000;
  cancelFallback(username||d.radio.dj||'current');
  const key=username||d.radio.dj||'current';
  const timer=setTimeout(()=>{
    fallbackTimers.delete(key);
    const now=readData();
    if(now.radio.mode!=='DJ'&&now.radio.live===false)return;
    if(username&&now.radio.dj&&now.radio.dj!==username)return;
    djStream.stop();
    now.radio={...now.radio,live:false,mode:'AUTO',dj:null,currentSource:'AUTO_RADIO',title:'101dunyasi.com Otomatik Yayın',announcement:reason||'DJ bağlantısı kesildi. Otomatik yayın devam ediyor.',startedAt:null,streamUrl:'/radio/live.mp3'};
    audit(now,'system','auto_fallback','radio',reason||'fallback');
    writeData(now);
    syncAutoEngine();
    io.to('radio').emit('radio:status',now.radio);
    io.to('radio').emit('rtc:stop');
  },delay);
  fallbackTimers.set(key,timer);
}

app.prepare().then(()=>{
  // Never leave a stale DJ live state after a server restart.
  try{
    const d=readData();
    if(d.radio.mode==='DJ'||d.radio.live){d.radio={...d.radio,live:false,mode:'AUTO',dj:null,currentSource:'AUTO_RADIO',title:'101dunyasi.com Otomatik Yayın',startedAt:null,streamUrl:'/radio/live.mp3'};writeData(d)}
  }catch{}

  const hs=http.createServer((req,res)=>{
    const cleanPath=req.url?.split('?')[0];
    if(cleanPath==='/radio/live.mp3'){
      if(readData().radio.mode==='AUTO')syncAutoEngine();
      radioStream.addSubscriber(res);
      return;
    }
    handle(req,res);
  });
  const io=new Server(hs,{cors:{origin:true,credentials:true},maxHttpBufferSize:2*1024*1024});

  radioEngine.on('track',track=>{
    const d=readData();
    if(d.radio.mode==='AUTO'){d.radio.currentTrack=track;d.radio.currentSource='AUTO_RADIO';writeData(d);broadcastRadio(io)}
  });
  djStream.on('error',()=>io.to('radio').emit('notice',{message:'DJ ses motoru başlatılamadı. ffmpeg kontrol ediliyor.'}));

  io.on('connection',socket=>{
    const user=userFromSocket(socket);
    socket.data.user=user;
    socket.join('radio');
    if(user)presenceStore.set(socket.id,{...clean(user),socketId:socket.id});
    presence(io);
    if(user)socket.emit('session:user',clean(user));

    socket.on('chat:send',payload=>{
      if(!user||typeof payload?.text!=='string')return;
      const d=readData();
      const me=d.users.find(x=>String(x.id)===String(user.id));
      if(!me||me.status==='banned')return;
      if(me.mutedUntil&&new Date(me.mutedUntil).getTime()>Date.now()){
        const left=Math.max(1,Math.ceil((new Date(me.mutedUntil).getTime()-Date.now())/1000));
        return socket.emit('chat:error',{error:`Susturuldun. ${left} saniye sonra tekrar yazabilirsin.`});
      }
      const now=Date.now();
      const last=d.messages.slice().reverse().find(m=>String(m.userId)===String(me.id));
      const slow=Number(d.settings.slowModeSec||0);
      if(last&&slow>0&&now-new Date(last.createdAt).getTime()<slow*1000)return socket.emit('chat:error',{error:`Yavaş mod: ${slow} saniye bekle.`});
      let text=payload.text.replace(/\s+/g,' ').trim().slice(0,500);
      if(!text)return;
      const bad=String(d.settings.badWords||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
      if(bad.some(w=>w&&text.toLowerCase().includes(w)))return socket.emit('chat:error',{error:'Mesaj filtreye takıldı.'});
      const m={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,userId:me.id,username:me.username,role:me.role,gold:!!me.gold,text,createdAt:new Date().toISOString()};
      d.messages.push(m);d.messages=d.messages.slice(-800);writeData(d);io.to('radio').emit('chat:message',m);
    });
    socket.on('chat:delete',({id})=>{
      if(!user||!['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user.role))return;
      const d=readData();d.messages=d.messages.filter(m=>String(m.id)!==String(id));audit(d,user.username,'delete_message',String(id));writeData(d);io.to('radio').emit('chat:deleted',{id});
    });
    socket.on('chat:clear',()=>{
      if(!user||!['ADMIN','WEBMASTER'].includes(user.role))return;
      const d=readData();d.messages=[];audit(d,user.username,'clear_chat','chat');writeData(d);io.to('radio').emit('chat:cleared');
    });
    socket.on('chat:reaction',emoji=>{if(user&&typeof emoji==='string')io.to('radio').emit('chat:reaction',{username:user.username,emoji:String(emoji).slice(0,8),gold:!!user.gold})});

    socket.on('dj:state',payload=>{
      if(!user||!['DJ','ADMIN','WEBMASTER'].includes(user.role))return;
      const d=readData();
      const live=!!payload?.live;
      cancelFallback(user.username);
      if(live){
        radioEngine.stop();
        djStream.start(user.username);
        d.radio={...d.radio,live:true,mode:'DJ',dj:user.username,currentSource:'DJ_SERVER_STREAM',title:String(payload?.title||d.radio.title).slice(0,120),announcement:String(payload?.announcement||d.radio.announcement).slice(0,300),startedAt:d.radio.startedAt||new Date().toISOString(),disco:!!payload?.disco,streamUrl:'/radio/live.mp3'};
        audit(d,user.username,'dj_live_start','radio');
      }else{
        djStream.stop();
        d.radio={...d.radio,live:false,mode:'AUTO',dj:null,currentSource:'AUTO_RADIO',title:'101dunyasi.com Otomatik Yayın',startedAt:null,disco:!!payload?.disco,streamUrl:'/radio/live.mp3'};
        audit(d,user.username,'dj_live_stop','radio');
        writeData(d);syncAutoEngine();io.to('radio').emit('radio:status',d.radio);return;
      }
      writeData(d);broadcastRadio(io);
    });

    // Real DJ audio: MediaRecorder sends WebM/Opus chunks to the server.
    socket.on('dj:audio',chunk=>{
      if(!user||!['DJ','ADMIN','WEBMASTER'].includes(user.role))return;
      const d=readData();
      if(!d.radio.live||d.radio.mode!=='DJ'||d.radio.dj!==user.username)return;
      const buf=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
      djStream.push(buf);
    });

    // Legacy WebRTC signaling retained for backwards compatibility with older clients.
    socket.on('rtc:offer',({target,description})=>{if(!user||!['DJ','ADMIN','WEBMASTER'].includes(user.role)||!target||!description)return;io.to(target).emit('rtc:offer',{from:socket.id,description})});
    socket.on('rtc:answer',({target,description})=>{if(!target||!description)return;io.to(target).emit('rtc:answer',{from:socket.id,description})});
    socket.on('rtc:ice',({target,candidate})=>{if(target&&candidate)io.to(target).emit('rtc:ice',{from:socket.id,candidate})});

    socket.on('disconnect',()=>{
      if(user?.role==='DJ'){
        const d=readData();
        if(d.radio.live&&d.radio.dj===user.username)setAutoFallback(io,`DJ ${user.username} bağlantısını kaybetti. Otomatik yayın devreye girecek.`,user.username);
      }
      presenceStore.del(socket.id);
      presence(io);
    });
  });

  hs.listen(port,()=>console.log(`101dunyasi.com running on http://localhost:${port}`));
});

function presence(io){
  const users=[...presenceStore.list()];
  io.to('radio').emit('presence',{count:users.length,users});
}
