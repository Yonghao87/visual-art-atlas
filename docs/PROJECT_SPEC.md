# Visual Art Atlas｜视觉艺术图鉴

**Codex 项目开发说明书 / Product + Technical Specification**  
版本：**v1.0** ｜ 编写日期：2026-10-09 ｜ 状态：**待开发（本文是规范，不是已完成的网站）**  
技术路线：**GitHub + JSON + Astro + GitHub Actions + GitHub Pages**  
产品语言：**简体中文优先** ｜ 预期使用方式：桌面端深度阅读，移动端日常浏览

> **交付目标**：先建立一个可实际浏览、搜索、分类、打开详情的高品质静态艺术知识库；再建立经过校验的“每日新增一条 JSON → 网站自动重新构建”的内容流水线。不要在第一阶段接入复杂数据库、账号系统或昂贵的 AI 服务。

---

## 0. 给 Codex 的执行总则（必读）

1. 本文为唯一主需求文档。先阅读完整文档，再实现，避免只做一个展示用的首页。
2. **优先完成 Phase 1 可运行 MVP**。Phase 2 的 AI 自动生成与定时入库设计好接口，但没有密钥时**不应**虚构已接通，不要使其成为本地运行前置条件。
3. 使用稳定、维护活跃的技术版本，锁定依赖，推荐 Node.js **22.12+ LTS 兼容版本**；如果官方版本约束更新，遵循当前官方要求。
4. TypeScript 开启严格类型检查，核心内容使用 Zod 校验。**每篇文章独立保存一个 JSON 文件**，不使用一个无限增大的 `data.json`。
5. 不为了“看起来好看”捏造艺术作品名称、艺术家归属、外部图片 URL、引文或作品年代。示例数据如无法核验，标注 `sample`，不能冒充正式条目。
6. 视觉优先：这是**艺术图鉴**，不是通用管理后台，也不是传统长文章博客。确保图片、留白、字体、卡片密度、阅读节奏和移动布局有设计感。
7. 建立本地开发、内容校验、构建、GitHub Pages 发布的文档与脚本。没有 GitHub 仓库信息、密钥或用户授权时，**不要自行创建远程仓库、提交远程或申请凭据**。
8. 每个阶段完成时，给出实际文件清单、命令、测试结果、未完成项目，不要只声称“已实现”。

---

## 1. 项目背景与定位

### 1.1 一句话定义

**Visual Art Atlas 是一座每日增长的个人视觉艺术与设计知识库，以图片为入口，将艺术风格、创作者、作品和设计语言组织成可搜索、可比较、可关联的长期资料。**

### 1.2 背景

用户希望每天中午 12:00 认识一个不同的视觉艺术/设计主题。探索对象包括古典油画、国画、浮世绘、新中式插画、数字绘画（黄光剑、WLOP 等）、平面设计、雕塑、建筑、服装、产品设计等，并长期扩展到摄影、影视美术、动画、字体、舞台等。每日内容原计划约 500–800 字，涵盖视觉语言拆解、代表人物/作品、风格差异和现代创作启发。

现已有一个**独立的 ChatGPT 每日 12:00 推送任务**。它仅负责消息推送；**不能假定它直接写入 GitHub**。本站后续自动入库需要另建真正可执行的流水线，两者在 Phase 2/3 再决定如何联动，以免每天生成两套不同内容。

### 1.3 产品目标

- **发现**：每天打开都能看到一个新的、有代表性的视觉主题。
- **理解**：不止记住名字，而是识别构图、色彩、光影、材料、笔触、版式等特征。
- **检索**：既能找“巴洛克”，也能找“戏剧性逆光 / 大面积留白 / 装饰曲线”。
- **关联**：从艺术运动走向代表艺术家、作品、相似/对照风格、现代设计应用。
- **积累**：长期达到 30、100、365+ 个条目后仍可维护、去重和迁移数据。

### 1.4 核心原则

1. **广泛探索**：七大方向大致轮换，不被用户当前常做的国风或游戏原画限制。
2. **视觉主导**：作品图/可靠图源、风格特征和实例优先于冗长背景史。
3. **事实可追溯**：艺术史与作品事实带参考来源；个人分析标注为分析。
4. **内容即数据**：JSON 是唯一真实内容源（Single Source of Truth）。网页是它的一种展现方式。
5. **逐步扩张**：初期不做数据库、登录或后台 CMS，未来需要时可以迁移。

---

## 2. 内容体系和分类规则

### 2.1 七个一级领域（`category`）

| key | 界面名称 | 示例 |
|---|---|---|
| `world_painting` | 世界绘画 | 文艺复兴、巴洛克、印象派、超现实主义 |
| `eastern_art` | 东方艺术 | 工笔、没骨、青绿山水、浮世绘、琳派、新中式 |
| `digital_art` | 数字绘画 | 游戏原画、概念艺术、黄光剑、WLOP、Craig Mullins |
| `graphic_design` | 平面设计 | 瑞士主义、包豪斯、构成主义、字体与海报 |
| `architecture` | 建筑空间 | 现代主义、粗野主义、安藤忠雄、解构主义 |
| `fashion_craft` | 服装雕塑工艺 | 三宅一生、古典雕塑、陶瓷、纺织、装置 |
| `product_design` | 产品与跨界 | 迪特·拉姆斯、孟菲斯、北欧家居、CMF |

未来摄影、电影美术等内容优先通过 `tags` 和 `topicType` 表示；当数量足够多时才增加一级类别，避免过早过度分类。分类 key 一旦投入使用不得随意重命名，变更必须提供迁移脚本。

### 2.2 主题实体类型（`topicType`）

**一级类别 != 主题类型。** 每一篇每日内容必须具有一个明确的主要研究对象：

- `movement`：艺术流派、艺术运动 / 风格，如巴洛克、包豪斯。
- `artist`：艺术家、插画家、设计师及其个人视觉语言，如 WLOP。
- `artwork`：具体作品或作品系列。
- `technique`：技法、材料、表现语言，如明暗对照、没骨法。
- `design_method`：设计方法或美学体系，如网格设计、侘寂。
- `cross_disciplinary`：跨界主题，如浮世绘对欧洲平面艺术的影响。

**规则**：不要把个人创作语言误叫作“独立艺术流派”。人物、作品、流派初期允许以轻量引用字段关联，未来再拆成独立实体库。

### 2.3 搜索/过滤标签

允许多维标签，后续可以新增而不变更分类：

- **视觉特征**：`高反差`、`柔和漫射光`、`对角线构图`、`对称`、`装饰性曲线`、`留白`、`厚涂`、`几何造型`。
- **情绪氛围**：`神秘`、`浪漫`、`庄严`、`超现实`、`日常生活感`。
- **材料/媒介**：`油画`、`水墨`、`版画`、`数字绘画`、`丝绸`、`混凝土`。
- **应用领域**：`角色KV`、`品牌海报`、`字体`、`产品造型`、`空间设计`。
- **地区/时代**：单独有 `regions` 和 `period` 字段，避免仅依赖自由标签。

可维护同义词映射，如 `明暗对照` / `chiaroscuro`、`浮世绘` / `ukiyo-e`。MVP 只需少量常用映射。

---

## 3. MVP 功能范围与优先级

### Phase 1 — P0：可用的艺术图鉴网站（必须实现）

1. **首页**：品牌名、简短宣言、大型搜索入口、七大类别快捷筛选、最新一期突出展示、最新条目网格、随机探索入口。
2. **探索页 `/explore/`**：卡片瀑布/响应式网格；按类别、主题类型、标签过滤；按日期新→旧 / 旧→新排序；能重置筛选；空状态明确。
3. **档案详情 `/entries/[id]/`**：题目、摘要、日期、类别、主题类型、标签、视觉语言、正文、作品参考、相似风格比较、现代应用、创作实验、关联条目、来源。
4. **基础搜索**：从标题、摘要、人物、作品、标签、特征词中搜中文与英文，支持关键词组合；不需要后端和 AI 语义搜索。
5. **响应式设计**：桌面、平板、手机；完整键盘操作；图像加载失败有占位设计。
6. **内容 Schema 校验**：本地脚本验证所有 JSON，阻止无效正式条目进入构建；草稿不发布。
7. **GitHub Pages 部署**：push 到 `main` 后由 GitHub Actions 自动 build/deploy；提供清晰设置说明。
8. **初始数据**：至少 7 个覆盖七大类别的可浏览条目。能查到可信来源的内容可在核验后标记为 `published`；未经核验的条目只能标为 `sample` 并在开发预览中醒目标注。**公开上线时至少应有 7 条合规 `published` 内容；否则上线应显示明确的待发布状态，而不是把示例伪装成正式内容。**
9. **基本 SEO / 可访问性**：正确 title/description、分享图回退、图片 alt、语义结构、无障碍焦点、站点地图。
10. **一个统一的数据导出入口**：构建时生成静态 `/catalog.json`（公开条目精简索引），为将来的其他客户端预留。

### Phase 1.5 — P1：优先增强（P0 通过后）

- 上一篇 / 下一篇，以及基于标签交集的相关推荐。
- 阅读进度或“每日第 N 期”的视觉呈现。
- 本地收藏（`localStorage`，**明确只保存在当前浏览器**，无跨设备同步）。
- 支持“复制当前档案链接”和“随机探索”。
- 全文搜索：当基本搜索不够用时引入 Pagefind 静态索引。

### Phase 2 — 自动内容生产与发布（独立里程碑）

- 每天生成**一份** JSON，查重、核验来源、数据校验，成功后入库并触发站点发布。
- 有 `workflow_dispatch` 手动运行入口；支持 `dry-run`、失败告警及可追踪日志。
- 可配置 `REVIEW_MODE=pr`（创建 PR 等待人工审核）或 `auto`（仅在所有质量门禁通过时自动提交）。
- 生成任务不得依赖网页浏览器保持打开，也不得假定现有 ChatGPT 定时任务已接通 GitHub。

### Phase 3 — 长期演进（暂不实现）

艺术家/作品独立数据库、跨期知识图谱、笔记云同步、图片相似搜索、AI 语义检索、对照视图、个人创作实验历史、后台编辑器、多语言等。

### 明确不做（Phase 1）

用户登录、评论系统、付费系统、实时服务端渲染、复杂 Supabase 后端、批量自动抓取未经授权图片、向公众开放内容投稿。

---

## 4. 信息架构与页面设计

### 4.1 路由建议

| 路由 | 用途 |
|---|---|
| `/` | 首页：今日推荐 + 分类入口 + 最新档案 |
| `/explore/` | 搜索 / 筛选 / 排序浏览 |
| `/entries/[id]/` | 单条艺术档案详情；静态预渲染 |
| `/about/` | 项目介绍、内容方法与版权说明 |
| `/catalog.json` | 导出已发布档案的精简 JSON 索引 |
| `/404` | 自定义无结果/错误页面（视部署支持） |

探索页筛选状态可写入 URL 查询参数（如 `?category=eastern_art&q=留白`），保证刷新、分享后可以恢复。若完全静态部署，客户端根据 `URLSearchParams` 渲染过滤结果。

### 4.2 首页层级（从上到下）

```text
顶栏：Visual Art Atlas   探索  分类  关于    [搜索]
────────────────────────────────────
Hero：每天认识一种新的视觉语言。
       探索绘画、设计、建筑与创作之间的关联。
       [输入艺术家 / 风格 / 视觉特征……]
────────────────────────────────────
今日档案 Spotlight：大图 + 期号 + 标题 + 核心观点
────────────────────────────────────
七大领域：7个视觉入口（图/文字混合）
────────────────────────────────────
最新档案：响应式卡片网格
────────────────────────────────────
随机探索 / 关于项目 / 数据来源说明
```

### 4.3 探索页

- 顶部：搜索框 + 简洁的结果数量 + 筛选项。
- 类别做横向可滚动 tabs/chips；类型与排序使用轻量下拉。
- 卡片优先呈现大面积视觉图，卡片下方展示标题、类别、3 个以内特征标签及日期。
- 默认按发布日期倒序。
- 手机至少可以轻松点击，筛选面板不遮挡内容，切换时结果可见。
- 过滤无结果时显示清空按钮和建议关键词。

### 4.4 详情页

推荐结构：

1. 头图（只使用有许可/可明确引用的图片；缺图使用高级排版占位），标题、摘要、分类、日期。
2. “一句话认识”及背景/语境。
3. **视觉语言分析**：按构图、光影、色彩、造型、笔触、材料、空间、排版等维度动态渲染，**不要把所有维度固定展示为空栏**。
4. **代表作品**：2–4 件，提供作品名、创作者、年代（若已核验）、图片或占位以及可靠的原始来源链接。
5. **风格比较**：与一项易混淆或有关联的风格解释差异。
6. **设计转化**：插画、KV、品牌、产品、空间等具体应用启发。
7. **今日创作实验**：可选，简短，不要求每日必须用 AI 生成图片。
8. **继续探索**：相关推荐 2–4 项；参考来源链接列表。
9. 底部上一期 / 下一期（若存在）。

正文要具备舒适行宽（例如 68–76ch 的上限）、清晰的引文/标题层级、适度作品图留白。

---

## 5. 视觉设计方向

**定位：现代编辑设计感的艺术档案馆（Editorial Art Archive）**，而不是科技感很重的 Dashboard。

- 主基调：温润纸白 / 偏暖象牙白；深炭黑字；配一款克制的蓝灰或深靛青色。可以选择深色模式，但 P0 不强制。
- 氛围：博物馆展签、艺术图录、当代独立艺术杂志的融合；视觉系统干净、留白充足。
- 字体：中文优先系统可用、易读字体；英文标题可用优雅衬线或克制无衬线。**不得打包并外发未经授权字体文件**。
- 组件：统一图片比例策略、标题层级、日期/标签样式、圆角/边框、交互动效，避免色块泛滥。
- 栅格：移动单列，平板 2 列，桌面可按宽度 3–4 列；确保中文标题长度不破坏布局。
- 图片：真实作品纵横比差异很大，卡片可以统一裁剪比，但详情页展示应避免破坏原图构图，配 `object-fit: contain` / 原图浏览入口。
- 缺少合法图片时：使用类别主题色 + 标题字排的封面占位，不用随机抓来的网络图片。
- 动效：少量 hover/fade；尊重 `prefers-reduced-motion`。
- 目标：390px 和 1440px 宽度下都要精心检查。不要用“移动端缩小桌面版”糊弄。

建议设计 Token（可微调）：

```css
:root {
  --color-paper: #f7f5ef;
  --color-surface: #fffdf8;
  --color-ink: #242725;
  --color-muted: #696d69;
  --color-line: #dcded7;
  --color-accent: #45576b;
  --radius-card: 14px;
  --content-width: 1200px;
  --reading-width: 760px;
}
```

**设计验收重点**：视觉体验应像一个值得收藏、反复翻看的图鉴，而不是一堆自动生成的文章卡片。

---

## 6. JSON 内容模型（最重要的技术规范）

### 6.1 存储原则

- 每篇单独文件：`src/data/entries/YYYY-MM-DD-short-slug.json`。
- 文件名 stem、JSON 内的 `id`、Astro Collection 条目 id **必须保持一致**。
- `id` 一经发布原则上不更改；标题可更新。
- 日期 `date` 用 **`YYYY-MM-DD`，按 `Asia/Shanghai` 的日历日**，不是 UTC 日期。
- 所有对外链接使用 `https://`（必要时 `http` 需例外白名单），不得使用伪造/示意站点地址当成正式资源。
- `status`：`sample | draft | published`。生产环境仅展示 `published`；示例可以在开发环境展示并带明显标识。
- `schemaVersion` 必须提供，用于将来迁移。
- 可空字段明确为 `null`，没有内容时使用 `[]`，禁止使用空链接或 `"TBD"` 冒充有效内容。

### 6.2 字段表

| 字段 | 类型 | 含义 |
|---|---|---|
| `schemaVersion` | number | 初始为 1 |
| `id` | string | 唯一 id；等于文件名去扩展名 |
| `date` | string | 发布日期 YYYY-MM-DD |
| `status` | enum | `sample/draft/published` |
| `title` / `subtitle` | string | 主标题 / 副标题 |
| `topicType` / `category` | enum | 内容类型 / 七大一级分类 |
| `period` | string/null | 时期或年代（不明确可缺） |
| `regions` / `tags` | string[] | 地域 / 可检索多维标签 |
| `summary` | string | 一句话认识，建议 ≤120 汉字 |
| `visualFeatures` | object[] | 视觉特征分项，包含 `key/label/description` |
| `context` | string | 历史背景 / 创作语境，可多段 |
| `people` | object[] | 创作者名字 + 角色/相关性说明 |
| `works` | object[] | 作品标题、创作者、年代、可靠来源、图片元信息 |
| `comparison` | object/null | 对照风格名和差别描述 |
| `applications` | string[] | 可迁移到当代创作的方法 |
| `experiment` | string/null | 今日可选创作实验 |
| `nextTopics` | string[] | 值得继续探索的主题名称 |
| `relatedIds` | string[] | 关联站内档案 id，允许为空 |
| `cover` | object/null | 图片路径/来源/alt/版权状态 |
| `sources` | object[] | 参考来源，至少 title/url/publisher |
| `updatedAt` | string/null | 可选 ISO 日期时间，内容修改时间 |

`visualFeatures.key` 建议枚举：`composition`、`lighting`、`color`、`form`、`linework`、`texture`、`material`、`space`、`typography`、`other`。同一主题只需有实际价值的 3–6 个维度。

### 6.3 可解析 JSON 示例

**注意：这是 `sample` 结构测试数据，不代表已对来源进行核验；不得自动改为 `published`。**

```json
{
  "schemaVersion": 1,
  "id": "2026-10-10-baroque",
  "date": "2026-10-10",
  "status": "sample",
  "title": "巴洛克绘画：让光线成为叙事",
  "subtitle": "从卡拉瓦乔的明暗对照理解戏剧性构图",
  "topicType": "movement",
  "category": "world_painting",
  "period": "17世纪",
  "regions": ["欧洲"],
  "tags": ["巴洛克", "明暗对照", "高反差", "戏剧性", "动态构图"],
  "summary": "通过强烈的明暗对照与人物动作关系，让画面充满紧张感和叙事力量。",
  "visualFeatures": [
    {
      "key": "lighting",
      "label": "戏剧性聚光",
      "description": "明亮人物从大面积深色环境中浮现，视线被精准引导。"
    },
    {
      "key": "composition",
      "label": "倾斜的动作关系",
      "description": "对角线、身体转折和手势构成富有张力的叙事瞬间。"
    },
    {
      "key": "color",
      "label": "沉稳底色与局部暖色",
      "description": "有限但集中使用亮部与暖色，强化主次。"
    }
  ],
  "context": "本例仅用于解释资料结构。正式发布时应补充经核验的历史语境、作品分析与准确出处。",
  "people": [
    { "name": "卡拉瓦乔", "role": "代表画家" },
    { "name": "彼得·保罗·鲁本斯", "role": "代表画家" }
  ],
  "works": [
    {
      "title": "圣马太蒙召",
      "creator": "卡拉瓦乔",
      "year": null,
      "sourceUrl": null,
      "image": null
    }
  ],
  "comparison": {
    "target": "文艺复兴盛期绘画",
    "description": "前者更强调突出的动作瞬间、戏剧性照明和紧张情绪。"
  },
  "applications": [
    "在人物 KV 中用单一主光源组织视觉焦点",
    "减少背景信息，让姿势、光线和手势构成叙事"
  ],
  "experiment": "尝试用一束斜向聚光和三个人物姿势，构成一张无文字戏剧海报。",
  "nextTopics": ["卡拉瓦乔", "明暗对照技法", "伦勃朗式用光"],
  "relatedIds": [],
  "cover": null,
  "sources": [],
  "updatedAt": null
}
```

### 6.4 图片与来源对象约定

正式 `work.image` 或 `cover` 应至少包含：

```json
{
  "src": "/images/example.webp",
  "alt": "对画面内容的客观描述",
  "credit": "创作者／收藏机构",
  "rights": "public_domain",
  "sourceUrl": "https://example.org/official-artwork-page"
}
```

此段只说明**字段结构**，`example.org` 是占位 URL，不能作为正式来源或下载地址写入项目正式内容。

`rights` 取值建议：`public_domain`、`cc_licensed`、`permission_granted`、`own_work`、`link_only`、`unknown`。只有经过明确确认的 `public_domain`、许可条件满足的 `cc_licensed`、`permission_granted`、`own_work` 才可下载到本地当站点资源。`link_only`、`unknown` **只展示来源链接/文字占位，不自动下载或热链嵌入**。

可选 `image.src` 如果是本地路径应从站点 base path 正确解析；外部地址必须明确允许嵌入，不能因 URL 能访问就默认具有使用权。

### 6.5 发布质量门禁

对于 `published` 条目，程序至少检查：

- `id/date` 合法，日期与文件名一致，id 不重复。
- `title`、`summary`、`context`、`visualFeatures`、`applications` 不空。
- 一级分类、主题类型、特征 key 属于已定义字典。
- `sources` 至少 1 个**已人工或可信检索流程核验的来源**，不能仅因 URL 返回 200 就认定史实正确。
- 引用的 `relatedIds` 必须存在（或在正式内容中去掉未发布引用）；不得引用自身。
- 图片如果有 `src`，`alt` 与 `rights` 必填，且版权状态支持展示。
- 敏感的未授权图/过长原文摘录不能直接收录；尽量用自行概括的文字。
- 每期中文主体约 500–800 字是**内容提示/告警**而非刚性校验，因为作品型或产品型专题可能长短不同。
- 对于网络故障、来源无法核验或 AI 结果不可靠的情况：**保留草稿，终止自动发布，不要生成假来源来凑齐字段**。

---

## 7. 技术架构与代码组织

### 7.1 技术栈

- **Astro**：静态站点、页面路由、内容集合，构建期输出 HTML。
- **TypeScript（strict）**：页面数据和工具脚本。
- **Zod**：内容格式与跨记录完整性校验。
- **CSS**：可用原生 CSS + tokens，不强制引入沉重组件库。确需工具类 CSS 可选 Tailwind，但应保持风格一致。
- **少量客户端 JavaScript**：搜索、过滤、收藏与交互。尽量不要将整个站点做成单页 React App。
- **GitHub**：内容与源码版本管理。
- **GitHub Actions**：CI、部署，Phase 2 定时生成。
- **GitHub Pages**：Phase 1 静态托管。部署到 `https://<user>.github.io/<repo>/` 时正确设置 `site` / `base`，防止图片、字体与内链 404。

官方参考：

- Astro Content Collections：https://docs.astro.build/en/guides/content-collections/
- Astro GitHub Pages：https://docs.astro.build/en/guides/deploy/github/
- GitHub Actions schedule：https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Pagefind（需要全文检索时再引入）：https://pagefind.app/docs/

### 7.2 推荐目录结构

```text
visual-art-atlas/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── daily-entry.yml            # Phase 2，先不要求运行
├── docs/
│   └── PROJECT_SPEC.md               # 本文
├── public/
│   └── images/                       # 仅存有权使用的图片
├── src/
│   ├── content.config.ts             # Astro glob JSON loader + Zod schema
│   ├── data/
│   │   └── entries/
│   │       ├── 2026-10-10-baroque.json
│   │       └── ...
│   ├── constants/
│   │   └── taxonomy.ts               # 分类字典、主题类型、特征 key、同义词
│   ├── lib/
│   │   ├── entries.ts                # 已发布过滤、排序、相关推荐
│   │   ├── search.ts                 # 简单客户端搜索索引/匹配
│   │   └── paths.ts                  # 站点 base path 统一处理
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── EntryCard.astro
│   │   ├── EntryHero.astro
│   │   ├── FilterBar.astro
│   │   ├── WorkGallery.astro
│   │   ├── FeatureList.astro
│   │   └── SourceList.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── explore.astro
│   │   ├── about.astro
│   │   ├── catalog.json.ts           # 静态导出 endpoint
│   │   └── entries/
│   │       └── [id].astro
│   └── styles/
│       └── global.css
├── scripts/
│   ├── validate-entries.ts
│   ├── check-links.ts                 # 可选，网络验证单独运行
│   └── generate-entry.ts              # Phase 2，依赖 AI 服务密钥
├── tests/
│   ├── content.test.ts
│   └── search.test.ts
├── .env.example
├── .gitignore
├── astro.config.mjs
├── package.json
├── README.md
└── tsconfig.json
```

可以轻微调整文件组织，但不可省去：内容数据、内容 schema、校验脚本、详情路由、部署工作流、项目 README。

### 7.3 Astro 的内容加载方式

使用 Astro 现代 Content Layer API（不是旧版 `src/content` 隐式集合机制）：

```ts
// src/content.config.ts — 示意，字段 schema 需按第 6 节完整实现
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entries = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/entries' }),
  schema: z.object({
    schemaVersion: z.literal(1),
    id: z.string(),
    date: z.iso.date(),
    status: z.enum(['sample', 'draft', 'published']),
    title: z.string().min(1),
    // 按第 6 节继续补齐字段，不要以此不完整 schema 交付
  }),
});

export const collections = { entries };
```

在生成路由时使用 `getCollection('entries')`，根据 `status === 'published'` 生成生产页；开发环境可开显式开关展示 `sample`，但要标明“示例”。`draft` 永远不公开导出。

**额外校验**：Astro schema 验证单条格式，但不能自动保证文件名 ID 一致、跨条目关联存在、日期唯一与主题去重。因此还要编写 `scripts/validate-entries.ts` 扫描 JSON 并进行跨条目检查。

### 7.4 搜索实现方式

P0 条目量数十到数百时：**构建期导出轻量搜索索引**，浏览器在本地对标题、摘要、标签、人物、作品名、视觉特征搜索。搜索不调用服务器或 AI；进行英文大小写归一化、中文包含匹配、基本多词匹配和防空数据处理。搜索结果与分类筛选组合使用。

全文索引、相关性排名需求出现后，再引入 Pagefind。不要一开始上向量数据库。

### 7.5 关联推荐

- 第一优先：`relatedIds` 人工/编辑推荐，最多 4 项。
- 第二优先：同一级分类 + 共同标签，排除当前条目，按关联度/日期排序。
- 第三优先：最近更新条目。**不能出现死链接或重复当前文章**。

---

## 8. 构建、CI 与发布

### 8.1 本地开发应支持

```bash
npm install
npm run dev
npm run validate:content
npm run check
npm run test
npm run build
npm run preview
```

由 Codex 在 `package.json` 中实际配置上述命令；不能只写在 README 而没有对应脚本。`npm run check` 应运行 Astro/type checking（需要安装相应工具）。`npm run validate:content` 应在 build 前由 CI 执行。

### 8.2 GitHub Actions CI (`ci.yml`)

触发：push / pull_request。顺序建议：

1. Checkout → 安装兼容 Node → `npm ci`。
2. `npm run validate:content`。
3. `npm run check`。
4. `npm run test`。
5. `npm run build`。

存在 sample/draft 时不能因未有权利展示图片而卡死构建，但正式 published 必须满足质量门禁。单独的外链可用性验证避免每次 build 都受网络波动影响。

### 8.3 GitHub Pages (`deploy.yml`)

- push `main` / 手工 `workflow_dispatch` 触发。
- 采用 Astro 官方推荐的 `withastro/action` 与 GitHub Pages 部署方式；按当时最新官方文档选择 Action 主版本。
- `permissions` 仅授予部署必需项；可用 `concurrency` 避免旧构建覆盖新版本。
- 正确计算项目仓库 `base`：例如仓库是 `visual-art-atlas`，发布地址通常为 `https://USERNAME.github.io/visual-art-atlas/`。若使用自定义域名，再调整 `site/base`。
- 全站所有内部链接、图片静态路径及 `/catalog.json` 均需要兼容 `base`。不可把每个链接直接写死为站点根 `/`。

**隐私注意**：GitHub Pages 网站默认对互联网公开，**即使源码仓库是 private，也不能自动认定网站是私密的**。本 MVP 不能放私人的未公开笔记、身份证明信息或受版权限制的图片。如需要仅自己访问，要另选鉴权部署方案。

---

## 9. Phase 2：每日自动入库（接口设计先预留）

### 9.1 目标工作流

```text
每天 ~11:20（Asia/Shanghai）/ 手工触发
        ↓
读取已经发布的 JSON + 近 30 日主题
        ↓
选择新主题：七大方向平衡、标题/人物/主题相似去重
        ↓
联网查找可核验资料（博物馆 / 官方机构 / 艺术家）
        ↓
AI 生成中文专题内容 + 结构化 JSON
        ↓
本地 Schema 校验 + 内容质量校验 + 来源核查
        ↓
失败：不发布，保留日志/草稿或开待审核 PR
成功：新增一个 JSON → 提交 GitHub
        ↓
触发 Astro 构建与 GitHub Pages 发布
        ↓
12:00 的推送可以指向同一篇站内档案（需另行打通通知渠道）
```

**为什么安排 11:20？** 给 API 响应、重试与构建留出缓冲；GitHub Actions 的 schedule 并不承诺绝对准时执行，因此网页更新“尽量中午前完成”，不能宣称秒级准时。原有 ChatGPT 12:00 定时推送作为独立提醒保留。

### 9.2 定时工作流

GitHub Actions 已支持在 `schedule` 中使用 IANA 时区字段。实现时以最新官方说明为准，例如：

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '20 11 * * *'
      timezone: 'Asia/Shanghai'
```

如果实际运行环境不支持该写法，回退到等价 UTC cron（北京 11:20 = UTC 03:20；无夏令时），并在 README 注明。尽量避开整点高峰。

### 9.3 自动生成的质量要求

- 每次运行由代码生成候选主题清单与禁重复表，不依赖模型“记住过去推荐过什么”。
- 不能随机生成文章后再让 AI 自己断言“来源真实”。先可靠检索，再生成文本；对名称、归属、年代和作品标题需要可追溯证据。
- 来源不足可更换主题或保存为 `draft`，**不强行发布**。
- 同一日重复运行要 **幂等**：同 ID 已存在时不覆盖正式内容；允许 `--date` / `--dry-run` / `--force`（force 必须审慎保护）。
- 自动内容与手工内容遵守同一 schema。升级 schema 必须兼容旧条目或提供迁移。
- 对外部链接设置超时和失败容忍度，记录可重现日志；对图片许可不能仅靠模型猜测。
- 秘钥如 `OPENAI_API_KEY` / 其他模型 API key 只放 GitHub Actions Secrets，不提交 `.env`。
- Workflow 写权限尽可能小。存在分支保护时使用 PR 工作流，不绕过仓库策略。
- `REVIEW_MODE=pr` 优先作为首次启用默认值；核验和故障恢复稳定后，用户可明确选择 `auto`。
- 首次上线无 API 密钥时自动化应处于**未启用或明确的跳过状态**，不影响网站。

### 9.4 ChatGPT 每日推送与站点的关系

这两套功能是两个不同系统：

- **现有 ChatGPT 定时任务**：每天中午向聊天会话推送艺术推荐。
- **未来 GitHub 内容流水线**：每天生成、验证并提交一个站内 JSON。

如果分别运行两个独立模型，它们可能选出两个不同主题。长期正确目标是**先生成并发布“唯一一份条目”**，再让消息通知引用此条目的标题、摘要和网址。需确认通知服务/连接器能否读取站内数据后再实施，**不要编造跨平台集成已完成**。先允许手动同步，后续可将现有 ChatGPT 任务调整为每日打开新档案/摘要的提醒。

---

## 10. 内容编辑规范（可复用 AI 生成提示）

**每篇专题结构**（阅读目标 3–5 分钟，约 500–800 中文字，非机械硬限制）：

1. 期号/日期 + 准确标题。
2. 一句话认识：核心特征，而不是空泛的形容词。
3. 历史或个人创作语境：简短、可信、交代背景。
4. 视觉语言拆解：从构图、色彩、光影、材料、造型、空间、字体中选真正适用的 3–6 项。
5. 2–3 位代表人物或 2–4 件作品：**为什么是代表作，具体观察什么**。
6. 与相近/不同风格的区别：避免只是泛泛而谈。
7. 当代设计应用：说明怎样借鉴而不是机械模仿。
8. 今日小练习：可选，偏视觉实验而不是固定写生图 prompt。
9. 下一步值得探索：建立关联知识网络。

**语气**：专业但不学究，聚焦观察方法和审美判断；既讲艺术史，也要说明它与平面、KV、商业插画、品牌、建筑/产品视觉之间的可能连接。

**来源优先顺序**：博物馆/收藏机构、艺术家本人/官方作品集、出版社/学术机构、可靠专业媒体。对于在世数字艺术家，不要虚构官方作品链接或擅自保存其图片。

**避免**：无来源的明确年份、艺术家生平轶事、所谓“公认风格”断言、伪造画作图片、未经授权的大幅作品复制、引用外部文章整段原文。

---

## 11. 测试场景与验收标准

### 11.1 功能验收（P0）

- [ ] 本地 `npm install && npm run dev` 正常启动，README 指令准确。
- [ ] 首页在 390px、768px、1440px 正常排版，不水平溢出。
- [ ] 开发预览中七个领域均有可浏览样例；正式上线时七个领域各至少有 1 条已核验 `published` 记录，否则清晰显示待发布状态。
- [ ] 首页、探索页、详情页、关于页可进入且返回正常。
- [ ] 搜索“光影”“巴洛克”“WLOP”等关键词可以找到符合字段的条目（基于样例内容）。
- [ ] 分类 + 标签 + 搜索能组合使用，重置后恢复默认状态。
- [ ] 页面 URL 可分享；直接打开详情 URL 正常显示。
- [ ] 点击随机探索能够跳转到一条存在的记录。
- [ ] 相关条目只指向存在且可见的档案。
- [ ] 作品缺图或图片失败时，不显示破损图标、不导致布局塌陷。
- [ ] 图片具有 alt、标签与输入有清晰可访问名称，键盘能完成主要操作。
- [ ] 生产站点**不展示** `draft`、`sample`，除非明确启动 Demo 模式且有视觉标识。
- [ ] `/catalog.json` 只包含公开已发布的条目，不泄露草稿。
- [ ] 静态 build 成功；构建产物中存在已发布详情页。

### 11.2 数据异常测试

- [ ] 破损 JSON 导致校验失败，并准确提示文件位置。
- [ ] 未知 `category`、不合法日期、错误 `topicType` 被拒绝。
- [ ] 两个文件 `id` 重复、文件名与内嵌 `id` 不一致被拒绝。
- [ ] 不存在的 `relatedIds` 在正式条目中被校验拒绝。
- [ ] 缺少来源、未定义图片许可时，正式条目不得进入生产构建。
- [ ] 日期排序正确；同日多条内容的规则清晰（允许，但日更流程不得意外重复）。
- [ ] 使用 GitHub Pages 仓库子路径时首页到详情、图片、导出链接无 404。

### 11.3 Phase 2 验收（后续）

- [ ] `workflow_dispatch` 可手动运行并选择 dry-run。
- [ ] 无 API key 时明确失败/跳过，绝不提交伪数据。
- [ ] 同一天重复运行不重复生成正式文件、不覆盖已有文章。
- [ ] 错误来源/不合规图片阻止自动发布。
- [ ] `REVIEW_MODE=pr` 能产生待审核变更；`auto` 仅在验证通过后提交。
- [ ] 内容 commit 后正常触发部署；失败可回滚。
- [ ] 运行日志能查看选题、文件名、校验结果，但不泄露 key。

---

## 12. 开发实施顺序（Codex 按此推进）

### Sprint A：项目脚手架与数据基础

1. 初始化 Astro + TypeScript strict，安装必要依赖和 scripts。
2. 建立分类字典、JSON Schema、条目加载与校验脚本。
3. 提供每类至少 1 条结构规范的条目；如果没有完成来源核验则标为 `sample`，仅用于开发预览。部署正式对外站点前应补齐至少 7 条经过核验的 `published` 条目。
4. 完成内容单元测试。**先让 JSON 正确加载，再做页面。**

**完成定义**：`npm run validate:content` + `npm run check` 成功，能在构建期读取全部有效样例。

### Sprint B：完整 UI

1. 创建整体设计 tokens、基本组件与全局布局。
2. 完成首页、探索页、详情页、关于页、静态索引。
3. 完成搜索/过滤/排序/URL 状态、相关推荐、缺图占位。
4. 适配移动端、键盘、页面分享与 SEO。

**完成定义**：七大类别可访问；至少两种屏幕宽度视觉验证；关键用户流程可跑通。

### Sprint C：质量保证与部署

1. 增加 CI、`deploy.yml`、base path 支持和 README。
2. 执行内容错误注入测试与构建测试。
3. 在用户提供 GitHub 仓库及授权后再部署；没有授权可生成配置和完整手动步骤。

**完成定义**：项目可以在无任何 AI API key 下运行、构建并准备发布。

### Sprint D：未来的自动内容流水线（先设计，待确认后开启）

1. 提供脚本接口：选题、来源检索、结构化生成、验证、提交。
2. 提供 Actions workflow 和 secrets 配置说明。
3. 优先打开 PR 审核模式，稳定后可选自动合并。
4. 最后再与 12:00 通知逻辑融合。

---

## 13. 给 Codex 的首次执行提示（直接复制）

> 你是一名有产品意识的资深全栈前端工程师和视觉设计工程师。请完整阅读项目根目录 `docs/PROJECT_SPEC.md`，实现 **Visual Art Atlas 的 Phase 1（P0）**。这是一个以图片和视觉语言为核心的个人艺术知识库，不是传统博客和后台 Dashboard。技术要求为 Astro + TypeScript strict + 独立 JSON 内容文件 + Zod 校验 + 静态 GitHub Pages 部署。
>
> 请先输出简短实施计划与拟创建的文件结构，然后直接开始代码实现，不要停留在概念设计。优先建立内容模型与 7 个分类的示例数据，再制作完整的首页、探索页、详情页、搜索/过滤和响应式界面；同时完成内容校验脚本、基础测试、CI、GitHub Pages 部署配置和 README。无需 API key 即可运行。
>
> 视觉方向为现代编辑式艺术图鉴：温暖纸色底、清晰排版、富有留白、作品优先、克制的交互动效。请做好缺图占位；不得杜撰作品出处、图片 URL 或图片使用许可。未经核验的示例数据必须标记为 `sample` 并与正式 `published` 内容隔离。
>
> 对 Phase 2 的“每日 AI 自动入库”仅预留清晰接口与文档，**本轮不连接真实付费 API，不开启每日自动提交，不擅自创建/修改远程 GitHub 仓库**。实现后执行可行的校验、测试和构建，报告结果与遗留问题。

---

## 14. 项目风险、决策与默认假设

| 事项 | Phase 1 默认方案 | 后续变化条件 |
|---|---|---|
| 数据源 | 一篇一个 JSON 文件 | 关联实体增多才拆库 |
| 图片 | 有许可才本地托管；其余用文字链接/占位 | 获得授权或开放资源 |
| 发布方式 | GitHub Pages 公开静态站 | 若需要访问控制再切换托管 |
| 搜索 | 本地结构化字段检索 | 大量文章时 Pagefind；语义搜索更后期 |
| 编辑方式 | Git 编辑 / PR | 频繁编辑再考虑 CMS |
| 每日生成 | 暂不自动连接 | 用户配置 AI API / 来源能力 / Secret |
| 自动发布 | 初始人工审核 PR | 内容质量稳定后可选择全自动 |
| 通知 | 保留既有 ChatGPT 12:00 任务 | 研究可以读取同一条站内档案的通知渠道 |
| 图片版权 | 未知即不展示外部图像 | 获得明确使用权后再上线 |
| 语言 | 简体中文 | 二期再考虑英文 |
| 收藏 | 非 P0（P1 可本地保存） | 跨设备才引入鉴权数据库 |

**核心技术风险**：自动生成有事实幻觉、图片权利不明、GitHub Actions 执行延迟、Github Pages 静态公开、仓库子路径 URL 处理。上述问题均需在实际测试与文档中明确处理，不可隐去。

---

## 15. 官方资料索引（开发时核对）

1. Astro 内容集合与 JSON glob：<https://docs.astro.build/en/guides/content-collections/>
2. Astro 内容加载器：<https://docs.astro.build/en/reference/content-loader-reference/>
3. Astro GitHub Pages 部署：<https://docs.astro.build/en/guides/deploy/github/>
4. GitHub Actions schedule：<https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows>
5. GitHub Pages 公开性与发布设置：<https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
6. Pagefind 静态搜索：<https://pagefind.app/docs/>

**本文是可执行开发规范；具体 API/Action 版本以开始实现时的官方文档为准。**

---

### 最终产品应达到的体验

> 用户每天收到艺术推荐，可以打开一个持续增长的视觉知识库；既能按艺术类别浏览，也能通过“光影、留白、几何、材料、排版”等视觉语言检索；点开条目能看到代表作品、深入但适度的解析、现代创作应用和其他相关主题。每一条数据都是可核验、可维护、可迁移的独立档案。
