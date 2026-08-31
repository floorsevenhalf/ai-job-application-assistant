# 兼容性测试指南

仅使用匿名编号和重新构造的观察结果。禁止保存账号、含 Token 的 URL、姓名、手机号、邮箱、身份证号、真实学校、地址、Profile 值、含个人信息的截图或复制的专有网页 HTML。

## 人工记录模板

```text
网站编号：SITE-001
网站类别：ATS
页面：基本信息
字段数：12
Scanner 检出：11 / 12
Matcher：9 matched / 1 ambiguous / 1 unmatched
正确：9
Autofill：8 filled / 1 custom select unsupported
失败类型：
- custom_select_unsupported
- scanner_context_incomplete
备注：页面使用了重新构造的自定义搜索式下拉结构。
```

## 操作流程

1. 使用虚构的本地 Profile。
2. 记录数量和稳定的 `FailureCategory` 代码，不记录个人字段值。
3. 将失败案例缩减成最小原创 fixture，并移除品牌和受版权保护的页面内容。
4. 确认 fixture 无法识别具体公司或用户。
5. 提交前运行 `pnpm evaluate`、`pnpm privacy:check` 和测试。

公开仓库中通常应使用 `SITE-NNN` 代替公司名称。不得自动抓取招聘网页。