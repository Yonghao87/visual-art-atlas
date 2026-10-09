import { test, expect } from '@playwright/test';
test('首页、七大分类、随机探索与完整详情', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('视觉语言');
  await expect(page.locator('.category-item')).toHaveCount(7);
  await page.locator('[data-random]').first().click();
  await expect(page).toHaveURL(/entries\/2026-/);
  await expect(page.locator('#visual-language')).toBeVisible();
  await expect(page.locator('#works .work-item')).toHaveCount(2);
  await expect(page.locator('#sources a').first()).toHaveAttribute(
    'href',
    /^https:/,
  );
  await expect(page.locator('.related-grid .entry-card')).toHaveCount(4);
});
test('组合搜索、筛选、空状态、重置、排序和URL恢复', async ({ page }) => {
  await page.goto('./explore/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('searchbox').fill('北斋 蓝色');
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(1);
  await page.getByText('东方艺术', { exact: true }).first().click();
  await page.getByLabel('主题类型').selectOption('movement');
  await page.getByLabel('视觉标签').selectOption('留白');
  await expect(page).toHaveURL(/category=eastern_art/);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('北斋 蓝色');
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('不存在的主题xyz');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button', { name: '清空筛选' }).click();
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(7);
  await page.getByLabel('排序', { exact: true }).selectOption('oldest');
  await expect(page.locator('#results .entry-card').first()).toHaveAttribute(
    'data-entry-id',
    '2026-10-03-rams',
  );
  await page.goBack();
  await expect(page.getByLabel('排序', { exact: true })).toHaveValue('newest');
});
test('图像失败有占位、键盘搜索、无横向溢出和公开目录', async ({
  page,
  request,
}) => {
  await page.route('**/images/*.jpg', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('.spotlight img')).toBeHidden();
  await expect(page.locator('.spotlight .visual-fallback')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.getByRole('searchbox').fill('Bauhaus');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const response = await request.get('./catalog.json');
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.entries).toHaveLength(7);
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
