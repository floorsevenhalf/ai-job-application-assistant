# 系统架构

## 数据流

```text
UserProfile（仅本地）
        ↓ 仅在用户确认后解析值
DOM Scanner ── 临时 fieldId → HTMLElement 映射保留在 Content Script
        ↓
FieldDescriptor（可序列化，不含 DOM 引用）
        ↓
Rule Matcher（主要路径、确定性、可解释）
        ↓ 仅 ambiguous/unmatched
可选 AI Semantic Fallback（仅脱敏结构）
        ↓
Hybrid Safety Gate（合法路径、置信度、候选差距、负向否决）
        ↓
人工审核（AI 建议默认不勾选）
        ↓
安全填充（重新校验实时 DOM、默认不覆盖、永不提交）
```

## 各层职责

### UserProfile 与存储

`UserProfile` 使用 Zod 校验并保存在 `chrome.storage.local`。包括最高学历逻辑路径在内的资料解析统一由 Profile Resolver 负责。Profile 值永远不会进入 Scanner 描述、兼容性报告、`SemanticMatchInput`、缓存键或遥测——项目没有遥测。

### DOM Scanner

Content Script 扫描受支持的原生控件，提取长度受限的 label、ARIA 文本、属性、局部上下文、选项、分组身份、可见性与安全状态，并排除危险或不支持的输入。扫描会话 Map 保存实时 DOM 元素，Descriptor 始终是普通可序列化对象。

### Rule Matcher

Rule Matcher 使用集中配置的来源权重、类型证据、选项证据与负向证据，对全部受支持的 `ProfileFieldPath` 排序。强负向否决可阻止将推荐人联系方式映射为求职者本人资料等危险行为。现有规则行为是默认生产路径。

### 可选语义回退

Semantic Matcher 是与 Provider 无关的接口。它默认关闭，仅处理 Scanner 支持的 ambiguous 或 unmatched 字段，接收脱敏 Descriptor 而不是 Profile 值。仓库只包含用于测试的 Fake Provider，不包含生产级远程 Provider。

### Hybrid Safety Gate

Safety Gate 校验结构化输出、合法路径、初始阈值 0.90、Top-1 候选差距 0.15 和规则否决。Provider 错误、畸形输出、超时或配置缺失时返回原始 Rule 结果。AI confidence 只是评分，不是经过校准的概率。

### 人工审核

规则匹配默认选中；AI 匹配带有明显标识并默认不选中，只有用户主动接受后才能填写。运行 AI 回退前会展示隐私预览。

### 安全填充

Autofill 只在审核后解析 Profile 值，重新检查当前 DOM，拒绝过期扫描会话，默认保留已有值，使用原生 setter 和冒泡事件，执行两次写入验证，并支持有条件 Undo。它永远不会点击或调用提交控件。

## 扩展边界

- Popup：编排、审核、选择和本地状态展示
- Options：本地 Profile 与可选 Provider 设置
- Content Script：DOM 所有权、扫描会话、填充、Undo 与 Mutation 失效
- Core：与框架无关的 Scanner、Matcher、语义契约、安全、评估和 Autofill
- Site Adapter：未来的隔离兼容钩子；当前不内置真实网站 Adapter

## 信任边界

1. 网页 DOM 不可信，扫描后仍可能变化。
2. Provider 输出不可信，必须通过严格解析与 Safety Gate。
3. User Profile 属于敏感信息，只会在用户确认写入 DOM 时使用。
4. 评估 fixture 和报告是公开产物，必须始终脱敏。
5. 提交行为永远不由扩展控制。