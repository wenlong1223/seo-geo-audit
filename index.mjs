/** SEO / GEO Audit - standalone Railway Function (Bun), no third-party packages. */
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { buildEnterpriseReport,validateBusinessProfile } from './enterprise.mjs';
import { buildComparison } from './compare.mjs';
import { collectSiteLinks,buildSiteReport } from './site.mjs';

const blocked = new BlockList();
for (const [ip, mask] of [
  ['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],
  ['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],
  ['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],
  ['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]
]) blocked.addSubnet(ip, mask, 'ipv4');
for (const [ip, mask] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32]]) blocked.addSubnet(ip, mask, 'ipv6');
const deniedHosts = /(^localhost$|\.localhost$|\.local$|\.internal$|\.home$|\.test$|\.invalid$|\.onion$|\.arpa$)/i;
const MAX_RESPONSE = 800_000;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT = 7500;
const cleanText = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim();
const chars = (s) => [...String(s || '')].length;
function normalizeURL(input) {
  let raw = String(input || '').trim();
  if (!raw || raw.length > 2048) throw new Error('请输入长度不超过 2048 字符的网址');
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u; try { u = new URL(raw); } catch { throw new Error('网址格式不正确'); }
  if (!['http:','https:'].includes(u.protocol) || u.username || u.password || (u.port && !['80','443'].includes(u.port))) throw new Error('仅支持无账号密码的 HTTP/HTTPS 标准端口网址');
  if (!u.hostname || isIP(u.hostname.replace(/^\[|\]$/g,'')) || deniedHosts.test(u.hostname) || !u.hostname.includes('.')) throw new Error('仅允许公网域名，不能检测 IP 地址或内网主机');
  if (u.hostname.length > 253) throw new Error('域名过长');
  u.hash = '';
  return u;
}
async function publicAddress(hostname) {
  let addrs;
  try { addrs = await lookup(hostname, { all: true, verbatim: true }); }
  catch { throw new Error('无法解析目标域名'); }
  // Select only a DNS answer that is a routable public address, and pin it.
  const candidates = addrs.filter(x => {
    const family = isIP(x.address);
    if (!family || family !== x.family) return false;
    if (blocked.check(x.address, family === 6 ? 'ipv6' : 'ipv4')) return false;
    // Reject IPv6-mapped, local, documentation, and non-global ranges.
    if (family === 6 && !/^[23][0-9a-f]*:/i.test(x.address)) return false;
    return true;
  });
  if (!candidates.length) throw new Error('目标域名没有可用的公网 IP 地址');
  return candidates.find(x => x.family === 4) || candidates[0];
}
async function oneRequest(u) {
  const addr = await publicAddress(u.hostname);
  return await new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, value) => { if (settled) return; settled = true; if (err) reject(err); else resolve(value); };
    const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)({
      protocol: u.protocol, hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search, method:'GET',
      headers: {'User-Agent':'SeoGeoAuditBot/1.0 (+https://github.com/wenlong1223)', 'Accept':'text/html,application/xml,text/xml,text/plain;q=0.8,*/*;q=0.2', 'Accept-Encoding':'identity'},
      lookup: (_host, opts, callback) => { if (typeof opts === 'object' && opts.all) callback(null,[addr]); else callback(null,addr.address,addr.family); },
      timeout: REQUEST_TIMEOUT,
    }, res => {
      const chunks = []; let length = 0;
      res.on('data', chunk => { length += chunk.length; if (length > MAX_RESPONSE) { req.destroy(new Error('目标页面超过 800 KB 的安全限制')); return; } chunks.push(chunk); });
      res.on('end', () => {
        try {
          let body = Buffer.concat(chunks); const enc = String(res.headers['content-encoding'] || '').toLowerCase();
          if (enc === 'gzip') body = gunzipSync(body); else if (enc === 'deflate') body = inflateSync(body); else if (enc === 'br') body = brotliDecompressSync(body);
          if (body.length > MAX_RESPONSE) throw new Error('解压后的页面超过 800 KB 安全限制');
          done(null,{status:res.statusCode || 0,headers:res.headers,body:body.toString('utf8')});
        } catch(e){done(e)}
      });
      res.on('error',e=>done(e));
    });
    req.on('timeout',()=>req.destroy(new Error('请求超时（7.5 秒）')));
    req.on('error',e=>done(new Error('请求失败：'+e.message)));
    req.end();
  });
}
async function fetchSafe(url,allowedOrigin=null) {
  let u = normalizeURL(url); let hops = 0;
  while (true) {
    if(allowedOrigin && u.origin!==allowedOrigin)throw new Error('站内采样拒绝跨站跳转');
    const response = await oneRequest(u);
    if ([301,302,303,307,308].includes(response.status) && response.headers.location) {
      if (++hops > MAX_REDIRECTS) throw new Error('跳转次数过多');
      u = normalizeURL(new URL(response.headers.location,u).href);
      continue;
    }
    return {...response,url:u.href, redirects:hops};
  }
}
function tags(html, name) {
  const pattern = new RegExp(`<${name}(?=[\\s/>])[^>]*>`, 'gi');
  return [...html.matchAll(pattern)].map(m => attrs(m[0]));
}
function attrs(html) {
  const out = {};
  const start = html.replace(/^<\/?[\w:-]+\s*/, '').replace(/\/?>$/, '');
  for (const m of start.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}
function firstMatch(html, re) {return cleanText(html.match(re)?.[1] || '');}
function metaValue(meta, key, value) {return meta.find(x => x[key] === value)?.content || '';}
function jsonTypes(input) {
  const found = new Set();
  function visit(x, depth=0) { if (depth>12 || !x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.slice(0,100).forEach(y=>visit(y,depth+1)); return; }
    if (x['@type']) (Array.isArray(x['@type'])?x['@type']:[x['@type']]).forEach(t=>found.add(String(t)));
    for(const [key,val] of Object.entries(x)) if (key !== '@context' && key !== '@type') visit(val,depth+1);
  }
  visit(input); return [...found];
}
function analyzeHTML(html, context={}) {
  const {url='https://example.com/',status=200,headers={},robots=null,sitemap=null,llms=null,redirects=0} = context;
  const meta = tags(html,'meta'), links = tags(html,'link'), images=tags(html,'img'), anchors=tags(html,'a');
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),text:cleanText(m[2]).slice(0,120)}));
  const title = firstMatch(html,/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const description = cleanText(metaValue(meta,'name','description'));
  const robotsTag = (metaValue(meta,'name','robots')+' '+String(headers['x-robots-tag']||'')).toLowerCase();
  const canonical = links.find(l=>(l.rel||'').toLowerCase().split(/\s+/).includes('canonical'))?.href || '';
  const language = attrs(html.match(/<html\b[^>]*>/i)?.[0]||'').lang || '';
  const viewport=metaValue(meta,'name','viewport');
  const ogTitle=metaValue(meta,'property','og:title'); const ogDesc=metaValue(meta,'property','og:description');
  const internalLinks = anchors.filter(a=>{try{if(!a.href||a.href.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(a.href))return false;return new URL(a.href,url).hostname===new URL(url).hostname;}catch{return false}}).length;
  const altMissing=images.filter(i=>!i.alt?.trim()).length;
  let schemaParsed=0,schemaInvalid=0; const schemaTypes=new Set(); let hasSameAs=false;
  for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const at=attrs('<script '+s[1]+'>');
    if(!/application\/ld\+json/i.test(at.type||''))continue;
    try{const x=JSON.parse(s[2].replace(/^\s*<!--|-->\s*$/g,'')); schemaParsed++;jsonTypes(x).forEach(t=>schemaTypes.add(t)); if(JSON.stringify(x).includes('"sameAs"'))hasSameAs=true;}catch{schemaInvalid++}
  }
  const schemaList=[...schemaTypes].slice(0,40);
  const hasEntity=schemaList.some(t=>/^(Organization|Corporation|LocalBusiness|Store|Person|ProfessionalService|NGO|EducationalOrganization|MedicalOrganization)$/i.test(t));
  const faqOnPage=/常见问题|常见问答|FAQ|Frequently Asked Questions|Q\s*&\s*A/i.test(html.slice(0,300_000)) || schemaList.some(t=>t==='FAQPage');
  const faqSchema=schemaList.includes('FAQPage');
  const checks=[];
  const add=(group,id,label,weight,status,detail,fix)=>checks.push({group,id,label,weight,status,detail,fix});
  const seo='SEO', geo='GEO';
  add(seo,'http','HTTP 状态',6,status===200?'pass':status>=200&&status<300?'warn':'fail',`HTTP ${status}，跳转 ${redirects} 次`,'确保页面可稳定返回 HTTP 200。');
  add(seo,'https','HTTPS',5,url.startsWith('https:')?'pass':'fail',url.startsWith('https:')?'使用 HTTPS 加密连接':'当前使用 HTTP','配置有效的 TLS 证书并将 HTTP 301 跳转到 HTTPS。');
  add(seo,'index','索引指令',7,/\bnoindex\b/.test(robotsTag)?'fail':'pass',/\bnoindex\b/.test(robotsTag)?'检测到 noindex':'未检测到 noindex（不代表一定已被收录）','移除不必要的 noindex，检查页面可访问性。');
  add(seo,'title','Title 标题',8,!title?'fail':chars(title)<12||chars(title)>70?'warn':'pass',title?`${chars(title)} 字符：${title.slice(0,110)}`:'缺少 title','为页面编写唯一、清晰的标题，避免关键词堆砌。');
  add(seo,'description','Meta Description',7,!description?'fail':chars(description)<35||chars(description)>180?'warn':'pass',description?`${chars(description)} 字符：${description.slice(0,125)}`:'缺少页面描述','编写准确概括页面内容的描述；搜索结果摘要可能由搜索引擎改写。');
  const h1s=headings.filter(h=>h.level===1);
  add(seo,'h1','H1 主标题',7,h1s.length===1?'pass':h1s.length>1?'warn':'fail',`发现 ${h1s.length} 个 H1`,'设置清晰的主要标题；多 H1 不必然错误，但应避免结构混乱。');
  let canonicalValid=false;try{canonicalValid=!!canonical&&['https:','http:'].includes(new URL(canonical,url).protocol)}catch{}
  add(seo,'canonical','Canonical',5,!canonical?'warn':canonicalValid?'pass':'fail',canonical||'未发现 canonical','如存在重复 URL，设置规范化地址并确保目标正确。');
  add(seo,'lang','页面语言',3,language?'pass':'warn',language||'HTML 未声明 lang','为 html 元素添加正确的 lang 属性，如 zh-CN 或 en。');
  add(seo,'viewport','移动端视口',3,viewport?'pass':'warn',viewport||'未设置 viewport','移动端页面建议设置 width=device-width, initial-scale=1。');
  add(seo,'alt','图片替代文本',5,!images.length?'na':altMissing===0?'pass':altMissing/images.length<0.3?'warn':'fail',images.length?`${images.length} 张图片中 ${altMissing} 张缺少 alt`:'未发现 img 标签','为内容图片提供描述性 alt，纯装饰图片可使用空 alt。');
  add(seo,'links','内部链接',4,internalLinks>=3?'pass':internalLinks>0?'warn':'fail',`检测到 ${internalLinks} 个站内链接`,'建立合理的上下文内链，帮助用户和爬虫发现重要页面。');
  add(seo,'robots','robots.txt',3,robots?.status===200?'pass':robots?.status===404?'warn':'warn',robots?.status===200?'robots.txt 可获取':robots?.status?`HTTP ${robots.status}`:'未能获取 robots.txt','检查 robots.txt 规则，避免误屏蔽重要资源与目录。');
  const mapSeen=sitemap?.status===200||!!(robots?.body||'').match(/^sitemap:\s*\S+/im);
  add(seo,'sitemap','XML Sitemap',4,mapSeen?'pass':'warn',mapSeen?'发现网站地图线索':'未发现 sitemap.xml 或 robots.txt 中的 Sitemap 指令','为需要索引的网站维护有效的 XML Sitemap。');
  add(seo,'social','社交摘要',3,ogTitle&&ogDesc?'pass':ogTitle||ogDesc?'warn':'fail',`Open Graph 标题：${ogTitle?'有':'无'}；描述：${ogDesc?'有':'无'}`,'补充 og:title、og:description，改善内容分享预览。');
  add(geo,'jsonld','JSON-LD 结构化数据',9,schemaParsed&&schemaInvalid===0?'pass':schemaParsed?'warn':'fail',`有效块 ${schemaParsed}，无效块 ${schemaInvalid}`,'添加符合 Schema.org 规范且与页面可见内容一致的 JSON-LD，并使用 Google 富媒体结果测试验证。');
  add(geo,'entity','实体 Schema 类型',7,hasEntity?'pass':schemaParsed?'warn':'fail',schemaList.length?'发现 '+schemaList.join('、'):'未发现实体类型','企业首页按实际主体添加 Organization/LocalBusiness，产品页则应使用适用的 Product 类型。');
  add(geo,'sameas','实体关联 sameAs',5,!hasEntity?'na':hasSameAs?'pass':'warn',!hasEntity?'无适用实体 Schema':hasSameAs?'检测到 sameAs':'尚无 sameAs 属性','有真实且权威的企业或个人资料页时，添加准确的 sameAs 链接。');
  add(geo,'structure','正文标题结构',4,headings.some(h=>h.level===2)?'pass':headings.length?'warn':'fail',`发现 ${headings.length} 个 H1–H6 标题，其中 H2 ${headings.filter(h=>h.level===2).length} 个`,'使用语义化 H2/H3 分节，确保页面信息组织清晰。');
  add(geo,'faq','FAQ 内容标记',5,!faqOnPage?'na':faqSchema?'pass':'warn',faqOnPage?(faqSchema?'检测到 FAQPage 类型':'发现 FAQ 内容，但未检测到 FAQPage 类型'):'当前页面无明确 FAQ 内容','只有当页面确实展示问答时才考虑相符的 FAQPage 标记；不保证搜索富媒体结果。');
  const rating=g=>{const list=checks.filter(x=>x.group===g&&x.status!=='na');const max=list.reduce((a,x)=>a+x.weight,0);const earned=list.reduce((a,x)=>a+x.weight*(x.status==='pass'?1:x.status==='warn'?0.5:0),0);return max?Math.round(earned/max*100):0};
  const seoScore=rating(seo), geoScore=rating(geo);const score=Math.round(seoScore*0.7+geoScore*0.3);
  const issues=checks.filter(x=>x.status==='fail'||x.status==='warn').sort((a,b)=> (a.status==='fail'?-1:0)-(b.status==='fail'?-1:0)||b.weight-a.weight);
  return {url,scannedAt:new Date().toISOString(),status,score,seoScore,geoScore,
    disclaimer:'启发式技术就绪度评分，不是搜索排名、流量预测或 AI 答案引用率。仅检测该 URL 和少量约定路径，不执行全站爬取。',
    summary:{title,description,language,canonical,headings:headings.slice(0,40),schemaTypes:schemaList,images:images.length,altMissing,internalLinks,redirects,robotsStatus:robots?.status??null,sitemapStatus:sitemap?.status??null,llmsStatus:llms?.status??null},
    checks,issues:issues.slice(0,20),passed:checks.filter(x=>x.status==='pass').length,warnings:checks.filter(x=>x.status==='warn').length,failed:checks.filter(x=>x.status==='fail').length,notApplicable:checks.filter(x=>x.status==='na').length};
}
async function audit(input) {
  const u=normalizeURL(input);const main=await fetchSafe(u.href);
  if(main.status>=400)throw new Error(`目标页面返回 HTTP ${main.status}，无法执行 HTML 分析`);
  const ct=String(main.headers['content-type']||'');
  if(ct&&!/(text\/html|application\/xhtml\+xml)/i.test(ct))throw new Error('目标不是 HTML 页面（Content-Type: '+ct.slice(0,60)+'）');
  const origin=new URL(main.url).origin;
  const probe=async path=>{try{return await fetchSafe(origin+path)}catch{return null}};
  const [robots,sitemap,llms]=await Promise.all([probe('/robots.txt'),probe('/sitemap.xml'),probe('/llms.txt')]);
  return analyzeHTML(main.body,{url:main.url,status:main.status,headers:main.headers,robots,sitemap,llms,redirects:main.redirects});
}

async function siteAudit(input,maxPages=5){
 const requested=normalizeURL(input);
 const entry=await fetchSafe(requested.href);
 if(entry.status>=400)throw new Error('入口页面返回 HTTP '+entry.status);
 const contentType=String(entry.headers['content-type']||'');
 if(contentType&&!/(text\/html|application\/xhtml\+xml)/i.test(contentType))throw new Error('入口不是 HTML 页面');
 const origin=new URL(entry.url).origin;
 const probe=async path=>{try{return await fetchSafe(origin+path,origin)}catch{return null}};
 const [robots,sitemap,llms]=await Promise.all([probe('/robots.txt'),probe('/sitemap.xml'),probe('/llms.txt')]);
 const first=analyzeHTML(entry.body,{url:entry.url,status:entry.status,headers:entry.headers,robots,sitemap,llms,redirects:entry.redirects});
 const candidates=collectSiteLinks(entry.body,entry.url,40);
 const selected=candidates.slice(0,maxPages-1),reports=[first],failures=[];
 const scan=async url=>{
  try{
   const fetched=await fetchSafe(url,origin);
   if(fetched.status>=400)throw new Error('HTTP '+fetched.status);
   const ct=String(fetched.headers['content-type']||'');
   if(ct&&!/(text\/html|application\/xhtml\+xml)/i.test(ct))throw new Error('非 HTML 页面');
   const report=analyzeHTML(fetched.body,{url:fetched.url,status:fetched.status,headers:fetched.headers,robots,sitemap,llms,redirects:fetched.redirects});
   return {report};
  }catch(e){return {failure:{url,error:String(e?.message||'抓取失败').slice(0,180)}};}
 };
 for(let i=0;i<selected.length;i+=2){
  const batch=await Promise.all(selected.slice(i,i+2).map(scan));
  for(const item of batch)if(item.report)reports.push(item.report);else failures.push(item.failure);
 }
 return buildSiteReport(entry.url,reports,failures,maxPages,candidates.length);
}

const HTML = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>SEO / GEO Audit — 网站技术可见性检测</title><meta name="description" content="免费检测网站技术 SEO、Schema JSON-LD、实体信息和 GEO 内容就绪度。"><style>
:root{font-family:Inter,"PingFang SC","Microsoft Yahei",system-ui,sans-serif;color:#eaf0fb;background:#081120;font-synthesis:none}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 50% -18%,#17435a 0%,transparent 42%),#081120}button,input{font:inherit}.shell{width:min(1120px,calc(100% - 36px));margin:auto}header{display:flex;align-items:center;justify-content:space-between;padding:25px 0}.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-.5px}.mark{width:35px;height:35px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#4be0c4,#2b9de0);color:#06232a;font-weight:900}.micro{font-size:12px;color:#90a9c7;border:1px solid #2b4057;border-radius:30px;padding:8px 12px}.hero{text-align:center;padding:76px 0 47px}.eyebrow{color:#6ee7cf;font-size:12px;letter-spacing:2.5px;font-weight:700}.hero h1{font-size:clamp(34px,5.5vw,62px);line-height:1.17;letter-spacing:-2px;margin:18px auto 19px;max-width:780px}.hero h1 span{background:linear-gradient(100deg,#6ce5c6,#64aff5);background-clip:text;color:transparent}.lead{color:#a2b3c9;line-height:1.9;font-size:16px;max-width:670px;margin:0 auto 34px}.search{display:flex;gap:10px;background:#101e31;border:1px solid #2b4058;padding:8px;border-radius:15px;max-width:760px;margin:auto;box-shadow:0 18px 55px #0003}.search input{width:100%;flex:1;min-width:0;background:none;border:0;outline:0;color:#f2f6fc;padding:10px 14px;font-size:15px}.search input::placeholder{color:#788ea8}.search button,.button{border:0;background:linear-gradient(120deg,#51e2c6,#65b9f4);color:#06202b;border-radius:10px;font-weight:750;padding:14px 23px;cursor:pointer;white-space:nowrap}.search button:hover,.button:hover{filter:brightness(1.08)}button:disabled{opacity:.5;cursor:wait}.hint{font-size:12px;color:#778da9;margin:17px auto}.features{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;margin:0 0 55px}.features span{background:#13243a;color:#a4bfd6;border:1px solid #263e56;border-radius:30px;padding:9px 14px;font-size:12px}.notice{padding:14px 18px;border:1px solid #653e43;color:#f0b5b5;background:#2b1924;border-radius:12px;margin:15px 0}.hidden{display:none!important}.results{padding-bottom:65px}.dashboard{display:grid;grid-template-columns:260px 1fr;gap:18px}.panel{background:#101d2e;border:1px solid #273b50;border-radius:17px;padding:23px;min-width:0}.scorebox{text-align:center}.ring{height:158px;width:158px;border-radius:50%;display:grid;place-items:center;margin:6px auto 20px;background:conic-gradient(#54dac6 calc(var(--pct)*1%),#2b3b50 0)}.ring .inner{width:132px;height:132px;border-radius:50%;display:grid;place-items:center;background:#101d2e}.scoreNumber{font-size:45px;font-weight:850;letter-spacing:-2px}.scoreSmall{color:#94a8c0;font-size:13px}.sectionTitle{font-size:18px;font-weight:800;letter-spacing:-.4px;margin:0 0 18px}.small{font-size:12px;color:#91a5bf;line-height:1.8}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.metric{border:1px solid #2a4057;padding:16px;border-radius:12px;background:#132338}.metric strong{display:block;font-size:29px;margin:9px 0 2px}.metric span{font-size:12px;color:#9cb2cb}.url{color:#a9f1df;overflow-wrap:anywhere;font-size:13px}.details{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.row{display:flex;gap:12px;justify-content:space-between;align-items:start;border-bottom:1px solid #26384d;padding:13px 0}.row:last-child{border-bottom:0}.row .lbl{min-width:72px;color:#8fa6be;font-size:12px}.row .val{font-size:13px;text-align:right;overflow-wrap:anywhere;max-width:76%}.checkList{display:flex;flex-direction:column;gap:9px}.check{border:1px solid #263d55;border-radius:12px;padding:15px;background:#122338}.checkHead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}.checkHead strong{font-size:13px}.check p{margin:5px 0;color:#a2b5cc;font-size:12px;line-height:1.7;overflow-wrap:anywhere}.check .fix{color:#b9dcd6}.flag{font-size:11px;flex-shrink:0;border-radius:7px;padding:5px 8px}.pass{color:#67dfbd;background:#144239}.warn{color:#ffce75;background:#4c3b22}.fail{color:#ff989e;background:#4f252f}.na{color:#9cafc7;background:#2a3949}.full{margin-top:18px}.toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.secondaryBtn{background:transparent;color:#a8dfe3;border:1px solid #315768;border-radius:9px;padding:10px 15px;cursor:pointer;font-size:12px}.footer{text-align:center;border-top:1px solid #24364a;padding:28px 0 38px;color:#6f829d;font-size:12px;line-height:1.8}.footer a{color:#8ee1d5;text-decoration:none}@media(max-width:760px){.hero{padding:48px 0 35px}.hero h1{letter-spacing:-1px}.dashboard,.details{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.metric{padding:13px 10px}.metric strong{font-size:23px}.search{flex-direction:column}.search button{width:100%}.micro{font-size:10px}}

.modeSwitch{display:flex;justify-content:center;gap:9px;margin:0 auto 21px;flex-wrap:wrap}
.modeBtn{border:1px solid #2e5266;background:#102235;color:#b5cbdf;border-radius:11px;padding:11px 18px;cursor:pointer;font-size:14px}
.modeBtn.active{background:#163b4a;color:#85ffdf;border-color:#45bfa8}
.businessFields{max-width:760px;margin:18px auto 0;padding:22px;text-align:left;background:#101e31;border:1px solid #2b4058;border-radius:16px}
.businessGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.businessFields label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:#b7cade}
.businessFields input,.businessFields select,.businessFields textarea{width:100%;border:1px solid #365068;border-radius:9px;padding:12px 13px;color:#f3f7fe;background:#0b192a;outline:none;font-size:14px}
.businessFields textarea{resize:vertical;min-height:76px}
.businessFields .wide{grid-column:1/-1}
.businessFields .fine{font-size:12px;color:#8ea9bf;line-height:1.7;margin-top:14px}
.reportHeader{display:flex;gap:12px;align-items:start;justify-content:space-between;flex-wrap:wrap}
.reportActions{display:flex;gap:8px;flex-wrap:wrap}
.enterpriseMeta{color:#90adc4;font-size:12px;line-height:1.8}
.enterpriseScoreGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0 18px}
.enterpriseScoreGrid .metric strong{font-size:28px}
.pillarGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pillar{background:#122338;border:1px solid #294058;border-radius:12px;padding:16px}
.pillar h3{font-size:14px;margin:0 0 10px}
.pillar p{font-size:12px;line-height:1.8;color:#a5b8ce;overflow-wrap:anywhere;margin:8px 0}
.pillar .source{color:#78aaaf;font-size:11px}
.unknown{color:#a1afc2;background:#29384a}
.enterpriseFooter{margin-top:15px;color:#90a8be;font-size:12px;line-height:1.8}
@media(max-width:760px){.businessGrid,.pillarGrid{grid-template-columns:1fr}.enterpriseScoreGrid{grid-template-columns:1fr 1fr}.businessFields{padding:16px}}
@media print{
@page{size:A4;margin:12mm}
body,html{background:white!important;color:#161b29!important}
header,.hero,.features,.footer,#results,#error,.reportActions{display:none!important}
.shell{width:100%!important;max-width:none!important}
#enterpriseResults{display:block!important;padding:0!important}
.panel,.pillar,.metric{background:white!important;border:1px solid #ccc!important;color:#161b29!important;box-shadow:none!important;break-inside:avoid}
.panel *, .pillar *, .metric *{color:#161b29!important}
.pillarGrid{grid-template-columns:1fr 1fr}
}

.comparePairs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}
.compareSite{background:#122338;border:1px solid #2d485c;border-radius:12px;padding:17px;min-width:0}
.compareSite strong{font-size:14px}.compareSite .siteUrl{font-size:12px;color:#87dfc4;overflow-wrap:anywhere;margin:8px 0}
.compareSite .siteScore{font-size:31px;font-weight:800;margin:12px 0 3px}
.comparisonScroll{overflow-x:auto}
.comparisonTable{width:100%;border-collapse:collapse;min-width:650px;font-size:12px}
.comparisonTable th,.comparisonTable td{border-bottom:1px solid #2c445c;padding:12px;text-align:left;vertical-align:top}
.comparisonTable th{color:#9fbad4;white-space:nowrap}
.comparisonTable td{color:#c7d8eb;overflow-wrap:anywhere;max-width:290px}
.compareStat{color:#85decf}
@media(max-width:760px){.comparePairs{grid-template-columns:1fr}}
@media print{#compareResults{display:block!important;padding:0!important}#compareResults .panel,#compareResults .compareSite{background:#fff!important;border:1px solid #aaa!important;color:#161b29!important}#compareResults *{color:#161b29!important}.comparisonTable th,.comparisonTable td{border-color:#ccc!important}}
@media print{#enterpriseResults.hidden,#compareResults.hidden{display:none!important}}

.sitePageMeta{display:flex;flex-wrap:wrap;gap:14px;color:#93b7c6;font-size:12px;margin:10px 0}
.siteIssueList{margin:10px 0;padding-left:20px;color:#c3d6e6;font-size:12px;line-height:1.9}
.siteIssueList li{overflow-wrap:anywhere}
.siteLink{color:#84e5c9;display:block;font-size:12px;overflow-wrap:anywhere;margin:6px 0}
@media print{#siteResults{display:block!important;padding:0!important}#siteResults.hidden{display:none!important}#siteResults .panel{background:#fff!important;border:1px solid #bbb!important}#siteResults *{color:#202a35!important}}
</style></head><body><div class="shell"><header><div class="logo"><span class="mark">↗</span> SEO<span style="color:#65e0c6">/</span>GEO Audit</div><span class="micro">v1.3 · Website Intelligence</span></header><section class="hero"><div class="eyebrow">TECHNICAL SEO × AI READINESS</div><h1>让网站更容易<br><span>被搜索发现 · 被 AI 理解</span></h1><p class="lead">输入网址，自动检测页面技术 SEO、Schema 结构化数据、实体信息和内容可理解性。提供明确的问题列表与修复建议。</p><div class="modeSwitch" role="group" aria-label="检测模式"><button type="button" class="modeBtn active" id="fastMode" aria-pressed="true">⚡ 快速技术检测</button><button type="button" class="modeBtn" id="businessMode" aria-pressed="false">▦ 企业 GEO-16 审计</button><button type="button" class="modeBtn" id="compareMode" aria-pressed="false">⇄ 竞品双站对比</button><button type="button" class="modeBtn" id="siteMode" aria-pressed="false">▤ 站内多页面审计</button></div><form class="search" id="scanForm"><input id="urlInput" type="text" name="url" placeholder="输入网站，例如 example.com" required autocomplete="url" maxlength="2048" aria-label="网站地址"><button id="submitBtn" type="submit">开始免费检测 →</button></form><section class="businessFields hidden" id="businessFields" aria-label="企业审计信息"><div class="businessGrid"><label>企业 / 品牌名称 *<input form="scanForm" id="brandInput" name="brand" maxlength="100" placeholder="例如：XX 科技有限公司"></label><label>所属行业 *<select form="scanForm" id="industryInput" name="industry"><option value="b2b">B2B / 工业及外贸</option><option value="local">本地商家 / 专业服务</option><option value="ecommerce">电商零售</option><option value="media">内容媒体</option><option value="other">其他</option></select></label><label>工商主体（选填）<input form="scanForm" id="legalInput" maxlength="120" placeholder="企业工商登记全称"></label><label>经营地区（选填）<input form="scanForm" id="regionInput" maxlength="100" placeholder="例如：中国山东 / 全球"></label><label>线下实体门店<select form="scanForm" id="storeInput"><option value="no">否 / 不适用</option><option value="yes">有（本地实体信息待核验）</option></select></label><label>审计阶段<select form="scanForm" id="stageInput"><option value="baseline">首次诊断</option><option value="recheck">优化后复测（不自动读取历史）</option><option value="competitor">竞品对比（真实抓取）</option></select></label><label class="wide">目标搜索词 / 客户问题（选填）<textarea form="scanForm" id="keywordsInput" maxlength="500" placeholder="每行一个关键词或客户问题"></textarea></label><label class="wide">资质信息（选填，尚未核验）<input form="scanForm" id="credentialsInput" maxlength="300" placeholder="认证、资质或授权介绍"></label><label class="wide">竞品官网（竞品对比阶段必填并真实抓取）<input form="scanForm" id="competitorInput" maxlength="400" placeholder="https://competitor.example"></label></div><p class="fine">仅检测公开网址；填写的企业资料由用户提供，不核验工商、第三方背书或 AI 真实引用。报告不在服务端持久保存。</p></section><section class="businessFields hidden" id="compareFields" aria-label="竞品双站对比"><div class="businessGrid"><label class="wide">竞品网址（必填）<input id="compareInput" type="url" maxlength="2048" placeholder="例如：https://example.org" aria-label="竞品网址"></label></div><p class="fine">本站网址使用上方输入框，双方将被真实抓取并按相同规则评分；比较仅代表所选页面技术状态。</p></section><section class="businessFields hidden" id="siteFields" aria-label="站内多页面审计设置"><div class="businessGrid"><label>最多检测页面数<select id="pageLimit"><option value="3">3 页（快速）</option><option value="5" selected>5 页（推荐）</option></select></label><p class="fine">从入口页面的静态 HTML 中寻找同源链接，最多抽样 5 个页面；不是全站深度爬虫，样本不足时按实际数量展示。</p></div></section><p class="hint">无需注册 · 单站或双站公开页面检测 · 不保存检测网址</p></section><div class="features"><span>✓ Technical SEO</span><span>✓ Schema / JSON-LD</span><span>✓ Entity Signals</span><span>✓ Robots / Sitemap</span><span>✓ 问题修复建议</span></div><div id="error" class="notice hidden" role="alert"></div><section id="results" class="results hidden" aria-live="polite"><div class="dashboard"><div class="panel scorebox"><h2 class="sectionTitle">综合技术就绪度</h2><div class="ring" id="ring"><div class="inner"><div><div id="score" class="scoreNumber">—</div><div class="scoreSmall">/ 100 分</div></div></div></div><p id="scoreTip" class="small"></p></div><div class="panel"><div class="toolbar"><h2 class="sectionTitle" style="margin:0">检测概览</h2><button class="secondaryBtn" type="button" id="downloadBtn">下载 JSON 报告 ↓</button></div><p id="target" class="url"></p><div class="metrics"><div class="metric"><span>Technical SEO</span><strong id="seoScore">—</strong><span>70% 权重</span></div><div class="metric"><span>GEO Readiness</span><strong id="geoScore">—</strong><span>30% 权重</span></div><div class="metric"><span>待改进项</span><strong id="issuesCount">—</strong><span>警告及失败</span></div></div><p class="small">检测分数来自公开规则，不代表 Google 排名或 AI 平台引用概率。</p></div></div><div class="details"><div class="panel"><h2 class="sectionTitle">页面信息</h2><div id="facts"></div></div><div class="panel"><h2 class="sectionTitle">优先修复</h2><div id="priority" class="checkList"></div></div></div><div class="panel full"><div class="toolbar"><h2 class="sectionTitle" style="margin:0">全部检测项</h2><span id="counts" class="small"></span></div><div id="checks" class="details" style="margin-top:14px"></div></div><p class="small" id="disclaimer" style="margin-top:15px"></p></section><section id="enterpriseResults" class="results hidden" aria-live="polite"><div class="panel"><div class="reportHeader"><div><h2 class="sectionTitle">企业 GEO-16 证据审计报告</h2><p id="enterpriseIdentity" class="enterpriseMeta"></p></div><div class="reportActions"><button type="button" class="secondaryBtn" id="enterpriseDownload">下载 JSON</button><button type="button" class="secondaryBtn" id="enterprisePrint">打印 / 保存 PDF</button></div></div><div class="enterpriseScoreGrid" id="enterpriseScores"></div><p id="enterpriseMethod" class="small"></p></div><div class="panel full"><h2 class="sectionTitle">优先整改 SOP（基于实测问题）</h2><div id="enterprisePriority" class="checkList"></div></div><div class="panel full"><h2 class="sectionTitle">16 维证据与核验状态</h2><div id="enterprisePillars" class="pillarGrid"></div></div><div class="panel full"><h2 class="sectionTitle">需人工补充核验</h2><div id="enterpriseManual" class="checkList"></div><p id="enterpriseDisclaimer" class="enterpriseFooter"></p></div></section><section id="compareResults" class="results hidden" aria-live="polite"><div class="panel"><div class="reportHeader"><div><h2 class="sectionTitle">竞品真实扫描 · 双站对比</h2><p id="compareMeta" class="enterpriseMeta"></p></div><div class="reportActions"><button class="secondaryBtn" type="button" id="compareDownload">下载对比 JSON</button><button class="secondaryBtn" type="button" id="comparePrint">打印 / 保存 PDF</button></div></div><div class="comparePairs" id="comparePairs"></div><div id="compareMetrics" class="enterpriseScoreGrid"></div><p id="compareMethod" class="small"></p></div><div class="panel full"><h2 class="sectionTitle">差距与优先整改建议</h2><div id="compareOpportunities" class="checkList"></div></div><div class="panel full"><h2 class="sectionTitle">逐项技术检测对照（有证据）</h2><div class="comparisonScroll"><table class="comparisonTable"><thead><tr><th>检查项</th><th>本站检测证据</th><th>竞品检测证据</th><th>结果</th></tr></thead><tbody id="compareRows"></tbody></table></div><p id="compareDisclaimer" class="enterpriseFooter"></p></div></section><section id="siteResults" class="results hidden" aria-live="polite"><div class="panel"><div class="reportHeader"><div><h2 class="sectionTitle">站内多页面技术审计</h2><p class="enterpriseMeta" id="siteMeta"></p></div><div class="reportActions"><button class="secondaryBtn" type="button" id="siteDownload">下载 JSON</button><button class="secondaryBtn" type="button" id="sitePrint">打印 / 保存 PDF</button></div></div><div id="siteMetrics" class="enterpriseScoreGrid"></div><p class="small" id="siteMethod"></p></div><div class="panel full"><h2 class="sectionTitle">重复内容与站内共性风险</h2><div class="checkList" id="siteFindings"></div></div><div class="panel full"><h2 class="sectionTitle">逐页诊断与整改建议</h2><div class="checkList" id="sitePages"></div></div><div class="panel full hidden" id="siteFailedPanel"><h2 class="sectionTitle">抓取失败的页面</h2><div class="checkList" id="siteFailures"></div></div><p class="enterpriseFooter" id="siteDisclaimer"></p></section><div class="footer">© 2026 SEO / GEO Audit · Created by <a href="https://github.com/wenlong1223" rel="noopener" target="_blank">wenlong1223</a><br>这是技术诊断工具，不提供排名保证；不执行全站爬虫扫描。</div></div><script data-cfasync="false">
const $=id=>document.getElementById(id);let currentReport=null;

let selectedMode='fast';
const chooseMode=m=>{
 selectedMode=m;
 $('fastMode').classList.toggle('active',m==='fast');$('businessMode').classList.toggle('active',m==='business');$('compareMode').classList.toggle('active',m==='compare');$('siteMode').classList.toggle('active',m==='site');
 $('fastMode').setAttribute('aria-pressed',String(m==='fast'));$('businessMode').setAttribute('aria-pressed',String(m==='business'));$('compareMode').setAttribute('aria-pressed',String(m==='compare'));$('siteMode').setAttribute('aria-pressed',String(m==='site'));
 $('businessFields').classList.toggle('hidden',m!=='business');$('compareFields').classList.toggle('hidden',m!=='compare');$('siteFields').classList.toggle('hidden',m!=='site');
 $('submitBtn').textContent=m==='business'?'生成证据审计报告 →':m==='compare'?'开始双站实测对比 →':m==='site'?'开始站内抽样审计 →':'开始免费检测 →';
 $('results').classList.add('hidden');$('enterpriseResults').classList.add('hidden');$('compareResults').classList.add('hidden');$('siteResults').classList.add('hidden');$('error').classList.add('hidden');
};
$('fastMode').addEventListener('click',()=>chooseMode('fast'));
$('businessMode').addEventListener('click',()=>chooseMode('business'));
$('compareMode').addEventListener('click',()=>chooseMode('compare'));
$('siteMode').addEventListener('click',()=>chooseMode('site'));
const profileData=()=>({
 brand:$('brandInput').value,industry:$('industryInput').value,hasStore:$('storeInput').value==='yes',
 legalName:$('legalInput').value,region:$('regionInput').value,keywords:$('keywordsInput').value,
 credentials:$('credentialsInput').value,competitor:$('competitorInput').value,stage:$('stageInput').value
});
const reportBadge=s=>'<span class="flag '+esc(s==='unknown'?'unknown':s)+'">'+({pass:'实测通过',warn:'建议优化',fail:'需要修复',unknown:'待核验'}[s]||'待核验')+'</span>';
const reportCard=(title,value,hint)=>'<div class="metric"><span>'+esc(title)+'</span><strong>'+esc(value)+'</strong><span>'+esc(hint)+'</span></div>';
function renderEnterprise(d){
 $('siteResults').classList.add('hidden');
 currentReport=d;
 $('results').classList.add('hidden');$('enterpriseResults').classList.remove('hidden');
 $('enterpriseIdentity').textContent=d.profile.brand+' · '+d.profile.industryLabel+' · '+d.website+' · '+new Date(d.scannedAt).toLocaleString('zh-CN');
 $('enterpriseScores').innerHTML=reportCard('已核验维度均分',d.verifiedScore===null?'—':d.verifiedScore+'/100','仅统计有证据的维度')+reportCard('证据覆盖率',d.coverage+'%',d.verifiedCount+' / '+d.totalCount+' 个维度')+reportCard('技术 SEO / GEO',d.seoScore+' / '+d.geoTechnicalScore,'单页技术实测');
 $('enterpriseMethod').textContent=d.methodology;
 $('enterprisePriority').innerHTML=d.priority.length?d.priority.map(p=>'<div class="check"><div class="checkHead"><strong>P'+p.order+' · '+esc(p.title)+'</strong>'+reportBadge(p.status)+'</div><p>依据：'+esc(p.evidence)+'</p><p class="fix">整改：'+esc(p.action)+'</p></div>').join(''):'<p class="small">暂无需要立即修复的已测异常，仍需人工核验未覆盖维度。</p>';
 $('enterprisePillars').innerHTML=d.pillars.map(p=>'<article class="pillar"><div class="checkHead"><h3>'+p.index+'. '+esc(p.label)+'</h3>'+reportBadge(p.status)+'</div><p>'+esc(p.purpose)+'</p><p>证据：'+esc(p.evidence)+'</p><p class="source">'+esc(p.source)+'</p><p class="fix">建议：'+esc(p.fix)+'</p></article>').join('');
 const missing=d.manual.map(x=>'<div class="check"><strong>'+esc(x.title)+'</strong><p>'+esc(x.action)+'</p></div>');
 for(const item of d.scope)missing.push('<div class="check"><strong>'+esc(item.label)+'</strong><p>'+esc(item.detail)+'</p></div>');
 $('enterpriseManual').innerHTML=missing.join('');
 $('enterpriseDisclaimer').textContent=d.disclaimer;
 if(d.comparison)renderCompare(d.comparison,true);else $('compareResults').classList.add('hidden');
 $('enterpriseResults').scrollIntoView({behavior:'smooth',block:'start'});
}
function saveJson(d,name){
 const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$('enterpriseDownload').addEventListener('click',()=>{if(currentReport?.kind==='enterprise-geo-16')saveJson(currentReport,'geo-enterprise-audit')});
$('enterprisePrint').addEventListener('click',()=>{if(currentReport?.kind==='enterprise-geo-16')window.print()});

const compareFlag=v=>'<span class="flag '+esc(v)+'">'+({ahead:'本站领先',behind:'竞品领先',tie:'同级',unverified:'不适用/未知'}[v]||'未核验')+'</span>';
const sideBox=(label,site)=>'<div class="compareSite"><strong>'+esc(label)+'</strong><p class="siteUrl">'+esc(site.url)+'</p><div class="siteScore">'+esc(site.score===null?'—':site.score)+'/100</div><p class="small">SEO '+esc(site.seoScore)+' · GEO '+esc(site.geoScore)+'</p><p class="small">页面标题：'+esc(site.summary.title||'缺失')+'</p><p class="small">Schema：'+esc((site.summary.schemaTypes||[]).join('、')||'未发现')+'</p></div>';
function renderCompare(d,embedded=false){
 $('siteResults').classList.add('hidden');
 if(!embedded){currentReport=d;$('results').classList.add('hidden');$('enterpriseResults').classList.add('hidden');}
 $('compareResults').classList.remove('hidden');
 $('compareMeta').textContent='双方独立抓取 · '+new Date(d.scannedAt).toLocaleString('zh-CN')+' · 同一套检测规则';
 $('comparePairs').innerHTML=sideBox('本站',d.primary)+sideBox('竞品',d.competitor);
 const difference=n=>n===null?'—':(n>0?'+'+n:String(n));
 $('compareMetrics').innerHTML=reportCard('综合分差（本站－竞品）',difference(d.delta.score),'仅技术就绪度评分')+reportCard('SEO / GEO 分差',difference(d.delta.seo)+' / '+difference(d.delta.geo),'两站同规则')+reportCard('本站需追赶的检查项',String(d.summary.behind),'本站较差 '+d.summary.behind+' · 较好 '+d.summary.ahead);
 $('compareMethod').textContent=d.methodology;
 $('compareOpportunities').innerHTML=d.opportunities.length?d.opportunities.map(x=>'<div class="check"><strong>P'+x.order+' · '+esc(x.label)+'</strong><p>本站：'+esc(x.evidencePrimary)+'</p><p>竞品：'+esc(x.evidenceCompetitor)+'</p><p class="fix">优先建议：'+esc(x.action)+'</p></div>').join(''):'<p class="small">在双方可比检测项中，没有发现本站较竞品更差的项目；不表示实际排名领先。</p>';
 const st={pass:'通过',warn:'警告',fail:'失败',na:'不适用'};
 $('compareRows').innerHTML=d.rows.map(x=>'<tr><td>'+esc(x.group+' · '+x.label)+'</td><td><strong>'+esc(st[x.primary.status]||'未知')+'</strong><p>'+esc(x.primary.detail)+'</p></td><td><strong>'+esc(st[x.competitor.status]||'未知')+'</strong><p>'+esc(x.competitor.detail)+'</p></td><td>'+compareFlag(x.verdict)+'</td></tr>').join('');
 $('compareDisclaimer').textContent=d.disclaimer;
 if(!embedded)$('compareResults').scrollIntoView({behavior:'smooth',block:'start'});
}
$('compareDownload').addEventListener('click',()=>{if(currentReport?.comparison)saveJson(currentReport,'geo-enterprise-with-comparison');else if(currentReport?.kind==='geo-technical-comparison')saveJson(currentReport,'geo-competitor-comparison')});
$('comparePrint').addEventListener('click',()=>window.print());

function renderSite(d){
 currentReport=d;
 $('results').classList.add('hidden');$('enterpriseResults').classList.add('hidden');$('compareResults').classList.add('hidden');
 $('siteResults').classList.remove('hidden');
 $('siteMeta').textContent=d.website+' · '+new Date(d.scannedAt).toLocaleString('zh-CN');
 $('siteMetrics').innerHTML=reportCard('成功抽样页数',d.scannedPages+'/'+d.requestedPages,'未成功 '+d.failedPages+' 页 · 发现链接 '+d.discoveredLinks+' 条')+
  reportCard('平均 SEO / GEO',d.average.seo+' / '+d.average.geo,'以成功检测的页面计算')+
  reportCard('平均技术就绪度',d.average.score+'/100','不代表搜索排名或 AI 引用率');
 $('siteMethod').textContent=d.methodology;
 $('siteFindings').innerHTML=d.findings.length?d.findings.map(f=>{
  const detail=(f.items||[]).map(x=>'<p>重复内容：'+esc(x.text)+'</p><p>涉及页面：'+esc(x.urls.join(' · '))+'</p>').join('')+(f.urls||[]).map(u=>'<p>'+esc(u)+'</p>').join('');
  return '<div class="check"><div class="checkHead"><strong>'+esc(f.label)+'</strong><span class="flag warn">'+f.count+' 个页面</span></div>'+detail+'<p class="fix">建议：'+esc(f.fix)+'</p></div>';
 }).join(''):'<p class="small">本次抽样未发现预设的共性风险；不代表全站没有问题。</p>';
 $('sitePages').innerHTML=d.pages.map((p,i)=>'<div class="check"><div class="checkHead"><strong>页面 '+(i+1)+' · '+esc(p.title||'未设置 Title')+'</strong><span class="flag '+(p.score>=80?'pass':p.score>=60?'warn':'fail')+'">'+p.score+'/100</span></div><span class="siteLink">'+esc(p.url)+'</span><div class="sitePageMeta"><span>SEO '+p.seoScore+'</span><span>GEO '+p.geoScore+'</span><span>失败 '+p.failed+'</span><span>警告 '+p.warnings+'</span></div><ul class="siteIssueList">'+p.issues.slice(0,8).map(x=>'<li>'+esc(x.label)+'：'+esc(x.evidence)+'。整改：'+esc(x.fix)+'</li>').join('')+'</ul></div>').join('');
 $('siteFailedPanel').classList.toggle('hidden',!d.failures.length);
 $('siteFailures').innerHTML=d.failures.map(x=>'<div class="check"><strong>'+esc(x.url)+'</strong><p>'+esc(x.error)+'</p></div>').join('');
 $('siteDisclaimer').textContent=d.disclaimer;
 $('siteResults').scrollIntoView({behavior:'smooth',block:'start'});
}
$('siteDownload').addEventListener('click',()=>{if(currentReport?.kind==='geo-multipage-audit')saveJson(currentReport,'geo-multipage-audit')});
$('sitePrint').addEventListener('click',()=>{if(currentReport?.kind==='geo-multipage-audit')window.print()});



const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label={pass:'通过',warn:'建议优化',fail:'需要修复',na:'不适用'};
const box=c=>'<div class="check"><div class="checkHead"><strong>'+esc(c.label)+'</strong><span class="flag '+esc(c.status)+'">'+label[c.status]+'</span></div><p>'+esc(c.detail)+'</p>'+(c.status==='pass'||c.status==='na'?'':'<p class="fix">建议：'+esc(c.fix)+'</p>')+'</div>';
function render(d){$('siteResults').classList.add('hidden');currentReport=d;$('results').classList.remove('hidden');$('score').textContent=d.score;$('ring').style.setProperty('--pct',d.score);$('scoreTip').textContent=d.score>=85?'基础技术状况较好，继续验证搜索平台数据。':d.score>=60?'存在可改进项，建议先处理高权重问题。':'基础技术就绪度偏低，建议先修复错误项。';$('target').textContent=d.url;$('seoScore').textContent=d.seoScore;$('geoScore').textContent=d.geoScore;$('issuesCount').textContent=d.warnings+d.failed;$('counts').textContent='通过 '+d.passed+' · 警告 '+d.warnings+' · 失败 '+d.failed+' · 不适用 '+d.notApplicable;const s=d.summary;const facts=[['页面标题',s.title||'未设置'],['页面语言',s.language||'未设置'],['Canonical',s.canonical||'未设置'],['Schema 类型',s.schemaTypes.join('、')||'未检测到'],['图片',s.images+' 张（缺少 alt '+s.altMissing+' 张）'],['内部链接',s.internalLinks+' 个'],['robots.txt',s.robotsStatus??'不可获取'],['sitemap.xml',s.sitemapStatus??'不可获取'],['llms.txt（可选）',s.llmsStatus??'不可获取']];$('facts').innerHTML=facts.map(([a,b])=>'<div class="row"><span class="lbl">'+esc(a)+'</span><span class="val">'+esc(b)+'</span></div>').join('');$('priority').innerHTML=d.issues.length?d.issues.slice(0,5).map(box).join(''):'<p class="small">暂未发现需要处理的告警。</p>';$('checks').innerHTML=['SEO','GEO'].map(g=>'<div><h3 class="sectionTitle">'+(g==='SEO'?'Technical SEO':'GEO / Entity Readiness')+'</h3><div class="checkList">'+d.checks.filter(x=>x.group===g).map(box).join('')+'</div></div>').join('');$('disclaimer').textContent=d.disclaimer;$('results').scrollIntoView({behavior:'smooth',block:'start'});}
$('scanForm').addEventListener('submit',async e=>{e.preventDefault();$('error').classList.add('hidden');const btn=$('submitBtn');btn.disabled=true;btn.textContent='正在安全扫描…';try{const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),selectedMode==='compare'||selectedMode==='site'||(selectedMode==='business'&&$('stageInput').value==='competitor')?45000:35000);let r;try{const payload={url:$('urlInput').value,...(selectedMode==='business'?profileData():selectedMode==='compare'?{competitor:$('compareInput').value}:selectedMode==='site'?{maxPages:Number($('pageLimit').value)}:{})};r=await fetch(selectedMode==='business'?'/api/business-audit':selectedMode==='compare'?'/api/compare':selectedMode==='site'?'/api/site-audit':'/api/audit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});}finally{clearTimeout(to)}const data=await r.json().catch(()=>({error:'服务器返回了非 JSON 响应，可能被安全规则拦截'}));if(!r.ok)throw new Error(data.error||('HTTP '+r.status));if(selectedMode==='business')renderEnterprise(data);else if(selectedMode==='compare')renderCompare(data);else if(selectedMode==='site')renderSite(data);else render(data);}catch(err){$('error').textContent='检测失败：'+(err.name==='AbortError'?'请求超时，请稍后重试':err.message);$('error').classList.remove('hidden');}finally{btn.disabled=false;btn.textContent=selectedMode==='business'?'生成证据审计报告 →':selectedMode==='compare'?'开始双站实测对比 →':selectedMode==='site'?'开始站内抽样审计 →':'开始免费检测 →';}});
$('downloadBtn').addEventListener('click',()=>{if(!currentReport)return;const blob=new Blob([JSON.stringify(currentReport,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='seo-geo-audit-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
</script></body></html>`;

const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
let active=0;
const lastScans=[];
async function handle(req) {
  const path=new URL(req.url).pathname;
  if(req.method==='GET'&&path==='/') return new Response(HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none';"}});
  if(req.method==='GET'&&path==='/api/health')return json({ok:true,service:'seo-geo-audit',version:'1.3.0'});
  if(req.method!=='POST'||!['/api/audit','/api/business-audit','/api/compare','/api/site-audit'].includes(path))return json({error:'Not found'},404);
  if(Number(req.headers.get('content-length')||0)>4096)return json({error:'请求过大'},413);
  let payload;try{const raw=await req.text();if(raw.length>4096)return json({error:'请求过大'},413);payload=JSON.parse(raw);}catch{return json({error:'请提交合法 JSON 请求体'},400)}
  let pair=false;
  try {
    const primary=normalizeURL(payload?.url);
    if(path==='/api/site-audit' && ![3,5].includes(payload.maxPages??5))throw new Error('每次最多检测 3 或 5 页');
    if(path==='/api/business-audit')validateBusinessProfile(payload);
    pair=path==='/api/compare'||(path==='/api/business-audit'&&payload.stage==='competitor');
    if(pair){
      if(!payload?.competitor)throw new Error('请填写竞品的完整公网网址');
      const competitor=normalizeURL(payload.competitor);
      if(primary.hostname.replace(/^www\./,'')===competitor.hostname.replace(/^www\./,''))
        throw new Error('请填写不同网站的竞品网址');
    }
  }catch(err){return json({error:String(err.message).slice(0,240)},400)}
  const now=Date.now();while(lastScans.length&&lastScans[0]<now-60000)lastScans.shift();
  const cost=path==='/api/site-audit'?3:pair?2:1;
  if(active+cost>3||lastScans.length+cost>18)return json({error:'当前扫描请求较多，请一分钟后再试'},429);
  active+=cost;for(let i=0;i<cost;i++)lastScans.push(now);
  try{
    if(path==='/api/site-audit')return json(await siteAudit(payload.url,payload.maxPages??5));
    if(pair) {
      const [a,b]=await Promise.allSettled([audit(payload.url),audit(payload.competitor)]);
      if(a.status==='rejected')throw new Error('本站抓取失败：'+String(a.reason?.message||a.reason));
      if(b.status==='rejected')throw new Error('竞品抓取失败：'+String(b.reason?.message||b.reason));
      const comparison=buildComparison(a.value,b.value);
      if(path==='/api/compare')return json(comparison);
      const report=buildEnterpriseReport(a.value,payload);
      report.comparison=comparison;
      return json(report);
    }
    const scanned=await audit(payload.url);
    return json(path==='/api/business-audit'?buildEnterpriseReport(scanned,payload):scanned);
  }catch(err){return json({error:String(err?.message||'网站检测失败').slice(0,240)},400)}
  finally{active-=cost}
}
if(typeof Bun!=='undefined')Bun.serve({port:Number(Bun.env.PORT||3000),hostname:'0.0.0.0',fetch:handle});
export {normalizeURL,analyzeHTML,handle,audit,siteAudit};