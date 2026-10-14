/* Obsidian-compatible entities, explicit relations, and provenance-first reports. */
import {createHash} from 'node:crypto';
export const ENTITY_TYPES=['industry','pain','method','function','case','standard','kpi','spec','other'];
export const EDGE_KINDS=['wikilink','causes','addresses','implements','evidenced_by','measures','governed_by'];
const strip=x=>String(x??'').trim();
const normal=x=>strip(x).replace(/\\/g,'/').replace(/^\.\//,'').replace(/\/+/g,'/');
const clean=x=>strip(x).replace(/[\r\n]+/g,' ').slice(0,400);
export function safePath(input){
 const p=normal(input).replace(/\.md$/i,'')+'.md';
 if(!p||p.startsWith('/')||p.startsWith('.')||p.includes('\0')||p.split('/').some(x=>x==='..')||p.length>240||!p.toLowerCase().endsWith('.md'))throw Error('文件路径不合法');
 return p;
}
function metadata(raw){
 if(!raw.startsWith('---\n'))return {frontmatter:{},body:raw};
 const end=raw.indexOf('\n---',4);if(end<0||end>12000)return {frontmatter:{},body:raw};
 const lines=raw.slice(4,end).split(/\r?\n/),meta={};let key='';
 for(const line of lines){
  const field=line.match(/^([A-Za-z_][A-Za-z0-9_-]{0,35}):\s*(.*)$/);
  if(field){key=field[1];let value=field[2].trim();if(value.startsWith('[')&&value.endsWith(']'))value=value.slice(1,-1).split(',').map(x=>x.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
    meta[key]=value;continue;}
  const list=line.match(/^\s*-\s+(.+)$/);if(list&&key){if(!Array.isArray(meta[key]))meta[key]=meta[key]?[meta[key]]:[];meta[key].push(list[1].trim().replace(/^["']|["']$/g,''))}
 }
 return {frontmatter:meta,body:raw.slice(end+4).replace(/^\r?\n/,'')};
}
function tagsOf(value){return (Array.isArray(value)?value:String(value||'').split(/[,\s]+/)).map(clean).filter(Boolean).slice(0,20);}
export function parseObsidianNote(input){
 const path=safePath(input.path),source=String(input.content??'');
 if(!source.trim()||source.length>18000)throw Error('单份 Markdown 不能为空且不得超过18KB');
 const {frontmatter:f,body}=metadata(source.replace(/\r\n/g,'\n'));
 const title=clean(f.title||body.match(/^#\s+([^\n]+)/m)?.[1]||path.split('/').pop().replace(/\.md$/i,'')).slice(0,110);
 let type=clean(f.type||f.entity_type).toLowerCase();
 if(!ENTITY_TYPES.includes(type)){
  const prefix=path.split('/')[0];type=(/行业/.test(prefix)?'industry':/案例/.test(prefix)?'case':/标准/.test(prefix)?'standard':/KPI|指标/.test(prefix)?'kpi':/功能|系统/.test(prefix)?'function':/流程|理论/.test(prefix)?'method':'other');
 }
 const aliases=tagsOf(f.aliases),tags=tagsOf(f.tags);
 const industry=clean(f.industry).slice(0,100),status=clean(f.status||'unreviewed').slice(0,30);
 const sourceUrl=clean(f.source_url||f.source||input.sourceUrl||'').slice(0,500);
 const sha=createHash('sha256').update(source).digest('hex');
 const links=[],seen=new Set();
 const add=(dest,kind)=>{
  let target=normal(dest.split('|')[0].split('#')[0]).replace(/\.md$/i,'').trim();
  if(!target||target.startsWith('/')||target.includes('../')||target.length>220)return;
  const key=kind+'|'+target;
  if(!seen.has(key)){seen.add(key);links.push({target,kind})}
 };
 for(const match of body.matchAll(/(?<!!)\[\[([^\]]{1,230})\]\]/g))add(match[1],'wikilink');
 for(const match of body.matchAll(/^\s*(causes|addresses|implements|evidenced_by|measures|governed_by)::\s*\[\[([^\]]{1,230})\]\]/gm))add(match[2],match[1]);
 return {path,title,type,industry,status,aliases,tags,body:source,sourceUrl,sha,links:links.slice(0,100),byteLength:Buffer.byteLength(source,'utf8')};
}
export function reviewEntity(entity,edges=[]){
 const checks=[
 {label:'包含标题与实际正文',ok:!!entity.title&&entity.body.length>=80},
 {label:'已明确实体类型',ok:entity.type!=='other'},
 {label:'可追溯来源链接或自有资料标记',ok:!!entity.source_url},
 {label:'至少一条显式知识关联',ok:edges.length>0},
 {label:'已完成事实审核',ok:entity.status==='reviewed'}
 ];
 return {checks,score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),rule:'知识完整性检查，不是事实真实性百分比'};
}
export function buildGroundedProposal({industry,pain,entities}){
 if(!Array.isArray(entities)||entities.length===0)throw Error('请先选择至少1个知识实体');
 const types=new Set(entities.map(x=>x.type)),missing=['method','function','case','kpi'].filter(t=>!types.has(t));
 const lines=['# '+(industry||'未指定行业')+'｜问题解决方案（证据草案）','',
 '问题：'+pain,'','> 本报告仅拼装已选实体，不自动证明因果关系、适用性、标准有效性或投资回报。','',
 '## 证据链与推荐依据',''];
 const labels={industry:'行业背景',pain:'已知痛点',method:'管理方法',function:'系统功能',case:'参考案例',standard:'标准线索',kpi:'指标线索',spec:'实施规格',other:'其他'};
 for(const t of ENTITY_TYPES){const subset=entities.filter(x=>x.type===t);if(!subset.length)continue;
  lines.push('### '+labels[t]);for(const x of subset){
   lines.push('- **'+x.title+'** [KB:'+x.id+']（'+x.path+'）');
   if(x.source_url)lines.push('  - 来源：'+x.source_url);
   lines.push('  - 摘录：'+(x.body.replace(/^---[\s\S]*?---\s*/,'').replace(/[#*_\[\]]/g,' ').replace(/\s+/g,' ').trim().slice(0,260)||'暂无正文'));
  }lines.push('');
 }
 lines.push('## 当前缺失的关键论据',missing.length?missing.map(t=>'- 缺少已选 '+labels[t]+'，请补充实际资料再确认方案。').join('\n'):'- 关键类别已列示，仍需人工审核是否真正相互支持。',
 '', '## 落地验证清单','- 与客户确认问题发生环节、当前指标和工艺约束','- 将方法映射到具体系统功能并列出责任人','- 核实每个案例和标准的实际适用性及有效版本','- 建立试点范围、基线、预算和停止条件','',
 '## 引用说明','文中 [KB:ID] 对应知识库中的不可变入库版本；若版本更新，需重新审查交付物。');
 return {markdown:lines.join('\n'),missing,sourceIds:entities.map(x=>x.id),kind:'kb-evidence-proposal'};
}
