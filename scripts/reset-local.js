const fs=require('fs');
const path=require('path');
const root=process.cwd();
const dataDir=path.join(root,'data');
const db=path.join(dataDir,'db.json');
if(process.env.NODE_ENV==='production'){
  console.error('Bu komut production ortamında çalıştırılamaz.');
  process.exit(1);
}
try{if(fs.existsSync(db))fs.rmSync(db,{force:true});}catch(err){console.error(err.message);process.exit(1)}
console.log('Yerel veriler sıfırlandı. Şimdi npm.cmd run dev çalıştırıp /setup adresini aç.');
