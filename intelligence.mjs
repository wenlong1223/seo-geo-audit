/* IIBD V2 integration — bounded, evidence-first research with no invented market data. */
export const DIMENSIONS=[
  ['icp','目标客户'],['product','服务与产品'],['pricing','报价与成本'],
  ['operations','履约与服务能力'],['integration','系统与集成'],
  ['channels','获客渠道'],['content','内容与SEO/GEO'],
  ['conversion','询盘转化'],['reputation','客户反馈'],['risk','风险与约束']
];
const labels=Object.fromEntries(DIMENSIONS);
const cut=(s,n=400)=>String(s??'').trim().slice(0,n);
const sourceOk=s=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&u.hostname.includes('.')}catch{return false}};
const unique=a=>[...new Set(a)];
function textCell(s){return String(s??'').replace(/[|]/g,'/').replace(/\r?\n/g,' ').slice(0,400)}
export function analyzeIntelligence(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('请求格式错误');
  const subject=cut(input.subject,100),industry=cut(input.industry,100);
  if(!subject||!industry)throw Error('请填写研究主体及所属行业');
  const companies=[{name:subject,kind:'self'},...(Array.isArray(input.companies)?input.companies:[]).slice(0,16).map(x=>({name:cut(x?.name,100),kind:['direct','indirect','benchmark'].includes(x?.kind)?x.kind:'direct'}))].filter(x=>x.name);
  if(companies.length>17||unique(companies.map(x=>x.name.toLocaleLowerCase())).length!==companies.length)throw Error('企业名称重复或过多');
  if(!Array.isArray(input.records||[]))throw Error('证据必须是数组');
  if((input.records||[]).length>200)throw Error('单次最多整理200条证据');
  const records=(input.records||[]).map((x,i)=>{
    const company=cut(x?.company,100),dimension=cut(x?.dimension,35),claim=cut(x?.claim,600),sourceUrl=cut(x?.sourceUrl,2048),date=cut(x?.date,30);
    if(!companies.some(c=>c.name===company)||!labels[dimension]||!claim)throw Error('第'+(i+1)+'条证据的企业、维度或内容不符合要求');
    if(sourceUrl&&!sourceOk(sourceUrl))throw Error('第'+(i+1)+'条证据的来源链接无效');
    const origin=x?.origin==='scanner'?'scanner':'user';
    const status=origin==='scanner'&&sourceUrl?'measured':sourceUrl?'cited-unverified':'unverified';
    return {id:'CLM-'+String(i+1).padStart(3,'0'),company,dimension,claim,sourceUrl,date,origin,status};
  });
  const matrix=DIMENSIONS.map(([key,label])=>({key,label,cells:companies.map(c=>({company:c.name,items:records.filter(r=>r.company===c.name&&r.dimension===key)}))}));
  const withSource=records.filter(x=>x.sourceUrl).length;
  const measured=records.filter(x=>x.status==='measured').length;
  const gaps=matrix.filter(r=>r.cells.some(c=>c.items.length===0)).map(r=>r.label);
  const actions=[];
  const ownRisks=records.filter(r=>r.company===subject&&r.origin==='scanner'&&/待修复|缺少|失败|未发现/.test(r.claim));
  for(const r of ownRisks.slice(0,5)) actions.push({title:'优先核查并修复：'+labels[r.dimension],basis:[r.id],priority:'先验证',next:'核对网页实际内容，确认是否影响客户获取；必要时整改后复测。',metric:'整改前后同页的可核验技术检测项',stop:'如该项业务不适用或检测结果有误，撤销此建议。'});
  if(!actions.length)actions.push({title:'补齐业务事实并访谈客户',basis:[],priority:'先验证',next:'优先验证价格、客户类型、供应能力及销售流失原因，收集可追溯材料。',metric:'补充的可核验证据数与完成的有效客户访谈数',stop:'证据不足时不得输出机会定论。'});
  const report={kind:'iibd-industry-research',version:'0.1-mvp',subject,industry,generatedAt:new Date().toISOString(),
    companies,records,matrix,coverage:{totalRecords:records.length,withSource,measured,withoutSource:records.length-withSource,missingDimensions:gaps},
    actions,methodology:'公开网页安全技术检测 + 用户输入的证据矩阵；人工提交的链接只代表可查阅来源，尚未由程序验证其内容。',limitations:'不提供市场规模、搜索量、营收、真实客户满意度、AI引用概率或商业机会成功率。缺数据标记未采集，不将网站技术评分视作商业竞争力。'};
  report.markdown=makeMarkdown(report);
  return report;
}
export function buildScanResearch(payload,results){
  const companies=results.map(x=>({name:x.name,kind:x.kind||'direct'}));
  const records=[]; const scans=[];
  for(const item of results){
    if(item.error){scans.push({company:item.name,url:item.url,error:item.error});continue;}
    const r=item.report;
    scans.push({company:item.name,url:r.url,score:r.score,seo:r.seoScore,geo:r.geoScore,
      title:r.summary.title,issues:r.issues.slice(0,6).map(i=>({id:i.id,label:i.label,status:i.status,detail:i.detail,fix:i.fix}))});
    const add=(dimension,claim)=>records.push({company:item.name,dimension,claim,sourceUrl:r.url,origin:'scanner',date:r.scannedAt?.slice(0,10)||''});
    add('content','页面 Title（实测）：'+(r.summary.title||'缺少'));
    add('content','Meta Description（实测）：'+(r.summary.description||'缺少'));
    add('integration','页面 Schema 类型（实测）：'+(r.summary.schemaTypes.join('、')||'未发现'));
    add('content','技术 SEO/GEO 就绪度：'+r.seoScore+'/'+r.geoScore+'（启发式技术评分，不等于排名或真实引用）');
    for(const issue of r.issues.slice(0,4)) if(issue.status==='fail') add('content','待修复：'+issue.label+'；检测依据：'+issue.detail);
  }
  const report=analyzeIntelligence({subject:cut(payload.subject,100),industry:cut(payload.industry,100),
    companies:companies.filter(c=>c.name!==payload.subject),records});
  report.scans=scans;
  report.scanScope='最多三家公开网站，每家为一个指定页面及固定技术探测路径。只对已扫描页面形成技术事实，不推导产品、定价或营销表现。';
  report.markdown=makeMarkdown(report);
  return report;
}
function makeMarkdown(r){
  const out=['# '+r.industry+'｜'+r.subject+' 行业情报分析（证据版）','',
    '生成日期：'+r.generatedAt,'','> '+r.limitations,'','## 研究范围',
    r.companies.map(c=>'- '+c.name+'（'+({self:'研究主体',direct:'直接竞品',indirect:'间接竞品',benchmark:'参考标杆'}[c.kind]||c.kind)+'）').join('\n'),
    '','## 证据覆盖情况','- 登记：'+r.coverage.totalRecords+' 条；有来源链接：'+r.coverage.withSource+' 条；程序直接采集：'+r.coverage.measured+' 条。',
    '- 未有证据不代表竞品没有该能力。','','## 横向证据矩阵',
    '| 维度 | '+r.companies.map(x=>textCell(x.name)).join(' | ')+' |',
    '| --- | '+r.companies.map(()=>'---').join(' | ')+' |'];
  for(const row of r.matrix)out.push('| '+row.label+' | '+row.cells.map(c=>c.items.length?c.items.slice(0,3).map(x=>textCell(x.claim)+' ['+x.id+']').join('；'):'未采集').join(' | ')+' |');
  out.push('','## 行动卡（假设，非商业结论）');
  r.actions.forEach((a,i)=>out.push('### '+(i+1)+'. '+a.title,'- 状态：'+a.priority,'- 依据：'+(a.basis.join(', ')||'待补充'),'- 下一步：'+a.next,'- 验证指标：'+a.metric,'- 停止条件：'+a.stop,''));
  out.push('## 证据账本','','| ID | 企业 | 维度 | 结论/原文摘录 | 来源 | 状态 |','| --- | --- | --- | --- | --- | --- |');
  for(const e of r.records)out.push('| '+e.id+' | '+textCell(e.company)+' | '+labels[e.dimension]+' | '+textCell(e.claim)+' | '+(e.sourceUrl?e.sourceUrl.replace(/[|]/g,'%7C'):'无')+' | '+({measured:'程序检测', 'cited-unverified':'人工提交链接/内容待核','unverified':'未提供来源'}[e.status])+' |');
  out.push('','## 方法与边界',r.methodology,r.limitations,'');
  if(r.scans?.length)out.push('## 扫描失败与范围',...r.scans.filter(s=>s.error).map(s=>'- '+s.company+'：'+s.error),r.scanScope||'');
  return out.join('\n');
}
