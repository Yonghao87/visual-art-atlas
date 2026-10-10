import { test, expect } from '@playwright/test';

const detail = './entries/2026-10-10-cezanne-still-life/';
test('所有亲子档案讲解优先，局部引用与原图尺寸一致', async ({
  page,
  request,
}) => {
  const catalog = (await (await request.get('./catalog.json')).json()).entries;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const entry of catalog.filter(
    (entry: { hasChildren: boolean }) => entry.hasChildren,
  )) {
    await page.goto(`./entries/${entry.id}/?edition=family`);
    const family = page.locator('#family-reading');
    await expect(family).toBeVisible();
    expect(
      await family.locator('.family-lesson-part').count(),
    ).toBeGreaterThanOrEqual(2);
    await expect(family.locator('.family-questions')).toHaveCount(0);
    await expect(family.locator('.family-reflection')).toBeVisible();
    const crops = family.locator('.family-detail svg');
    await expect(family.locator('.family-detail-marker')).toHaveCount(
      await crops.count(),
    );
    for (const crop of await crops.all()) {
      const image = crop.locator('image');
      const src = (await image.getAttribute('href'))!;
      const width = Number(await image.getAttribute('width'));
      const height = Number(await image.getAttribute('height'));
      const fullImage = family.locator(`.family-work img[src="${src}"]`);
      await fullImage.scrollIntoViewIfNeeded();
      await expect(fullImage).toHaveCount(1);
      await expect(fullImage).toBeVisible();
      await expect(fullImage).toHaveJSProperty('complete', true);
      if (src.endsWith('.svg')) {
        const svg = await (await request.get(src)).text();
        expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
      } else {
        expect(
          await fullImage.evaluate((img: HTMLImageElement) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        ).toEqual([width, height]);
      }
      const [x, y, w, h] = (await crop.getAttribute('viewBox'))!
        .split(' ')
        .map(Number);
      expect(x + w).toBeLessThanOrEqual(width);
      expect(y + h).toBeLessThanOrEqual(height);
      const back = crop
        .locator('..')
        .getByRole('link', { name: '回看完整作品 ↑' });
      const target = (await back.getAttribute('href'))!;
      await expect(page.locator(target)).toHaveCount(1);
    }
    for (const activity of await family
      .locator('.family-optional-activity')
      .all())
      await expect(activity).not.toHaveAttribute('open', '');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test('印象派样稿以讲解为主，原图定位与局部放大对应', async ({
  page,
}, testInfo) => {
  await page.goto('./entries/2026-10-08-impressionism/?edition=family');
  const family = page.locator('#family-reading');
  await expect(family).toBeVisible();
  await expect(family.locator('h2').first()).toContainText('认识印象派');
  await expect(family.locator('.family-lesson-part')).toHaveCount(3);
  await expect(family.locator('.family-questions')).toHaveCount(0);
  const marker = family.locator('.family-detail-marker');
  await marker.click();
  await expect(page).toHaveURL(/#family-detail-1$/);
  const crop = family.locator('.family-detail svg');
  await expect(crop).toBeVisible();
  await expect(crop).toHaveAttribute('viewBox', '930 1500 1050 525');
  const cropImage = await crop.locator('image').getAttribute('href');
  const fullImage = await family
    .locator('.family-work img')
    .getAttribute('src');
  expect(cropImage).toBe(fullImage);
  const full = family.locator('.family-work img');
  expect(await full.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(
    2342,
  );
  await expect(family.locator('.family-optional-activity')).not.toHaveAttribute(
    'open',
    '',
  );
  await family.locator('.family-optional-activity summary').click();
  await expect(
    family.locator('.family-optional-activity .applications'),
  ).toBeVisible();
  await family.locator('.family-optional-activity summary').click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/vaa-impressionism-lesson-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
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
test('拉姆斯旧档案补齐亲子内容后可正常切换', async ({ page }) => {
  await page.goto('./entries/2026-10-03-rams/?edition=family');
  await expect(page.locator('#family-reading')).toBeVisible();
  await expect(page.locator('.edition-switch')).toBeVisible();
  await expect(page.locator('#family-reading h2').first()).toContainText(
    '架子上的小房间',
  );
  await expect(page.locator('#edition-note')).not.toContainText('尚未收录');
  await page.getByRole('button', { name: '成人阅读', exact: true }).click();
  await expect(page.locator('#adult-reading')).toBeVisible();
  await page.getByRole('button', { name: /亲子共读/ }).click();
  await expect(page.locator('#family-reading')).toBeVisible();
});
test('亲子探索、组合筛选、分享入口与公开目录', async ({ page, request }) => {
  const catalog = (await (await request.get('./catalog.json')).json()).entries;
  const count = catalog.filter(
    (entry: { hasChildren: boolean }) => entry.hasChildren,
  ).length;
  expect(count).toBeGreaterThanOrEqual(8);
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
