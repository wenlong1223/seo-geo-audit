import assert from 'node:assert/strict';
import vm from 'node:vm';
import { V4_PAGE } from './v4-page.mjs';
import { handle } from './index.mjs';

assert.match(V4_PAGE, /Web Toolkit V4/);
assert.match(V4_PAGE, /ZWLLA_TOOLKIT_READY_V4/);
assert.match(V4_PAGE, /ZWLLA_TOOLKIT_REPORT_V4/);
assert.match(V4_PAGE, /localStorage/);
assert.match(V4_PAGE, /\/api\/site-audit/);
assert.match(V4_PAGE, /Codex/);
const embedded=V4_PAGE.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(embedded, 'V4 inline portal JS missing');
new vm.Script(embedded,{filename:'v4-portal-inline.js'});

assert.match(V4_PAGE, /white-space:pre-line/, 'preserve visible line breaks');
const sourceStart=embedded.indexOf('function displayText(');
const sourceEnd=embedded.indexOf('function normalize(',sourceStart);
assert.ok(sourceStart>=0 && sourceEnd>sourceStart,'safe text renderer is present');
const {displayText,textNode}=new vm.Script(embedded.slice(sourceStart,sourceEnd)+'\n({displayText,textNode})').runInNewContext({});
assert.equal(displayText('\\u4e2d\\u6587'),'中文','decode literal Unicode escapes');
assert.equal(displayText('第一行\\n第二行'),'第一行\n第二行','decode literal newline escapes');
const unsafe='<img src=x onerror=alert(1)>';
const view={innerHTML:'original'};
textNode(view,unsafe);
assert.equal(view.textContent,unsafe,'preserve visible tag characters');
assert.equal(view.innerHTML,'original','do not interpret imported markup as HTML');


const page=await handle(new Request('https://geo.zwlla.com/toolkit'));
assert.equal(page.status,200);
assert.match(page.headers.get('content-type'),/text\/html/);
assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
assert.match(await page.text(),/全站问题管理工作台/);
const home=await handle(new Request('https://geo.zwlla.com/'));
assert.match(await home.text(),/Web Toolkit V4/);
const health=await handle(new Request('https://geo.zwlla.com/api/health'));
assert.equal(health.status,200);
console.log('V4 portal integration tests passed');