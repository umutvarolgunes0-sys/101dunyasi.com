'use client';
import {useEffect,useState} from 'react';

export default function Setup(){
 const[required,setRequired]=useState(null),[done,setDone]=useState(false),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[siteName,setSiteName]=useState('101dunyasi.com'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/setup',{cache:'no-store'}).then(r=>r.json()).then(x=>{setRequired(!!x.required);setDone(!!x.completed);}).catch(()=>setRequired(false))},[]);
 async function submit(e){
  e.preventDefault();setError('');
  if(password!==confirm){setError('Şifreler eşleşmiyor.');return}
  setBusy(true);
  try{
   const r=await fetch('/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,siteName})});
   const x=await r.json();
   if(!r.ok){setError(x.error||'Kurulum başarısız.');return}
   setDone(true);setRequired(false);
  }finally{setBusy(false)}
 }
 if(required===null)return <main className="setupPage"><section className="auth"><div className="brand center">101<span>dunyasi</span>.com</div><h1>Kontrol ediliyor…</h1></section></main>;
 if(done)return <main className="setupPage"><section className="auth"><div className="brand center">101<span>dunyasi</span>.com</div><h1>✅ Kurulum tamamlandı</h1><p className="muted">Webmaster hesabın oluşturuldu ve oturum açıldı.</p><a className="big linkButton" href="/webmaster">Webmaster Paneli</a><a className="big linkButton" href="/">Siteye Git</a></section></main>;
 if(!required)return <main className="setupPage"><section className="auth"><div className="brand center">101<span>dunyasi</span>.com</div><h1>Kurulum zaten tamamlanmış</h1><p className="muted">Bu yerel kurulumda Webmaster hesabı zaten mevcut.</p><a className="big linkButton" href="/">Ana Sayfa</a></section></main>;
 return <main className="setupPage"><form className="auth" onSubmit={submit}><div className="brand center">101<span>dunyasi</span>.com</div><h1>İlk Kurulum</h1><p className="muted">Demo hesap yok. İlk Webmaster hesabını sen oluşturursun.</p><label>Webmaster kullanıcı adı<input value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username"/></label><label>Webmaster şifresi<input type="password" minLength={10} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></label><label>Şifre tekrar<input type="password" minLength={10} value={confirm} onChange={e=>setConfirm(e.target.value)} required autoComplete="new-password"/></label><label>Site adı<input value={siteName} onChange={e=>setSiteName(e.target.value)} required/></label><button disabled={busy}>{busy?'Kuruluyor…':'Kurulumu Tamamla'}</button>{error&&<div className="error">{error}</div>}</form></main>;
}
