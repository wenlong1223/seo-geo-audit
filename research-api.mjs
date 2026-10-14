/* Authenticated, auditable private research API. */
import {createHash,timingSafeEqual} from 'node:crypto';
import {createResearchProject,listResearchProjects,getResearchProject,saveResearchScan,setResearchCursor,saveManualResearchEvidence,saveResearchAI} from './research-store.mjs';
import {collectCompanyEvidence} from './research-collector.mjs';
import {generateCitedResearch} from './research-ai.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const busy=new Set();
const dim=new Set(['icp','product','pricing','operations','integration','channels','content','conversion','reputation','risk']);
const ss=(x,n=400)=>String(x??'').trim().slice(0,n);
function safeSecretEqual(a,b){
 const ah=createHash('sha256').update(a).digest(),bh=createHash('sha256').update(b).digest();
 return timingSafeEqual(ah,bh);
}
async function body(req){
 if(Number(req.headers.get('content-length')||0)>65_000)throw Error('请求体超过65KB');
 const raw=await req.text();if(raw.length>65_000)throw Error('请求体超过65KB');
 try{return JSON.parse(raw)}catch{throw Error('无效 JSON')}
}
function authenticate(req){
 const secret=process.env.IIBD_ADMIN_TOKEN;
 if(!secret||secret.length<24)return json({error:'管理员安全密钥未配置；管理员接口不可用'},503);
 const supplied=String(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(supplied.length>200||!safeSecretEqual(secret,supplied))return json({error:'请填写管理员访问密钥'},401);
 return null;
}
export async function handleResearchApi(req,dependencies){
 const auth=authenticate(req);if(auth)return auth;
 const path=new URL(req.url).pathname,parts=path.split('/').filter(Boolean);
 if(parts[0]!=='api'||parts[1]!=='research')return json({error:'Not found'},404);
 const isGet=req.method==='GET',isPost=req.method==='POST';
 try{
  if(parts.length===3&&parts[2]==='projects'){
   if(isGet)return json({projects:await listResearchProjects()});
   if(isPost){
    const p=await body(req),subject=ss(p.subject,100),industry=ss(p.industry,100);
    if(!subject||!industry)throw Error('研究主体及行业必须填写');
    const url=dependencies.normalizeURL(p.url).href;
    if(!Array.isArray(p.competitors)||p.competitors.length<1||p.competitors.length>16)throw Error('请填写1至16家竞品');
    const names=new Set([subject.toLocaleLowerCase()]),hosts=new Set([new URL(url).hostname.replace(/^www\./,'')]);
    const competitors=p.competitors.map(c=>{
     const name=ss(c?.name,100),website=dependencies.normalizeURL(c?.url).href;
     const host=new URL(website).hostname.replace(/^www\./,'');
     if(!name||names.has(name.toLocaleLowerCase())||hosts.has(host))throw Error('竞品名称或网站重复：'+name);
     names.add(name.toLocaleLowerCase());hosts.add(host);
     return {name,url:website,kind:['direct','indirect','benchmark'].includes(c.kind)?c.kind:'direct'};
    });
    return json(await createResearchProject({subject,industry,url,competitors}),201);
   }
  }
  if(parts.length===4&&parts[2]==='projects'&&isGet)return json(await getResearchProject(parts[3]));
  const id=parts[3];
  if(parts.length!==5||parts[2]!=='projects'||!isPost)return json({error:'Not found'},404);
  if(parts[4]==='batch'){
   if(busy.has(id))return json({error:'此项目另一个批次正在运行，请稍后再试'},409);
   busy.add(id);
   try{
    const snapshot=await getResearchProject(id);
    const targets=snapshot.companies.filter(c=>c.position>=0).sort((a,b)=>a.position-b.position);
    const start=snapshot.project.cursor;
    if(start>=targets.length)return json({done:true,processed:[],cursor:start,total:targets.length,projectId:id});
    const chosen=targets.slice(start,start+2),processed=[];
    for(const c of chosen){
     try{
      const records=await collectCompanyEvidence(c,{...dependencies});
      await saveResearchScan(id,c,records);
      processed.push({company:c.name,status:'scanned',count:records.length});
     }catch(e){
      const msg=ss(e?.message||'采集失败',150);
      await saveResearchScan(id,c,[],msg);
      processed.push({company:c.name,status:'failed',error:msg});
     }
     await setResearchCursor(id,c.position+1);
    }
    const fresh=await getResearchProject(id);
    return json({done:fresh.project.cursor>=targets.length,processed,cursor:fresh.project.cursor,total:targets.length,projectId:id});
   }finally{busy.delete(id)}
  }
  if(parts[4]==='evidence'){
   const p=await body(req);await getResearchProject(id);
   const dimension=ss(p.dimension,30),company=ss(p.company,100),claim=ss(p.claim,600),quote=ss(p.quote,600);
   if(!company||!dim.has(dimension)||!claim)throw Error('请输入企业、研究维度及具体事实');
   const sourceUrl=p.sourceUrl?dependencies.normalizeURL(p.sourceUrl).href:'';
   let status='unverified',sourceHash='',matched=false;
   if(sourceUrl&&quote.length>=12){
    try{
     const r=await dependencies.fetchSafe(sourceUrl);
     if(r.status===200&&/text\/html|text\/plain|application\/xhtml\+xml/i.test(String(r.headers['content-type']||'text/html'))){
      const visible=String(r.body||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
      const normalize=x=>x.replace(/\s+/g,' ').trim();
      matched=visible.includes(normalize(quote));
      if(matched){status='quote-matched';sourceHash=createHash('sha256').update(normalize(quote)).digest('hex')}
     }
    }catch{}
   }
   const result=await saveManualResearchEvidence(id,{company,dimension,claim,sourceUrl,quote,status,sourceHash});
   return json({...result,matched,note:matched?'已核对公开网页存在此原文，但观点解释仍需人工复查':'未核验来源原文；不会提交 AI 作为事实依据'},201);
  }
  if(parts[4]==='ai'){
   const project=await getResearchProject(id);
   const output=await generateCitedResearch(project);
   const saved=await saveResearchAI(id,output.model,output.report);
   return json({...output,...saved});
  }
  return json({error:'Not found'},404);
 }catch(e){
  const msg=ss(e?.message||'研究服务异常',260);
  if(/AI 功能待配置|持久化未配置/.test(msg))return json({error:msg},503);
  if(/项目不存在/.test(msg))return json({error:msg},404);
  return json({error:msg},400);
 }
}
