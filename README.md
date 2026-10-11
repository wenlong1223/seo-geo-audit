# SEO / GEO Audit

> 免费、开源的中文网站技术 SEO 与 GEO 就绪度诊断工具。  
> **在线体验：** https://seo-geo-audit-web-production.up.railway.app/

[![Tests](https://github.com/wenlong1223/seo-geo-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/wenlong1223/seo-geo-audit/actions/workflows/ci.yml)

## 功能

输入公开网站 URL 后，服务端检查：

- **Technical SEO：** 标题、描述、H1、规范链接、viewport、语言、图片 ALT、内部链接、索引指令及 Open Graph；
- **抓取基础：** `robots.txt` 和 Sitemap 可访问性；
- **GEO 技术就绪度：** Schema.org / JSON-LD 解析、企业实体类型、`sameAs` 等结构化实体信号；
- **诊断报告：** 各项问题、修复建议、启发式评分，以及 JSON 报告导出。

**注意：** GEO 分数只代表结构化信息与技术就绪度，**不代表** Google 收录、SEO 排名、AI 平台真实引用率或任何商业效果保证。当前版本不运行 JS 渲染器，也不执行深度全站爬取。

## 立即体验

**在线网页：** https://seo-geo-audit-web-production.up.railway.app/

**健康检测：** https://seo-geo-audit-web-production.up.railway.app/api/health

**API：**

```bash
curl -X POST "https://seo-geo-audit-web-production.up.railway.app/api/audit" \
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
4. 原线上地址持续使用：https://seo-geo-audit-web-production.up.railway.app/

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
- `test.mjs`：本地功能和安全回归断言
- `.github/workflows/ci.yml`：每次推送自动运行测试

**作者：** [wenlong1223](https://github.com/wenlong1223)  
**许可证：** MIT

