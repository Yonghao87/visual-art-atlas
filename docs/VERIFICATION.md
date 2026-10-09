# Phase 1 验收记录

日期：2026-10-09。宿主 Node.js 26.0.0；项目最低 Node 22.12，`.nvmrc` 和 CI 使用 Node 24 LTS。依赖版本锁定在 package-lock.json。GitHub 托管执行尚未发生。

## 实测结果

| 检查                                           | 结果                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run validate:content`                     | 7份JSON、7条published，覆盖7类，通过。                                                                     |
| `npm run check`                                | Astro + strict TypeScript：0错误、0警告、0提示。                                                           |
| `npm test`                                     | 16项内容与搜索测试通过。                                                                                   |
| `npm run build`                                | 静态构建成功；首页、探索、关于、404、7篇详情、catalog及sitemap已生成。                                     |
| `npm run test:e2e` 根路径                      | 1440×1000与390×844，每种视口4项，8/8通过。                                                                 |
| `BASE_PATH=/visual-art-atlas npm run test:e2e` | 同样8/8通过；从带base的生产构建验证。                                                                      |
| `npm run test:isolation`                       | 临时新增sample/draft；生产HTML、客户端JS、搜索索引、随机索引、catalog和sitemap均不含它们；临时文件已清理。 |
| `npm run dev -- --port 4322 --ignore-lock`     | 无API密钥启动与本地HTTP访问通过。                                                                          |
| npm依赖安装审计                                | 0个已知漏洞（安装时结果，不保证未来数据库不变）。                                                          |

内容测试覆盖：破损JSON定位、非法分类/类型/日期/schema版本、缺少核验来源、作品缺出处、文件名不一致、重复ID、关联自身或不存在/未发布档案、图片alt/权利/CC许可/授权记录/路径/本地存在性、draft/sample隔离、关联去重。

搜索测试覆盖：中文、英文大小写、常用同义词（含多词短语）、关键词AND匹配、作品/人物/特征/摘要、组合过滤、日期及同日稳定排序、base路径。

浏览器测试覆盖：首页7分类、随机链接、完整详情、组合查询和筛选、重载URL恢复、空状态、清空与排序、浏览器后退、键盘跳转/提交搜索、图像失败占位、公开目录、全部7个详情和图像请求。

草稿导入接口也已执行dry-run，校验通过且没有写入文件。最终根路径E2E已验证自行启动和关闭前台预览服务。

## 视觉复核

实际截图位于 `docs/screenshots/`：

- `home-desktop.png`：1440px首页。
- `home-mobile.png`：390px首页。
- `explore-mobile.png`：390px探索。
- `detail-desktop.png`：1440px详情。
- `detail-mobile.png`：390px详情。

上述页面实测document宽度等于视口宽度，作品图片decode成功，浏览器脚本错误为0。初次手机探索出现fieldset最小宽度溢出，已修复并通过复测。详情页作品采用contain，浏览卡片采用cover；图片失败保留封面或作品占位。

重现截图（先运行生产预览）：`npm run capture:preview`。测试服务器使用`--ignore-lock`在前台运行，避免Astro在Agent环境自动后台化影响CI生命周期。

## 剩余限制

1. 未创建远程仓库、未push、未在GitHub执行Actions或真正部署；部署配置和设置步骤已准备，需确定仓库后使用。
2. 五类封面为原创排版导览，真实参考图片仅提供原站链接。莫奈图像下载端点返回403，未使用未经确认许可的替代图。
3. 搜索为结构化字段本地检索，暂未接入Pagefind全文或AI语义检索。
4. Phase 2仅预留接受draft的离线入库接口；没有付费API、定时生成、每日自动提交或提醒联动。
5. 首批条目集中整理，日期为初始阅读顺序；机器质量门禁不能替代来源与权利的人类判断。
6. 浏览器实测为Chrome；未声称Firefox/Safari或辅助技术全矩阵已验证。
