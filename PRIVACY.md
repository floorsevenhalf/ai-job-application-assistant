# 隐私政策与数据处理

AI Job Application Assistant 是一款本地优先的浏览器扩展。

## 本地存储内容

- 用户在 Options 页面填写的 `UserProfile`
- 可选的 AI 开关、Provider ID 与 API Key 设置
- 上述数据均由 Chrome 保存在 `chrome.storage.local`

项目不提供浏览器同步、后端数据库、遥测或用户账号。

## DOM 处理

只有用户主动发起扫描后，Content Script 才会读取当前页面中受支持的表单控件。实时 DOM 引用仅保留在 Content Script 扫描会话中，不会被序列化。字段描述只包含长度受限的结构文本，不包含完整页面 HTML。

## 可选语义回退

AI 默认关闭，仓库不内置生产级远程 Provider。未来由用户安装的 Provider 只能在用户明确确认后接收界面所展示的 `SemanticMatchInput`。该输入不包含 `UserProfile` 值或字段当前值，Rule Matcher 的负向否决和 Hybrid Safety Gate 始终有效。

可选 API Key 仅保存在本地，在 Options 页面中隐藏，并从日志、fixture、报告和源码中排除。

## 公开仓库数据

示例、测试、评估 fixture 和报告只能包含虚构或脱敏数据。贡献者必须运行：

```bash
corepack pnpm privacy:check
```

该检查是纵深防御的模式扫描器，不能保证任意数据天然安全，仍然需要人工审核。

## 永不收集

项目没有在服务器上收集分析数据、申请提交、简历、招聘账号、浏览历史或 Profile 值的机制。

## 用户控制

用户可以通过扩展设置或卸载扩展来编辑、删除本地 Profile 与 AI 设置。Autofill 永不提交表单；在当前 Content Script 会话中，成功写入的值可以有条件撤销。