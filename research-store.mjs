/* SQLite WAL-backed private research projects; mounted directory required. */
import {randomUUID} from 'node:crypto';
let connectionPromise;
const now=()=>new Date().toISOString();
const text=(x,n=500)=>String(x??'').trim().slice(0,n);
export async function store(){
 if(typeof Bun==='undefined'||!process.env.IIBD_DB_PATH)throw Error('持久化未配置：请先挂载 Railway /data 并设置 IIBD_DB_PATH');
 if(!connectionPromise) connectionPromise=(async()=>{
  const {Database}=await import('bun:sqlite');
  const db=new Database(process.env.IIBD_DB_PATH,{create:true,strict:true});
  for(const sql of ['PRAGMA journal_mode = WAL','PRAGMA foreign_keys = ON','PRAGMA busy_timeout = 5000',
  'CREATE TABLE IF NOT EXISTS research_projects(id TEXT PRIMARY KEY,subject TEXT NOT NULL,industry TEXT NOT NULL,website TEXT NOT NULL,cursor INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)',
  "CREATE TABLE IF NOT EXISTS research_companies(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,name TEXT NOT NULL,website TEXT NOT NULL,kind TEXT NOT NULL,position INTEGER NOT NULL,scan_status TEXT NOT NULL DEFAULT 'pending',last_scanned TEXT,UNIQUE(project_id,name),UNIQUE(project_id,position))",
  "CREATE TABLE IF NOT EXISTS research_evidence(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,company_id TEXT NOT NULL REFERENCES research_companies(id) ON DELETE CASCADE,dimension TEXT NOT NULL,claim TEXT NOT NULL,source_url TEXT NOT NULL DEFAULT '',quote TEXT NOT NULL DEFAULT '',status TEXT NOT NULL,origin TEXT NOT NULL,captured_at TEXT NOT NULL,source_hash TEXT NOT NULL DEFAULT '',UNIQUE(project_id,company_id,dimension,claim,source_url))",
  'CREATE TABLE IF NOT EXISTS research_ai_reports(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,model TEXT NOT NULL,created_at TEXT NOT NULL,output_json TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS research_evidence_project_idx ON research_evidence(project_id)'])db.run(sql);
  return db;
 })().catch(e=>{connectionPromise=null;throw e});
 return connectionPromise;
}
const companyRow=(db,id,name)=>db.query('SELECT id FROM research_companies WHERE project_id=? AND name=?').get(id,name);
export async function createResearchProject({subject,industry,url,competitors}){
 const db=await store(),id=randomUUID(),t=now();
 db.query('INSERT INTO research_projects(id,subject,industry,website,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,subject,industry,url,t,t);
 const add=db.query('INSERT INTO research_companies(id,project_id,name,website,kind,position) VALUES(?,?,?,?,?,?)');
 add.run(randomUUID(),id,subject,url,'self',-1);
 competitors.forEach((c,i)=>add.run(randomUUID(),id,c.name,c.url,c.kind,i));
 return getResearchProject(id);
}
export async function listResearchProjects(){
 const db=await store();
 return db.query('SELECT p.*, (SELECT COUNT(*) FROM research_companies c WHERE c.project_id=p.id AND c.position>=0) AS total, (SELECT COUNT(*) FROM research_evidence e WHERE e.project_id=p.id) AS evidence_count FROM research_projects p ORDER BY updated_at DESC LIMIT 50').all();
}
export async function getResearchProject(id){
 const db=await store(),project=db.query('SELECT * FROM research_projects WHERE id=?').get(id);
 if(!project)throw Error('研究项目不存在');
 const companies=db.query('SELECT * FROM research_companies WHERE project_id=? ORDER BY position').all(id);
 const evidence=db.query('SELECT e.*,c.name AS company FROM research_evidence e JOIN research_companies c ON c.id=e.company_id WHERE e.project_id=? ORDER BY e.captured_at DESC LIMIT 800').all(id);
 const reports=db.query('SELECT id,model,created_at,output_json FROM research_ai_reports WHERE project_id=? ORDER BY created_at DESC LIMIT 5').all(id).map(r=>({id:r.id,model:r.model,created_at:r.created_at,output:JSON.parse(r.output_json)}));
 return {project,companies,evidence,reports};
}
export async function saveResearchScan(id,company,records,error=''){
 const db=await store(),t=now(),cid=companyRow(db,id,company.name)?.id;
 if(!cid)throw Error('扫描企业不属于当前项目');
 const insert=db.query('INSERT OR IGNORE INTO research_evidence(id,project_id,company_id,dimension,claim,source_url,quote,status,origin,captured_at,source_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
 for(const e of records)insert.run(randomUUID(),id,cid,text(e.dimension,40),text(e.claim,600),text(e.sourceUrl,2048),text(e.quote,600),text(e.status,40),text(e.origin,40),t,text(e.sourceHash,64));
 db.query('UPDATE research_companies SET scan_status=?,last_scanned=? WHERE id=?').run(error?'failed':'scanned',t,cid);
 db.query('UPDATE research_projects SET updated_at=? WHERE id=?').run(t,id);
}
export async function setResearchCursor(id,cursor){
 const db=await store();db.query('UPDATE research_projects SET cursor=?,updated_at=? WHERE id=?').run(cursor,now(),id);
}
export async function saveManualResearchEvidence(id,entry){
 const db=await store(),cid=companyRow(db,id,entry.company)?.id;if(!cid)throw Error('企业名称未在研究项目中');
 const key=randomUUID();
 db.query('INSERT OR IGNORE INTO research_evidence(id,project_id,company_id,dimension,claim,source_url,quote,status,origin,captured_at,source_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(key,id,cid,entry.dimension,text(entry.claim,600),text(entry.sourceUrl,2048),text(entry.quote,600),entry.status,'user',now(),text(entry.sourceHash,64));
 db.query('UPDATE research_projects SET updated_at=? WHERE id=?').run(now(),id);
 return {id:key,status:entry.status};
}
export async function saveResearchAI(id,model,output){
 const db=await store(),rid=randomUUID(),t=now();
 db.query('INSERT INTO research_ai_reports(id,project_id,model,created_at,output_json) VALUES(?,?,?,?,?)').run(rid,id,model,t,JSON.stringify(output));
 db.query('UPDATE research_projects SET updated_at=? WHERE id=?').run(t,id);
 return {id:rid,createdAt:t};
}
