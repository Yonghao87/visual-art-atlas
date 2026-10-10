import { test, expect } from '@playwright/test';
test('首页、七大分类、随机探索与完整详情', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('视觉语言');
  await expect(page.locator('.category-item')).toHaveCount(7);
  await page.locator('[data-random]').first().click();
  await expect(page).toHaveURL(/entries\/2026-/);
  await expect(page.locator('#visual-language')).toBeVisible();
  await expect(page.locator('#style-summary')).toBeVisible();
  await expect(
    page.getByRole('button', { name: '复制视觉风格速记' }),
  ).toHaveText('复制');
  const styleSummary = await page.locator('#style-summary-text').innerText();
  await expect(page.locator('#style-summary-text')).toContainText(
    `${await page.locator('h1').innerText()}-`,
  );
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '复制视觉风格速记' }).click();
  await expect(page.locator('#style-summary-copy-status')).toHaveText(
    '风格描述已复制',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    styleSummary,
  );
  expect(
    await page.locator('#works .work-item').count(),
  ).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#sources a').first()).toHaveAttribute(
    'href',
    /^https:/,
  );
  await expect(page.locator('.related-grid .entry-card')).toHaveCount(4);
});
test('缺图作品以紧凑档案行保留作品信息和来源', async ({ page }) => {
  await page.goto('./entries/2026-10-05-modern-architecture/');
  const missingWorks = page.locator('#works .work-item--missing');
  await expect(missingWorks).toHaveCount(2);

  for (const item of await missingWorks.all()) {
    await expect(item.locator('.work-missing')).toHaveText('图像待补充');
    await expect(item.locator('.work-placeholder')).toHaveCount(0);
    await expect(item.locator('h3')).toBeVisible();
    await expect(item.getByRole('link', { name: '原始来源' })).toHaveAttribute(
      'href',
      /^https:/,
    );
    expect((await item.boundingBox())?.height ?? Infinity).toBeLessThan(190);
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('平涂技法示意是原创图并能正常加载', async ({ page, request }) => {
  await page.goto('./entries/2026-10-07-digital-painting/');
  const item = page
    .locator('#works .work-item')
    .filter({ hasText: '平涂研究实例 / Flat Coloring' });
  const image = item.locator('img');
  await expect(image).toBeVisible();
  const src = await image.getAttribute('src');
  expect(src).toMatch(/digital-painting-flat-coloring\.svg$/);
  const response = await request.get(new URL(src!, page.url()).href);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  await expect(item.locator('.work-image-credit')).toContainText(
    '原创技法示意',
  );
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveJSProperty('naturalWidth', 1200);
});
test('组合搜索、筛选、空状态、重置、排序和URL恢复', async ({ page }) => {
  await page.goto('./explore/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const total = await page.locator('#results .entry-card').count();
  await page.getByRole('searchbox').fill('北斋 蓝色');
  await expect
    .poll(() => page.locator('#results .entry-card:visible').count())
    .toBeGreaterThan(0);
  await page.getByText('东方艺术', { exact: true }).first().click();
  await page.getByLabel('主题类型').selectOption('movement');
  await page.getByLabel('视觉标签').selectOption('留白');
  await expect(page).toHaveURL(/category=eastern_art/);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('北斋 蓝色');
  await expect
    .poll(() => page.locator('#results .entry-card:visible').count())
    .toBeGreaterThan(0);
  await page.getByRole('searchbox').fill('不存在的主题xyz');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button', { name: '清空筛选' }).click();
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(total);
  const oldestId = await page
    .locator('#results .entry-card')
    .evaluateAll(
      (cards) =>
        cards.map((card) => (card as HTMLElement).dataset.entryId!).sort()[0],
    );
  await page.getByLabel('排序', { exact: true }).selectOption('oldest');
  await expect(page.locator('#results .entry-card').first()).toHaveAttribute(
    'data-entry-id',
    oldestId!,
  );
  await page.goBack();
  await expect(page.getByLabel('排序', { exact: true })).toHaveValue('newest');
});
test('图像失败有占位、键盘搜索、无横向溢出和公开目录', async ({
  page,
  request,
}) => {
  await page.route('**/images/**', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('.spotlight img')).toBeHidden();
  await expect(page.locator('.spotlight .visual-fallback')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.getByRole('searchbox').fill('Bauhaus');
  await page.getByRole('searchbox').press('Enter');
  await expect
    .poll(() => page.locator('#results .entry-card:visible').count())
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const response = await request.get('./catalog.json');
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.entries.length).toBe(
    await page.locator('#results .entry-card').count(),
  );
  expect(
    data.entries.every((e: { style_summary?: string }) => e.style_summary),
  ).toBe(true);
  expect(data.entries.every((e: { id: string }) => /^2026-/.test(e.id))).toBe(
    true,
  );
});
test('所有档案及内链资源在当前base下可用', async ({ page, request }) => {
  await page.goto('./explore/');
  const cards = await page
    .locator('.card-link')
    .evaluateAll((links) => links.map((el) => (el as HTMLAnchorElement).href));
  for (const href of cards) {
    const response = await request.get(href);
    expect(response.ok(), href).toBe(true);
  }
  await page.goto(cards[0]!);
  for (const img of await page
    .locator('img')
    .evaluateAll((images) =>
      images.map((el) => (el as HTMLImageElement).src),
    )) {
    expect((await request.get(img)).ok(), img).toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
