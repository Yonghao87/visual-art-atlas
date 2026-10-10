import { test, expect } from '@playwright/test';

const detail = './entries/2026-10-10-cezanne-still-life/';
test('成人与亲子切换、键盘、记忆、URL历史和复制', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(detail);
  await expect(page.locator('#adult-reading')).toBeVisible();
  await expect(page.locator('#family-reading')).toBeHidden();
  const family = page.getByRole('button', { name: /亲子共读/ });
  await family.focus();
  await page.keyboard.press('Enter');
  await expect(family).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/edition=family/);
  await expect(page.locator('#adult-reading')).toBeHidden();
  await expect(page.locator('#style-summary')).toBeHidden();
  await expect(page.locator('#family-reading')).toBeVisible();
  const image = page.locator('.family-work img').first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  expect(
    await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '复制亲子阅读链接' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'edition=family',
  );
  await page.getByRole('button', { name: '成人阅读', exact: true }).click();
  await expect(page.locator('#style-summary')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#family-reading')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `/tmp/vaa-family-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.goto('./entries/2026-10-09-ukiyo-e/');
  await expect(page.locator('#family-reading')).toBeVisible();
  await page.goto(detail + '?edition=adult');
  await expect(page.locator('#adult-reading')).toBeVisible();
  await expect(page.locator('#family-reading')).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('旧档案不出现空模块，亲子链接正确回退', async ({ page }) => {
  await page.goto('./entries/2026-10-03-rams/?edition=family');
  await expect(page.locator('#family-reading')).toHaveCount(0);
  await expect(page.locator('.edition-switch')).toHaveCount(0);
  await expect(page.locator('#adult-reading')).toBeVisible();
  await expect(page.locator('#edition-note')).toContainText('尚未收录');
});
test('亲子探索、组合筛选、分享入口与公开目录', async ({ page, request }) => {
  const catalog = (await (await request.get('./catalog.json')).json()).entries;
  const count = catalog.filter(
    (entry: { hasChildren: boolean }) => entry.hasChildren,
  ).length;
  await page.goto('./explore/?edition=family');
  await expect(page.getByLabel('阅读版本')).toHaveValue('family');
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(count);
  await page.getByRole('searchbox').fill('苹果里面');
  await expect(page.locator('#results .entry-card:visible')).toHaveCount(1);
  await page.locator('#results .entry-card:visible .card-link').click();
  await expect(page).toHaveURL(
    /entries\/2026-10-10-cezanne-still-life\/\?edition=family/,
  );
  await expect(page.locator('#family-reading h2').first()).toContainText(
    '苹果里面',
  );
  expect(
    catalog.every(
      (entry: { children?: object }) =>
        !entry.children ||
        Object.keys(entry.children).every((key) =>
          ['title', 'summary'].includes(key),
        ),
    ),
  ).toBe(true);
});
test('偏好存储被禁用时仍可切换阅读版本', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage disabled');
      },
    });
  });
  await page.goto(detail + '?edition=family');
  await expect(page.locator('#family-reading')).toBeVisible();
  await page.getByRole('button', { name: '成人阅读', exact: true }).click();
  await expect(page.locator('#adult-reading')).toBeVisible();
});
test('无JavaScript仍可阅读两版与来源', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(new URL(detail, baseURL).href);
  await expect(page.locator('#adult-reading')).toBeVisible();
  await page.getByRole('link', { name: /进入亲子共读/ }).click();
  await expect(page.locator('#family-reading')).toBeVisible();
  await expect(page.locator('.family-work').first()).toBeVisible();
  await page.getByText('查看共同参考来源与核验记录').click();
  await expect(page.locator('.family-sources .source-list')).toBeVisible();
  await context.close();
});
