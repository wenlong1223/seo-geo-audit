import assert from 'node:assert/strict';
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
console.log('All 18 assertions passed');
