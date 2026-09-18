'use client';
import {useEffect,useRef,useState} from 'react';
import {io} from 'socket.io-client';
import ChatPanel from '@/components/ChatPanel';

export default function DJ(){
 const [me,setMe]=useState(null),[radio,setRadio]=useState({live:false,mode:'AUTO',title:'101dunyasi.com Otomatik Yayın',announcement:''}),[users,setUsers]=useState([]),[tab,setTab]=useState('studio'),[title,setTitle]=useState('101dunyasi.com Canlı Yayın'),[announcement,setAnnouncement]=useState(''),[mic,setMic]=useState(false),[msg,setMsg]=useState(''),[music,setMusic]=useState([]),[upload,setUpload]=useState(null),[requests,setRequests]=useState([]),[playing,setPlaying]=useState(null),[disco,setDisco]=useState(false);
 const stream=useRef(null),recorder=useRef(null),socket=useRef(null),file=useRef(null);
 const loadMusic=()=>fetch('/api/dj/music').then(r=>r.json()).then(x=>setMusic(x.music||[]));
 useEffect(()=>{
  fetch('/api/auth/me').then(r=>r.json()).then(x=>setMe(x.user));
  fetch('/api/dj/status').then(r=>r.json()).then(x=>{setRadio(x);setTitle(x.title||'101dunyasi.com Canlı Yayın');setAnnouncement(x.announcement||'');setDisco(!!x.disco)});
  loadMusic();fetch('/api/requests').then(r=>r.json()).then(x=>setRequests(x.requests||[]));
  const s=io({withCredentials:true});socket.current=s;s.on('presence',p=>setUsers(p.users||[]));s.on('radio:status',setRadio);s.on('notice',x=>setMsg(x.message||''));
  return()=>{s.close();stopMic()};
 },[]);
 function stopMic(){try{recorder.current?.stop()}catch{};recorder.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setMic(false)}
 async function startMic(){
  if(stream.current&&recorder.current?.state==='recording'){setMic(true);return true}
  try{
   stream.current=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   const types=['audio/webm;codecs=opus','audio/webm'];const mime=window.MediaRecorder?.isTypeSupported?types.find(t=>window.MediaRecorder.isTypeSupported(t)):'';
   const rec=new MediaRecorder(stream.current,mime?{mimeType:mime}:{});recorder.current=rec;
   rec.ondataavailable=e=>{if(e.data?.size&&socket.current?.connected)socket.current.emit('dj:audio',e.data)};rec.onerror=()=>setMsg('Mikrofon yayın motoru hatası.');rec.start(250);setMic(true);return true;
  }catch{setMsg('Mikrofon izni verilmedi veya tarayıcı desteklemiyor.');return false}
 }
 async function saveLive(next){
  if(next){const ok=await startMic();if(!ok)return}
  else stopMic();
  const r=await fetch('/api/dj/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({live:next,title,announcement,disco})});
  const x=await r.json();if(!r.ok){setMsg(x.error||'İşlem başarısız');return}setRadio(x);socket.current?.emit('dj:state',x);setMsg(next?'🔴 Yayın başladı. Ortak 101dunyasi.com stream aktif.':'⏹ Yayın durdu; otomatik yayın aktif.');
 }
 async function saveText(){const r=await fetch('/api/dj/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({live:radio.live,title,announcement,disco})});const x=await r.json();if(r.ok){setRadio(x);socket.current?.emit('dj:state',x);setMsg('Yayın bilgileri kaydedildi.')}}
 async function toggleMic(){if(!radio.live){setMsg('Önce yayını başlat.');return}if(!stream.current||recorder.current?.state!=='recording'){await startMic();return}const next=!(stream.current.getAudioTracks()[0]?.enabled);stream.current.getAudioTracks().forEach(t=>t.enabled=next);setMic(next);setMsg(next?'🎤 Mikrofon yayında.':'🔇 Mikrofon susturuldu.')}
 async function uploadMusic(e){e.preventDefault();if(!upload)return;const fd=new FormData();fd.append('file',upload);const r=await fetch('/api/dj/music',{method:'POST',body:fd});const x=await r.json();if(!r.ok){setMsg(x.error||'Yüklenemedi');return}setMusic(v=>[...v,x.music]);setUpload(null);if(file.current)file.current.value='';setMsg('🎵 Müzik arşive eklendi.')}
 async function delMusic(id){if(!confirm('Parça silinsin mi?'))return;const r=await fetch('/api/dj/music',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(r.ok)setMusic(v=>v.filter(x=>x.id!==id));}
 async function reqStatus(id,status){const r=await fetch('/api/admin/requests',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});const x=await r.json();setMsg(r.ok?'İstek güncellendi.':x.error);if(r.ok)setRequests(v=>v.map(a=>a.id===id?{...a,status}:a))}
 if(me&& !['DJ','ADMIN','WEBMASTER'].includes(me.role))return <main><div className="panel" style={{maxWidth:600,margin:'80px auto'}}>DJ yetkisi gerekli. <a href="/">Radyoya dön</a></div></main>;
 return <main className={`admin ${disco?'discoMode':''}`}><header className="siteHeader"><div><span className="brand">101<span>dunyasi</span>.com</span><div className="sub">PROFESYONEL DJ STÜDYOSU</div></div><div className="top"><span>🟢 {users.length} çevrimiçi</span><a className="navBtn" href="/">← Canlı Oda</a></div></header>
 <div className="adminWrap"><div className="studioHero"><div><div className={radio.live?'live liveOn':'live'}>{radio.live?'● YAYINDASIN':'○ STÜDYO HAZIR'}</div><h1>DJ Kontrol Merkezi</h1><p>101dunyasi.com kendi yayın motorun: mikrofon, müzik, playlist, istek ve sohbet tek ekranda.</p></div><div className="vu">🎚️</div></div>
 <div className="workspaceTabs">{[['studio','🎙️ Stüdyo'],['music','🎵 Müzik Arşivi'],['requests','📨 İstekler'],['listeners','👥 Dinleyiciler']].map(x=><button className={tab===x[0]?'active':''} onClick={()=>setTab(x[0])} key={x[0]}>{x[1]}</button>)}<a className="navBtn" href="/">Sohbete dön</a></div>
 {tab==='studio'&&<div className="studioGrid"><section className="panel"><h2>📻 Yayın Kumandası</h2><label>Yayın başlığı<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Duyuru<textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)}/></label><div className="row"><button onClick={saveText}>💾 Bilgileri Kaydet</button><button className={radio.live?'danger':''} onClick={()=>saveLive(!radio.live)}>{radio.live?'⏹ Yayını Durdur':'▶ Yayını Başlat'}</button></div><div className="notice">{radio.live?'🔴 Ortak yayın aktif: /radio/live.mp3':'🎵 Otomatik yayın aktif; DJ gelene kadar arşiv devam eder.'}</div><div className="row"><button className={mic?'danger':''} onClick={toggleMic}>{mic?'🔇 Mikrofonu Sustur':'🎤 Mikrofonu Aç'}</button><button onClick={()=>{setDisco(v=>!v);socket.current?.emit('dj:state',{live:radio.live,title,announcement,disco:!disco})}}>🪩 {disco?'Disko Kapat':'Disko Modu'}</button></div></section><section className="panel"><h2>📊 Canlı Durum</h2><div className="listenerCount">{radio.listeners||users.length}<small> dinleyici</small></div><p><b>Kaynak:</b> {radio.live?`🎙️ DJ ${radio.dj||me?.username}`:'🎵 101dunyasi.com Otomatik Yayın'}</p><p><b>Şimdi:</b> {radio.currentTrack?.name||radio.title}</p><p><b>Arşiv:</b> {music.length} parça</p>{msg&&<div className="notice">{msg}</div>}</section><section className="panel"><h2>💬 Sohbet</h2><ChatPanel compact/></section><section className="panel"><h2>🛟 Kesintisiz Yayın</h2><p className="muted">DJ bağlantısı koparsa sunucu otomatik olarak arşiv yayınını devralır. DJ tekrar bağlandığında canlı yayın yeniden öne alınır.</p></section></div>}
 {tab==='music'&&<section className="panel"><div className="panelTitle"><h2>🎵 Müzik Arşivi</h2><span>{music.length} parça</span></div><form onSubmit={uploadMusic} className="uploadBox"><input ref={file} type="file" accept="audio/*" onChange={e=>setUpload(e.target.files?.[0]||null)}/><button disabled={!upload}>⬆️ Arşive Yükle</button></form><div className="musicGrid">{music.map(m=><div className="musicCard" key={m.id}><div className="musicIcon">♫</div><div><b>{m.name}</b><small>{Math.ceil((m.size||0)/1024/1024*10)/10} MB · {m.uploadedBy}</small></div><div className="actions"><button onClick={()=>setPlaying(m)}>▶</button><button className="danger" onClick={()=>delMusic(m.id)}>Sil</button></div></div>)}</div>{playing&&<div className="stickyPlayer"><b>🎧 {playing.name}</b><audio controls autoPlay src={playing.url}/></div>}</section>}
 {tab==='requests'&&<section className="panel"><div className="panelTitle"><h2>📨 Şarkı İstek Merkezi</h2><span>{requests.filter(r=>r.status==='pending').length} bekliyor</span></div>{requests.map(r=><div className="requestAdmin" key={r.id}><b>{r.song}</b><small>{r.username} · {r.status}</small><div className="actions"><button onClick={()=>reqStatus(r.id,'approved')}>Onayla</button><button onClick={()=>reqStatus(r.id,'played')}>Çalındı</button><button className="danger" onClick={()=>reqStatus(r.id,'rejected')}>Reddet</button></div></div>)}{!requests.length&&<div className="empty small">İstek kuyruğu boş.</div>}</section>}
 {tab==='listeners'&&<section className="panel"><div className="panelTitle"><h2>👥 Dinleyiciler</h2><span>{users.length}</span></div><div className="proUserGrid">{users.map(u=><div className="proUser" key={u.id}><span className="avatar">{u.username[0]?.toUpperCase()}</span><div><b>{u.username}</b><small>{u.role}</small></div><span className="onlineDot">●</span></div>)}</div></section>}
 </div></main>
}
