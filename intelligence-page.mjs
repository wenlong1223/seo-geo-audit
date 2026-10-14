/* Standalone research page. Uses existing application server, no external assets. */
export const INTELLIGENCE_PAGE=String.raw\`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>行业情报工作台 · SEO/GEO Audit</title><meta name="description" content="有证据的竞品与行业信息工作台，支持真实技术扫描、商业证据登记、可追溯矩阵和 Markdown 导出。">
<style>
:root{font-family:Inter,"PingFang SC","Microsoft Yahei",system-ui,sans-serif;color:#eaf0fb;background:#081120}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% -16%,#144159,transparent 45%),#081120}
a{color:#77dfcc}button,input,select,textarea{font:inherit}.wrap{max-width:1140px;margin:0 auto;padding:24px 20px 64px}
nav{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:45px}
nav strong{font-size:18px}.muted{color:#9cb1c8;font-size:13px;line-height:1.8}
h1{font-size:clamp(26px,4.5vw,46px);margin:4px 0 14px}h2{font-size:20px;margin:0 0 18px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{background:#111f32;border:1px solid #294058;padding:22px;border-radius:16px;margin-bottom:18px}
label{font-size:13px;display:flex;flex-direction:column;gap:8px;color:#cbd9ed}input,select,textarea{width:100%;background:#0b1728;border:1px solid #395068;border-radius:9px;color:#ecf3fd;padding:11px;outline:none}
textarea{resize:vertical;min-height:94px;line-height:1.6}button{cursor:pointer;border:0;border-radius:10px;padding:12px 17px;font-weight:700;background:#5cd8c2;color:#08202a}button.secondary{background:#22364c;color:#d8ecfa;border:1px solid #405b70}button:disabled{opacity:.55;cursor:wait}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:16px}.hidden{display:none!important}
.note{background:#16293b;border-left:3px solid #60cfbf;padding:12px 15px;color:#b8cadd;font-size:13px;line-height:1.7}
.bad{border-left-color:#ee918d;background:#3d2530;color:#ffc9c9}.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:690px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #304359;padding:12px;line-height:1.6;overflow-wrap:anywhere}td{max-width:310px}th{color:#91c7da}
.tag{display:inline-block;font-size:11px;border:1px solid #466478;border-radius:7px;padding:2px 6px;margin:3px;color:#acc7d8}
.card{border:1px solid #39516a;border-radius:10px;padding:15px;margin:11px 0;background:#13243a}
.card b{font-size:14px}.card p{font-size:12px;color:#b6cbe0;line-height:1.8}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.kpis div{background:#15293f;border:1px solid #2e516a;padding:13px;border-radius:10px}.kpis b{font-size:25px;display:block;margin-top:8px}
@media(max-width:700px){.grid,.kpis{grid-template-columns:1fr}.box{padding:16px}nav{margin-bottom:26px}}
@media print{nav,.no-print,.controls{display:none!important}body{background:white;color:#111}.box,.card{background:white;color:#111;border-color:#aaa}td,th,.muted,.card p{color:#111!important}}
</style></head><body><div class="wrap">
<nav><strong>↗ SEO/GEO Audit <span style="color:#65e0c6">/ 行业情报</span></strong><a href="/">← 返回原网站技术检测</a></nav>
<header><div style="color:#6ee7cf;font-size:12px;letter-spacing:2px">INDUSTRY INTELLIGENCE · EVIDENCE FIRST</div>
<h1>行业情报与商业决策工作台</h1><p class="muted">真实网页检测 + 可追溯业务证据 + 竞品横向矩阵 + 下一步验证动作。不会凭空编造价格、收入、流量或行业规模。</p></header>
<div class="note no-print">V0.1 可用版：一次真实扫描研究主体 + 最多 2 家竞品的公开页面技术状态。业务能力、价格、客户画像和营销效果须手工补充证据。当前不保存到服务器，完成后请下载 JSON/Markdown。</div>
<section class="box no-print"><h2>① 设置研究项目</h2><div class="grid">
<label>研究主体名称<input id="subject" value="86DROP" maxlength="100" required></label>
<label>行业 / 细分赛道<input id="industry" value="跨境电商履约与Dropshipping供应链" maxlength="100" required></label>
<label style="grid-column:1/-1">研究主体官网（真实检测用）<input id="subjectUrl" value="https://www.86drop.com" placeholder="https://example.com"></label>
<label style="grid-column:1/-1">竞品清单：每行 名称 | 官网 | 类型（direct / indirect / benchmark），支持最多 16 家<textarea id="competitors" rows="5">DayOne Fulfillment | https://www.dayonefulfillment.com | direct
Bestfulfill | https://bestfulfill.com | direct
BuckyDrop | https://www.buckydrop.com | benchmark
NicheBay | https://www.nichebay.com | benchmark</textarea></label>
</div><div class="controls"><button id="scan">真实扫描本站 + 前2家竞品</button><button class="secondary" id="analyze">根据现有证据生成分析</button><span id="scanState" class="muted"></span></div>
<p class="muted">竞品类型决定可比性。当前扫描只处理前三站；其余企业可手动录入证据，不会偷偷假定未访问的网站缺少功能。</p></section>
<section class="box no-print"><h2>② 业务证据登记</h2><p class="muted">可以登记公开定价、服务范围、系统对接、海外社媒、客户评价或客户访谈。人工输入始终标记为“待核验”，即使填写了网址，也不代表软件已验证该内容。</p>
<div class="grid">
<label>企业<select id="company"></select></label>
<label>研究维度<select id="dimension">
<option value="icp">目标客户</option><option value="product">服务与产品</option><option value="pricing">报价与成本</option>
<option value="operations">履约与服务能力</option><option value="integration">系统与集成</option>
<option value="channels">获客渠道</option><option value="content">内容与SEO/GEO</option>
<option value="conversion">询盘转化</option><option value="reputation">客户反馈</option><option value="risk">风险与约束</option>
</select></label>
<label style="grid-column:1/-1">具体事实/网页原文摘录（不填泛泛结论）<textarea id="claim" maxlength="600" placeholder="示例：官方服务页列出验货及代发服务，尚未确认具体价格"></textarea></label>
<label>证据来源 URL（建议填写）<input id="source" maxlength="2048" placeholder="https://..."></label>
<label>证据日期（选填）<input id="observed" type="date"></label>
</div><div class="controls"><button id="add">添加到证据账本</button><button class="secondary" id="reset">清空本次证据</button><span id="count" class="muted">0 条手工证据</span></div></section>
<div id="error" class="note bad hidden" role="alert"></div>
<section id="results" class="hidden" aria-live="polite">
<div class="box"><h2>③ 分析结果</h2><p id="scope" class="muted"></p><div id="kpis" class="kpis"></div>
<div class="controls no-print"><button id="downloadMd">下载 Markdown 报告</button><button class="secondary" id="downloadJson">下载 JSON 数据</button><button class="secondary" id="print">打印 / 保存 PDF</button></div></div>
<div class="box"><h2>竞品横向证据矩阵</h2><div class="scroll"><table><thead id="matrixHead"></thead><tbody id="matrixBody"></tbody></table></div></div>
<div class="box"><h2>可执行行动卡（尚需验证）</h2><div id="actions"></div></div>
<div class="box"><h2>来源与扫描记录</h2><div id="records"></div><p class="muted" id="limits"></p></div></section>
</div><script data-cfasync="false">
(function(){
'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let manual=[],scanRecords=[],last=null,scans=[];
function listCompanies(){const rows=$('competitors').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,16);
 return rows.map(x=>{const z=x.split('|').map(t=>t.trim());return {name:z[0],url:z[1]||'',kind:['direct','indirect','benchmark'].includes(z[2])?z[2]:'direct'}}).filter(x=>x.name);}
function updateCompanies(){const names=[$('subject').value.trim(),...listCompanies().map(x=>x.name)];const old=$('company').value;
 $('company').innerHTML=names.filter(Boolean).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');if(names.includes(old))$('company').value=old;}
$('subject').addEventListener('input',updateCompanies);$('competitors').addEventListener('input',updateCompanies);updateCompanies();
function err(e){$('error').textContent=e?.message||String(e);$('error').classList.remove('hidden');}
async function post(path,data){const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),55000);
 try{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:ctrl.signal});
 const result=await r.json().catch(()=>({error:'服务未返回有效 JSON'}));if(!r.ok)throw Error(result.error||'HTTP '+r.status);return result;}finally{clearTimeout(t)}}
const payload=()=>({subject:$('subject').value.trim(),industry:$('industry').value.trim(),companies:listCompanies(),records:[...scanRecords,...manual]});
$('add').onclick=()=>{const claim=$('claim').value.trim();if(!claim)return err(Error('请输入可核对的具体事实'));
 if(manual.length+scanRecords.length>=200)return err(Error('本次最多200条证据'));
 manual.push({company:$('company').value,dimension:$('dimension').value,claim,sourceUrl:$('source').value.trim(),date:$('observed').value,origin:'user'});
 $('claim').value='';$('source').value='';$('error').classList.add('hidden');$('count').textContent=manual.length+' 条手工证据'};
$('reset').onclick=()=>{if(confirm('清空本次采集证据和结果？请确保已下载报告。')){manual=[];scanRecords=[];scans=[];last=null;$('count').textContent='0 条手工证据';$('results').classList.add('hidden')}};
$('scan').onclick=async()=>{const btn=$('scan');btn.disabled=true;$('error').classList.add('hidden');$('scanState').textContent='正在依次采集真实网页技术证据...';
 try{const items=listCompanies().slice(0,2);if(!items.length)throw Error('请至少填写一家竞品');
 const d=await post('/api/intelligence/scan',{subject:$('subject').value.trim(),industry:$('industry').value.trim(),url:$('subjectUrl').value.trim(),competitors:items});
 scanRecords=d.records;scans=d.scans||[];$('scanState').textContent='扫描完成：'+scans.filter(x=>!x.error).length+'/'+scans.length+' 家网站，已载入 '+scanRecords.length+' 条技术证据';
 await runAnalyze();}catch(e){err(e);$('scanState').textContent='扫描未完成'}finally{btn.disabled=false}};
async function runAnalyze(){const d=await post('/api/intelligence/analyze',payload());last=d;last.scans=scans;render(d);}
$('analyze').onclick=async()=>{try{$('error').classList.add('hidden');await runAnalyze()}catch(e){err(e)}};
function render(d){$('results').classList.remove('hidden');$('scope').textContent=d.subject+' · '+d.industry+' · '+new Date(d.generatedAt).toLocaleString('zh-CN');
 $('kpis').innerHTML=[['证据记录',d.coverage.totalRecords],['附来源链接',d.coverage.withSource],['程序实测条目',d.coverage.measured]].map(x=>'<div><span class="muted">'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('');
 $('matrixHead').innerHTML='<tr><th>维度</th>'+d.companies.map(c=>'<th>'+esc(c.name)+'</th>').join('')+'</tr>';
 $('matrixBody').innerHTML=d.matrix.map(row=>'<tr><th>'+esc(row.label)+'</th>'+row.cells.map(c=>'<td>'+(!c.items.length?'<span class="muted">未采集</span>':c.items.slice(0,4).map(x=>'<p>'+esc(x.claim)+' <span class="tag">'+esc(x.id)+'</span></p>').join(''))+'</td>').join('')+'</tr>').join('');
 $('actions').innerHTML=d.actions.map(a=>'<div class="card"><b>'+esc(a.title)+'</b><p>依据：'+esc(a.basis.join('、')||'待补充')+'</p><p>下一步：'+esc(a.next)+'</p><p>验证：'+esc(a.metric)+'</p><p>停止条件：'+esc(a.stop)+'</p></div>').join('');
 $('records').innerHTML=d.records.length?d.records.map(x=>'<div class="card"><b>'+esc(x.id+' · '+x.company+' / '+x.dimension)+'</b><p>'+esc(x.claim)+'</p><p>'+esc(x.status==='measured'?'程序页面检测':x.status==='cited-unverified'?'人工提供链接，内容未自动核验':'尚无来源')+(x.sourceUrl?' · <a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">查看原始网址 ↗</a>':'')+'</p></div>').join(''):'<p class="muted">尚未登记证据，可以先进行网站扫描或手工补充。</p>';
 if(scans.length)$('records').innerHTML+='<h3>本次扫描</h3>'+scans.map(s=>'<p class="muted">'+esc(s.company)+'：'+esc(s.error||('SEO '+s.seo+' / GEO '+s.geo+'，技术就绪度 '+s.score))+'</p>').join('');
 $('limits').textContent=d.limitations;$('results').scrollIntoView({behavior:'smooth',block:'start'});
}
function download(text,name,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
$('downloadMd').onclick=()=>{if(last)download(last.markdown,'iibd-report-'+new Date().toISOString().slice(0,10)+'.md','text/markdown;charset=utf-8')};
$('downloadJson').onclick=()=>{if(last)download(JSON.stringify({report:last,input:payload(),scans},null,2),'iibd-evidence-'+new Date().toISOString().slice(0,10)+'.json','application/json')};
$('print').onclick=()=>window.print();
})();
</script></body></html>\`;
