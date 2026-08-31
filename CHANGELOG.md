# 更新日志

所有重要变更都记录在此。项目遵循 Keep a Changelog 原则，并计划在 V1.0 后采用语义化版本。

## [1.0.0-rc.1] - 2026-08-31

### 新增

- 使用 React Popup 与 Options 页面的 Manifest V3 Chrome 扩展
- 经过 Zod 校验的本地 `UserProfile` 存储
- 具有边界上下文和稳定分组身份的可序列化 DOM Scanner
- 支持置信度、证据、负向否决和 Section Context 的可解释 Rule Matcher
- 面向原生文本、Select、日期和 Radio 控件的安全 matched-only Autofill
- 已有值保护、延迟验证、会话失效、临时高亮和 Undo
- 与 Provider 无关的可选 Semantic Matcher 和 Hybrid Safety Gate
- 隐私预览、本地 AI 设置、内存缓存、超时与 Fake Provider 测试
- 兼容性 fixture、评估 Runner、置信度分桶、消融与阈值报告
- Playwright 扩展 E2E、隐私检查、GitHub Actions、公开治理文档与发布 Demo

### 安全

- 永不自动提交
- AI 默认关闭，AI 建议默认不勾选
- 不内置生产级远程 AI Provider
- 不包含遥测、后端或 Profile 上传

### 已知限制

- 当前仅支持原生控件；自定义 Select、级联选择器、iframe、Shadow DOM 和 contenteditable 需要未来 Adapter
- 兼容性数据集规模有限且为合成数据
- Fake Provider 指标只验证管线行为，不代表真实大模型质量