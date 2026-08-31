# AI Job Application Assistant

> 隐私优先 · 本地优先 · 规则优先 · AI 可选 · 人工参与 · 永不自动提交

AI Job Application Assistant 是一款基于 Chrome Manifest V3 的求职表单辅助扩展，用于减少网申过程中重复填写个人信息的工作。它扫描网页原生表单控件，通过可解释规则将字段映射到浏览器本地保存的个人资料，在用户逐项确认后，仅填写明确选择的字段。

当前项目为 V1.0 候选发布版，面向开源审阅、简历项目展示和安全的本地演示。扩展不会提交申请，也不会自动做出求职决策。

## 项目简介

扩展将 DOM 扫描、语义匹配、安全策略、人工审核与 DOM 写入拆分为可独立测试的模块。个人资料保存在 `chrome.storage.local`；扩展边界之间只传递可序列化的字段描述，DOM 引用始终留在 Content Script 内部。

## 项目动机

求职者需要在不同招聘网站反复填写联系方式和教育信息，而常见自动化工具可能缺乏透明度或操作过于激进。本项目采用更安全的方案：确定性规则优先、保守回退、证据可见、显式确认，并且绝不自动提交。

## 演示

```bash
corepack pnpm dev --host 127.0.0.1
```

打开 `http://127.0.0.1:5173/examples/forms/release-demo.html`，按照 [Demo 录制指南](docs/demo.md) 操作。演示页包含标准字段、歧义字段、已有值字段、协议复选框和提交按钮，所有数据均为虚构数据。

## 核心特性

- Chrome Manifest V3、TypeScript、Vite 与 React
- 使用 Zod 校验并在本地保存 `UserProfile`
- 扫描原生 input、textarea、select、radio 和 checkbox
- 可序列化的 `FieldDescriptor`，包含 label、ARIA、附近文本、选项、分组和 Section Context
- 可解释 Rule Matcher：置信度、Top-3 候选、类型/选项证据与强负向否决
- 仅填写 `matched` 字段，使用原生 setter 并兼容常见 React/Vue 事件监听
- 默认保护网页已有内容
- 延迟二次验证、过期会话拒绝、临时高亮和单会话撤销
- 可选 Hybrid Matcher：Provider 抽象、脱敏预览、超时、缓存与 Safety Gate
- 本地兼容性评估、置信度分桶、消融实验、阈值实验与失败报告
- Playwright 浏览器级测试、隐私扫描与 GitHub Actions 质量门禁

## 系统架构

```text
UserProfile（chrome.storage.local）
              ↓
          DOM Scanner
              ↓
       FieldDescriptor
              ↓
         Rule Matcher
              ↓
    可选 AI Semantic Fallback
              ↓
          Safety Gate
              ↓
          人工审核
              ↓
          安全填充
```

规则匹配是默认主路径。AI 默认关闭，只能查看经过脱敏的字段结构，并且仅处理 Scanner 支持的 `ambiguous`/`unmatched` 字段。AI 不能覆盖强负向否决。详见[架构文档](docs/architecture.md)。

## 工作流程

1. 用户在 Options 页面将个人资料保存到浏览器本地。
2. Popup 请求扫描当前 HTTP(S) 页面。
3. Content Script 提取有边界、可序列化的字段描述，并临时维护 `fieldId → HTMLElement` 引用。
4. Rule Matcher 对支持的 `ProfileFieldPath` 排序并展示证据。
5. 可选 AI 回退只能在用户查看隐私预览并显式操作后运行。
6. Hybrid Safety Gate 校验路径、置信度、候选差距和负向否决。
7. 用户审核并选择字段：规则匹配默认勾选，AI 建议默认不勾选。
8. Autofill 重新校验实时 DOM，默认保留已有值，只写入选中字段，且永不提交。
9. Undo 只恢复填充后未被用户手动修改的值。

## 安装

环境要求：Node.js 22、pnpm 9.15.5。

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

打开 `chrome://extensions`，启用“开发者模式”，点击“加载已解压的扩展程序”，选择生成的 `dist` 目录。

## 使用方法

1. 打开扩展 Options 页面，填写并保存本地个人资料。
2. 保持“AI 语义识别”关闭，即可使用确定性的纯规则路径。
3. 打开普通 HTTP(S) 表单，点击“扫描当前页面”。
4. 检查字段路径、状态、置信度、证据和待填值。
5. 如需 AI，可先查看脱敏预览，再显式运行已注册的 Provider。
6. 取消不希望填写的规则匹配项；AI 建议必须由用户主动勾选。
7. 点击“填充已确认字段”。
8. 人工核对每个值；必要时点击“撤销本次填充”；最终提交由用户自己完成。

## 评估结果

当前兼容性数据集包含 38 个合成、脱敏字段样本，不代表所有招聘网站。

| 指标 | 结果 |
|---|---:|
| Scanner 检出召回率 | 92.1% |
| Rule Matcher 精确率 | 100.0% |
| Rule Matcher 召回率 | 69.7% |
| Rule Matcher F1 | 82.1% |
| 错误匹配率 | 0.0% |

`pnpm evaluate:ai` 使用 **Scripted Fake Provider**，仅用于验证 Hybrid Matcher 的控制流程和报告系统。其结果不代表真实大模型性能，不得用于宣传 AI 效果。详见[评估文档](docs/evaluation.md)。

## 隐私

- Profile 与可选 Provider 凭据仅保存在 `chrome.storage.local`
- 仓库只包含虚构 Profile 和重新构造的测试 fixture
- 不包含遥测、后端数据库、远程同步、账号系统或 Profile 上传
- 语义输入不包含 Profile 值、字段当前值、完整 HTML 或账号数据
- API Key 不会写入日志、报告、fixture 或源码
- `pnpm privacy:check` 会扫描常见个人数据和密钥模式

详见[隐私政策](PRIVACY.md)。

## 安全原则

- **规则优先：** 确定性规则始终是主要匹配路径
- **AI 可选：** 默认关闭，本版本不内置生产级远程 Provider
- **人工参与：** 用户审核每项匹配，并主动接受 AI 建议
- **永不自动提交：** 扩展不会点击或调用最终提交控件
- **负向否决优先：** Safety Gate 前后都会移除被强安全规则否决的路径
- **默认不覆盖：** 除非用户显式允许，否则保留网页已有内容
- **保守失败：** 不支持的控件和不确定结果交给用户手动处理
- **可恢复：** 拒绝过期会话，并可安全撤销成功填充

## 开发

```bash
corepack pnpm dev
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm privacy:check
corepack pnpm evaluate
corepack pnpm evaluate:ai
corepack pnpm exec playwright install chromium
corepack pnpm e2e
```

提交变更前请阅读[贡献指南](CONTRIBUTING.md)。特定网站逻辑应放在 `SiteAdapter` 接口之后，不应侵入 Scanner、Matcher 或 Autofill 核心模块。

## 测试

- Vitest 单元、集成、鲁棒性、评估和性能测试
- 使用解压扩展与受控 React 页面运行的 Playwright 浏览器测试
- 包含 325 个 DOM 控件的大型合成表单 Benchmark
- 隐私模式扫描
- 可复现的 Rule 与 Hybrid 管线评估脚本
- GitHub Actions 执行 lint、typecheck、测试、构建、评估、隐私检查和 Chromium E2E

## 路线图

详见[项目路线图](docs/roadmap.md)。计划方向包括：真实但需用户主动启用的 AI Provider、更大的兼容性数据集、自定义下拉与地区级联 Adapter、更多匿名招聘网站兼容适配，以及 Firefox/Edge 兼容性。

自动提交、批量投递、自动点击申请按钮和绕过人工确认明确不在项目范围内。

## 安全问题

请按照[安全政策](SECURITY.md)私密报告漏洞，不要在报告中包含真实个人资料或有效凭据。

## 开源协议

本项目采用 [MIT License](LICENSE)。