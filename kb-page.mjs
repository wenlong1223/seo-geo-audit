/* Client-only UI; credentials remain in memory and are never embedded into HTML or localStorage. */
export const KNOWLEDGE_PAGE=String.raw`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>行业知识引擎 · geo.zwlla.com</title>
<style>
:root{font-family:Inter,"PingFang SC","Microsoft Yahei",sans-serif;color:#e9f2fc;background:#081220}*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at 55% -15%,#15445c,transparent 47%),#081220}
header,main,footer{width:min(1150px,calc(100% - 36px));margin:auto}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 0}header strong{font-size:19px}
a{color:#73dccf;text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:clamp(28px,4vw,45px);margin:16px 0 14px;line-height:1.2}h2{font-size:19px;margin:0 0 13px}h3{font-size:15px;margin:14px 0}
p{line-height:1.8}.lead{color:#a3b9ce;max-width:820px;font-size:15px}.eyebrow{color:#70e5c6;font-size:12px;letter-spacing:2px;font-weight:700}
.card{background:#101f32;border:1px solid #2d4862;border-radius:16px;padding:22px;margin:18px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.buttons{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:15px 0}
input,select,textarea,button{font:inherit}input,select,textarea{display:block;width:100%;color:#e9f2fc;border:1px solid #385370;background:#0a192b;border-radius:9px;padding:12px;outline:0}
textarea{min-height:90px;resize:vertical}label{font-size:13px;color:#c0d2e4;display:block;line-height:1.8}
button{border:0;background:#56d7c2;border-radius:9px;padding:11px 16px;color:#08252b;font-weight:750;cursor:pointer}
button.secondary{background:#20384d;color:#d7eef7;border:1px solid #446178}
button:disabled{opacity:.5;cursor:wait}
.muted{color:#99aec6;font-size:12px;line-height:1.85}.note{border-left:3px solid #64d8c9;background:#152a3c;color:#c6dded;border-radius:5px;padding:12px 15px;font-size:13px;line-height:1.7}
.error{border-left-color:#f18a92;background:#35252d;color:#ffd2d3}.hidden{display:none!important}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.metric{background:#172b42;border:1px solid #38516c;border-radius:10px;padding:13px}.metric b{display:block;font-size:26px;margin-top:5px}
table{border-collapse:collapse;width:100%;min-width:600px;font-size:13px}
th,td{padding:12px;border-bottom:1px solid #314862;vertical-align:top;text-align:left;line-height:1.5}
.table{overflow:auto}.entry{border:1px solid #34495f;border-radius:11px;padding:14px;margin:10px 0;background:#15263b}
.entry strong{font-size:14px}.entry p{margin:5px 0;color:#b3c9de;font-size:12px}
code{color:#97e9d5;overflow-wrap:anywhere}
details{padding:8px 0}summary{cursor:pointer;color:#9bded4}
footer{padding:25px 0 50px;font-size:12px;color:#728aa4}
@media(max-width:680px){.grid,.metrics{grid-template-columns:1fr}.card{padding:16px}header{flex-direction:column;align-items:start}}
</style></head><body>
<header><strong>↗ GEO Audit <span style="color:#72e4ce">/ 行业知识引擎</span></strong><nav><a href="/">GEO 技术检测</a> · <a href="/intelligence">行业情报</a></nav></header>
<main>
<div class="eyebrow">OBSIDIAN KNOWLEDGE · GRAPH · EVIDENCE</div><h1>知识不是文件堆积，而是可调用的解决方案</h1>
<p class="lead">面向制造业及其他 B2B 行业：导入 Markdown/Obsidian 笔记，保留实体、元数据、Wikilink 和版本；按真实知识拼装问题解决方案。配置模型 API 后，可启用基于实体证据的 LLM 问答。</p>
<div class="note">这是独立的空知识库，未包含原文章作者的 13,199 个实体。只有实际导入的内容才会计入统计。浏览与证据方案无需 AI Key；自然语言语义分析需要单独配置模型 API。</div>
<section class="card"><h2>① 管理员连接</h2>
<div class="grid"><label>知识库管理员密钥（与行业情报管理密钥共用）<input id="token" type="password" autocomplete="off" placeholder="Railway IIBD_ADMIN_TOKEN"></label>
<div><p class="muted">所有知识 API 默认私有，密钥仅在当前页面内存使用，不写入浏览器存储。</p><button id="connect">连接并读取知识库</button></div></div>
<p id="feedback" class="note" role="status">等待连接。</p><div id="stats" class="metrics"></div></section>
<section class="card"><h2>② 导入知识实体</h2>
<p class="muted">支持选择多个 .md 文件，也可在支持文件夹选择的桌面浏览器中选整个 Obsidian Vault。每批最多12份、合计约115KB；大批导入需保持页面打开。只接受 Markdown，不执行宏或附件。</p>
<div class="grid">
<label>多选 Markdown 文件<input type="file" multiple accept=".md,text/markdown" id="files"></label>
<label>选择 Obsidian 文件夹（桌面浏览器）<input type="file" webkitdirectory directory multiple id="folder"></label>
</div><div class="buttons"><button id="import">导入所选文件</button><button class="secondary" id="example">下载标准实体模板</button></div>
<p class="muted" id="importProgress"></p>
<details><summary>实体文件格式及关系规则</summary><pre style="white-space:pre-wrap;font-size:12px;color:#a4c5db">---
type: pain
industry: SMT电子组装
status: unreviewed
tags: [质量, 效率]
source_url: https://example.org/verified-source
aliases: [换线困难]
---
# SMT换模效率问题
这里填写真实业务资料、调研记录和出处，不要只堆关键词。
相关方法：[[SMED快速换模]]
addresses:: [[换模培训流程]]
</pre><p class="muted">普通 [[关系]] 是导航边；causes:: / addresses:: 等才是有类型的关系。没有可靠证据不得随意标为因果。原件按 SHA-256 版本追加保存，不删除旧版本。</p></details></section>
<section class="card"><h2>③ 实体浏览与关联</h2>
<div class="grid"><label>按实体类型筛选<select id="type">
<option value="">全部类型</option><option value="industry">行业</option><option value="pain">痛点</option><option value="method">理论工具</option><option value="function">系统功能</option><option value="case">案例</option><option value="standard">标准</option><option value="kpi">指标</option><option value="spec">规格书</option><option value="other">其他</option>
</select></label><label>行业（精确元数据，留空不限）<input id="filterIndustry" placeholder="例如：SMT电子组装"></label></div>
<div class="buttons"><button id="browse" class="secondary">读取实体目录</button><span class="muted">按目录字段筛选，不以关键词/BM25/BFS 冒充语义理解。</span></div>
<div id="entries"></div><div id="detail" class="hidden"></div></section>
<section class="card"><h2>④ 证据驱动方案生成</h2><p class="muted">在实体列表点“加入方案”挑选 1–18 个可追溯实体。不自动补充不存在的标准条款和案例。</p>
<div class="grid"><label>行业<input id="industry" value="SMT电子组装"></label><label>客户痛点<textarea id="pain" rows="2">换模时间较长、现场作业效率低，需要找出原因并安排可验收的改进措施。</textarea></label></div>
<div id="selection" class="muted">尚未选择知识实体</div><div class="buttons"><button id="proposal">根据选中实体生成方案</button><button id="download" class="secondary" disabled>下载 Markdown</button></div>
<div id="proposalOutput"></div></section>
<section class="card"><h2>⑤ LLM 语义知识调用（可选）</h2>
<p class="muted">不使用 BM25 或 BFS 为文件打分。模型在当前行业/类型的实体范围内选择相关依据，并核查引用 ID。超过80条候选会要求缩小行业范围，避免伪装成全库搜索。</p>
<label>要解决的实际问题<textarea id="question">SMT生产中换模时间长，应优先核对哪些工艺流程、功能模块和指标？</textarea></label>
<div class="buttons"><button id="ask">让 AI 根据现有实体分析</button></div><div id="answer"></div>
<p class="muted">远程 MCP 实验接口：<code>https://geo.zwlla.com/mcp/knowledge</code>（2025-06-18 Streamable HTTP 子集，需要支持自定义 Bearer Header 的客户端；不支持公开匿名调用）。</p></section>
</main><footer>知识图谱中的链接不自动等于真实因果；任何方案必须验证来源、标准版本、客户场景与投资假设。</footer>
<script data-cfasync="false">
(function(){
'use strict';
const $=x=>document.getElementById(x);
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=new Map(),lastReport='',latest=null,readable=[];
const say=(message,error=false)=>{$('feedback').textContent=message;$('feedback').classList.toggle('error',error)};
const doRequest=async(method,path,data)=>{
 const key=$('token').value.trim();if(!key)throw Error('请先输入管理员密钥');
 const options={method,headers:{authorization:'Bearer '+key}};
 if(data!==undefined){options.headers['content-type']='application/json';options.body=JSON.stringify(data)}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),61000);options.signal=controller.signal;
 try{const r=await fetch(path,options),json=await r.json().catch(()=>({error:'服务端没有返回合法JSON'}));if(!r.ok)throw Error(json.error||'HTTP '+r.status);return json}finally{clearTimeout(timer)}
};
async function refresh(){
 const s=await doRequest('GET','/api/kb/stats');
 $('stats').innerHTML=[['实体总数',s.entities],['入库版本',s.versions],['显式关系',s.links]].map(x=>'<div class="metric"><span class="muted">'+x[0]+'</span><b>'+x[1]+'</b></div>').join('');
 say('已连接 · 当前仅展示本系统实际导入的实体');
}
$('connect').onclick=()=>refresh().catch(e=>say(e.message,true));
$('example').onclick=()=>{
 const body='---\ntype: pain\nindustry: SMT电子组装\nstatus: unreviewed\ntags: [质量, 效率]\nsource_url: https://example.org/source\n---\n# 换模时间长\n待补充真实客户问题、现场观察和原始证据。\n相关方法：[[SMED快速换模]]\n';
 save(body,'obsidian-entity-example.md','text/markdown;charset=utf-8')
};
function save(data,name,mime){const b=new Blob([data],{type:mime}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('import').onclick=async()=>{
 const button=$('import');button.disabled=true;
 try{
  let files=[...$('files').files,...$('folder').files].filter(f=>f.name.toLowerCase().endsWith('.md'));
  if(!files.length)throw Error('请先选择至少1份 .md 文件');
  if(files.length>200)throw Error('单次最多导入200份文件，请分批处理。');
  let added=0,identical=0,failed=[];
  const root=f=>{const p=f.webkitRelativePath||f.name;const parts=p.split('/');return parts.length>1?parts.slice(1).join('/'):p};
  let batch=[],bytes=0;
  async function flush(){
   if(!batch.length)return;
   const r=await doRequest('POST','/api/kb/import',{files:batch});
   added+=r.added;identical+=r.identical;batch=[];bytes=0;
   $('importProgress').textContent='已入库 '+added+' 份；相同版本 '+identical+' 份；读取失败 '+failed.length+' 份';
   await new Promise(ok=>setTimeout(ok,2500));
  }
  for(const f of files){
   const raw=await f.text(),length=new TextEncoder().encode(raw).length;
   if(length>18000||length<1){failed.push(f.name+' 文件大小超限');continue}
   if(batch.length>=10||bytes+length>85000)await flush();
   batch.push({path:root(f),content:raw});bytes+=length;
  }
  await flush();await refresh();
  $('importProgress').textContent='导入结束：新增 '+added+'，重复 '+identical+'，跳过 '+failed.length+(failed.length?'（'+failed.slice(0,3).join('、')+'）':'');
 }catch(e){say('导入失败：'+e.message,true)}finally{button.disabled=false}
};
async function browse(){
 const qs=new URLSearchParams({type:$('type').value,industry:$('filterIndustry').value.trim()});
 const r=await doRequest('GET','/api/kb/entities?'+qs.toString());readable=r.entities;
 $('entries').innerHTML=readable.length?readable.map(e=>'<div class="entry"><strong>'+escape(e.title)+'</strong><p>'+escape(e.type)+' · '+escape(e.industry||'未注明行业')+' · '+escape(e.path)+' · '+escape(e.status)+'</p><div class="buttons"><button type="button" class="secondary" data-open="'+escape(e.id)+'">查看证据/关系</button><button type="button" data-add="'+escape(e.id)+'">加入方案</button></div></div>').join(''):'<p class="muted">这个类型/行业下没有入库实体。先导入资料。</p>';
 for(const node of $('entries').querySelectorAll('[data-open]'))node.onclick=()=>detail(node.dataset.open);
 for(const node of $('entries').querySelectorAll('[data-add]'))node.onclick=()=>{const ent=readable.find(x=>x.id===node.dataset.add);if(ent){selected.set(ent.id,ent);renderSelection()}};
}
$('browse').onclick=()=>browse().catch(e=>say(e.message,true));
async function detail(id){
 try{
  const d=await doRequest('GET','/api/kb/relations?id='+encodeURIComponent(id));const x=d.entity;
  $('detail').classList.remove('hidden');
  $('detail').innerHTML='<div class="entry"><h3>'+escape(x.title)+'</h3><p>文件：'+escape(x.path)+' · 入库版本：'+escape(x.sha.slice(0,12))+'</p>'+
   (x.source_url?'<p>来源：<a rel="noreferrer noopener" target="_blank" href="'+escape(x.source_url)+'">原始资料 ↗</a></p>':'<p class="muted">缺少来源，请人工审核</p>')+
   '<p>结构质量检查：'+escape(x.review.score)+'/100（非真实性得分）</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;color:#bccfe3;max-height:300px;overflow:auto">'+escape(x.body.slice(0,3500))+'</pre>'+
   '<h3>出链</h3>'+(d.links.map(l=>'<p>'+escape(l.kind)+' → '+escape(l.target)+' '+(l.resolved?'✓ '+escape(l.resolved.title):'未找到唯一目标')+'</p>').join('')||'<p>无</p>')+
   '<h3>反向链接</h3>'+(d.backlinks.map(b=>'<p>'+escape(b.title)+'</p>').join('')||'<p>无</p>')+'</div>';
  $('detail').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){say(e.message,true)}
}
function renderSelection(){$('selection').textContent='已选 '+selected.size+'/18 个实体：'+[...selected.values()].map(x=>x.title).join('、')}
$('proposal').onclick=async()=>{
 try{
  if(!selected.size)throw Error('请先在实体列表里选至少1项');
  const r=await doRequest('POST','/api/kb/proposal',{ids:[...selected.keys()],industry:$('industry').value,pain:$('pain').value});
  lastReport=r.markdown;$('proposalOutput').innerHTML='<div class="entry"><h3>已生成引用版方案</h3><p class="muted">'+escape(r.missing.length?'待补证：'+r.missing.join('、'):'主要类别齐全，仍需人工核实')+'</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;color:#bcd6e8">'+escape(lastReport)+'</pre></div>';
  $('download').disabled=false;
 }catch(e){say(e.message,true)}
};
$('download').onclick=()=>{if(lastReport)save(lastReport,'knowledge-evidence-proposal.md','text/markdown;charset=utf-8')};
$('ask').onclick=async()=>{
 const btn=$('ask');btn.disabled=true;try{
  const r=await doRequest('POST','/api/kb/ask',{question:$('question').value,industry:$('filterIndustry').value.trim(),type:$('type').value});
  $('answer').innerHTML='<div class="entry"><strong>AI 实体分析</strong><p>'+escape(r.answer)+'</p><h3>实体依据</h3>'+
    r.citations.map(x=>'<p>[KB:'+escape(x.entity_id)+'] '+escape(x.reason)+'</p>').join('')+
    '<h3>待补证</h3><p>'+escape(r.missing.join('；'))+'</p><p class="muted">'+escape(r.disclaimer)+'</p></div>';
 }catch(e){say(e.message,true)}finally{btn.disabled=false}
};
})();
</script></body></html>`;
