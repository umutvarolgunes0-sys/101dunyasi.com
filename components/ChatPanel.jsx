'use client';
import {useEffect,useRef,useState} from 'react';

export default function ChatPanel({compact=false}){
 const [user,setUser]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(''),[online,setOnline]=useState([]),[notice,setNotice]=useState('');
 const socket=useRef(null),box=useRef(null);
 useEffect(()=>{
  Promise.all([fetch('/api/auth/me').then(r=>r.json()),fetch('/api/messages').then(r=>r.json())]).then(([me,msg])=>{setUser(me.user||null);setMessages(msg.messages||[])});
  const poll=async()=>{try{const msg=await fetch('/api/messages',{cache:'no-store'}).then(r=>r.json());setMessages(msg.messages||[])}catch{}};
  poll();const timer=setInterval(poll,5000);
  return()=>clearInterval(timer);
 },[]);
 useEffect(()=>{if(box.current)box.current.scrollTop=box.current.scrollHeight},[messages]);
 const canMod=['MODERATOR','DJ','ADMIN','WEBMASTER'].includes(user?.role);
 async function send(e){e.preventDefault();if(!user||!text.trim())return;const r=await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.trim()})});const x=await r.json();if(r.ok){setMessages(v=>[...v,x.message].slice(-300));setText('')}else setNotice(x.error||'Mesaj gönderilemedi.');}
 return <section className={`panel embeddedChat ${compact?'compactChat':''}`}>
   <div className="panelTitle"><h2>💬 Canlı Sohbet</h2><span>🟢 {online.length} çevrimiçi</span></div>
   <div className="chat" ref={box}>{messages.length?messages.map(m=><div className="msg" key={m.id}><div><b>{m.username}</b><small>{m.role}</small></div><span>{m.text}</span>{canMod&&<button className="tiny danger" onClick={()=>fetch('/api/messages',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:m.id})}).then(()=>setMessages(v=>v.filter(a=>String(a.id)!==String(m.id))))}>Sil</button>}</div>):<div className="empty small">Henüz mesaj yok.</div>}</div>
   <form onSubmit={send} className="chatform"><input value={text} onChange={e=>setText(e.target.value)} disabled={!user} placeholder={user?'Mesajını yaz...':'Giriş yaparak sohbete katıl'}/><button disabled={!user}>Gönder</button></form>
   {notice&&<div className="notice">{notice}</div>}
 </section>
}
