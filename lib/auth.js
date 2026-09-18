const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');

const secret=process.env.JWT_SECRET || (process.env.NODE_ENV==='production' ? null : 'local-dev-secret-change-before-production');
function assertSecret(){if(!secret)throw new Error('JWT_SECRET environment variable is required in production.');}
function sign(user){assertSecret();return jwt.sign({id:user.id,username:user.username,role:user.role},secret,{expiresIn:'7d'})}
function verify(token){try{if(!token||!secret)return null;return jwt.verify(token,secret)}catch{return null}}
function getUserFromCookies(cookies){return verify(cookies.get('token')?.value||'')}
async function hash(password){return bcrypt.hash(password,12)}
async function compare(password,hashValue){return bcrypt.compare(password,hashValue)}
module.exports={sign,verify,getUserFromCookies,hash,compare};
