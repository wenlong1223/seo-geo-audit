/** SEO/GEO V4 portal. Existing public scan APIs remain unchanged.
 * Snapshots are client-side in this browser only; never uploaded as stored reports.
 */
export const V4_PAGE = String.raw<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>Web Toolkit V4 · SEO/GEO 网站工作台</title>
<meta name="description" content="Safari Web Toolkit V4：本地报告导入、历史差异、内链拓扑、SEO/GEO 检测、Codex 整改清单。">
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",Inter,system-ui,sans-serif;background:#08111e;color:#e9f1ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 72% -10%,#173f55,transparent 40%),#08111e;min-height:100vh}
a{color:#7ee5d4;text-decoration:none}button,input{font:inherit}button{cursor:pointer}
main{max-width:1120px;margin:0 auto;padding:23px 18px 75px}
header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.brand{font-size:19px;font-weight:850}.sub{color:#83a4c0;font-size:12px}
h1{font-size:clamp(27px,5vw,43px);letter-spacing:-1px;margin:46px 0 13px}
h2{font-size:18px;margin:0 0 16px}.lead{color:#a0b8cf;line-height:1.9;max-width:790px}
.panel{border:1px solid #284154;border-radius:17px;background:#111f30;padding:20px;margin-top:18px;min-width:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
.stat{background:#15283d;border:1px solid #2d485d;border-radius:11px;padding:14px}
.stat strong{display:block;font-size:26px;color:#6ce1c8}.stat span{display:block;font-size:12px;color:#92aec7}
label{display:block;font-size:12px;color:#aac6db;margin-bottom:8px}
input[type=url],select{width:100%;padding:12px;background:#0a1626;color:#e9f1ff;border:1px solid #36546b;border-radius:10px}
input[type=file]{width:100%;font-size:13px}
.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}
button,.btn{border:1px solid #385976;background:#19324c;color:#cce7f3;border-radius:10px;padding:10px 15px;font-size:13px;font-weight:750}
.primary{background:linear-gradient(110deg,#52ddbf,#6bb9fa);border-color:transparent;color:#052230}
button:disabled{opacity:.5;cursor:wait}.muted{font-size:12px;color:#8da9be;line-height:1.8}
.error{color:#ffb7b7}.good{color:#82e8c8}
table{border-collapse:collapse;width:100%;font-size:12px;table-layout:fixed}
td,th{padding:10px 8px;border-bottom:1px solid #284053;text-align:left;word-break:break-word;vertical-align:top}
th{color:#98bad1}th:first-child{width:56%}
.chip{font-size:11px;color:#b0d5e5;border:1px solid #36556c;padding:3px 7px;border-radius:6px;display:inline-block;margin:2px 5px 2px 0}
.scroll{overflow:auto;max-height:460px}pre{background:#071421;border:1px solid #2c4355;border-radius:10px;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:340px;overflow:auto;font:11px/1.7 ui-monospace,monospace}
.disclaimer{margin-top:25px;color:#7795ac;font-size:12px;line-height:1.8}
@media(max-width:700px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.panel{padding:15px}h1{margin-top:28px}}
</style></head><body><main>
<header><div><div class="brand">◈ SEO/GEO <span style="color:#67e0c6">Web Toolkit V4</span></div><div class="sub">SITE INTELLIGENCE · Safari + Web</div></div><a href="/">返回原有 GEO 审计 ↗</a></header>
<h1>全站问题管理工作台</h1>
<p class="lead">在电脑上使用网站审计，在 iPhone Safari 中使用 Userscripts 网页工具箱。导入抓取报告，保存浏览器本地快照，对比前后变化，整理内链和 Codex 整改任务。</p>
<div class="grid">
<section class="panel"><h2>网站快速抽样</h2><label for="url">公开网址</label><input id="url" type="url" placeholder="https://example.com"><div class="actions"><button class="primary" id="scan">检测当前网站（5 页抽样）</button></div><p class="muted">通过原站 /api/site-audit 执行公网 HTML 安全抽样；最多 5 页，不代表完整全站扫描。深入抓取请用 Safari V4 插件。</p></section>
<section class="panel"><h2>Safari 报告接入</h2><label for="file">导入 V3/V4 抓取 JSON 报告</label><input id="file" type="file" accept=".json,application/json"><div class="actions"><button id="guide">查看连接方法</button><button id="clear">清空本地历史</button></div><p class="muted">Safari 插件可直接打开此页面并发送报告；也可以下载 JSON 后手动导入。报告只保存在当前浏览器 localStorage，不会进入网站服务端数据库。</p></section>
</div>
<div id="status" class="panel muted" aria-live="polite">尚无检测报告。首次使用可输入域名检测，或从 Safari 导入。</div>
<section class="panel" id="results" hidden><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h2>检测概览</h2><span class="sub" id="source"></span></div>
<div class="stats"><div class="stat"><strong id="count">—</strong><span>已检测页面</span></div><div class="stat"><strong id="seo">—</strong><span>SEO 参考分</span></div><div class="stat"><strong id="geo">—</strong><span>GEO 参考分</span></div><div class="stat"><strong id="issues">—</strong><span>待处理问题</span></div></div>
<div class="actions"><button id="export">下载当前 JSON</button><button id="codex">下载 Codex 整改任务</button><button id="md">下载 Markdown 摘要</button></div>
</section>
<div class="grid" id="details" hidden>
<section class="panel"><h2>历史快照差异</h2><div id="history" class="muted">需至少两份同站报告。</div></section>
<section class="panel"><h2>站内链接关系</h2><div id="graph" class="muted">当前报告没有内链边数据。</div></section>
</div>
<section class="panel" id="pagesPanel" hidden><h2>逐页问题与证据</h2><div class="scroll"><table><thead><tr><th>页面 URL / 标题</th><th>SEO/GEO</th><th>问题</th></tr></thead><tbody id="pages"></tbody></table></div></section>
<p class="disclaimer">技术分数属于规则驱动的参考值，并不代表 Google 排名、真实 AI 搜索引用概率或流量。Safari 抓取受浏览器前台运行、同源策略和网站 robots 规则限制。导入报告可能包含页面公开文本，不建议导入登录后台、个人数据或客户机密。</p>
</main>
<script>
(function(){
'use strict';
const KEY='geo.zwlla.com.toolkit.v4.snapshots';
const $=id=>document.getElementById(id);
const state={current:null};
function status(s,error){$('status').textContent=s;$('status').className='panel muted'+(error?' error':'');}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch{return '';}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(d)?d.slice(0,12):[];}catch{return [];}}
function save(report){const a=load();a.unshift({when:new Date().toISOString(),website:report.website,report});try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,8)));}catch{status('浏览器存储空间不足：本次报告可浏览和导出，但未能保存历史。',true);}}
function textNode(node,v){node.textContent=String(v==null?'':v);}
function normalize(obj){
 if(!obj||typeof obj!=='object')throw Error('无效报告');
 const r=obj.kind==='geo-v4-site-audit'||obj.kind==='geo-multipage-audit'?obj:(obj.crawl&&Array.isArray(obj.crawl.pages)?obj.crawl:(Array.isArray(obj.pages)?obj:null));
 if(!r)throw Error('仅支持包含 pages 数组的全站报告');
 const list=Array.isArray(r.pages)?r.pages:[];
 if(list.length>120)throw Error('最多导入 120 个页面');
 const pages=list.map(p=>({
  url:safeUrl(p.url||p.finalUrl||''),title:String(p.title||p.summary?.title||'').slice(0,220),
  seo:Number(p.seoScore??p.seo??p.scores?.seo??0),geo:Number(p.geoScore??p.geo??p.scores?.geo??0),
  issues:Array.isArray(p.issues)?p.issues.slice(0,35):[],status:p.status,
  depth:p.depth,links:Array.isArray(p.links)?p.links.slice(0,120):[]
 })).filter(p=>p.url);
 if(!pages.length)throw Error('报告中没有有效的已检测页面 URL');
 const website=safeUrl(r.website||r.startUrl||r.origin||pages[0].url)||pages[0].url;
 const graph=Array.isArray(r.graph)?r.graph.slice(0,700).map(e=>({from:safeUrl(e.from),to:safeUrl(e.to)})).filter(e=>e.from&&e.to):[];
 const avg=k=>Math.round(pages.reduce((n,p)=>n+(p[k]||0),0)/pages.length);
 return {kind:'geo-v4-portal-report',website,scannedAt:r.scannedAt||new Date().toISOString(),
 pages,graph,scores:{seo:Number(r.scores?.seo??r.average?.seo??avg('seo')),geo:Number(r.scores?.geo??r.average?.geo??avg('geo'))},
 failures:(Array.isArray(r.failures)?r.failures:[]).slice(0,100),coverage:r.coverage||{scannedPages:pages.length},disclaimer:r.disclaimer||'只反映已扫描样本'};
}
function makeRows(parent,rows){parent.replaceChildren();for(const cells of rows){const tr=document.createElement('tr');for(const v of cells){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}parent.append(tr);}}
function fmtDate(s){try{return new Date(s).toLocaleString('zh-CN');}catch{return s;}}
function render(){
 const r=state.current;if(!r)return;
 $('results').hidden=$('details').hidden=$('pagesPanel').hidden=false;
 textNode($('source'),new URL(r.website).hostname+' · '+fmtDate(r.scannedAt));
 textNode($('count'),r.pages.length);textNode($('seo'),r.scores.seo||0);textNode($('geo'),r.scores.geo||0);
 const issueCount=r.pages.reduce((n,p)=>n+p.issues.length,0);
 textNode($('issues'),issueCount);
 makeRows($('pages'),r.pages.map(p=>[p.url+'\n'+(p.title||'未读到页面标题'),p.seo+' / '+p.geo,p.issues.slice(0,4).map(x=>x.label||x.name||x.id||x.key||'问题').join('；')||'未发现明确问题']));
 const host=new URL(r.website).hostname;
 const versions=load().filter(x=>{try{return new URL(x.website).hostname===host;}catch{return false;}});
 const h=$('history');h.replaceChildren();
 if(versions.length<2)textNode(h,'当前浏览器没有该网站的第二次检测记录，下一次导入后将自动显示差异。');
 else {
  const old=versions[1].report;const oldBy=new Map(old.pages.map(p=>[p.url,p]));
  const fresh=r.pages.filter(p=>!oldBy.has(p.url)).length;
  const changed=r.pages.filter(p=>oldBy.has(p.url)&&JSON.stringify(p.issues.map(i=>i.id||i.key).sort())!==JSON.stringify(oldBy.get(p.url).issues.map(i=>i.id||i.key).sort())).length;
  textNode(h,'对比 '+fmtDate(versions[1].when)+'\n新增扫描页面 '+fresh+' 页；问题项发生变化 '+changed+' 页。\nSEO 平均分变化 '+(r.scores.seo-old.scores.seo)+'；GEO 平均分变化 '+(r.scores.geo-old.scores.geo)+'。\n注意：扫描样本不同可能造成分数不可比。');
 }
 const g=$('graph');g.replaceChildren();
 if(!r.graph.length){textNode(g,'报告未提供页面链接边，仅能进行逐页检查。请使用 Safari V4 的全站抓取与导出功能，或后续服务端拓扑扫描。');}
 else{
  const count=new Map();for(const e of r.graph)count.set(e.to,(count.get(e.to)||0)+1);
  const lines=[...count.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(x=>x[1]+' 条入链 · '+x[0]);
  textNode(g,'已检测页面之间 '+r.graph.length+' 条内链\n\n入链最多的页面：\n'+lines.join('\n'));
 }
 status('已载入 '+host+' 的 '+r.pages.length+' 页报告；快照存储在本机浏览器。');
}
function accept(input){const r=normalize(input);state.current=r;save(r);render();}
function saveFile(name,mime,text){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:mime}));a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
function task(){
 const r=state.current,rows=[];
 rows.push('# SEO/GEO V4 Codex 整改任务','','目标站点：'+r.website,'扫描日期：'+r.scannedAt,'声明：按实测证据人工复核，禁止虚构资质、排名、AI 引用。','','## 执行规范','- 先确认仓库和运行环境，禁止直接修改线上站','- 按 URL 分任务执行；保留现有视觉与核心业务功能','- 每项输出修改前证据、修改记录、测试和回滚方案','- 不可依据页面检测结果擅自修改 robots 或 noindex 意图','');
 for(const p of r.pages){const issues=p.issues.filter(i=>i.status!=='pass'&&i.status!=='na');if(!issues.length)continue;
  rows.push('## '+p.url,'页面标题：'+(p.title||'缺失'));
  for(const i of issues.slice(0,18))rows.push('- ['+(i.status||'issue')+'] '+(i.label||i.name||i.id||'检查项')+' | 证据：'+(i.detail||i.evidence||i.value||'请复核')+' | 建议：'+(i.fix||i.tip||'人工确认后修复'));
  rows.push('');
 }
 rows.push('## 验收','- 同源页面重新检测，对比前后报告','- 确认 HTML、Schema、canonical、索引配置符合实际业务事实','- 将结果写入 QA_REPORT.md');
 return rows.join('\n');
}
function summary(){
 const r=state.current;return ['# V4 网站分析报告','',r.website,r.scannedAt,'已分析 '+r.pages.length+' 页','SEO '+r.scores.seo+' / GEO '+r.scores.geo,'',...r.pages.map(p=>'## '+p.url+'\n'+(p.title||'')+'\n问题：'+p.issues.map(i=>i.label||i.name||i.id).join('、')),'',r.disclaimer].join('\n');
}
$('scan').onclick=async()=>{
 const b=$('scan'),url=$('url').value.trim();if(!url){status('请输入网站地址',true);return;}
 b.disabled=true;status('正在执行服务端 5 页抽样扫描…');
 try{
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),65000);let res;
  try{res=await fetch('/api/site-audit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,maxPages:5}),signal:ctrl.signal});}finally{clearTimeout(timer);}
  const obj=await res.json();if(!res.ok)throw Error(obj.error||'HTTP '+res.status);accept(obj);
 }catch(e){status('扫描失败：'+e.message,true);}finally{b.disabled=false;}
};
$('file').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;if(file.size>1200000){status('文件超过 1.2 MB 上限',true);return;}
 try{accept(JSON.parse(await file.text()));}catch(e){status('导入失败：'+e.message,true);}
 e.target.value='';
};
$('guide').onclick=()=>alert('在 iPhone 安装 Safari Web Toolkit V4，点击「连接 geo.zwlla.com」，Safari 会打开本页并自动传入当前报告。若自动导入受浏览器弹窗限制，请先用插件下载 JSON，再从本页选择文件导入。');
$('clear').onclick=()=>{if(confirm('清空此浏览器中的 V4 检测历史吗？')){localStorage.removeItem(KEY);status('本地历史已清空；服务器没有保存这些快照。');}};
$('export').onclick=()=>state.current&&saveFile('geo-v4-report.json','application/json',JSON.stringify(state.current,null,2));
$('codex').onclick=()=>state.current&&saveFile('codex-geo-v4-fixes.md','text/markdown;charset=utf-8',task());
$('md').onclick=()=>state.current&&saveFile('geo-v4-summary.md','text/markdown;charset=utf-8',summary());
window.addEventListener('message',event=>{
 if(event.source!==window.opener||!event.data||event.data.type!=='ZWLLA_TOOLKIT_REPORT_V4')return;
 try{
  const raw=JSON.stringify(event.data.report);
  if(raw.length>950000)throw Error('传输报告超过 950 KB');
  accept(event.data.report);
  try{window.opener.postMessage({type:'ZWLLA_TOOLKIT_IMPORTED_V4'},event.origin);}catch{}
 }catch(e){status('Safari 传入报告失败：'+e.message,true);}
});
try{if(window.opener)window.opener.postMessage({type:'ZWLLA_TOOLKIT_READY_V4'},'*');}catch{}
})();
</script></body></html>