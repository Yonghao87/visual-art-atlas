# 内容入库与每日双版发布

Phase 1 的离线入库接口保留。2026-10-10 起，本机 Codex 每日任务在专用聊天中执行生成、校验、提交与 Pages 发布；不是 GitHub Actions schedule，也不调用付费模型 API。原有 ChatGPT 提醒仍没有接入本站。亲子版按“艺术介绍、具体讲解、局部对应、整体回看、感受表达”组织；新日更必须包含 `children.lesson`，动手活动可省略。双版内容契约和新日更门禁见 [CHILDREN_EDITION.md](CHILDREN_EDITION.md)。

## 数据契约

候选生成器输出一个符合 `src/lib/schema.ts` 的独立 JSON；默认 `status: draft`，`schemaVersion: 1`。文件名必须为 `<id>.json`，日期采用 Asia/Shanghai 日历日。生产发布需要来源 `verifiedAt` 和 `verificationNote`，图片许可与事实来源分别核验。这些字段记录核验过程，程序不能替代人工事实判断。

## 可用的离线入库接口

```bash
npm run import:entry -- /absolute/path/candidate.json --dry-run
npm run import:entry -- /absolute/path/candidate.json
npm run validate:content
```

接口接受草稿，禁止覆盖现有 ID；校验失败不写入。它不调用 AI、不操作 Git、不提交、不发布。手工制作可通过编辑 PR 审阅后发布。自动日更在核验完事实与图像后准备 published 文件，运行独立双版日更门禁与构建测试，再推送 main 触发 Pages；入库脚本本身仍不发布。

后续可实现 `ContentProvider.generate({ date, category, existingIds, sources }) -> Promise<Entry>`，先检索来源，再生成草稿，使用同一校验器入库。凭据仅放环境变量或 Actions Secrets。建议 `REVIEW_MODE=pr`，内容不足保留草稿，幂等按 ID 与日期校验。来源核查失败时不发布。

后续若增加独立 API 内容提供者，还需实现：选题轮换和主题查重、超时与重试、来源证据、图片权利审核、dry-run日志、PR权限最小化、失败告警，以及与已有提醒使用同一份档案的协调。
