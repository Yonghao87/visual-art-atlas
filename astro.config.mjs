import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
const repository = process.env.GITHUB_REPOSITORY?.split('/');
const site =
  process.env.SITE_URL ||
  (repository ? `https://${repository[0]}.github.io` : 'http://localhost:4321');
const base =
  process.env.BASE_PATH ||
  (repository && repository[1] !== `${repository[0]}.github.io`
    ? `/${repository[1]}`
    : '/');
export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  devToolbar: { enabled: false },
});
