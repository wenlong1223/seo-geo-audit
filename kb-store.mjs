/* Immutable note versions + explicit current pointers; no destructive note replacement. */
import {randomUUID} from 'node:crypto';
import {store as researchStore} from './research-store.mjs';
import {parseObsidianNote,reviewEntity,buildGroundedProposal,ENTITY_TYPES} from './kb-core.mjs';
const now=()=>new Date().toISOString();
export async function knowledgeStore(){
 const db=await researchStore();
 for(const sql of [
  'CREATE TABLE IF NOT EXISTS kb_versions(id TEXT PRIMARY KEY,path TEXT NOT NULL,title TEXT NOT NULL,type TEXT NOT NULL,industry TEXT NOT NULL,status TEXT NOT NULL,aliases_json TEXT NOT NULL,tags_json TEXT NOT NULL,body TEXT NOT NULL,source_url TEXT NOT NULL,sha TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(path,sha))',
  'CREATE TABLE IF NOT EXISTS kb_current(path TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES kb_versions(id))',
  'CREATE TABLE IF NOT EXISTS kb_links(version_id TEXT NOT NULL REFERENCES kb_versions(id),target TEXT NOT NULL,kind TEXT NOT NULL,PRIMARY KEY(version_id,target,kind))',
  'CREATE INDEX IF NOT EXISTS kb_versions_type ON kb_versions(type,industry)',
  'CREATE INDEX IF NOT EXISTS kb_links_source ON kb_links(version_id)'
 ])db.run(sql);
 return db;
}
const cols='v.id,v.path,v.title,v.type,v.industry,v.status,v.aliases_json,v.tags_json,v.source_url,v.sha,v.created_at';
const base=' FROM kb_current c JOIN kb_versions v ON c.version_id=v.id';
const hydrate=r=>r?({...r,aliases:JSON.parse(r.aliases_json),tags:JSON.parse(r.tags_json),aliases_json:undefined,tags_json:undefined}):null;
export async function importMarkdownBatch(files){
 const db=await knowledgeStore();
 if(!Array.isArray(files)||files.length<1||files.length>12)throw Error('一次请选择1至12份 Markdown 文件');
 const entities=files.map(parseObsidianNote);
 if(entities.reduce((a,x)=>a+x.byteLength,0)>115000)throw Error('单批文件不得超过115KB，请减少所选文件');
 if(new Set(entities.map(x=>x.path)).size!==entities.length)throw Error('本批存在相同路径文件');
 let added=0,identical=0,versions=0;
 const operation=db.transaction(()=>{
  const has=db.query('SELECT id FROM kb_versions WHERE path=? AND sha=?');
  const current=db.query('SELECT version_id FROM kb_current WHERE path=?');
  const insert=db.query('INSERT INTO kb_versions(id,path,title,type,industry,status,aliases_json,tags_json,body,source_url,sha,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
  const point=db.query('INSERT INTO kb_current(path,version_id) VALUES(?,?) ON CONFLICT(path) DO UPDATE SET version_id=excluded.version_id');
  const edge=db.query('INSERT INTO kb_links(version_id,target,kind) VALUES(?,?,?)');
  for(const e of entities){
   const same=has.get(e.path,e.sha);
   if(same){if(current.get(e.path)?.version_id===same.id){identical++;continue}point.run(e.path,same.id);versions++;continue}
   const previous=current.get(e.path),id=randomUUID();
   insert.run(id,e.path,e.title,e.type,e.industry,e.status,JSON.stringify(e.aliases),JSON.stringify(e.tags),e.body,e.sourceUrl,e.sha,now());
   for(const link of e.links)edge.run(id,link.target,link.kind);
   point.run(e.path,id);added++;if(previous)versions++;
  }
 });
 operation();
 return {added,identical,updatedVersions:versions,files:entities.map(x=>({path:x.path,title:x.title,type:x.type,links:x.links.length}))};
}
export async function knowledgeStats(){
 const db=await knowledgeStore();
 const count=db.query('SELECT COUNT(*) AS n FROM kb_current').get().n;
 const versions=db.query('SELECT COUNT(*) AS n FROM kb_versions').get().n;
 const edges=db.query('SELECT COUNT(*) AS n FROM kb_links e JOIN kb_current c ON c.version_id=e.version_id').get().n;
 const types=db.query('SELECT v.type,COUNT(*) AS count'+base+' GROUP BY v.type ORDER BY count DESC').all();
 return {entities:count,versions,links:edges,types,method:'统计当前已导入的真实 Markdown 实体与显式链接；不等于文章中的13,199实体。'};
}
export async function listKnowledge({type='',industry='',limit=60,offset=0}={}){
 const db=await knowledgeStore();
 const t=ENTITY_TYPES.includes(type)?type:'';
 const l=Math.max(1,Math.min(80,Number(limit)||60)),o=Math.max(0,Math.min(50000,Number(offset)||0));
 const rows=db.query('SELECT '+cols+base+" WHERE (?='' OR v.type=?) AND (?='' OR v.industry=?) ORDER BY v.created_at DESC LIMIT ? OFFSET ?").all(t,t,industry,industry,l,o);
 return rows.map(hydrate);
}
export async function getKnowledgeEntity(id){
 const db=await knowledgeStore();
 const r=db.query('SELECT '+cols+',v.body'+base+' WHERE v.id=?').get(id);
 if(!r)throw Error('知识实体不存在或不是最新版本');
 const edges=db.query('SELECT target,kind FROM kb_links WHERE version_id=? ORDER BY kind,target').all(id);
 return {...hydrate(r),edges,review:reviewEntity(r,edges)};
}
export async function getKnowledgeRelations(id){
 const e=await getKnowledgeEntity(id);
 const db=await knowledgeStore(),current=db.query('SELECT '+cols+base).all().map(hydrate);
 const norm=x=>String(x).replace(/\.md$/i,'').replace(/\\/g,'/').trim().toLowerCase();
 const resolving=ref=>{
  const exact=current.filter(x=>norm(x.path)===norm(ref));if(exact.length===1)return exact[0];
  const leaf=norm(ref).split('/').at(-1);
  const candidates=current.filter(x=>norm(x.path).split('/').at(-1)===leaf||x.aliases?.some(a=>norm(a)===leaf));
  return candidates.length===1?candidates[0]:null;
 };
 const links=e.edges.map(x=>({...x,resolved:resolving(x.target)}));
 const backlinks=[];
 for(const other of current.filter(x=>x.id!==id)){
  const arrows=db.query('SELECT target,kind FROM kb_links WHERE version_id=?').all(other.id);
  if(arrows.some(x=>resolving(x.target)?.id===id))backlinks.push({id:other.id,title:other.title,path:other.path});
  if(backlinks.length>=100)break;
 }
 return {entity:e,links,backlinks,unresolved:links.filter(x=>!x.resolved).length,notes:'Wikilink仅为导航关系；因果含义须由显式关系类型和外部事实佐证，不能仅凭图上的边推断。'};
}
export async function assembleKnowledgeProposal(args){
 if(!Array.isArray(args.ids)||args.ids.length<1||args.ids.length>18)throw Error('选择1至18个已审核实体ID生成方案');
 const db=await knowledgeStore(),found=[];
 for(const id of new Set(args.ids)){
  const r=db.query('SELECT '+cols+',v.body'+base+' WHERE v.id=?').get(id);
  if(!r)throw Error('引用实体不存在或已有新版本：'+String(id).slice(0,40));
  found.push(hydrate(r));
 }
 return buildGroundedProposal({industry:String(args.industry||'').slice(0,100),pain:String(args.pain||'').slice(0,600),entities:found});
}
