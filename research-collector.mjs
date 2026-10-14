/* Respectfully collect bounded, literal public website evidence. */
import {createHash} from 'node:crypto';
const clean=s=>String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
 .replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'")
 .replace(/\s+/g,' ').trim();
const sourceHash=s=>createHash('sha256').update(String(s)).digest('hex');
function extractPublicClaims(html,url,company){
 const rows=[],seen=new Set();
 const add=(dimension,quote)=>{
  quote=clean(quote).slice(0,360);
  if(quote.length<12||seen.has(quote.toLowerCase()))return;
  seen.add(quote.toLowerCase());
  rows.push({dimension,claim:'网站公开原文：'+quote,quote,sourceUrl:url,origin:'collector',status:'page-observed',sourceHash:sourceHash(quote)});
 };
 const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
 add('content',title);
 const meta=html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]||html.match(/<meta\b[^>]*content=["'][^"']+["'][^>]*name=["']description["'][^>]*>/i)?.[0]||'';
 const description=meta.match(/content=["']([^"']+)["']/i)?.[1]||'';
 add('product',description);
 for(const m of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)){
  add('product',m[1]);if(rows.length>=6)break;
 }
 for(const m of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)){
  const plain=clean(m[1]);if(plain.length<45||plain.length>400)continue;
  if(/price|pricing|quote|cost|费用|报价|价格/i.test(plain))add('pricing',plain);
  else if(/ship|fulfill|warehouse|delivery|shipping|仓储|发货|物流|履约/i.test(plain))add('operations',plain);
  else if(/integrat|API|Shopify|WooCommerce|系统|对接/i.test(plain))add('integration',plain);
  else continue;
  if(rows.length>=10)break;
 }
 return rows.slice(0,10);
}
function canVisitByRobots(body,path){
 if(!body)return true;
 const lines=String(body).split(/\r?\n/).map(x=>x.replace(/#.*/,'').trim());
 let applies=false,specific=false,denied=[];
 for(const line of lines){
  const [field,...rest]=line.split(':');const value=rest.join(':').trim();
  if(!field)continue;
  if(/^user-agent$/i.test(field)){specific=true;applies=value==='*';continue}
  if(specific&&applies&&/^disallow$/i.test(field)&&value)denied.push(value);
 }
 return !denied.some(x=>x==='/'||path.startsWith(x));
}
export async function collectCompanyEvidence(company,{audit,fetchSafe,normalizeURL,collectSiteLinks}){
 const url=normalizeURL(company.website).href;
 const main=await fetchSafe(url);
 if(main.status>=400)throw Error('首页 HTTP '+main.status);
 if(!/text\/html|application\/xhtml\+xml/i.test(String(main.headers['content-type']||'text/html')))throw Error('首页非HTML');
 const origin=new URL(main.url).origin;
 let robots=null;try{robots=await fetchSafe(origin+'/robots.txt',origin)}catch{}
 if(robots?.status===200&&!canVisitByRobots(robots.body,new URL(main.url).pathname))throw Error('robots.txt 禁止采集该页面');
 const first=extractPublicClaims(main.body,main.url,company);
 const candidates=collectSiteLinks(main.body,main.url,35).filter(link=>{
  const p=new URL(link).pathname;return /service|fulfill|price|solution|about|integrat|product|shipping|warehous|dropship|服务|价格/i.test(decodeURIComponent(p));
 }).slice(0,1);
 if(candidates.length&&(!robots||robots.status!==200||canVisitByRobots(robots.body,new URL(candidates[0]).pathname))){
  try{const extra=await fetchSafe(candidates[0],origin);
   if(extra.status===200&&/text\/html/i.test(String(extra.headers['content-type']||'text/html')))
    first.push(...extractPublicClaims(extra.body,extra.url,company).slice(0,6));
  }catch{}
 }
 try{
  const technical=await audit(url);
  first.push({dimension:'content',claim:'SEO/GEO 技术就绪度（启发式）SEO '+technical.seoScore+' / GEO '+technical.geoScore,
   quote:'Title: '+(technical.summary.title||'未设置')+'。本条为页面技术测试，不代表行业排名。',
   sourceUrl:technical.url,origin:'collector',status:'measured',sourceHash:sourceHash(technical.url+technical.scannedAt)});
 }catch{}
 return first;
}
export {extractPublicClaims,canVisitByRobots};
