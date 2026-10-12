import assert from 'node:assert/strict';
import vm from 'node:vm';
import { normalizeURL, analyzeHTML, handle } from './index.mjs';

const clean = '<!doctype html><html lang="zh-CN"><head><title>示例企业网站 SEO GEO 技术优化方案</title><meta name="description" content="这是一个完整的企业网站服务介绍，涵盖网站开发、技术 SEO 优化、实体结构化数据建设与项目技术交付，并且提供丰富的实操指导信息。"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="example"><meta property="og:description" content="description"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Example","sameAs":["https://example.org/"]}</script></head><body><h1>企业网站服务</h1><h2>详细服务说明</h2><img alt="说明图" src="/one.png"><a href="/a">a</a><a href="/b">b</a><a href="/c">c</a></body></html>';
const result = analyzeHTML(clean, {
  url:'https://example.com/',
  robots:{status:200},
  sitemap:{status:200},
  llms:{status:404}
});
assert.equal(result.summary.schemaTypes[0], 'Organization');
assert.equal(result.checks.find(x=>x.id==='entity').status, 'pass');
assert.equal(result.checks.find(x=>x.id==='jsonld').status, 'pass');
assert.equal(result.checks.find(x=>x.id==='sameas').status, 'pass');
assert.equal(result.checks.find(x=>x.id==='faq').status, 'na');
assert.equal(result.summary.images, 1);

const broken = analyzeHTML('<html><head><title>x</title><meta name="robots" content="noindex"><script type="application/ld+json">invalid json</script></head><body><img src="/img.jpg"></body></html>');
assert.equal(broken.checks.find(x=>x.id==='index').status, 'fail');
assert.equal(broken.checks.find(x=>x.id==='jsonld').status, 'fail');
assert.equal(broken.checks.find(x=>x.id==='alt').status, 'fail');
for (const bad of ['http://localhost','http://127.0.0.1','http://2130706433','http://user:password@example.com','ftp://example.com','http://example.com:8080','http://[::1]']) {
  assert.throws(()=>normalizeURL(bad));
}
assert.equal(normalizeURL('example.com').href, 'https://example.com/');

const h = await handle(new Request('http://localhost/api/health'));
assert.equal(h.status, 200);
assert.equal((await h.json()).ok, true);
const page = await handle(new Request('http://localhost/'));
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes('开始免费检测'));
assert.ok(html.includes('让网站更容易'));
assert.ok(!html.includes(String.fromCharCode(92)+'u8BA9'));
assert.equal(page.headers.get('cache-control'), 'no-store');
// Cloudflare Rocket Loader must not postpone the only interactive script.
assert.ok(html.includes('<script data-cfasync="false">'));
const inlineScript = html.split('<script data-cfasync="false">')[1]?.split('</script>')[0];
assert.ok(inlineScript, 'inline scan form controller exists');
assert.doesNotThrow(() => new vm.Script(inlineScript), 'scan form controller parses');
assert.match(page.headers.get('content-security-policy') || '', /script-src 'self' 'unsafe-inline'/);
assert.match(inlineScript, /scanForm.*addEventListener/);

import { buildEnterpriseReport,validateBusinessProfile } from './enterprise.mjs';
const profile={brand:'Example Brand',industry:'b2b',hasStore:false,keywords:'工业产品如何选型'};
const enterprise=buildEnterpriseReport(result,profile);
assert.equal(enterprise.kind,'enterprise-geo-16');
assert.equal(enterprise.pillars.length,16);
assert.equal(enterprise.coverage,Math.round(enterprise.verifiedCount/16*100));
assert.ok(enterprise.pillars.some(x=>x.status==='unknown'&&x.score===null));
assert.equal(enterprise.profile.industryLabel,'B2B / 工业及外贸');
assert.ok(enterprise.priority.every(x=>x.evidence&&x.action));
assert.throws(()=>validateBusinessProfile({brand:'X',industry:'b2b'}));
assert.throws(()=>validateBusinessProfile({brand:'Example',industry:'none'}));
assert.throws(()=>validateBusinessProfile({brand:'Example',industry:'b2b',competitor:'http://localhost'}));
const invalidBusiness=await handle(new Request('http://localhost/api/business-audit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:'https://example.com',brand:'x',industry:'b2b'})}));
assert.equal(invalidBusiness.status,400);
const noScan=await handle(new Request('http://localhost/api/business-audit',{method:'GET'}));
assert.equal(noScan.status,404);
assert.ok(html.includes('企业 GEO-16 审计'));
assert.ok(html.includes('enterpriseResults'));
assert.match(inlineScript,/renderEnterprise/);

console.log('All assertions passed');
