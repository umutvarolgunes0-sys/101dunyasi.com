'use client';
import {useEffect,useRef,useState} from 'react';
import {io} from 'socket.io-client';

export default function ChatPanel({compact=false}){
 const [user,setUser]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(''),[online,setOnline]=useState([]),[notice,setNotice]=useState('');
 const socket=useRef(null),box=useRef(null);
 useEffect(()=>{
  Promise.all([fetch('/api/auth/me').then(r=>r.json()),fetch('/api/messages').then(r=>r.json())]).then(([me,msg])=>{setUser(me.user||null);setMessages(msg.messages||[])});
  const s=io({withCredentials:true}); socket.current=s;
  s.on('presence',p=>setOnline(p.users||[]));
  s.on('chat:message',m=>setMessages(v=>[...v,m].slice(-300)));
  s.on('chat:deleted',({id})=>setMessages(v=>v.filter(m=>String(m.id)!==String(id))));
  s.on('chat:cleared',()=>setMessages([]));
  return()=>s.close();
 },[]);
 useEffect(()=>{if(box.current)box.current.scrollTop=box.current.scrollHeight},[messages]);
 const canMod=['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user?.role);
 function send(e){e.preventDefault();if(!user||!text.trim())return;socket.current?.emit('chat:send',{text:text.trim()});setText('')}
 return <section className={`panel embeddedChat ${compact?'compactChat':''}`}>
   <div className="panelTitle"><h2>💬 Canlı Sohbet</h2><span>🟢 {online.length} çevrimiçi</span></div>
   <div className="chat" ref={box}>{messages.length?messages.map(m=><div className="msg" key={m.id}><div><b>{m.username}</b><small>{m.role}</small></div><span>{m.text}</span>{canMod&&<button className="tiny danger" onClick={()=>socket.current?.emit('chat:delete',{id:m.id})}>Sil</button>}</div>):<div className="empty small">Henüz mesaj yok.</div>}</div>
   <form onSubmit={send} className="chatform"><input value={text} onChange={e=>setText(e.target.value)} disabled={!user} placeholder={user?'Mesajını yaz...':'Giriş yaparak sohbete katıl'}/><button disabled={!user}>Gönder</button></form>
   {notice&&<div className="notice">{notice}</div>}
 </section>
}
