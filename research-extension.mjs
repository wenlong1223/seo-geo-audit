/* Private research tools appended after legacy report UI, avoiding changes to old controller. */
export const RESEARCH_EXTENSION=String.raw`
<section class="wrap" style="max-width:1140px;margin:30px auto 60px;padding:0 20px">
<section class="box" id="ri-workspace">
<h2>长期研究项目｜16 家竞品分批采集 + 数据库 + AI 来源核验</h2>
<p class="muted">第一步：输入管理员密钥（Railway → Variables → IIBD_ADMIN_TOKEN），然后创建项目。采集按每批2家进行，进度每批写入数据库，断开后可继续。所有网站扫描仅采集公开可见页面，不能推断未公开价格或经营情况。</p>
<div class="grid"><label>管理员访问密钥<input id="ri-token" type="password" autocomplete="off" placeholder="Railway IIBD_ADMIN_TOKEN"></label><label>已保存研究项目<select id="ri-projects"><option value="">请选择</option></select></label></div>
<div class="controls"><button id="ri-new">创建持久项目</button><button class="secondary" id="ri-refresh">刷新项目列表</button><button class="secondary" id="ri-load">读取项目</button><button id="ri-batch">开始 / 继续采集全部竞品</button><button id="ri-ai">生成有来源的 AI 报告</button></div>
<p class="note" id="ri-progress">尚未打开持久化项目。</p>
</section><section id="ri-output" class="box hidden"><h2>研究结果</h2><div id="ri-project-data"></div><h3>登记补充证据</h3>
<div class="grid"><label>企业名称<input id="ri-company" placeholder="必须与项目企业名称一致"></label><label>研究维度<select id="ri-dimension"><option value="product">产品与服务</option><option value="pricing">报价与成本</option><option value="operations">履约能力</option><option value="integration">系统集成</option><option value="channels">获客渠道</option><option value="content">内容与SEO/GEO</option><option value="icp">目标客户</option><option value="conversion">询盘转化</option><option value="reputation">客户评价</option><option value="risk">风险</option></select></label>
<label style="grid-column:1/-1">要登记的事实<textarea id="ri-claim" placeholder="写清楚观察事实，避免推断"></textarea></label>
<label>证据来源链接<input id="ri-source" placeholder="https://..."></label><label>网页原文摘录（≥12 字，逐字核对）<textarea id="ri-quote"></textarea></label></div>
<div class="controls"><button class="secondary" id="ri-add">校验原文并保存</button><button class="secondary" id="ri-json">下载完整持久数据 JSON</button></div>
<div id="ri-ai-result"></div></section></section>
<script data-cfasync="false">
(function(){
'use strict';
const q=id=>document.getElementById('ri-'+id),esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let projectId='',snapshot=null;
function progress(s){q('progress').textContent=s}
async function request(method,path,body){
 const token=q('token').value.trim();if(!token)throw Error('请输入管理员密钥');
 const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),65000);
 const opts={method,signal:ctrl.signal,headers:{Authorization:'Bearer '+token}};
 if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 try{const r=await fetch(path,opts),o=await r.json().catch(()=>({error:'服务端未返回JSON'}));if(!r.ok)throw Error(o.error||('HTTP '+r.status));return o}finally{clearTimeout(t)}
}
function fail(e){progress('操作未完成：'+String(e?.message||e))}
function parseCompetitors(){return document.getElementById('competitors').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,16).map(x=>{const v=x.split('|').map(t=>t.trim());return {name:v[0],url:v[1],kind:v[2]||'direct'}})}
function formData(){return {subject:document.getElementById('subject').value.trim(),industry:document.getElementById('industry').value.trim(),url:document.getElementById('subjectUrl').value.trim(),competitors:parseCompetitors()}}
async function reload(){const r=await request('GET','/api/research/projects');q('projects').innerHTML='<option value="">选择持久项目</option>'+r.projects.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.subject+' — '+x.industry+'（'+x.cursor+'/'+x.total+'）')+'</option>').join('');if(projectId)q('projects').value=projectId}
function showAI(report){const refs=new Map((snapshot?.evidence||[]).map(x=>[x.id,x]));q('ai-result').innerHTML='<h3>AI 来源研究</h3><p>'+esc(report.summary||'')+'</p>'+
 (report.findings||[]).map(x=>'<div class="card"><b>'+esc(x.claim)+'</b><p>'+esc(x.next_step)+'</p><p>证据：'+(x.source_ids||[]).map(id=>{const s=refs.get(id);return s?'<a target="_blank" rel="noopener noreferrer" href="'+esc(s.source_url)+'">'+esc(s.company+' #'+id.slice(0,8))+'</a>':'引用无效'}).join('、')+'</p></div>').join('')+
 '<p class="muted">待验证：'+esc((report.unknowns||[]).join('；'))+'</p><p class="muted">'+esc(report.disclaimer||'')+'</p>'}
function show(data){
 snapshot=data;projectId=data.project.id;q('output').classList.remove('hidden');q('projects').value=projectId;
 const n=data.companies.filter(x=>x.position>=0).length,finished=data.companies.filter(x=>x.position>=0&&x.scan_status!=='pending').length;
 q('project-data').innerHTML='<div class="kpis"><div>竞品<b>'+n+'</b></div><div>已处理<b>'+finished+'/'+n+'</b></div><div>证据条目<b>'+data.evidence.length+'</b></div></div>'+
 '<div class="scroll"><table><thead><tr><th>企业</th><th>类型</th><th>状态</th></tr></thead><tbody>'+data.companies.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.kind)+'</td><td>'+esc(c.scan_status)+'</td></tr>').join('')+'</tbody></table></div>'+
 '<h3>已保存的证据（最新12条）</h3>'+data.evidence.slice(0,12).map(e=>'<div class="card"><b>'+esc(e.company+' / '+e.dimension+' / '+e.status)+'</b><p>'+esc(e.quote||e.claim)+'</p>'+(e.source_url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(e.source_url)+'">来源网页 ↗</a>':'')+'</div>').join('');
 if(data.reports.length)showAI(data.reports[0].output);
 progress('已保存项目：'+data.project.subject+'，'+finished+'/'+n+'家完成，'+data.evidence.length+'条证据');
}
async function load(id){const d=await request('GET','/api/research/projects/'+encodeURIComponent(id));show(d)}
q('new').onclick=async()=>{try{const d=await request('POST','/api/research/projects',formData());projectId=d.project.id;await reload();show(d)}catch(e){fail(e)}};
q('refresh').onclick=async()=>{try{await reload();progress('项目清单已刷新')}catch(e){fail(e)}};
q('load').onclick=async()=>{try{const id=q('projects').value;if(!id)throw Error('请先选择项目');await load(id)}catch(e){fail(e)}};
q('batch').onclick=async()=>{const button=q('batch');button.disabled=true;try{
 if(!projectId)throw Error('请先创建或加载项目');
 let d;do{
 progress('正在抓取下一批公开网站，处理后自动存库……');
 d=await request('POST','/api/research/projects/'+encodeURIComponent(projectId)+'/batch',{});
 progress('进度 '+d.cursor+'/'+d.total+'：'+d.processed.map(x=>x.company+' '+(x.status==='failed'?'抓取失败':'已保存')).join('、'));
 if(!d.done)await new Promise(resolve=>setTimeout(resolve,2700));
 }while(!d.done);
 await load(projectId);progress('全部批次处理完成（部分站点如失败会标出，不编造证据）');
 }catch(e){fail(e)}finally{button.disabled=false}};
q('ai').onclick=async()=>{const button=q('ai');button.disabled=true;try{
 if(!projectId)throw Error('请先创建或加载项目');progress('正在基于可追溯原文生成研究报告……');
 const r=await request('POST','/api/research/projects/'+encodeURIComponent(projectId)+'/ai',{});
 await load(projectId);showAI(r.report);progress('AI研究已持久保存，模型：'+r.model+'。建议人工复核观点。');
 }catch(e){fail(e)}finally{button.disabled=false}};
q('add').onclick=async()=>{try{if(!projectId)throw Error('请先创建或加载项目');
 const r=await request('POST','/api/research/projects/'+encodeURIComponent(projectId)+'/evidence',{company:q('company').value,dimension:q('dimension').value,claim:q('claim').value,sourceUrl:q('source').value,quote:q('quote').value});
 await load(projectId);progress(r.matched?'原文匹配成功，已保存并可作为AI引用':'证据已保存但原文未核实，AI不会引用');
 }catch(e){fail(e)}};
q('json').onclick=()=>{if(!snapshot)return;const b=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='iibd-research-'+projectId+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
})();
</script>
`;
