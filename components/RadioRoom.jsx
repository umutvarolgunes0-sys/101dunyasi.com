'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {io} from 'socket.io-client';

const roleLabel={WEBMASTER:'Site Kurucusu',ADMIN:'Yönetici',DJ:'DJ',MODERATOR:'Moderatör',USER:'Dinleyici'};
const reactions=['❤️','😂','🔥','👏','🎉','😍','🎵','🙌','✨'];

export default function RadioRoom(){
 const[user,setUser]=useState(null),[setup,setSetup]=useState(false),[messages,setMessages]=useState([]),[text,setText]=useState(''),[online,setOnline]=useState([]),[auth,setAuth]=useState(false),[register,setRegister]=useState(false),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const[radio,setRadio]=useState({live:false,mode:'AUTO',dj:null,title:'101dunyasi.com Otomatik Yayın',announcement:'',listeners:0,disco:false,currentSource:'AUTO_RADIO',currentTrack:null,streamUrl:'/radio/live.mp3'});
 const[notice,setNotice]=useState(''),[song,setSong]=useState(''),[requests,setRequests]=useState([]),[profile,setProfile]=useState(false),[bio,setBio]=useState(''),[workspace,setWorkspace]=useState(false),[wtab,setWtab]=useState('home'),[music,setMusic]=useState([]),[upload,setUpload]=useState(null),[fireworks,setFireworks]=useState(false),[reactBurst,setReactBurst]=useState([]),[mic,setMic]=useState(false),[playing,setPlaying]=useState(false),[playlists,setPlaylists]=useState([]),[playlistName,setPlaylistName]=useState(''),[emojiOpen,setEmojiOpen]=useState(false),[gifMode,setGifMode]=useState(false),[gifUrl,setGifUrl]=useState(''),[contextMenu,setContextMenu]=useState(null);
 const socket=useRef(null),stream=useRef(null),recorder=useRef(null),audio=useRef(null),chat=useRef(null),uploadRef=useRef(null);
 const dj=!!user&&['DJ','ADMIN','WEBMASTER'].includes(user.role),mod=!!user&&['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user.role),wm=user?.role==='WEBMASTER';

 useEffect(()=>{
  Promise.all([
   fetch('/api/auth/me').then(r=>r.json()),fetch('/api/messages').then(r=>r.json()),fetch('/api/dj/status').then(r=>r.json()),
   fetch('/api/requests').then(r=>r.json()),fetch('/api/dj/music').then(r=>r.json()),fetch('/api/dj/playlists').then(r=>r.json()),fetch('/api/setup').then(r=>r.json())
  ]).then(([me,msg,rs,req,mu,pl,su])=>{
   setUser(me.user||null);setBio(me.user?.bio||'');setMessages(msg.messages||[]);setRadio(rs);setRequests(req.requests||[]);setMusic(mu.music||[]);setPlaylists(pl.playlists||[]);setSetup(!!su.required);
  }).catch(()=>{});
  const s=io({withCredentials:true});socket.current=s;
  s.on('presence',p=>{setOnline(p.users||[]);setRadio(r=>({...r,listeners:p.count||0}))});
  s.on('radio:status',r=>setRadio(r));
  s.on('chat:message',m=>setMessages(v=>[...v,m].slice(-500)));
  s.on('chat:deleted',({id})=>setMessages(v=>v.filter(m=>String(m.id)!==String(id))));
  s.on('chat:cleared',()=>setMessages([]));
  s.on('chat:error',x=>setNotice(x.error||'Sohbet işlemi başarısız.'));
  s.on('notice',x=>setNotice(x?.message||'Yayın motoru bildirimi.'));
  s.on('chat:reaction',x=>{const id=`r-${Date.now()}-${Math.random()}`;setReactBurst(v=>[...v,{id,...x}].slice(-12));setTimeout(()=>setReactBurst(v=>v.filter(a=>a.id!==id)),1400)});
  const closeMenu=()=>setContextMenu(null);
  const handleDocClick=()=>closeMenu();
  document.addEventListener('click',handleDocClick);
  return()=>{s.close();stopRecording();document.removeEventListener('click',handleDocClick)};
 },[]);

 useEffect(()=>{if(chat.current)chat.current.scrollTop=chat.current.scrollHeight},[messages]);
 useEffect(()=>{
  if(!audio.current)return;
  const shouldListen=radio.mode==='AUTO'||!dj;
  if(shouldListen){
   audio.current.src=radio.streamUrl||'/radio/live.mp3';audio.current.load();
   if(playing)audio.current.play().catch(()=>setNotice('🔊 Dinlemeyi başlatmak için ▶ butonuna bas.'));
  }else{audio.current.pause();audio.current.removeAttribute('src');audio.current.load();setPlaying(false)}
 },[radio.mode,radio.streamUrl,dj]);
 useEffect(()=>{if(radio.live&&radio.dj&&'Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})},[radio.live,radio.dj]);

 const pending=requests.filter(r=>r.status==='pending').length;
 const sourceText=radio.live?`🎙️ Canlı DJ ${radio.dj||''}`.trim():'🎵 Otomatik Yayın';
 const visibleRequests=useMemo(()=>requests.slice(0,8),[requests]);

 function stopRecording(){try{recorder.current?.stop()}catch{};recorder.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setMic(false)}
 async function enableMic(){
  if(!dj)return false;
  if(stream.current&&recorder.current?.state==='recording'){setMic(true);return true}
  try{
   const ms=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   stream.current=ms;
   const types=['audio/webm;codecs=opus','audio/webm'];
   const mime=window.MediaRecorder?.isTypeSupported?types.find(t=>window.MediaRecorder.isTypeSupported(t)):'';
   const rec=new MediaRecorder(ms,mime?{mimeType:mime}:{});
   recorder.current=rec;
   rec.ondataavailable=e=>{if(e.data?.size&&socket.current?.connected)socket.current.emit('dj:audio',e.data)};
   rec.onerror=()=>setNotice('🎤 Mikrofon yayın motoruna bağlanamadı.');
   rec.start(250);setMic(true);return true;
  }catch{setNotice('Mikrofon izni verilmedi veya tarayıcı desteklemiyor.');return false}
 }
 async function toggleLive(){
  if(!dj){setAuth(true);return}
  if(radio.live){
   stopRecording();
   const r=await fetch('/api/dj/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({live:false,disco:radio.disco,announcement:radio.announcement})});
   const x=await r.json();if(r.ok){setRadio(x);socket.current?.emit('dj:state',x);setNotice('🎵 Otomatik yayın başladı.')}else setNotice(x.error||'Yayın durdurulamadı.');return;
  }
  const ok=await enableMic();if(!ok)return;
  const body={live:true,disco:radio.disco,title:radio.title||'101dunyasi.com Live',announcement:radio.announcement||'Canlı DJ yayını'};
  const r=await fetch('/api/dj/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const x=await r.json();
  if(!r.ok){stopRecording();setNotice(x.error||'Yayın başlatılamadı.');return}
  setRadio(x);socket.current?.emit('dj:state',x);setNotice('🔴 DJ yayını başladı. Ses 101dunyasi.com ortak yayın akışına gönderiliyor.');
 }
 async function toggleMic(){
  if(!dj){setAuth(true);return}
  if(!radio.live){setNotice('Önce DJ yayınını başlat.');return}
  if(!stream.current||recorder.current?.state!=='recording'){await enableMic();return}
  const next=!(stream.current.getAudioTracks()[0]?.enabled);stream.current.getAudioTracks().forEach(t=>t.enabled=next);setMic(next);setNotice(next?'🎤 Mikrofon yayında.':'🔇 Mikrofon susturuldu.');
 }
 function toggleDisco(){if(!dj)return;const next=!radio.disco;setRadio(r=>({...r,disco:next}));socket.current?.emit('dj:state',{...radio,disco:next,live:radio.live});setNotice(next?'🪩 Disko ışıkları aktif.':'🪩 Disko ışıkları kapalı.')}
 async function quickModerate(action,target){
  const r=await fetch('/api/moderator/action',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:target.id,action,durationSec:300})});
  const x=await r.json();setContextMenu(null);setNotice(r.ok?(action==='mute'?`🔇 ${target.username} 5 dakika susturuldu.`:action==='ban'?`🚫 ${target.username} engellendi.`:action==='gold'?`⭐ ${target.username} GOLD durumu güncellendi.`:'İşlem tamamlandı.'):x.error||'İşlem başarısız.');
 }
 function userContext(e,target){
  e.preventDefault();e.stopPropagation();
  if(!mod||String(target.id)===String(user?.id))return;
  setContextMenu({x:Math.min(e.clientX,window.innerWidth-240),y:Math.min(e.clientY,window.innerHeight-220),target});
 }
 function insertEmoji(e){setText(v=>`${v}${e}`);setEmojiOpen(false)}
 function sendGif(){const url=gifUrl.trim();if(!url)return;socket.current?.emit('chat:send',{text:url});setGifUrl('');setGifMode(false);}
 function send(e){e.preventDefault();if(!user||!text.trim())return;socket.current?.emit('chat:send',{text:text.trim()});setText('')}
 function react(e){if(!user){setAuth(true);return}socket.current?.emit('chat:reaction',e)}
 async function requestSong(e){e.preventDefault();if(!user){setAuth(true);return}const r=await fetch('/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({song})});const x=await r.json();if(!r.ok){setNotice(x.error);return}setRequests(v=>[x.request,...v]);setSong('');setNotice('🎵 İstek gönderildi.')}
 async function uploadMusic(e){e.preventDefault();if(!upload)return;const fd=new FormData();fd.append('file',upload);const r=await fetch('/api/dj/music',{method:'POST',body:fd});const x=await r.json();if(!r.ok){setNotice(x.error);return}setMusic(v=>[...v,x.music]);setUpload(null);if(uploadRef.current)uploadRef.current.value='';setNotice('🎵 Müzik arşive eklendi.')}
 async function saveProfile(e){e.preventDefault();const r=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({bio})});if(r.ok){setUser(u=>({...u,bio}));setProfile(false);setNotice('Profil güncellendi.')}}
 async function logout(){stopRecording();await fetch('/api/auth/logout',{method:'POST'});location.reload()}
 function fireworksShow(){if(!user?.gold){setNotice('⭐ Havai fişek GOLD üyeler içindir.');return}setFireworks(true);setTimeout(()=>setFireworks(false),1700)}
 function startListening(){if(!audio.current)return;audio.current.src=radio.streamUrl||'/radio/live.mp3';audio.current.muted=false;audio.current.play().then(()=>setPlaying(true)).catch(()=>setNotice('Tarayıcı ses iznini engelledi; oynat düğmesine tekrar bas.'))}

 return <main className={radio.disco?'discoMode':''}>
  <header className="siteHeader"><div><span className="brand">101<span>dunyasi</span>.com</span><div className="sub">CANLI • SOHBET • DJ</div></div><div className="top"><span className="onlineDot">●</span><b>{radio.listeners||0}</b> çevrimiçi {user?<><span className={user.gold?'roleBadge goldBadge':'roleBadge'}>{user.gold?'⭐ GOLD':roleLabel[user.role]}</span><b className={user.gold?'goldName':''}>{user.username}</b><button onClick={()=>setProfile(true)}>Profil</button>{mod&&<button className="navBtn" onClick={()=>setWorkspace(true)}>⚡ Çalışma Alanı</button>}<button onClick={logout}>Çıkış</button></>:<button onClick={()=>setAuth(true)}>Giriş / Kayıt</button>}</div></header>
  {setup&&<div className="setupBanner"><b>İlk kurulum gerekiyor.</b><span>Webmaster hesabını oluştur.</span><a className="navBtn" href="/setup">Kurulumu Başlat</a></div>}

  <section className="homeLayout">
   <div className="panel chatPanel chatPanelLarge"><div className="panelTitle"><h2>💬 Canlı Sohbet</h2><span>{messages.length} mesaj</span></div>
    {(dj||mod)&&<div className="chatQuickBar">{dj&&<><button className={radio.live?'quickLive on':'quickLive'} onClick={toggleLive}>{radio.live?'⏹ Yayını Kapat':'▶ Yayını Başlat'}</button><button className={mic?'quickMic on':'quickMic'} onClick={toggleMic}>{mic?'🎙️ Mikrofon Açık':'🎤 Mikrofon Al'}</button><button onClick={toggleDisco}>{radio.disco?'🪩 Işık Kapat':'🪩 Disko'}</button></>}{mod&&<button onClick={()=>setWorkspace(true)}>⚡ Panel</button>}</div>}
    <div className="liveSourceCard"><div><b>{radio.live?`🔴 DJ CANLI • ${radio.dj||''}`:'🎵 OTOMATİK YAYIN'}</b><small>{radio.currentTrack?.name||radio.title||'101dunyasi.com'}</small></div><span>🔊 {radio.mode==='DJ'?'DJ Yayını':'Otomatik Yayın'}</span></div>
    <div className="chat" ref={chat}>{messages.length?messages.map(m=><div className="msg messageBubble" key={m.id}><span className="msgAvatar">{m.username?.[0]?.toUpperCase()}</span><div className="msgBody"><div className="msgMeta"><b className={m.gold?'goldName':''}>{m.username}</b><small>{roleLabel[m.role]||m.role}</small><time>{new Date(m.createdAt||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div>{/^https?:\/\/.*\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i.test(m.text)?<img className="chatGif" src={m.text} alt="GIF"/>:<span className="msgText">{m.text}</span>}</div>{mod&&<button className="tiny danger" onClick={()=>socket.current?.emit('chat:delete',{id:m.id})}>Sil</button>}</div>):<div className="empty">Henüz mesaj yok.</div>}</div>
    <div className="chatTools"><div className="reactionBar">{reactions.map(e=><button type="button" key={e} onClick={()=>react(e)} title="Tepki gönder">{e}</button>)}{user?.gold&&<button type="button" className="goldBadge" onClick={fireworksShow}>🎆 Havai Fişek</button>}<button type="button" className="toolBtn" onClick={()=>setEmojiOpen(v=>!v)}>😊 Emoji</button><button type="button" className="toolBtn" onClick={()=>setGifMode(v=>!v)}>GIF</button></div>{emojiOpen&&<div className="emojiTray">{['😀','😂','😍','🥰','😎','🤩','🔥','❤️','👏','🎉','🎵','🪩','🙌','✨','😅','🤍'].map(e=><button type="button" key={e} onClick={()=>insertEmoji(e)}>{e}</button>)}</div>}{gifMode&&<div className="gifBox"><input value={gifUrl} onChange={e=>setGifUrl(e.target.value)} placeholder="GIF bağlantısı (.gif / .webp)"/><button type="button" onClick={sendGif}>Gönder</button></div>}</div>
    <form onSubmit={send} className="chatform chatComposer"><button type="button" className="composerIcon" onClick={()=>setEmojiOpen(v=>!v)} disabled={!user}>😊</button><input value={text} onChange={e=>setText(e.target.value)} placeholder={user?'Mesajını yaz...':'Giriş yaparak sohbete kat'} disabled={!user}/><button className="sendBtn" disabled={!user}>Gönder</button></form>
   </div>
   <aside className="panel usersPanel"><div className="panelTitle"><h2>🟢 Çevrimiçi Kullanıcılar</h2><span>{online.length}</span></div><div className="userList">{online.length?online.map(u=><div className="userRow" key={u.id} onContextMenu={(e)=>userContext(e,u)} title={mod&&u.id!==user?.id?'Sağ tık: hızlı müdahale':'Sohbet kullanıcısı'}><span className="avatar">{u.username[0]?.toUpperCase()}</span><div><b className={u.gold?'goldName':''}>{u.username}</b><small>{u.gold?'⭐ Gold Üye · ':''}{roleLabel[u.role]||u.role}{u.mutedUntil&&new Date(u.mutedUntil)>new Date()?' · 🔇':''}</small></div><i>●</i></div>):<div className="empty small">Henüz giriş yapan yok.</div>}</div></aside>
   <div className="panel controls"><div className="panelTitle"><h2>🎵 Şarkı İsteği</h2><span>{pending} bekliyor</span></div><form onSubmit={requestSong} className="chatform"><input value={song} onChange={e=>setSong(e.target.value)} placeholder="Sanatçı - Şarkı" disabled={!user}/><button disabled={!user}>İstek Gönder</button></form><div className="requestList">{visibleRequests.map(r=><div key={r.id}><b>{r.song}</b><small>{r.username} · {r.status}</small></div>)}</div></div>
  </section>

  <section className="homeHero"><section className="hero"><div><div className={radio.live?'live liveOn':'live'}>{radio.live?'● DJ CANLI':'● OTOMATİK YAYIN'}</div><h1>Canlı Radyo</h1><p>{radio.title}</p><div className="radioSourcePill"><b>{sourceText}</b>{radio.currentTrack&&<span> • {radio.currentTrack.name}</span>}<span> • 👥 {radio.listeners||0}</span></div><div className="heroActions">{dj&&<button onClick={toggleLive}>{radio.live?'⏹ Yayını Kapat':'▶ DJ Yayını'}</button>}{dj&&<button className={mic?'danger':''} onClick={toggleMic}>{mic?'🎙️ Mikrofon Açık':'🎤 Mikrofon'}</button>}{dj&&<button onClick={toggleDisco}>{radio.disco?'🪩 Disko Modunu Kapat':'🪩 Disko Işıkları'}</button>}{mod&&<button onClick={()=>setWorkspace(true)}>⚡ Paneli Aç</button>}</div></div><div className="orb">🎧</div></section></section>

  <div className="announcement">📢 <b>{radio.announcement||'101dunyasi.com'}</b></div>
  <div className="radioPlayer panel"><div><b>{radio.live?`🔴 DJ ${radio.dj||''}`:'🎵 Otomatik Yayın'}</b><small>{radio.live?'Ortak canlı yayın akışı':'Arşivdeki parçalar sırayla yayınlanıyor'}</small></div><button onClick={startListening}>{playing?'🔊 Dinleniyor':'▶ Dinlemeyi Başlat'}</button><audio ref={audio} controls className="audioPlayer"/></div>

  {contextMenu && (
    <div className="contextMenu" style={{left:contextMenu.x,top:contextMenu.y}} onClick={(e)=>e.stopPropagation()}>
      <div className="contextTitle">
        <span className="avatar">{contextMenu.target.username?.[0]?.toUpperCase()}</span>
        <div>
          <b>{contextMenu.target.username}</b>
          <small>{roleLabel[contextMenu.target.role]||contextMenu.target.role}</small>
        </div>
      </div>
      <button onClick={()=>{setText(v=>`@${contextMenu.target.username} ${v}`);setContextMenu(null)}}>💬 Etiketle</button>
      {['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user?.role) && (
        <button onClick={()=>quickModerate(contextMenu.target.mutedUntil?'unmute':'mute',contextMenu.target)}>
          {contextMenu.target.mutedUntil?'🔊 Susturmayı Kaldır':'🔇 5 dk Sustur'}
        </button>
      )}
      {['ADMIN','WEBMASTER'].includes(user?.role) && (
        <button onClick={()=>quickModerate('gold',contextMenu.target)}>⭐ GOLD Aç/Kapat</button>
      )}
      {!['WEBMASTER','ADMIN'].includes(contextMenu.target.role) && ['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user?.role) && (
        <button className="danger" onClick={()=>quickModerate(contextMenu.target.status==='banned'?'unban':'ban',contextMenu.target)}>
          {contextMenu.target.status==='banned'?'✅ Yasağı Kaldır':'🚫 Engelle'}
        </button>
      )}
      <button className="contextClose" onClick={()=>setContextMenu(null)}>Kapat</button>
    </div>
  )}

  {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}
  {reactBurst.map((r,i)=><span key={r.id} className="floatingReaction" style={{left:`${15+(i*37)%70}%`}}>{r.emoji}</span>)}

  {workspace&&<div className="modal"><div className="workspaceModal"><div className="workspaceHead"><div><b>{wm?'👑 Webmaster':dj?'🎙️ DJ':'🛡️ Moderatör'} Çalışma Alanı</b><small>sohbet açık kalır</small></div><button className="x" onClick={()=>setWorkspace(false)}>×</button></div>
   {dj&&<div className="workspaceTabs">{[['home','Yayın'],['music','Müzik'],['playlist','Playlist'],['requests','İstekler'],['listeners','Dinleyiciler']].map(x=><button className={wtab===x[0]?'active':''} onClick={()=>setWtab(x[0])} key={x[0]}>{x[1]}</button>)}</div>}
   {dj&&wtab==='home'&&<div className="quickGrid"><section className="panel"><h3>📻 DJ Studio</h3><label>Yayın başlığı<input value={radio.title} onChange={e=>setRadio({...radio,title:e.target.value})}/></label><label>Duyuru<textarea value={radio.announcement} onChange={e=>setRadio({...radio,announcement:e.target.value})}/></label><button onClick={async()=>{const r=await fetch('/api/dj/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({live:radio.live,title:radio.title,announcement:radio.announcement,disco:radio.disco})});setNotice(r.ok?'Yayın bilgileri kaydedildi.':'Kaydetme başarısız')}}>💾 Kaydet</button><button onClick={toggleLive}>{radio.live?'⏹ Yayını Kapat':'▶ Yayını Başlat'}</button><button onClick={toggleMic}>{mic?'🔇 Mikrofonu Sessize Al':'🎤 Mikrofonu Aç'}</button><button onClick={toggleDisco}>{radio.disco?'🪩 Disko Modunu Kapat':'🪩 Disko Işıkları'}</button></section><section className="panel"><h3>📈 Anlık Durum</h3><div className="listenerCount">{radio.listeners}<small> dinleyici</small></div><p><b>Kaynak:</b> {sourceText}</p><p><b>Arşiv:</b> {music.length} parça</p></section></div>}
   {dj&&wtab==='music'&&<section className="panel"><h3>🎵 DJ Müzik Arşivi</h3><p className="muted">Yüklediğin parçalar 101dunyasi.com otomatik yayın kuyruğunda kullanılabilir.</p><form onSubmit={uploadMusic} className="uploadBox"><input ref={uploadRef} type="file" accept="audio/*" onChange={e=>setUpload(e.target.files?.[0]||null)}/><button disabled={!upload}>⬆️ Yükle</button></form><div className="musicGrid">{music.map(m=><div className="musicCard" key={m.id}><div className="musicIcon">♫</div><div><b>{m.name}</b><small>{m.uploadedBy} · {Math.round((m.size||0)/1024)} KB</small></div><audio controls src={m.url}/></div>)}</div></section>}
   {dj&&wtab==='playlist'&&<section className="panel"><h3>📋 Playlist</h3><form className="uploadBox" onSubmit={async e=>{e.preventDefault();const ids=music.map(m=>m.id);const r=await fetch('/api/dj/playlists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:playlistName,trackIds:ids,repeat:'all'})});const x=await r.json();if(r.ok){setPlaylists(v=>[...v.filter(p=>p.name!==x.item.name),x.item]);setPlaylistName('');setNotice('Playlist kaydedildi.')}else setNotice(x.error||'Playlist kaydedilemedi.')}}><input value={playlistName} onChange={e=>setPlaylistName(e.target.value)} placeholder="Playlist adı"/><button>Kaydet</button></form>{playlists.map(p=><div className="requestAdmin" key={p.id}><b>{p.name}</b><small>{p.trackIds?.length||0} parça · {p.repeat}</small></div>)}</section>}
   {dj&&wtab==='requests'&&<section className="panel"><h3>📨 İstek Kuyruğu</h3>{requests.map(r=><div className="requestAdmin" key={r.id}><b>{r.song}</b><small>{r.username} · {r.status}</small></div>)}</section>}
   {dj&&wtab==='listeners'&&<section className="panel"><h3>👥 Dinleyiciler</h3>{online.filter(u=>u.id!==user.id).map(u=><div className="proUser" key={u.id}><span className="avatar">{u.username[0]}</span><b>{u.username}</b><span className="onlineDot">●</span></div>)}</section>}
   {wm&&<section className="panel"><h3>👑 Webmaster</h3><a className="big linkButton" href="/webmaster">Webmaster Control Center</a></section>}
  </div></div>}

  {profile&&<div className="modal"><form className="auth" onSubmit={saveProfile}><button type="button" className="x" onClick={()=>setProfile(false)}>×</button><h2>Profil</h2><p className="muted">{user?.username} · {roleLabel[user?.role]}</p><textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Biyografin"/><button>Kaydet</button></form></div>}
  {auth&&<div className="modal"><form onSubmit={async e=>{e.preventDefault();setError('');const r=await fetch(register?'/api/auth/register':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})}),x=await r.json();if(!r.ok){setError(x.error||'İşlem başarısız');return}location.reload()}} className="auth"><button type="button" className="x" onClick={()=>setAuth(false)}>×</button><div className="brand center">101<span>dunyasi</span>.com</div><h2>{register?'Yeni hesap':'Giriş yap'}</h2><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Kullanıcı adı" required/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Şifre" required/><button>{register?'Kayıt Ol':'Giriş Yap'}</button>{error&&<div className="error">{error}</div>}<a href="#" onClick={e=>{e.preventDefault();setRegister(v=>!v)}}>{register?'Giriş yap':'Yeni hesap oluştur'}</a></form></div>}
  {fireworks&&<div className="fireworks" aria-hidden="true">{Array.from({length:30},(_,i)=><span className="firework" key={i} style={{left:`${8+(i*29)%84}%`,top:`${10+(i*17)%62}%`,'--dx':`${-140+(i*67)%280}px`,'--dy':`${-200+(i*31)%250}px`}}>{['🎆','✨','⭐','💥'][i%4]}</span>)}</div>}
 </main>
}
