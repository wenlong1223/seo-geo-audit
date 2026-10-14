/* Private knowledge-workbench API and opt-in MCP Streamable HTTP (protocol 2025-06-18 subset). */
import {createHash,timingSafeEqual} from 'node:crypto';
import {knowledgeStats,listKnowledge,getKnowledgeEntity,getKnowledgeRelations,importMarkdownBatch,assembleKnowledgeProposal} from './kb-store.mjs';
import {answerWithKnowledge} from './kb-ai.mjs';
const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const fault=(msg,status=400)=>send({error:String(msg).slice(0,260)},status);
export function authorized(req){
 const token=process.env.IIBD_ADMIN_TOKEN;
 if(!token||token.length<24)return fault('管理员密钥未配置，知识库保持关闭',503);
 const supplied=String(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!supplied||supplied.length>200)return fault('需要管理员 Bearer Token',401);
 const a=createHash('sha256').update(supplied).digest(),b=createHash('sha256').update(token).digest();
 return timingSafeEqual(a,b)?null:fault('管理员身份校验失败',401);
}
async function parseBody(req,max=118000){
 if(Number(req.headers.get('content-length')||0)>max)throw Error('请求体过大');
 const raw=await req.text();if(Buffer.byteLength(raw,'utf8')>max)throw Error('请求体过大');
 try{return JSON.parse(raw)}catch{throw Error('请求数据不是有效 JSON')}
}
export async function handleKnowledgeApi(req){
 const auth=authorized(req);if(auth)return auth;
 const url=new URL(req.url),p=url.pathname,m=req.method;
 try{
  if(p==='/api/kb/stats'&&m==='GET')return send(await knowledgeStats());
  if(p==='/api/kb/entities'&&m==='GET')return send({entities:await listKnowledge({type:url.searchParams.get('type')||'',industry:url.searchParams.get('industry')||'',limit:80,offset:url.searchParams.get('offset')||0})});
  if(p==='/api/kb/entity'&&m==='GET'){
   const id=url.searchParams.get('id');if(!id)return fault('缺少实体ID');
   return send(await getKnowledgeEntity(id));
  }
  if(p==='/api/kb/relations'&&m==='GET'){
   const id=url.searchParams.get('id');if(!id)return fault('缺少实体ID');
   return send(await getKnowledgeRelations(id));
  }
  if(p==='/api/kb/import'&&m==='POST'){
   const b=await parseBody(req);return send(await importMarkdownBatch(b?.files),201);
  }
  if(p==='/api/kb/proposal'&&m==='POST')return send(await assembleKnowledgeProposal(await parseBody(req,20000)));
  if(p==='/api/kb/ask'&&m==='POST'){
   const b=await parseBody(req,5000);
   if(!String(b?.question||'').trim())return fault('请填写行业问题');
   return send(await answerWithKnowledge(b));
  }
  return fault('Not found',404);
 }catch(e){const message=String(e?.message||'知识库处理失败');return fault(message,/OPENAI_API_KEY|未配置/.test(message)?503:/实体不存在/.test(message)?404:400)}
}
const tool=(name,description,properties,required=[])=>({name,description,inputSchema:{type:'object',properties,required}});
const tools=[
 tool('list_entities','按已登记实体类型及行业浏览目录（非关键词评分）',{type:{type:'string'},industry:{type:'string'},limit:{type:'integer'}}),
 tool('get_entity','通过精确知识ID读取实体内容和来源',{id:{type:'string'}},['id']),
 tool('get_relations','读取原有 Obsidian wikilink、明确关系和反向链接，不擅自推理因果',{id:{type:'string'}},['id']),
 tool('ask_knowledge','LLM 对当前已入库实体进行语义理解与证据引用核验，需要 API Key',{question:{type:'string'},industry:{type:'string'},type:{type:'string'}},['question']),
 tool('generate_proposal','按指定知识实体 ID 拼装可追溯的 Markdown 方案，不自动补证',{ids:{type:'array',items:{type:'string'}},industry:{type:'string'},pain:{type:'string'}},['ids','pain'])
];
const mcpResponse=(id,result,error=null)=>send({jsonrpc:'2.0',id,...(error?{error}:{result})});
export async function handleKnowledgeMcp(req){
 if(req.method!=='POST')return fault('MCP 只接受 POST JSON-RPC 请求',405);
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin)return fault('Origin 校验失败',403);
 const auth=authorized(req);if(auth)return auth;
 let msg;
 try{msg=await parseBody(req,30000)}catch(e){return mcpResponse(null,null,{code:-32700,message:String(e.message)})}
 if(!msg||msg.jsonrpc!=='2.0'||Array.isArray(msg)||typeof msg.method!=='string')return mcpResponse(msg?.id??null,null,{code:-32600,message:'Invalid Request'});
 const version=req.headers.get('mcp-protocol-version');
 if(version&&!['2025-03-26','2025-06-18'].includes(version))return mcpResponse(msg.id??null,null,{code:-32602,message:'Unsupported protocol version; supported 2025-06-18'});
 if(msg.id===undefined)return new Response(null,{status:202,headers:{'cache-control':'no-store'}});
 if(msg.method==='initialize')return mcpResponse(msg.id,{protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'zwlla-knowledge-engine',version:'0.1.0'},instructions:'只读已入库的用户知识。知识关联不代表已证明的因果关系。'});
 if(msg.method==='ping')return mcpResponse(msg.id,{});
 if(msg.method==='tools/list')return mcpResponse(msg.id,{tools});
 if(msg.method==='tools/call'){
  const name=msg.params?.name,args=msg.params?.arguments||{};
  if(!tools.some(t=>t.name===name))return mcpResponse(msg.id,null,{code:-32602,message:'Unknown tool'});
  try{
   let result;
   if(name==='list_entities')result=await listKnowledge(args);
   else if(name==='get_entity')result=await getKnowledgeEntity(args.id);
   else if(name==='get_relations')result=await getKnowledgeRelations(args.id);
   else if(name==='ask_knowledge')result=await answerWithKnowledge(args);
   else if(name==='generate_proposal')result=await assembleKnowledgeProposal(args);
   return mcpResponse(msg.id,{content:[{type:'text',text:JSON.stringify(result)}]});
  }catch(e){return mcpResponse(msg.id,{content:[{type:'text',text:String(e?.message||'Tool error').slice(0,450)}],isError:true})}
 }
 return mcpResponse(msg.id,null,{code:-32601,message:'Method not found'});
}
