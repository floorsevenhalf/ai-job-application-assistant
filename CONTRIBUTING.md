# 贡献指南

感谢你帮助改进 AI Job Application Assistant。所有贡献都应保持隐私优先、本地优先、规则优先和人工参与的设计。

## 环境准备

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
```

## 提交 Pull Request 前

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm privacy:check
corepack pnpm evaluate
corepack pnpm evaluate:ai
corepack pnpm e2e
```

## Pull Request 要求

- 说明问题、安全影响和测试方式。
- 保持 Scanner、Matcher、Semantic Matcher、Autofill 与网站特定逻辑相互独立。
- 网站兼容逻辑必须放在 `SiteAdapter` 接口之后。
- 使用最小化、重新构造的 fixture，不要复制真实网站页面。
- 不要提交真实 Profile、账号、截图、Cookie、Token、API Key 或私有 URL。
- 相比漏匹配，应将错误自动填写视为更高风险。
- 未经明确安全讨论，不得削弱负向否决、人工审核、已有值保护或禁止提交边界。
- 评估输入或算法发生变化时，应重新生成报告。

## 贡献范围

欢迎测试、无障碍、文档、安全字段规则、兼容性 fixture、不支持控件的 Adapter 和浏览器兼容性改进。

自动提交、批量投递、自动点击申请按钮、绕过用户同意和规避招聘网站安全机制不在项目范围内。

## Commit 与发布规范

保持提交内容聚焦，不提交本地产物。面向用户的变更应更新 `CHANGELOG.md`。维护者创建 tag 前应完成[发布检查清单](docs/release-checklist.md)。