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



## IIBD · 行业情报与商业决策工作台（实验性集成）

**入口：** `/intelligence`。与原 SEO/GEO Audit 共用 Railway/Bun 服务，无需另开 Streamlit/Python 服务，也不影响现有四种检测模式。

功能：
- 研究主体 + 最多16家竞品清单，分直接竞品、间接竞品、参考标杆。
- **真实技术采集**：单次最多扫描研究主体和两家竞品，复用原站 SSRF 防护与扫描规则，允许部分目标失败。
- **十维证据矩阵**：目标客户、产品、定价、履约、集成、获客、内容、转化、口碑、风险；未采集不等于不支持。
- 业务证据手工登记（可添加来源 URL；仍标记人工待核验）；证据来源可回查。
- 行动卡、Markdown/JSON 导出；**无数据库、无自动市场数据 API、无生成式 AI**。

**接口：**
```bash
curl -X POST https://geo.zwlla.com/api/intelligence/analyze \
  -H "Content-Type: application/json" \
  -d '{"subject":"86DROP","industry":"跨境电商履约","companies":[{"name":"Competitor A","kind":"direct"}],"records":[]}'
```

注意：本模块无法凭网页技术扫描得出真实市场规模、搜索量、客户LTV、营收、转化率或商家商业竞争力；缺数据明确留白。当前报告只在当前页面/响应中，需主动下载，服务端不长期保存。

开发和后续架构说明：[`docs/IIBD_V2_GEO_集成与后续开发.md`](docs/IIBD_V2_GEO_集成与后续开发.md)。

线上 WAF 部署需把 `/api/intelligence/scan` 纳入扫描速率限制，并给 `/api/intelligence/analyze` 单独设置请求频率及大小上限。正式部署前检查 PR CI、Railway 健康状态和旧页面功能。

## IIBD V2.1：16 家竞品采集、SQLite 数据库、带来源 AI 研究

在 `/intelligence` 页面下方使用 **长期研究项目**。

本版本由原站 Bun 服务直接实现，不部署第二套 Streamlit：
- **16 家竞品**：从已有清单创建项目，逐批扫描最多 2 家，页面自动循环批次并显示失败结果；服务端每批持久化进度，即使关闭页面也能下次继续。
- **公开来源抽取**：安全检查 URL 与 DNS，读取指定网站首页与最多 1 个相关公开页面，提取页面标题、Meta Description、H1/H2/H3、部分履约/集成/报价相关原文；部分被屏蔽的网站标记失败。公开文字仅证明网页这样写，不证明商家实际履约能力。
- **SQLite WAL 持久存储**：`research_projects`、`research_companies`、`research_evidence`、`research_ai_reports`，按项目隔离、来源字段、状态和时间戳保存。数据文件路径由 `IIBD_DB_PATH` 配置，必须位于 Railway 已挂载持久卷中。
- **来源核验**：人工录入的网页原文需 URL 可达且逐字匹配才算 `quote-matched`；否则为 `unverified`，不会成为 AI 的事实素材。
- **AI 调用**：仅提交带公开原文和证据 ID 的经过核验片段。服务端审核 AI 输出的每个 source_id 必须属于输入素材，没有有效引用的洞察会被删除。引用有效不保证推论正确，仍需终审。
- **旧 GEO Audit**：原来的四种技术审计和 /api/intelligence/analyze 不变。

### 必须配置的 Railway 变量
| 变量 | 用途 |
| --- | --- |
| `IIBD_ADMIN_TOKEN` | 长度 ≥24 的随机管理员 Bearer Token；只在管理员表单中输入，不要写进 GitHub 源码 |
| `IIBD_DB_PATH` | 指向持久卷，如 `/data/iibd-research.sqlite` |
| `RAILWAY_RUN_UID` | Railway 根属主持久卷的访问兼容性，当前设 `0`，请尽可能采用单独最小权限服务隔离 |
| `OPENAI_API_KEY` | 可选；AI 分析必需，需单独开通 OpenAI API 计费，ChatGPT 订阅不能替代 |
| `IIBD_AI_MODEL` | 可选，默认 `gpt-5-mini`；需是账号具备调用权限的模型 |

生产 Railway Volume：`/data`。现阶段一次只允许运行一个服务实例，无法扩容副本。必须在 Railway Dashboard 给 Volume 设置备份策略：SQLite 单文件并不等于自动备份。

### 操作
1. 打开 `https://geo.zwlla.com/intelligence`，在原有项目表单中填行业、研究主体、16 家竞品（每行 `名称 | 官网 | direct/indirect/benchmark`）。
2. 在 **长期研究项目** 模块填写管理员密钥，点击新建项目。
3. 点击“开始/继续采集全部竞品”，程序分批自动采集并保存；有失败可在结果中查到，不能冒充扫描成功。
4. 使用“校验原文并保存”提交额外事实；原文需要与真实来源页面内容一致，12 字以上。
5. 如果已配置 `OPENAI_API_KEY`，点击“生成有来源的 AI 报告”。每条模型发现含对应事实证据 URL。
6. 下载 JSON 作为离线备份，管理员数据不会被公开共享。

### API 安全
私有路径：`/api/research/projects`、`/api/research/projects/:id`、`/api/research/projects/:id/batch`、`/api/research/projects/:id/evidence`、`/api/research/projects/:id/ai`；均需 `Authorization: Bearer <管理员密钥>`。
Cloudflare 已配置 `/api/research/` 的 POST 速率限制；服务端限制项目最多16个竞品、每批2个。建议后续使用 Cloudflare Access 做身份隔离并单独拆分后台进程。

### 约束
当前不具备商业销量、流量、客户成交数据、第三方平台评价 API 或企业经营数据验证。爬取的页面标题与介绍属于“来源声明”，不能当成“行业客观真相”。AI 若无 Key 会明确显示配置缺失，不会降级成无来源的虚拟分析。数据备份、重扫失败项、权限分级和更多合规数据源仍属于下一阶段。

## 行业知识引擎：Obsidian Markdown → 实体知识 → 关系 → 方案

**在线入口：** https://geo.zwlla.com/knowledge

本模块不是文章中那套 13,199 实体知识库的镜像。首次启用时为空库，只有真实导入的文件才计数。

- 复用现有 Railway Bun + SQLite 持久卷，不引入额外服务器；所有 API 均使用现有 IIBD_ADMIN_TOKEN 鉴权。
- 管理员可导入 .md 或桌面文件夹：单份最大18KB、每批最多12份，浏览器自动分批；保留原始内容、frontmatter、wikilinks、SHA256历史版本。
- 支持实体类型（industry/pain/method/function/case/standard/kpi/spec/other）、行业、标签、别名和原始来源；出链、反链和未解析链接可直接查看。
- 方案构建只使用明确选中的知识实体并保留引用 [KB:ID]；缺失案例/指标/功能时标记待补证。
- 可选知识语义问答需 OPENAI_API_KEY。无 Key 时直接返回不可用，不使用关键词命中或 BM25/BFS 冒充 AI 检索；超过79条候选必须先缩小行业/实体类型。
- 试验性远程 MCP：POST /mcp/knowledge，兼容 Streamable HTTP 2025-06-18 协议的已实现子集，提供五个只读/方案工具。必须使用 Bearer 管理员密钥。
- 当前不支持 PPTX/PDF OCR、ZIP 解包、复杂嵌套 YAML、整库向量索引或原文章14 Skill自动迁移。

**操作：** 打开 /knowledge → 输入 Railway 服务变量 IIBD_ADMIN_TOKEN → 连接 → 导入真实 Markdown → 浏览证据和关系 → 选择实体 → 生成引用版 Markdown。

**安全提醒：** Markdown 内容作为数据而不是指令。页面转义显示笔记；文章中的关系是知识声明，不自动作为因果证明。启用备份后再进行长期项目归档。
