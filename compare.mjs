/** Comparison of two independent real technical scans, without inventing AI search visibility. */
const statusRank={fail:0,warn:1,pass:2};
const statuses={fail:'需要修复',warn:'建议优化',pass:'通过',na:'不适用'};
const numberOrNull=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
export function buildComparison(primary,competitor) {
 if(!primary||!competitor||!Array.isArray(primary.checks)||!Array.isArray(competitor.checks))
   throw new Error('比较报告必须来自两个真实的技术扫描结果');
 const other=new Map(competitor.checks.map(c=>[c.id,c]));
 const rows=primary.checks.map(c=>{
   const v=other.get(c.id),a=statusRank[c.status],b=v?statusRank[v.status]:undefined;
   const verdict=a===undefined||b===undefined?'unverified':a===b?'tie':a<b?'behind':'ahead';
   return {id:c.id,group:c.group,label:c.label,weight:c.weight,
     primary:{status:c.status,detail:c.detail,fix:c.fix},
     competitor:{status:v?.status||'na',detail:v?.detail||'未检测到对应维度'},
     verdict,fix:c.fix};
 });
 const gaps=rows.filter(c=>c.verdict==='behind').sort((a,b)=>(b.weight||0)-(a.weight||0));
 const compact=v=>({
   url:v.url,scannedAt:v.scannedAt,status:v.status,
   score:numberOrNull(v.score),seoScore:numberOrNull(v.seoScore),geoScore:numberOrNull(v.geoScore),
   passed:v.passed,warnings:v.warnings,failed:v.failed,
   summary:{title:v.summary?.title||'',description:v.summary?.description||'',canonical:v.summary?.canonical||'',
     schemaTypes:v.summary?.schemaTypes||[],headings:v.summary?.headings||[],images:v.summary?.images??null,
     internalLinks:v.summary?.internalLinks??null,robotsStatus:v.summary?.robotsStatus??null,
     sitemapStatus:v.summary?.sitemapStatus??null}
 });
 const a=compact(primary),b=compact(competitor);
 return {
   kind:'geo-technical-comparison',version:'1.2.0',scannedAt:new Date().toISOString(),
   primary:a,competitor:b,
   delta:{score:a.score!==null&&b.score!==null?a.score-b.score:null,
     seo:a.seoScore!==null&&b.seoScore!==null?a.seoScore-b.seoScore:null,
     geo:a.geoScore!==null&&b.geoScore!==null?a.geoScore-b.geoScore:null},
   rows,summary:{ahead:rows.filter(x=>x.verdict==='ahead').length,
     behind:gaps.length,tie:rows.filter(x=>x.verdict==='tie').length,
     unverified:rows.filter(x=>x.verdict==='unverified').length},
   opportunities:gaps.map((c,i)=>({order:i+1,label:c.label,group:c.group,weight:c.weight,
     evidencePrimary:c.primary.detail,evidenceCompetitor:c.competitor.detail,action:c.fix})).slice(0,12),
   methodology:'两站使用同一版本技术扫描规则；差值=本站得分－竞品得分。逐项比较通过/警告/失败等级，不适用或缺数据时不判断优劣。',
   disclaimer:'只扫描分别输入的公开 URL 以及各自 robots.txt、sitemap.xml、llms.txt 等约定路径；不做整站爬取、JavaScript 渲染或搜索平台引用监测。分数不是关键词排名、真实流量、AI 推荐概率或商业竞争力证明。'
 };
}
