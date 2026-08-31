# V1.0 发布检查清单

## 功能

- [ ] 发布 Demo 的“扫描 → 规则匹配 → 人工审核 → 安全填充”流程正常
- [ ] 默认保护网页已有值
- [ ] Undo 只恢复未被用户再次修改的自动填充值
- [ ] AI 默认关闭，AI 建议默认不勾选
- [ ] Submit 与协议控件保持不变

## 测试

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm evaluate`
- [ ] `pnpm evaluate:ai`
- [ ] `pnpm e2e`
- [ ] 发布 commit 的 GitHub Actions 通过

## 隐私

- [ ] `pnpm privacy:check`
- [ ] 检查 Git 历史中的个人信息和密钥
- [ ] 示例与 Demo 只包含虚构数据
- [ ] 评估报告不包含 Profile 值
- [ ] 未提交 API Key、Token、私有 URL、账号或 Session 数据

## 文档

- [ ] 检查 README 各章节与链接
- [ ] 检查架构、评估、隐私、安全、贡献指南、更新日志和路线图
- [ ] 明确标注 Fake Provider 指标只验证管线
- [ ] 版本与兼容性限制保持一致

## Demo

- [ ] 使用干净的浏览器 Profile 按照 `docs/demo.md` 操作
- [ ] 录制 30～60 秒 GIF/视频，避免出现私人浏览器界面或数据
- [ ] 确认 Submit count 始终为 0
- [ ] 发布媒体时添加压缩文件和替代文本

## GitHub

- [ ] 创建远程仓库后替换 `OWNER/REPOSITORY` 占位符
- [ ] 添加仓库简介与 Topics
- [ ] 启用 Private Vulnerability Reporting
- [ ] 保护默认分支并要求 CI
- [ ] 检查 Dependabot 与权限设置
- [ ] 确认按设计忽略 `dist`、本地 Profile、含私密数据的报告和测试产物

## Release Tag

- [ ] 提交经过审核的 RC 文件树
- [ ] 确认工作区干净
- [ ] 创建签名或附注 tag `v1.0.0-rc.1`
- [ ] 推送 commit 与 tag
- [ ] 确认远程 CI
- [ ] 根据 `CHANGELOG.md` 发布 Release Notes
- [ ] RC 反馈解决前不要创建 `v1.0.0` tag