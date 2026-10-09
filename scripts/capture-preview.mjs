import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'docs/screenshots'), { recursive: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
for (const [name, width, height, url] of [
  ['home-desktop', 1440, 1000, '/'],
  ['home-mobile', 390, 844, '/'],
  ['explore-mobile', 390, 844, '/explore/'],
  ['detail-desktop', 1440, 1000, '/entries/2026-10-09-ukiyo-e/'],
  ['detail-mobile', 390, 844, '/entries/2026-10-09-ukiyo-e/'],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(
    'http://127.0.0.1:4321' +
      (process.env.BASE_PATH || '').replace(/\/$/, '') +
      url,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) {
      img.loading = 'eager';
      await img.decode().catch(() => {});
    }
  });
  await page.screenshot({
    path: root + '/docs/screenshots/' + name + '.png',
    fullPage: true,
  });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      images: [...document.images].map((i) => ({
        source: i.getAttribute('src'),
        loaded: i.complete && i.naturalWidth > 0,
      })),
    })),
  );
}
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(
  `<html><head><style>*{box-sizing:border-box}body{margin:0;background:#f6f4ee;color:#252925;font-family:Georgia,serif;width:1200px;height:630px;padding:68px 78px}header{font-size:28px;display:flex;justify-content:space-between;border-bottom:1px solid #b8bbb1;padding-bottom:24px}h1{font-size:72px;line-height:1.2;letter-spacing:-3px;font-weight:400;margin:62px 0 30px}p{font:22px -apple-system,sans-serif;color:#455a6b}.number{position:absolute;right:80px;bottom:60px;font-size:130px;color:#d7dcd3}small{font:12px -apple-system,sans-serif;letter-spacing:3px}</style></head><body><header>Visual Art Atlas<small>视觉艺术图鉴 / VISUAL CULTURE</small></header><h1>Look closer.<br>See differently.</h1><p>每天认识一种新的视觉语言。</p><span class="number">va²</span></body></html>`,
);
await page.screenshot({ path: root + '/public/images/share.png' });
console.log('Browser errors:', errors);
await browser.close();
