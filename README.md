# SEO / GEO Audit

> 免费、开源的中文网站技术 SEO 与 GEO 就绪度诊断工具。  
> **在线体验：** https://geo.zwlla.com/

[![Tests](https://github.com/wenlong1223/seo-geo-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/wenlong1223/seo-geo-audit/actions/workflows/ci.yml)

## 功能

输入公开网站 URL 后，服务端检查：

- **Technical SEO：** 标题、描述、H1、规范链接、viewport、语言、图片 ALT、内部链接、索引指令及 Open Graph；
- **抓取基础：** `robots.txt` 和 Sitemap 可访问性；
- **GEO 技术就绪度：** Schema.org / JSON-LD 解析、企业实体类型、`sameAs` 等结构化实体信号；
- **诊断报告：** 各项问题、修复建议、启发式评分，以及 JSON 报告导出。

**注意：** GEO 分数只代表结构化信息与技术就绪度，**不代表** Google 收录、SEO 排名、AI 平台真实引用率或任何商业效果保证。当前版本不运行 JS 渲染器，也不执行深度全站爬取。

## 企业 GEO-16 审计模式（v1.2）

通过页面顶部切换 **企业 GEO-16 审计**，填写品牌名称、行业、目标关键词、主体名称及可选竞品信息，生成含 **16 个参考维度、抓取证据、待核验状态、优先整改 SOP、JSON 下载、打印/保存 PDF** 的企业报告。

- **证据优先：** 实测通过 / 待修复 / 建议优化 / 待核验，未知项不计分，并独立展示覆盖率；
- **仅公开页面：** 仍不做全站、品牌工商查询、竞争对手抓取或真正 AI 引用测试；
- **规则驱动：** 目前不接入大模型 API，不自动生成没有事实依据的 AI 分数；
- **评分说明：** 自定义 16 维映射，不等于学术 GEO-16 原始评分公式。

**新增 API：** POST `/api/business-audit`，JSON 示例：

```json
{"url":"https://example.com","brand":"Example Brand","industry":"b2b","hasStore":false}
```

**部署安全：** 如果使用 Cloudflare WAF，须将该 API、`/api/compare` 和 `/api/site-audit` 加入与 `/api/audit` 相同的限流规则。


## 双站真实扫描对比（v1.2）

首页选择「竞品双站对比」，输入**本站 URL** 和**竞品 URL**。工具对双方分别执行安全受限的 HTTP/HTTPS 真实抓取（首页或指定页面 + robots.txt/sitemap.xml/llms.txt 探测），用同一套 SEO/GEO 技术规则比较得分、检查项、原始摘要、差距和整改优先级。

企业 GEO-16 审计中，选择「竞品对比（真实抓取）」并填写竞品 URL，也会在企业审计报告下方附上可打印的实测对照部分。其他阶段只保存竞品网址，不会额外抓取。

**API：**

- \`POST /api/compare\` —— \`{"url":"https://example.com","competitor":"https://example.org"}\`
- \`POST /api/business-audit\` —— 当 \`stage="competitor"\` 且提供 \`competitor\` 时返回 \`comparison\` 对象。

两站分别限制公网域名、DNS 公网地址校验、超时、大小、重定向、并发；双站对比占用 2 个扫描额度，且受 Cloudflare 同一 IP 限流保护。如果任一网站无法访问，将标明失败方，不生成虚假的对照分数。

**重要边界：** 对比仅衡量所选页面的技术就绪度；不代表关键词排名、搜索流量、真实 AI 引用率或全站综合实力。对于不适用/无法核验的项目不判定谁领先。

## 站内多页面审计（v1.3）

首页选择「站内多页面审计」，输入一个公网 URL，选择最多 3 或 5 页。工具从入口页的静态 HTML 链接发现同源页面，最多两页并发抓取，生成：
- 页面级 Technical SEO/GEO 分数、问题与整改建议。
- 已成功检测页面的平均分、失败页面、发现链接数。
- 重复 Title/Description、缺失字段、noindex 和缺少 JSON-LD 的抽样统计。
- 可打印报告和 JSON 下载。

API：POST /api/site-audit；请求体示例：{"url":"https://example.com","maxPages":5}。

安全边界：这是最多 5 页的有限采样，默认 5 页；同源链接不够时少于 5 页。对每个 URL 复用 SSRF 与 DNS 公网校验、同源跳转限制、响应大小及请求超时。单次任务占用 3 个应用并发额度，并受 Cloudflare API 限速保护。不执行 JS 渲染、不登录、不进行全站抓取，不代表排名或 AI 实际引用率。

## 立即体验

**在线网页：** https://geo.zwlla.com/

**健康检测：** https://geo.zwlla.com/api/health

**API：**

```bash
curl -X POST "https://geo.zwlla.com/api/audit" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/"}'
```

## 技术栈

- **Runtime:** Bun / TypeScript（无第三方运行时依赖）
- **UI:** 原生 HTML、CSS、JavaScript；深色响应式中文界面
- **扫描:** 服务端 HTTP 请求、HTML 解析、robots / sitemap 探测和 JSON-LD 解析
- **生产部署:** Railway GitHub 自动部署（Dockerfile + Bun，main 分支）

## 本地运行

安装 [Bun](https://bun.sh/) 后：

```bash
bun run index.ts
```

打开 http://localhost:3000/，也可以将 `PORT` 环境变量设置为其他端口。

运行测试（Node.js 22 或更高版本）：

```bash
node test.mjs
```

仓库中的 `index.mjs` 与 `index.ts` 采用同一份部署逻辑，方便 Node.js 测试，无需转译步骤。

## Railway 自动部署（已启用）

生产服务 `seo-geo-audit-web` 已连接 GitHub 仓库 [wenlong1223/seo-geo-audit](https://github.com/wenlong1223/seo-geo-audit) 的 `main` 分支。

1. 代码推送到 `main` 后，Railway 会自动拉取该分支并开始部署（不固定某个提交 SHA）。
2. 使用仓库根目录的 `Dockerfile` 构建 Bun 镜像，并执行 `bun run index.ts`。
3. 通过 `/api/health` 健康检查后，新版本才会成为服务中的可用部署。
4. 原线上地址持续使用：https://geo.zwlla.com/

`.github/workflows/ci.yml` 会在 GitHub Push 和 Pull Request 时运行 Node.js 功能测试。**生产环境已开启 Wait for CI：Railway 应等待 GitHub Actions 工作流通过后再部署。建议先通过 Pull Request 验证，再合并到 `main` 发布。**

### 从其他 Railway 项目部署

1. 将本 GitHub 仓库连接到 Railway 项目中，选择 `main` 分支；
2. 自动识别仓库的 `Dockerfile` 和 `railway.json`，并确认健康检查路径为 `/api/health`；
3. 生成 Railway 域名、检查服务状态，随后推送新提交测试自动部署是否触发。

## 安全与使用限制

- 仅接受 HTTP/HTTPS 公网域名及 80、443 端口，限制跳转次数、超时、响应大小和并发；
- DNS 解析后只选择验证为公网的目标地址并固定连接，降低 SSRF 风险；
- 以上为应用层保护，面向公众提供服务时仍应配置**网络层出站隔离、WAF、持久化速率限制**；
- 请尊重目标网站规则，避免过量自动扫描。

## 仓库文件

- `index.ts`：线上 Railway 服务构建使用的 Bun / TypeScript 完整源码
- `index.mjs`：同一份源码的 Node.js ESM 测试镜像
- `compare.mjs`：两个真实技术扫描结果的差异分析与整改优先级
- `site.mjs`：安全的站内链接发现与多页面审计汇总
- `enterprise.mjs`：企业资料校验、16 维证据报告和整改建议映射
- `test.mjs`：本地功能和安全回归断言
- `.github/workflows/ci.yml`：每次推送自动运行测试

**作者：** [wenlong1223](https://github.com/wenlong1223)  
**许可证：** MIT

