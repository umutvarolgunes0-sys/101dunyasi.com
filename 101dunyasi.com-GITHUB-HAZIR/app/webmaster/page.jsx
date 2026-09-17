'use client';
import {useEffect,useMemo,useState} from 'react';
import {io} from 'socket.io-client';
import ChatPanel from '@/components/ChatPanel';

const roles=['USER','MODERATOR','DJ','ADMIN','WEBMASTER'];
const permNames={
'users.manage':'Kullanıcı yönetimi','dj.manage':'DJ yönetimi','moderation':'Moderasyon','chat.delete':'Sohbet mesajı silme',
'radio.live':'Canlı yayın','music.manage':'Müzik yönetimi','requests.manage':'İstek yönetimi','requests.create':'Şarkı isteği',
'site.settings':'Site ayarları','radio.sources':'Yayın kaynakları','backup':'Yedekleme'
};

export default function Webmaster(){
 const[me,setMe]=useState(null),[tab,setTab]=useState('overview'),[data,setData]=useState(null),[users,setUsers]=useState([]),
 [perm,setPerm]=useState({}),[allPerm,setAllPerm]=useState([]),[sources,setSources]=useState([]),[playlists,setPlaylists]=useState([]),
 [schedules,setSchedules]=useState([]),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[userSearch,setUserSearch]=useState(''),
 [selected,setSelected]=useState(null),[liveUsers,setLiveUsers]=useState([]),[pw,setPw]=useState({current:'',next:'',confirm:''});
 const[site,setSite]=useState({stationName:'101dunyasi.com',welcome:'',siteNotice:'',autoFallback:true,fallbackDelaySec:5});

 async function load(){
  setBusy(true);
  try{
   const m=await fetch('/api/auth/me').then(r=>r.json());setMe(m.user);
   if(m.user?.role!=='WEBMASTER')return;
   const [o,u,p,r]=await Promise.all([fetch('/api/webmaster/overview'),fetch('/api/webmaster/users'),fetch('/api/webmaster/permissions'),fetch('/api/webmaster/radio')]);
   const [oj,uj,pj,rj]=await Promise.all([o.json(),u.json(),p.json(),r.json()]);
   setData(oj);setUsers(uj.users||[]);setPerm(pj.permissions||{});setAllPerm(pj.all||[]);
   setSources(rj.sources||[]);setPlaylists(rj.playlists||[]);setSchedules(rj.schedules||[]);setSite(oj.settings||site);
  }finally{setBusy(false)}
 }
 useEffect(()=>{load();const s=io({withCredentials:true});s.on('presence',p=>setLiveUsers(p.users||[]));return()=>s.close()},[]);

 if(me&&me.role!=='WEBMASTER')return <main><div className="panel" style={{maxWidth:650,margin:'80px auto'}}>Bu alana yalnızca WEBMASTER erişebilir.</div></main>;

 async function changeOwnPassword(e){
  e.preventDefault();setMsg('');
  if(pw.next!==pw.confirm){setMsg('Yeni şifreler eşleşmiyor.');return}
  const r=await fetch('/api/webmaster/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:pw.current,newPassword:pw.next})});
  const x=await r.json();setMsg(r.ok?'Webmaster şifresi değiştirildi.':x.error);if(r.ok)setPw({current:'',next:'',confirm:''});
 }
 async function saveSite(){const r=await fetch('/api/webmaster/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(site)});setMsg(r.ok?'Site ayarları kaydedildi.':(await r.json()).error);load()}
 async function userPatch(id,patch){
  const r=await fetch('/api/webmaster/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...patch})});
  const x=await r.json();setMsg(r.ok?'Kullanıcı güncellendi.':x.error);if(r.ok){setSelected(prev=>prev?.id===id?{...prev,...x.user}:prev);load()}
 }
 async function savePerm(role){const r=await fetch('/api/webmaster/permissions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,permissions:perm[role]||[]})});setMsg(r.ok?'Rol yetkileri kaydedildi.':(await r.json()).error);load()}
 async function addSource(e){e.preventDefault();const f=new FormData(e.currentTarget);const body={type:'source',name:f.get('name'),url:f.get('url'),fmFrequency:f.get('fmFrequency'),kind:f.get('kind'),priority:f.get('priority')};const r=await fetch('/api/webmaster/radio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});setMsg(r.ok?'Yayın kaynağı eklendi.':(await r.json()).error);if(r.ok)e.currentTarget.reset();load()}
 async function sourcePatch(s){const r=await fetch('/api/webmaster/radio',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'source',id:s.id,enabled:!s.enabled})});setMsg(r.ok?'Kaynak durumu değiştirildi.':(await r.json()).error);load()}
 async function del(type,id){if(!confirm('Silmek istediğine emin misin?'))return;const r=await fetch('/api/webmaster/radio',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,id})});setMsg(r.ok?'Silindi.':'İşlem başarısız.');load()}

 const filtered=useMemo(()=>users.filter(u=>u.username.toLowerCase().includes(userSearch.toLowerCase())),[users,userSearch]);

 return <main className="admin">
  <header className="siteHeader"><div><span className="brand">101<span>dunyasi</span></span><div className="sub">WEBMASTER • SİTE KURUCUSU</div></div>
   <div className="top"><span className="roleBadge">WEBMASTER</span><b>{me?.username}</b><a className="navBtn" href="/">← Canlı Radyo</a></div>
  </header>
  <div className="adminWrap">
   <div className="adminIntro"><div><div className="eyebrow">CONTROL CENTER</div><h1>Webmaster Merkezi</h1><p className="muted">Sistem, ekip ve yayın kontrolü</p></div><button className="navBtn" onClick={load} disabled={busy}>{busy?'Yükleniyor…':'↻ Yenile'}</button></div>
   {msg&&<div className="notice">{msg}<button className="noticeClose" onClick={()=>setMsg('')}>×</button></div>}

   <div className="workspaceTabs">{[
    ['overview','📊 Genel'],['team','👥 Kullanıcılar'],['permissions','🔐 Roller'],['radio','📻 Radyo'],
    ['playlists','🎵 Playlist'],['schedule','🗓 Program'],['site','⚙️ Site'],['security','🛡 Güvenlik']
   ].map(([k,t])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{t}</button>)}</div>

   {tab==='overview'&&<><div className="statsGrid">
    <Stat n={data?.users||0} t="Kullanıcı"/><Stat n={data?.djs||0} t="DJ"/><Stat n={data?.admins||0} t="Admin"/><Stat n={data?.moderators||0} t="Moderatör"/><Stat n={data?.music||0} t="Müzik"/>
   </div><div className="adminCards">
    <section className="panel"><div className="panelTitle"><h2>🟢 Çevrimiçi</h2><span>{liveUsers.length}</span></div><div className="proUserGrid">{liveUsers.slice(0,20).map(u=><div className="proUser" key={u.id}><span className="avatar">{u.username[0]?.toUpperCase()}</span><div><b>{u.username}</b><small>{u.role}</small></div><span className="onlineDot">●</span></div>)}</div>{!liveUsers.length&&<p className="muted">Şu anda bağlı kullanıcı yok.</p>}</section>
    <section className="panel"><h2>📡 Yayın</h2><div className="liveBox"><b>{data?.radio?.live?'🔴 DJ CANLI':'🎵 OTOMATİK YAYIN'}</b><span>{data?.radio?.dj||'Otomatik yayın'}</span><small>{data?.radio?.title||'—'}</small></div></section>
    <section className="panel"><h2>🧾 Son İşlemler</h2>{(data?.audit||[]).slice(0,8).map(x=><div className="requestAdmin" key={x.id}><b>{x.action}</b><small>{x.actor} · {new Date(x.at).toLocaleString('tr-TR')}</small></div>)}</section>
   </div></>}

   {tab==='team'&&<section className="panel">
    <div className="panelTitle"><div><h2>👥 Kullanıcı ve Yetki Yönetimi</h2><small className="muted">Kullanıcıya tıklayarak ayrıntılı yetki panelini aç</small></div><span>{filtered.length}/{users.length}</span></div>
    <div className="toolbar"><input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Kullanıcı ara..."/><button onClick={()=>setUserSearch('')}>Temizle</button></div>
    <div className="userCards">{filtered.map(u=><button className="userAdminCard" key={u.id} onClick={()=>setSelected(u)}>
      <span className="avatar">{u.username[0]?.toUpperCase()}</span><span className="userAdminMain"><b>{u.username}</b><small>{u.role} · {u.status}</small></span><span className="userAdminMeta">{u.gold?'⭐ GOLD':''}<i>›</i></span>
    </button>)}</div>
    {!filtered.length&&<div className="empty small">Kullanıcı bulunamadı.</div>}
   </section>}

   {tab==='permissions'&&<div className="adminCards">{['ADMIN','DJ','MODERATOR'].map(role=><section className="panel" key={role}><div className="panelTitle"><h2>🔐 {role}</h2><span>{(perm[role]||[]).length} yetki</span></div>{allPerm.map(p=><label className="check" key={p}><input type="checkbox" checked={(perm[role]||[]).includes(p)} onChange={e=>setPerm({...perm,[role]:e.target.checked?[...(perm[role]||[]),p]:(perm[role]||[]).filter(x=>x!==p)})}/>{permNames[p]||p}</label>)}<button className="big" onClick={()=>savePerm(role)}>💾 Yetkileri Kaydet</button></section>)}</div>}

   {tab==='radio'&&<><section className="panel"><div className="panelTitle"><h2>📡 Yayın Kaynakları</h2><span>{sources.length}</span></div><form onSubmit={addSource} className="quickGrid"><input name="name" placeholder="Kaynak adı" required/><input name="url" placeholder="https://.../stream veya .m3u8" required/><input name="fmFrequency" placeholder="FM frekansı (örn. 105.6 MHz)"/><select name="kind"><option>HLS</option><option>MP3</option><option>AAC</option><option>Icecast</option><option>Shoutcast</option></select><input name="priority" type="number" min="1" defaultValue="1"/><button>Kaynak Ekle</button></form></section>
   <section className="panel"><h2>🔀 Otomatik Yayın</h2><div className="settingsGrid"><label>Otomatik geçiş<input type="checkbox" checked={!!site.autoFallback} onChange={e=>setSite({...site,autoFallback:e.target.checked})}/></label><label>Bekleme (sn)<input type="number" min="1" max="60" value={site.fallbackDelaySec||5} onChange={e=>setSite({...site,fallbackDelaySec:Number(e.target.value)})}/></label></div><button className="big" onClick={async()=>{const r=await fetch('/api/webmaster/radio',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'settings',autoFallback:site.autoFallback,fallbackDelaySec:site.fallbackDelaySec,sourceId:data?.radio?.fallbackSourceId||''})});setMsg(r.ok?'Fallback ayarları kaydedildi.':(await r.json()).error);load()}}>💾 Kaydet</button></section>
   <section className="panel"><h2>Kaynaklar</h2>{sources.map(s=><div className="requestAdmin" key={s.id}><b>{s.name}</b><small>{s.fmFrequency||'FM belirtilmedi'} · {s.kind} · öncelik {s.priority}</small><div className="actions"><button onClick={()=>sourcePatch(s)}>{s.enabled?'Pasifleştir':'Aktifleştir'}</button><button className="danger" onClick={()=>del('source',s.id)}>Sil</button></div></div>)}</section></>}

   {tab==='playlists'&&<section className="panel"><h2>🎵 Playlist Yönetimi</h2>{playlists.map(p=><div className="requestAdmin" key={p.id}><b>{p.name}</b><small>{p.trackIds.length} parça · {p.shuffle?'Karışık':'Sıralı'} · tekrar: {p.repeat}</small><button className="danger" onClick={()=>del('playlist',p.id)}>Sil</button></div>)}{!playlists.length&&<div className="empty small">Henüz playlist yok.</div>}</section>}

   {tab==='schedule'&&<section className="panel"><h2>🗓 DJ Program Takvimi</h2>{schedules.map(s=><div className="requestAdmin" key={s.id}><b>{s.start}–{s.end}</b><small>Gün: {s.day} · DJ: {s.dj||'Otomatik'} · Playlist: {s.playlistId||'—'}</small><button className="danger" onClick={()=>del('schedule',s.id)}>Sil</button></div>)}{!schedules.length&&<div className="empty small">Henüz program eklenmedi.</div>}</section>}

   {tab==='site'&&<section className="panel"><h2>⚙️ Site Ayarları</h2><div className="settingsGrid"><label>Site adı<input value={site.stationName||''} onChange={e=>setSite({...site,stationName:e.target.value})}/></label><label>Karşılama<input value={site.welcome||''} onChange={e=>setSite({...site,welcome:e.target.value})}/></label><label>Site duyurusu<textarea value={site.siteNotice||''} onChange={e=>setSite({...site,siteNotice:e.target.value})}/></label><label className="check"><input type="checkbox" checked={!!site.registrationEnabled} onChange={e=>setSite({...site,registrationEnabled:e.target.checked})}/> Yeni üyeliklere izin ver</label><label className="check"><input type="checkbox" checked={!!site.requestEnabled} onChange={e=>setSite({...site,requestEnabled:e.target.checked})}/> Şarkı istekleri açık</label><label className="check"><input type="checkbox" checked={!!site.maintenance} onChange={e=>setSite({...site,maintenance:e.target.checked})}/> Bakım modu</label></div><button className="big" onClick={saveSite}>💾 Site Ayarlarını Kaydet</button></section>}

   {tab==='security'&&<div className="adminCards"><section className="panel"><div className="panelTitle"><h2>🔐 Şifre</h2><span>Webmaster</span></div><form onSubmit={changeOwnPassword} className="passwordForm"><input type="password" placeholder="Mevcut şifre" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})} required/><input type="password" placeholder="Yeni şifre" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})} minLength={8} required/><input type="password" placeholder="Yeni şifre tekrar" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})} minLength={8} required/><button className="big saveButton" type="submit">💾 Kaydet</button></form></section>
   <section className="panel"><h2>🔑 Yetkili Hesaplar</h2>{users.filter(u=>u.role!=='USER').map(u=><div className="requestAdmin" key={u.id}><b>{u.username}</b><small>{u.role}</small><button onClick={()=>setSelected(u)}>Yönet</button></div>)}</section>
   <section className="panel"><h2>📜 İşlem Kayıtları</h2>{(data?.audit||[]).slice(0,20).map(x=><div className="requestAdmin" key={x.id}><b>{x.action}</b><small>{x.actor} → {x.target||'sistem'} · {new Date(x.at).toLocaleString('tr-TR')}</small></div>)}</section></div>}

   <div className="wmBottomGrid"><ChatPanel compact/><section className="panel"><h2>⚡ Hızlı İşlemler</h2><div className="quickActions"><button onClick={()=>setTab('team')}>👥 Kullanıcılar</button><button onClick={()=>setTab('radio')}>📡 Radyo</button><button onClick={()=>setTab('permissions')}>🔐 Roller</button><button onClick={()=>setTab('security')}>🛡 Güvenlik</button></div></section></div>
  </div>

  {selected&&<UserPermissionModal u={selected} allPerm={allPerm} permNames={permNames} me={me} onClose={()=>setSelected(null)} onPatch={userPatch}/>}
 </main>
}

function UserPermissionModal({u,allPerm,permNames,me,onClose,onPatch}){
 const[role,setRole]=useState(u.role),[gold,setGold]=useState(!!u.gold),[status,setStatus]=useState(u.status||'active'),
 [password,setPassword]=useState(''),[bio,setBio]=useState(u.bio||''),[permissions,setPermissions]=useState(u.permissions||[]),[saving,setSaving]=useState(false);
 useEffect(()=>{setRole(u.role);setGold(!!u.gold);setStatus(u.status||'active');setBio(u.bio||'');setPermissions(u.permissions||[])},[u]);
 async function save(){
  setSaving(true);
  await onPatch(u.id,{role,gold,status,bio,password:password||undefined,permissions});
  setPassword('');setSaving(false);
 }
 return <div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="userPermModal">
  <div className="workspaceHead"><div><b>👤 {u.username}</b><small>Hesap ve özel yetkiler</small></div><button className="x" onClick={onClose}>×</button></div>
  <div className="modalGrid">
   <div className="panel"><h3>Hesap</h3><label>Rol<select value={role} disabled={u.id===me?.id} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
    <label>Durum<select value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Aktif</option><option value="banned">Banlı</option></select></label>
    <label>Biyografi<textarea value={bio} onChange={e=>setBio(e.target.value)}/></label>
    <label>Yeni şifre<input type="password" value={password} minLength={6} onChange={e=>setPassword(e.target.value)} placeholder="Değiştirmek istemiyorsan boş bırak"/></label>
    <label className="check"><input type="checkbox" checked={gold} onChange={e=>setGold(e.target.checked)}/> ⭐ GOLD</label>
   </div>
   <div className="panel"><h3>Özel Yetkiler</h3>{allPerm.map(p=><label className="check" key={p}><input type="checkbox" checked={permissions.includes(p)} onChange={e=>setPermissions(e.target.checked?[...new Set([...permissions,p])]:permissions.filter(x=>x!==p))}/>{permNames[p]||p}</label>)}</div>
  </div>
  <div className="modalActions"><button onClick={onClose}>İptal</button><button className="big" disabled={saving} onClick={save}>{saving?'Kaydediliyor…':'💾 Kaydet'}</button></div>
 </section></div>
}
function Stat({n,t}){return <div className="stat"><b>{n}</b><span>{t}</span></div>}
