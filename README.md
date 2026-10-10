# Visual Art Atlas · 视觉艺术图鉴

一个可以离线构建、按视觉语言检索的静态艺术档案馆。技术为 Astro 7、TypeScript strict、Zod 4、JSON Content Collections 和 GitHub Pages。完整需求见 [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md)。

## 运行

使用 Node.js 24 LTS（最低 22.12，推荐 `nvm use`）。无需 API key。

```bash
npm ci
npm run dev
```

打开 http://localhost:4321/。生产预览：

```bash
npm run build
npm run preview
```

## 已有功能

- 首页：大型搜索、最新档案、七大领域、最新条目与随机探索。
- 探索：中英文关键词 AND 匹配、同义词、领域/主题类型/标签组合筛选、日期排序、空状态、重置、URL恢复与浏览器后退。
- 七份正式档案：浮世绘、印象派、数字绘画技法、包豪斯、现代建筑、罗丹、拉姆斯。每份有两个作品或明确标注的研究实例。
- 成人/亲子双版：塞尚与浮世绘已有 5–7 岁亲子样稿，详情切换、偏好记忆、版本分享、亲子筛选；旧条目继续成人阅读。
- 详情：背景、动态视觉分析、作品参考、风格比较、应用、实验、来源与核验记录、关联推荐、上一篇/下一篇、复制链接。
- 自适应界面、键盘操作、图像失败占位、SEO、分享图、站点地图、自定义404与 `/catalog.json`。
- 草稿隔离、独立文件与跨条目校验、可运行的草稿入库接口。

首批条目于 2026-10-09 集中整理，10-03 至 10-09 是初始阅读顺序，不表示此前已每日上线。正文史实基于来源自行概括，分析和创作建议明确标注为本站内容。图片权利单独核验，缺图保留排版封面与原站链接。来源记录详见 [docs/CONTENT_SOURCES.md](docs/CONTENT_SOURCES.md)。

## 文件结构

```text
.github/workflows/{ci,deploy}.yml
public/images/                         # 本地获准图像与分享图
src/content.config.ts                  # JSON glob loader
src/constants/taxonomy.ts              # 7领域、6类型、特征与同义词
src/data/entries/*.json                 # 一篇一文件
src/lib/{schema,content-validation}.ts  # 单条与跨文件质量门禁
src/lib/{entries,search,paths,visibility}.ts
src/components/{Visual,EntryCard}.astro
src/layouts/BaseLayout.astro
src/pages/{index,explore,about,404}.astro
src/pages/entries/[id].astro
src/pages/catalog.json.ts
src/styles/global.css
src/scripts/explore.ts
scripts/{validate-entries,import-entry}.ts
tests/{content,search}.test.ts
tests/e2e/atlas.spec.ts
```

## 编辑与校验

新增 `src/data/entries/YYYY-MM-DD-slug.json`，字段遵循 `src/lib/schema.ts`。分类 key 固定，标题可更新而 ID 稳定。正式来源必须有 HTTPS URL、出版者、核验日期、核验说明；不能仅以网页可访问判定史实正确。图片必须声明 alt、credit、rights 和来源，CC图片需许可链接，授权图片需授权记录。

双版本的数据与写作模板见 [亲子版规范](docs/CHILDREN_EDITION.md)。新日更使用 `npm run validate:daily -- src/data/entries/YYYY-MM-DD-slug.json` 强制检查两版完整性和上海当天唯一档案；历史数据仍允许缺亲子版。

新增条目按 [日常收录流程](docs/EDITORIAL_WORKFLOW.md) 起草、核验、预览和人工发布，图片依 [图片收录原则](docs/IMAGE_COLLECTION_POLICY.md) 单独处理：按主题和学习价值确定作品清单，再寻找和补充图片。重要对象暂时缺图时保留记录与原站链接，不因缺图更换选题或阻止可靠内容发布；已展示图片必须图文对应并符合使用条件。封面可用明确标注的原创主题视觉。详情页会将缺图作品显示为紧凑档案行，并保留原始来源入口；待补图对象登记在收录流程文档中。

```bash
npm run validate:content
npm run check
npm test
npm run build
npm run test:e2e
npm run test:isolation  # 临时插入草稿/示例并检查生产产物
```

`build` 自动运行内容校验。正文长度建议500–800字，为提示而非阻断。相同日期按 ID 字母升序稳定排序；当前一期编号是站内阅读顺序，会随更早日期的内容补入而变化。

默认 dev 和生产都只显示 published。只有显式 `PUBLIC_DEMO_MODE=true npm run dev`（或build）才显示 sample，带顶部 Demo 提示及卡片标记。draft 永远不生成路由、不进入浏览器索引、随机列表或公开目录；`catalog.json` 即使Demo模式也只含 published。未达到七份正式档案时首页显示筹备提示。请注意：公开 GitHub 源码仓库仍能看到提交的JSON草稿，敏感草稿不应提交公开仓库。

视觉截图：先启动生产预览，再运行 `npm run capture:preview`。如果Astro在Agent环境后台启动预览，可用 `npx astro preview stop` 停止。

E2E 在 macOS 使用已安装的 Chrome；Linux/CI 使用 Playwright Chromium，运行前 `npx playwright install --with-deps chromium`。测试预览生产构建，包含1440px和390px两个项目。

## GitHub Pages 部署

项目已发布到 [Yonghao87/visual-art-atlas](https://github.com/Yonghao87/visual-art-atlas)，线上站点为 [yonghao87.github.io/visual-art-atlas](https://yonghao87.github.io/visual-art-atlas/)。每次推送到 `main` 都会运行检查并自动部署。首次部署所需的 Pages Actions 来源已启用。

仓库根目录就是本项目目录（不是整个“插件”文件夹）。如需检查发布状态，请查看仓库的 [Actions](https://github.com/Yonghao87/visual-art-atlas/actions)。

配置自动从 `GITHUB_REPOSITORY=owner/repo` 计算 `site=https://owner.github.io`、`base=/repo`；若仓库是 `owner.github.io`，base使用 `/`。内部链接、图片、搜索、随机跳转与公开目录共享路径处理函数。工作流采用 [Astro官方部署流程](https://docs.astro.build/en/guides/deploy/github/)，固定Action主版本，构建前检查类型和内容测试。

自定义域名设置 Repository Variables：`SITE_URL=https://your-domain.com`、`BASE_PATH=/`，同时自行配置DNS并添加 `public/CNAME`。SITE_URL 指域名根地址，子路径单独放 BASE_PATH。

本地复现仓库子路径：

```bash
SITE_URL=https://your-domain.com BASE_PATH=/visual-art-atlas npm run build
BASE_PATH=/visual-art-atlas npm run test:e2e
npm run test:isolation  # 临时插入草稿/示例并检查生产产物
BASE_PATH=/visual-art-atlas npm run preview
```

浏览 http://localhost:4321/visual-art-atlas/。如果尚无远程信息，保持本地默认即可；本地canonical指向localhost，部署后会使用真实site。CI使用虚拟域名仅用于验证构建，不会发布。

GitHub Pages 是公开站点，私有源码不自动意味着站点私密。无账号或访问控制。`.env` 不提交，Phase 1 无密钥。

## 下一阶段

[docs/AUTOMATION_INTERFACE.md](docs/AUTOMATION_INTERFACE.md) 描述已可用的草稿导入与未来内容提供者契约。本机 Codex 每日任务已在专用聊天配置，按模板生成双版并检查后提交，不使用付费 API 或 GitHub 模型密钥；运行依赖本机和登录环境。后续可扩展 Pagefind全文索引、跨设备收藏或后台管理。当前搜索仅匹配结构化字段，不搜索全部历史背景。

测试与视觉验收记录见 [docs/VERIFICATION.md](docs/VERIFICATION.md)。
