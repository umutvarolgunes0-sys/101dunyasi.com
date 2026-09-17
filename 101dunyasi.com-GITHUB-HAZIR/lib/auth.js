const jwt=require('jsonwebtoken');const bcrypt=require('bcryptjs');
const secret=process.env.JWT_SECRET||'dev-secret-change-me';
function sign(user){return jwt.sign({id:user.id,username:user.username,role:user.role},secret,{expiresIn:'7d'})}
function verify(token){try{return jwt.verify(token,secret)}catch{return null}}
function getUserFromCookies(cookies){return verify(cookies.get('token')?.value||'')}
module.exports={sign,verify,getUserFromCookies,hash:p=>bcrypt.hash(p,10),compare:(p,h)=>bcrypt.compare(p,h)};
