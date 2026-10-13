/** Bounded same-origin multi-page technical audit. Only HTML links are sampled. */
const BINARY=/\.(?:pdf|jpe?g|png|gif|webp|svg|ico|css|js|zip|rar|7z|mp4|mp3|woff2?|ttf|xml|json)$/i;
const RESTRICTED=/(?:^|\/)(?:wp-admin|admin|login|logout|signin|signup|register|checkout|cart|account|my-account|user|delete|reset-password|wp-json)(?:\/|$)/i;
export function collectSiteLinks(html,baseUrl,maxCandidates=40){
 const base=new URL(baseUrl),found=[],seen=new Set([base.pathname.replace(/\/$/,'')||'/']);
 const pattern=/<a\b[^>]{0,1200}?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
 let match,attempted=0;
 while((match=pattern.exec(html))!==null&&attempted++<2500&&found.length<maxCandidates){
  const href=match[1]??match[2]??match[3]??'';
  if(!href||href.startsWith('#')||/^(?:javascript|mailto|tel|data):/i.test(href))continue;
  try{
   const u=new URL(href,base);
   if(u.origin!==base.origin||u.username||u.password||u.search||BINARY.test(u.pathname)||RESTRICTED.test(u.pathname))continue;
   u.hash='';
   const key=u.pathname.replace(/\/$/,'')||'/';
   if(seen.has(key))continue;
   seen.add(key);found.push(u.href);
  }catch{}
 }
 return found;
}
function duplicates(pages,key){
 const groups=new Map();
 for(const p of pages){
  const value=String(p.summary?.[key]||'').trim(),code=value.toLocaleLowerCase();
  if(!value)continue;
  if(!groups.has(code))groups.set(code,{text:value,urls:[]});
  groups.get(code).urls.push(p.url);
 }
 return [...groups.values()].filter(x=>x.urls.length>1);
}
export function buildSiteReport(startUrl,reports,failures=[],requestedPages=5,discoveredLinks=0){
 if(!Array.isArray(reports)||!reports.length||!reports.every(x=>x?.summary&&Array.isArray(x.checks)))
  throw new Error('多页面报告必须基于真实页面检测结果');
 const avg=field=>Math.round(reports.reduce((n,p)=>n+(Number(p[field])||0),0)/reports.length);
 const repeatedTitles=duplicates(reports,'title'),repeatedDescriptions=duplicates(reports,'description');
 const findings=[
  {id:'duplicate-title',label:'重复页面标题',count:repeatedTitles.reduce((n,x)=>n+x.urls.length,0),items:repeatedTitles,fix:'针对不同内容设置独立、真实的 Title。'},
  {id:'duplicate-description',label:'重复页面描述',count:repeatedDescriptions.reduce((n,x)=>n+x.urls.length,0),items:repeatedDescriptions,fix:'为不同业务页面编写对应的 Meta Description。'},
  {id:'missing-title',label:'缺少 Title',count:reports.filter(x=>!x.summary.title).length,urls:reports.filter(x=>!x.summary.title).map(x=>x.url),fix:'补充与页面内容一致的标题。'},
  {id:'missing-description',label:'缺少 Meta Description',count:reports.filter(x=>!x.summary.description).length,urls:reports.filter(x=>!x.summary.description).map(x=>x.url),fix:'编写准确的页面摘要。'},
  {id:'noindex',label:'页面包含 noindex',count:reports.filter(x=>x.checks.some(c=>c.id==='index'&&c.status==='fail')).length,urls:reports.filter(x=>x.checks.some(c=>c.id==='index'&&c.status==='fail')).map(x=>x.url),fix:'确认这些页面是否有意禁止收录。'},
  {id:'missing-schema',label:'未发现有效 JSON-LD',count:reports.filter(x=>x.checks.find(c=>c.id==='jsonld')?.status==='fail').length,urls:reports.filter(x=>x.checks.find(c=>c.id==='jsonld')?.status==='fail').map(x=>x.url),fix:'依据各页面实际内容部署对应 Schema.org 结构化数据。'}
 ].filter(x=>x.count>0);
 const pages=reports.map(p=>({
  url:p.url,scannedAt:p.scannedAt,score:p.score,seoScore:p.seoScore,geoScore:p.geoScore,
  title:p.summary.title,description:p.summary.description,
  failed:p.failed,warnings:p.warnings,
  issues:p.checks.filter(c=>c.status==='fail'||c.status==='warn')
   .sort((a,b)=>(a.status==='fail'?-1:1)-(b.status==='fail'?-1:1)||b.weight-a.weight)
   .slice(0,12).map(c=>({id:c.id,label:c.label,status:c.status,evidence:c.detail,fix:c.fix}))
 }));
 return {kind:'geo-multipage-audit',version:'1.3.0',scannedAt:new Date().toISOString(),website:startUrl,
  requestedPages,scannedPages:reports.length,failedPages:failures.length,discoveredLinks,
  average:{score:avg('score'),seo:avg('seoScore'),geo:avg('geoScore')},findings,pages,failures,
  methodology:'仅从入口页静态 HTML 链接选择最多 '+requestedPages+' 个同源页面，使用同一套技术检测规则；均分只计算成功检测页面。',
  disclaimer:'这是有限页面抽样，不是全站爬取、不执行客户端 JavaScript、不验证 Google 实际索引或任何 AI 平台的引用率。样本不足或抓取失败时按实际数据展示，不推断未检测页面。'};
}
