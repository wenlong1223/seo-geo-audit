/** Evidence-led enterprise GEO audit. This is an in-house 16-dimension rubric,
 * not a validated prediction of AI answer citations or the published GEO-16 scoring formula. */
const industries = {b2b:'B2B / 工业及外贸',local:'本地商家 / 专业服务',ecommerce:'电商零售',media:'内容媒体',other:'其他'};
const asText=(value,max=180)=>String(value??'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
export function validateBusinessProfile(input={}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('企业信息格式错误');
  const brand=asText(input.brand,100);
  if (brand.length<2) throw new Error('请填写至少两个字符的企业或品牌名称');
  const industry=asText(input.industry,30);
  if (!Object.hasOwn(industries,industry)) throw new Error('请选择正确的行业类型');
  const hasStore=input.hasStore===true;
  const p={
    brand, industry,industryLabel:industries[industry],hasStore,
    legalName:asText(input.legalName,120),
    region:asText(input.region,100),
    keywords:asText(input.keywords,500),
    credentials:asText(input.credentials,300),
    competitor:asText(input.competitor,400),
    stage:['baseline','recheck','competitor'].includes(input.stage)?input.stage:'baseline'
  };
  if(p.competitor && !/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:[/?#:]|$)/i.test(p.competitor)) throw new Error('竞品网址需要填写带 http(s) 的完整公网网址');
  return p;
}
const dimensions=[
  ['indexing','索引指令','搜索引擎是否被明确禁止索引',['index'],'移除不必要的 noindex，并核对搜索引擎站长平台。'],
  ['metadata','页面元数据','标题与描述是否清楚',['title','description'],'完善唯一的页面标题和 Meta Description，避免堆砌关键词。'],
  ['structure','语义与标题结构','H1/H2 标题层级',['h1','structure'],'按业务主题建立清晰的 H1、H2、H3 内容结构。'],
  ['schema','结构化数据','JSON-LD 机器可读数据',['jsonld'],'依据页面真实内容部署并验证 Schema.org JSON-LD。'],
  ['entity','实体身份','企业实体 Schema 类型',['entity'],'在真实企业介绍页面添加 Organization 或适用的 LocalBusiness 结构化信息。'],
  ['sameas','实体资料关联','站内实体与可信公开资料的 sameAs 关联',['sameas'],'仅关联确属同一企业的真实官网及权威资料页。'],
  ['canonical','规范化网址','规范链接设置',['canonical'],'核对页面 canonical 指向，不要将不同内容错误合并。'],
  ['crawl','页面可抓取性','HTTP 与 robots.txt 的基础响应',['http','robots'],'优先修复 HTTP 可访问性、错误 robots 指令及跳转问题。'],
  ['sitemap','网站地图','发现 XML sitemap 的线索',['sitemap'],'维护 sitemap 并提交至对应站长平台。'],
  ['internal','内部链接','当前页面可见的站内链接',['links'],'完善主要栏目、专题、产品与 FAQ 之间的自然内链。'],
  ['media','多媒体可理解性','当前页面图片的 alt 文本',['alt'],'为内容图片编写与事实一致的替代文本。'],
  ['answers','答案式内容','FAQ 及问答标记线索',['faq'],'按真实用户问题建立可见 FAQ；Schema 要与页面内容一致。'],
  ['social','分享摘要','Open Graph 元信息',['social'],'设置准确的 OG 标题与描述，方便内容分享。'],
  ['freshness','内容更新时效','发布时间与更新记录是否可核验',[],'人工核验页面更新日期、更新内容与来源，不要伪造时间。'],
  ['authority','第三方可信背书','外部可验证的权威引用与品牌记录',[],'人工检查可靠的第三方提及、资质证书和来源链接。'],
  ['ai_citation','AI 实际引用表现','ChatGPT、豆包等平台的真实回答引用',[],'使用固定问题集和可重复的测试记录评估，不能由网页 HTML 推断。']
];
export function buildEnterpriseReport(technical,rawProfile) {
  if(!technical || !Array.isArray(technical.checks))throw new Error('请提供真实技术扫描结果');
  const p=validateBusinessProfile(rawProfile);
  const checks=new Map(technical.checks.map(c=>[c.id,c]));
  const pillars=dimensions.map(([id,label,purpose,ids,fix],index)=>{
    const evidenceChecks=ids.map(i=>checks.get(i)).filter(x=>x&&x.status!=='na');
    const status=evidenceChecks.length?evidenceChecks.some(x=>x.status==='fail')?'fail':evidenceChecks.some(x=>x.status==='warn')?'warn':'pass':'unknown';
    const evidence=evidenceChecks.length?evidenceChecks.map(x=>x.label+'：'+x.detail).join('；'):'未采集到足以可靠判断该维度的证据，待人工核验';
    return {index:index+1,id,label,purpose,status,score:status==='unknown'?null:status==='pass'?100:status==='warn'?50:0,evidence,fix,source:evidenceChecks.length?'本次公开页面技术扫描':'待人工/外部数据核验'};
  });
  const verified=pillars.filter(x=>x.score!==null);
  const verifiedScore=verified.length?Math.round(verified.reduce((a,x)=>a+x.score,0)/verified.length):null;
  const scope=[{label:'企业基本资料',state:'self_reported',detail:'客户自行填写，未执行工商或资质核验'}];
  if(p.competitor)scope.push({label:'竞品对比',state:p.stage==='competitor'?'checked':'not_checked',detail:p.stage==='competitor'?'已使用同一规则抓取并对比两个公开页面及有限约定路径':'仅记录竞品网址，未选择竞品对比阶段'});
  if(p.hasStore)scope.push({label:'本地商家扩展',state:'not_checked',detail:'线下地址、地图 POI 和 NAP 跨平台一致性尚未核验'});
  const priority=pillars.filter(x=>x.status==='fail'||x.status==='warn').sort((a,b)=>(a.status==='fail'?-1:1)-(b.status==='fail'?-1:1)).slice(0,8).map((x,i)=>({order:i+1,title:x.label,action:x.fix,evidence:x.evidence,status:x.status}));
  const manual=pillars.filter(x=>x.status==='unknown').map(x=>({title:x.label,action:x.fix}));
  if(p.hasStore) manual.push({title:'本地实体信息',action:'线下门店地址、电话、营业时间及地图 POI 需人工交叉核验。'});
  return {
    kind:'enterprise-geo-16',version:'1.2.0',scannedAt:technical.scannedAt||new Date().toISOString(),
    website:technical.url,profile:p,
    verifiedScore,verifiedCount:verified.length,totalCount:16,coverage:Math.round(verified.length/16*100),
    seoScore:technical.seoScore,geoTechnicalScore:technical.geoScore,
    technicalStatus:technical.status,pillars,priority,manual,scope,
    summary:technical.summary,
    methodology:'自定义 16 维技术与业务证据映射。仅对可观察维度计分，pass=100、warn=50、fail=0，未知项不计入均分；覆盖率单独显示。非学术 GEO-16 评分公式。',
    disclaimer:'仅检查所输入的公开页面及少量约定路径；不执行整站爬取、工商资质核验、未选择对比时不扫描竞品、AI 引用率监测或真实搜索排名测量。品牌及行业信息均由用户提供，未独立核实。分数不是任何 AI 平台推荐概率。'
  };
}
