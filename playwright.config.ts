import { defineConfig } from '@playwright/test';
const base = process.env.BASE_PATH || '/';
const port = process.env.PREVIEW_PORT || '4327';
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}${base.replace(/\/$/, '')}/`,
    browserName: 'chromium',
    ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}${base.replace(/\/$/, '')}/`,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
