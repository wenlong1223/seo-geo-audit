import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parseObsidianNote,buildGroundedProposal} from './kb-core.mjs';
import {verifyKnowledgeAnswer} from './kb-ai.mjs';
import {handle} from './index.mjs';
const note=`---
type: pain
industry: SMT电子组装
status: reviewed
aliases:
  - 换线问题
tags: [质量, 效率]
source_url: https://example.org/reference
---
# SMT换模时间长
该客户在多种产品切换中需要观察换线时间和操作流程；记录为匿名示例，暂未提供实测数值。
相关方案：[[SMED快速换模|快速换模]]
causes:: [[产线等待]]
`;
const e=parseObsidianNote({path:'01-行业知识/SMT换模问题.md',content:note});
assert.equal(e.type,'pain');assert.equal(e.industry,'SMT电子组装');assert.equal(e.status,'reviewed');
assert.equal(e.links.length,3);assert.ok(e.links.some(x=>x.kind==='causes'&&x.target==='产线等待'));
assert.ok(e.aliases.includes('换线问题'));
assert.throws(()=>parseObsidianNote({path:'../secrets.md',content:note}));
const p=buildGroundedProposal({industry:'SMT电子组装',pain:'换模太慢',entities:[{...e,id:'kb-test',source_url:'https://example.org/reference'}]});
assert.ok(p.markdown.includes('[KB:kb-test]'));assert.ok(p.missing.includes('case'));
const vetted=verifyKnowledgeAnswer({answer:'待验证',citations:[{entity_id:'wrong',reason:'imagined'},{entity_id:'kb-test',reason:'excerpt'}]},[{id:'kb-test'}]);
assert.equal(vetted.citations.length,1);assert.equal(vetted.citations[0].entity_id,'kb-test');
const home=await handle(new Request('https://geo.zwlla.com/knowledge'));
assert.equal(home.status,200);const html=await home.text();
assert.ok(html.includes('行业知识引擎'));assert.ok(html.includes('选择 Obsidian 文件夹'));
assert.ok(!/\\u[0-9a-fA-F]{4}/.test(html),'Chinese text rendered, not unicode escaped');
const inline=html.split('<script data-cfasync="false">')[1]?.split('</script>')[0];
assert.ok(inline);assert.doesNotThrow(()=>new vm.Script(inline));
assert.equal((await handle(new Request('https://geo.zwlla.com/api/kb/stats'))).status,503);
assert.equal((await handle(new Request('https://geo.zwlla.com/mcp/knowledge',{method:'POST'}))).status,503);
const original=await handle(new Request('https://geo.zwlla.com/api/health'));assert.equal(original.status,200);
console.log('KB parse, citation filtering, HTML and auth smoke tests passed');
