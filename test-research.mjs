import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
process.env.IIBD_DB_PATH='/tmp/iibd-test-'+randomUUID()+'.sqlite';
process.env.IIBD_ADMIN_TOKEN='integration-test-secret-key-not-for-production';
const {handle}=await import('./index.mjs');
const auth={Authorization:'Bearer '+process.env.IIBD_ADMIN_TOKEN,'content-type':'application/json'};
const call=async(method,path,payload)=>{
 const res=await handle(new Request('https://geo.zwlla.com'+path,{method,headers:auth,...(payload?{body:JSON.stringify(payload)}:{})}));
 return {status:res.status,data:await res.json()};
};
const create=await call('POST','/api/research/projects',{subject:'86DROP',industry:'Fulfillment',url:'https://www.86drop.com',
 competitors:[{name:'Alpha',url:'https://alpha.example.com',kind:'direct'},{name:'Beta',url:'https://beta.example.com',kind:'benchmark'}]});
assert.equal(create.status,201,JSON.stringify(create.data));
const id=create.data.project.id;
assert.equal(create.data.companies.length,3);
const listed=await call('GET','/api/research/projects');
assert.equal(listed.data.projects[0].id,id);
const newEvidence=await call('POST','/api/research/projects/'+id+'/evidence',{company:'Alpha',dimension:'product',claim:'价格未知',quote:'',sourceUrl:''});
assert.equal(newEvidence.status,201);
assert.equal(newEvidence.data.status,'unverified');
const loaded=await call('GET','/api/research/projects/'+id);
assert.equal(loaded.data.evidence.length,1);
assert.equal(loaded.data.evidence[0].claim,'价格未知');
const noEvidenceAI=await call('POST','/api/research/projects/'+id+'/ai',{});
assert.equal(noEvidenceAI.status,400);
const bad=await handle(new Request('https://geo.zwlla.com/api/research/projects',{headers:{authorization:'Bearer WRONG'}}));
assert.equal(bad.status,401);
console.log('SQLite persisted create/read, token, evidence and AI guard assertions passed');
