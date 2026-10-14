# IIBD V2 × geo.zwlla.com 集成实施方案

> 分支 feat/iibd-intelligence-mvp-20261014。文档中的阶段 1 是本 PR 实现目标，后续功能均为待开发，不等于已经上线。

## 一、现有生产事实
- 仓库 wenlong1223/seo-geo-audit，Bun/JavaScript 单体，Railway Docker 自动部署，主域名 geo.zwlla.com。
- 已有 SSRF 防护的 URL 规范化、DNS 公网 IP 校验、限时限量真实网页 GET、技术 SEO/GEO 分析。
- 无 PostgreSQL/SQLite 持久卷和登录身份体系。既有检测本身不存储用户扫描报告。
- 原 IIBD ZIP 的 Streamlit/SQLite 方案是“独立服务蓝图”，不能直接 import 成当前 Bun 服务。

## 二、真正的融合方式
| 功能 | 原站复用 | IIBD 新增 | 当前状态 |
| --- | --- | --- | --- |
| 首页/快速检测 | 原有 GET / | 主页入口链接 | 阶段1 |
| 企业 GEO-16 | /api/business-audit | 研究结论可引入 GEO 检测证据 | 独立，不更改旧接口 |
| 双站技术对比 | /api/compare | 多站技术证据采集 | 阶段1 |
| 站内多页面 | /api/site-audit | 后期可用作内容结构证据 | 规划 |
| 行业情报 | 无 | /intelligence | 阶段1 |
| 整理证据 | 无 | POST /api/intelligence/analyze | 阶段1 |
| 多站技术采样 | 安全 audit() | POST /api/intelligence/scan | 阶段1 |
| 证据历史/版本 | 无数据库 | 可持久化的资料库/项目 | 待开发 |
| 行业规模/流量/口碑 | 原站不提供 | 仅授权和带溯源数据源 | 待开发 |
| AI 辅助摘要 | 无 | 可选 API + 引用审计 | 待开发 |

## 三、阶段1可用的完整操作步骤
1. 打开 /intelligence，填写行业、研究主体和竞品；竞品格式为“名称 | 官网 | direct/indirect/benchmark”。
2. 点击“真实扫描本站 + 前2家竞品”，只扫描最多3个所选网站公开页面技术状态；若目标无法访问，明确显示失败，不编造完成率。
3. 按证据登记单逐条录入官网服务描述、价格、集成、渠道或访谈内容。手工输入的内容统一归类“待核验”，与程序实测分开。
4. 点击“根据现有证据生成分析”，返回10维可追溯矩阵、完整证据账本、测试优先的行动卡。
5. 导出 Markdown 与 JSON；本阶段没有数据库，务必用户自己保存。无证据格显示“未采集”，绝不显示“不支持”。

## 四、技术契约
- POST /api/intelligence/scan：body {subject,industry,url,competitors:[{name,url,kind}]}。
  - 竞品至少1个、最多2个，每次最多3家网站同时扫描。
  - 复用 normalizeURL + audit()；一个请求占 3 个应用并发额度。与旧接口共享额度/节流。
  - 若个别站点失败，返回已成功站点与明确 failures。
- POST /api/intelligence/analyze：body {subject,industry,companies:[{name,kind}],records:[{company,dimension,claim,sourceUrl,date,origin}]}。
  - 最多16家竞品、200条证据，140000 字符上限。
  - status: measured 仅代表既有 scanner 产出的字段；其他来源统一待核验。
  - 输出 matrix、records、coverage、actions、markdown；无系统级市场规模评分。
- 新页面通过独立 intelligence-page.mjs 加载，不修改旧页面 DOM 操作器。
- Dockerfile 必须包含新增两个模块；index.ts / index.mjs 保持内容完全相同。
- 所有返回均 cache-control no-store；无第三方 JS、CDN、追踪依赖。

## 五、安全与线上发布闸门
1. 所有旧测试通过、IIBD 新测试通过，PR CI 绿色再合并 main。
2. Railway 构建成功、/api/health 可用，旧4模式回归。
3. 新页面脚本可解析，空证据、无来源、重复域名、错误来源链接被正确处理。
4. Cloudflare WAF：/api/intelligence/scan 须纳入现有扫描请求限流；/api/intelligence/analyze 应单独设置有效速率/请求体限制（推荐约每IP每分钟10次，按流量调整），防止恶意请求刷服务器。
5. URL 抓取保持现有公网/DNS/端口/限流限制；新研究模块不引入任意外部代理。
6. 请勿将测试数据当成86DROP真实调查；页面示例是待扫描网址。

## 六、Roadmap（不在当前 PR）
- P1：多批次导入 CSV（使用可靠转义解析）、JSON 反向导入、企业名称去重、可查阅证据 URL 的人工审核状态。
- P1：给每条 Claim 固定 ID、来源抓取快照、内容变化比较、批次归档。
- P2：Railway Postgres + 持久卷/连接、账号权限、项目分组、断点续跑、任务队列。
- P2：服务产品、价格币种/单位/条款归一化，10维矩阵完善；直接竞品 vs 标杆禁止混排价格。
- P2：机会 D/B/G/F 显示证据闸门、投入工时预算、测试/停止条件（含访谈/丢单/复购等内部数据）。
- P3：合规行业统计官方接口、可选 LLM 引用摘要、日报/周报差异提醒。
- P3：报告导出 Word/PDF/PPT（采用独立后端或模板，不在当前 Bun 进程引入重量级 Python GUI）。

## 七、明确不允许的“方便捷径”
- 不要拿 GEO 技术就绪度当作市场份额、SEO流量、AI引用概率。
- 不要拿“网页无证据”判定“该企业没有服务”。
- 不要宣称手工粘贴的价格已经由 AI 实时核验。
- 不要在公网容器内启用未授权网页大规模爬虫或未认证代理。
- 不要在未上数据库/权限前宣称永久保存资料。
