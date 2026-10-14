import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
process.env.IIBD_DB_PATH='/tmp/kb-citest-'+randomUUID()+'.sqlite';
process.env.IIBD_ADMIN_TOKEN='kb-test-admin-token-0123456789abcdef';
const {handle}=await import('./index.mjs');
const head={authorization:'Bearer '+process.env.IIBD_ADMIN_TOKEN,'content-type':'application/json'};
async function req(method,path,body,headers=head){
 const response=await handle(new Request('https://geo.zwlla.com'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})}));
 return {status:response.status,data:await response.json()};
}
const files=[
 {path:'01-行业知识/SMT问题.md',content:['---','type: pain','industry: SMT','status: reviewed','source_url: https://example.org/notes','---','# SMT换模时间长','客户反映不同生产批次之间换模用时较长，必须通过现场记录确认实际耗时和停机原因。','相关方法：[[SMED快速换模]]'].join('\n')},
 {path:'07-流程结构/SMED快速换模.md',content:['---','type: method','industry: SMT','status: reviewed','source_url: https://example.org/method','---','# SMED快速换模','这是一个方法论线索，须按实际换模步骤拆分内外部工作，实施前先观察生产线。','addresses:: [[SMT问题]]'].join('\n')}
];
const importOne=await req('POST','/api/kb/import',{files});assert.equal(importOne.status,201,JSON.stringify(importOne.data));
assert.equal(importOne.data.added,2);
const repeated=await req('POST','/api/kb/import',{files});assert.equal(repeated.data.identical,2);
const stats=await req('GET','/api/kb/stats');assert.equal(stats.data.entities,2);assert.equal(stats.data.versions,2);
const listed=await req('GET','/api/kb/entities?industry=SMT');assert.equal(listed.data.entities.length,2);
const entity=listed.data.entities.find(x=>x.type==='pain');
const details=await req('GET','/api/kb/entity?id='+entity.id);assert.equal(details.data.title,'SMT换模时间长');
const relations=await req('GET','/api/kb/relations?id='+entity.id);assert.equal(relations.data.links.length,1);
assert.equal(relations.data.links[0].resolved.title,'SMED快速换模');
const report=await req('POST','/api/kb/proposal',{ids:listed.data.entities.map(x=>x.id),pain:'SMT生产切换较慢',industry:'SMT'});
assert.equal(report.status,200);assert.ok(report.data.markdown.includes('[KB:'));
assert.ok(report.data.missing.includes('case'));
const secondVersion={path:files[0].path,content:files[0].content+'\n追加一次现场访谈待核查事项。'};
const revision=await req('POST','/api/kb/import',{files:[secondVersion]});assert.equal(revision.data.updatedVersions,1);
const after=await req('GET','/api/kb/stats');assert.equal(after.data.versions,3);assert.equal(after.data.entities,2);
const stale=await req('GET','/api/kb/entity?id='+entity.id);assert.equal(stale.status,404);
const wrong=await req('GET','/api/kb/stats',undefined,{'authorization':'Bearer wrong'});
assert.equal(wrong.status,401);
const mcp=await req('POST','/mcp/knowledge',{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}}});
assert.equal(mcp.status,200);assert.equal(mcp.data.result.capabilities.tools.listChanged,false);
const listing=await req('POST','/mcp/knowledge',{jsonrpc:'2.0',id:2,method:'tools/list'});
assert.ok(listing.data.result.tools.some(t=>t.name==='get_entity'));
const asking=await req('POST','/api/kb/ask',{question:'SMT如何解决换模问题'});
assert.equal(asking.status,503,'LLM without API Key must return unavailable rather than fake output');
console.log('KB real Bun SQLite append-only, graph, proposals, MCP, auth passed');
