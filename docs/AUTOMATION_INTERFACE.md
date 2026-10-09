# Phase 2 接口预留（未启用）

Phase 1 不包含付费 API 调用、schedule 工作流、自动提交或每日发布。现有 ChatGPT 提醒没有接入本站。

## 数据契约

候选生成器输出一个符合 `src/lib/schema.ts` 的独立 JSON；默认 `status: draft`，`schemaVersion: 1`。文件名必须为 `<id>.json`，日期采用 Asia/Shanghai 日历日。生产发布需要来源 `verifiedAt` 和 `verificationNote`，图片许可与事实来源分别核验。这些字段记录核验过程，程序不能替代人工事实判断。

## 可用的离线入库接口

```bash
npm run import:entry -- /absolute/path/candidate.json --dry-run
npm run import:entry -- /absolute/path/candidate.json
npm run validate:content
```

接口接受草稿，禁止覆盖现有 ID；校验失败不写入。它不调用 AI、不操作 Git、不提交、不发布。草稿通过编辑 PR 人工审核后改为 published，再由部署工作流构建。

后续可实现 `ContentProvider.generate({ date, category, existingIds, sources }) -> Promise<Entry>`，先检索来源，再生成草稿，使用同一校验器入库。凭据仅放环境变量或 Actions Secrets。建议 `REVIEW_MODE=pr`，内容不足保留草稿，幂等按 ID 与日期校验。来源核查失败时不发布。

正式增加自动化前还需实现：选题轮换和主题查重、超时与重试、来源证据、图片权利审核、dry-run日志、PR权限最小化、失败告警，以及与已有提醒使用同一份档案的协调。
