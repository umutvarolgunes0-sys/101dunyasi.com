const key=Symbol.for('101dunyasi.presence');
if(!globalThis[key])globalThis[key]=new Map();
const map=globalThis[key];
function set(id,user){if(id&&user)map.set(id,user)}
function del(id){map.delete(id)}
function list(){return [...map.values()].map(u=>({...u}))}
module.exports={set,del,list};
