const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'data');
const file=path.join(dir,'db.json');
const dataDirLock = new Map();

const defaultData=()=>({
  users:[],
  messages:[],
  requests:[],
  favorites:[],
  schedules:[],
  moderationLogs:[],
  music:[
    {id:'seed-blok3',name:'Blok3 - Sebebi Yar',url:'/music/blok3-sebebi-yar.mp3',size:0,uploadedBy:'system',createdAt:new Date().toISOString(),enabled:true}
  ],
  auditLogs:[],
  radioSources:[],
  playlists:[{id:'default-auto',name:'Otomatik Yayın',trackIds:['seed-blok3'],shuffle:false,repeat:'all',enabled:true}],
  permissions:{
    WEBMASTER:['users.manage','users.password','users.roles','dj.manage','moderation','chat.delete','chat.clear','radio.live','radio.settings','music.manage','requests.manage','requests.create','site.settings','site.theme','security.view','backup'],
    ADMIN:['users.manage','dj.manage','moderation','chat.delete','requests.manage','requests.create','radio.live','music.manage'],
    DJ:['radio.live','radio.settings','music.manage','requests.manage','requests.create','chat.delete'],
    MODERATOR:['moderation','chat.delete','chat.clear','requests.manage'],
    USER:['chat.send','requests.create']
  },
  notifications:[],
  reports:[],
  settings:{
    stationName:'101dunyasi.com',
    welcome:'Canlı DJ • Sohbet • Topluluk',
    siteNotice:'',
    autoFallback:true,
    requestEnabled:true,
    registrationEnabled:true,
    maintenance:false,
    maxUploadMb:50,
    fallbackDelaySec:5,
    slowModeSec:0,
    badWords:'',
    giphyEnabled:false,
    theme:'dark'
  },
  setup:{completed:false,createdAt:null},
  radio:{
    live:false,
    mode:'AUTO',
    dj:null,
    title:'101dunyasi.com Otomatik Yayın',
    announcement:'',
    listeners:0,
    startedAt:null,
    currentTrack:null,
    currentSource:'AUTO_RADIO',
    disco:false,
    streamUrl:'/radio/live.mp3'
  }
});

function ensure(){
  if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(defaultData(),null,2));
}

function mergeDefaults(d){
  const base=defaultData();
  for(const k of Object.keys(base)) if(d[k]===undefined) d[k]=base[k];
  for(const k of ['users','messages','requests','favorites','schedules','moderationLogs','music','auditLogs','radioSources','playlists','notifications','reports']) if(!Array.isArray(d[k])) d[k]=[];
  d.permissions={...base.permissions,...(d.permissions||{})};
  d.settings={...base.settings,...(d.settings||{})};
  d.radio={...base.radio,...(d.radio||{})};
  d.setup={...base.setup,...(d.setup||{})};
  for(const u of d.users){
    u.permissions=Array.isArray(u.permissions)?u.permissions:[];
    u.status=u.status||'active';
    u.gold=!!u.gold;
    u.bio=u.bio||'';
    u.avatar=u.avatar||'';
    u.mutedUntil=u.mutedUntil||null;
  }
  return d;
}

function readData(){
  ensure();
  const d=JSON.parse(fs.readFileSync(file,'utf8'));
  return mergeDefaults(d);
}

function writeData(d){
  ensure();
  const merged=mergeDefaults(d);
  const payload=JSON.stringify(merged,null,2);
  const tmp=file+'.'+process.pid+'.'+Date.now()+'.tmp';
  fs.writeFileSync(tmp,payload);

  // OneDrive/Defender can briefly lock db.json. Prefer atomic rename, then
  // fall back to a direct copy after a short retry window on Windows.
  let renamed=false;
  for(let i=0;i<4;i++){
    try{
      fs.renameSync(tmp,file);
      renamed=true;
      break;
    }catch(err){
      if(!['EPERM','EBUSY','EACCES'].includes(err?.code)) throw err;
      try{ if(fs.existsSync(file)) fs.copyFileSync(tmp,file); else fs.copyFileSync(tmp,file); renamed=true; break; }catch{}
    }
  }
  try{if(fs.existsSync(tmp))fs.rmSync(tmp,{force:true})}catch{}
  if(!renamed){
    // Last-resort direct write keeps local development usable when a sync
    // client has the target file momentarily locked.
    fs.writeFileSync(file,payload);
  }
}

function publicUser(u){
  return u?{id:u.id,username:u.username,role:u.role,status:u.status||'active',createdAt:u.createdAt,bio:u.bio||'',avatar:u.avatar||'',gold:!!u.gold,mutedUntil:u.mutedUntil||null,permissions:Array.isArray(u.permissions)?u.permissions:[]}:null;
}

function roleLevel(r){return {USER:1,MODERATOR:2,DJ:3,ADMIN:4,WEBMASTER:5}[r]||0}

function audit(data,actor,action,target,meta){
  data.auditLogs.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,actor,action,target:target||'',meta:meta||null,at:new Date().toISOString()});
  data.auditLogs=data.auditLogs.slice(0,500);
}

function notify(data,userId,type,title,body){
  data.notifications.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,userId,type,title,body,read:false,createdAt:new Date().toISOString()});
  data.notifications=data.notifications.slice(0,500);
}

module.exports={readData,writeData,publicUser,roleLevel,audit,notify};
