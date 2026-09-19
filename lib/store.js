import { neon } from '@neondatabase/serverless';

function db(){ if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is required.'); return neon(process.env.DATABASE_URL); }

const defaultData = () => ({
  users:[], messages:[], requests:[], favorites:[], schedules:[], moderationLogs:[],
  music:[{id:'seed-blok3',name:'Blok3 - Sebebi Yar',url:'/music/blok3-sebebi-yar.mp3',size:0,uploadedBy:'system',createdAt:new Date().toISOString(),enabled:true}],
  auditLogs:[], radioSources:[],
  playlists:[{id:'default-auto',name:'Otomatik Yayın',trackIds:['seed-blok3'],shuffle:false,repeat:'all',enabled:true}],
  permissions:{
    WEBMASTER:['users.manage','users.password','users.roles','dj.manage','moderation','chat.delete','chat.clear','radio.live','radio.settings','music.manage','requests.manage','requests.create','site.settings','site.theme','security.view','backup'],
    ADMIN:['users.manage','dj.manage','moderation','chat.delete','requests.manage','requests.create','radio.live','music.manage'],
    DJ:['radio.live','radio.settings','music.manage','requests.manage','requests.create','chat.delete'],
    MODERATOR:['moderation','chat.delete','chat.clear','requests.manage'],
    USER:['chat.send','requests.create']
  },
  notifications:[], reports:[],
  settings:{stationName:'101dunyasi.com',welcome:'Canlı DJ • Sohbet • Topluluk',siteNotice:'',autoFallback:true,requestEnabled:true,registrationEnabled:true,maintenance:false,maxUploadMb:50,fallbackDelaySec:5,slowModeSec:0,badWords:'',giphyEnabled:false,theme:'dark'},
  setup:{completed:false,createdAt:null},
  radio:{live:false,mode:'AUTO',dj:null,title:'101dunyasi.com Otomatik Yayın',announcement:'',listeners:0,startedAt:null,currentTrack:null,currentSource:'AUTO_RADIO',disco:false,streamUrl:'/music/blok3-sebebi-yar.mp3'}
});

function mergeDefaults(d={}) {
  const base=defaultData();
  for(const k of Object.keys(base)) if(d[k]===undefined) d[k]=base[k];
  for(const k of ['users','messages','requests','favorites','schedules','moderationLogs','music','auditLogs','radioSources','playlists','notifications','reports']) if(!Array.isArray(d[k])) d[k]=[];
  d.permissions={...base.permissions,...(d.permissions||{})};
  d.settings={...base.settings,...(d.settings||{})};
  d.radio={...base.radio,...(d.radio||{})};
  d.setup={...base.setup,...(d.setup||{})};
  for(const u of d.users){u.permissions=Array.isArray(u.permissions)?u.permissions:[];u.status=u.status||'active';u.gold=!!u.gold;u.bio=u.bio||'';u.avatar=u.avatar||'';u.mutedUntil=u.mutedUntil||null;}
  return d;
}

let initPromise;
async function ensure(){
  if(!initPromise){
    initPromise=(async()=>{
      const sql=db();
      await sql`CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      const rows=await sql`SELECT id FROM app_state WHERE id=1`;
      if(!rows.length) await sql`INSERT INTO app_state (id,data) VALUES (1, ${JSON.stringify(defaultData())}::jsonb)`;
    })().catch(e=>{initPromise=null;throw e});
  }
  return initPromise;
}

export async function readData(){
  await ensure();
  const sql=db();
  const rows=await sql`SELECT data FROM app_state WHERE id=1`;
  return mergeDefaults(rows[0]?.data||{});
}

export async function writeData(d){
  const merged=mergeDefaults(d);
  await ensure();
  const sql=db();
  await sql`UPDATE app_state SET data=${JSON.stringify(merged)}::jsonb, updated_at=NOW() WHERE id=1`;
  return merged;
}

export function publicUser(u){
  return u?{id:u.id,username:u.username,role:u.role,status:u.status||'active',createdAt:u.createdAt,bio:u.bio||'',avatar:u.avatar||'',gold:!!u.gold,mutedUntil:u.mutedUntil||null,permissions:Array.isArray(u.permissions)?u.permissions:[]}:null;
}
export function roleLevel(r){return {USER:1,MODERATOR:2,DJ:3,ADMIN:4,WEBMASTER:5}[r]||0}
export function audit(data,actor,action,target,meta){
  data.auditLogs.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,actor,action,target:target||'',meta:meta||null,at:new Date().toISOString()});
  data.auditLogs=data.auditLogs.slice(0,500);
}
export function notify(data,userId,type,title,body){
  data.notifications.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,userId,type,title,body,read:false,createdAt:new Date().toISOString()});
  data.notifications=data.notifications.slice(0,500);
}
