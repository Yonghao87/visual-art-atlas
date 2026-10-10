import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const seed = JSON.parse(
  await readFile(
    join(root, 'src/data/entries/2026-10-09-ukiyo-e.json'),
    'utf8',
  ),
);
const ids = ['2026-10-09-test-sample-private', '2026-10-09-test-draft-private'];
const files = ids.map((id) => join(root, 'src/data/entries', id + '.json'));
const marker = 'ISOLATION_SECRET_CONTENT_72aa';
const initial = await readdir(join(root, 'src/data/entries'));
let publishedCount = 0;
for (const file of initial.filter((f) => f.endsWith('.json'))) {
  const entry = JSON.parse(
    await readFile(join(root, 'src/data/entries', file), 'utf8'),
  );
  if (entry.status === 'published') publishedCount++;
}
const created = [];
try {
  for (let i = 0; i < files.length; i++) {
    await writeFile(
      files[i],
      JSON.stringify({
        ...seed,
        id: ids[i],
        title: marker,
        style_summary: `${marker}-${seed.style_summary.slice(seed.title.length + 1)}`,
        status: i === 0 ? 'sample' : 'draft',
        children: seed.children
          ? { ...seed.children, title: marker, summary: marker }
          : undefined,
        relatedIds: [],
        cover: null,
      }),
      { flag: 'wx' },
    );
    created.push(files[i]);
  }
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build'],
    {
      cwd: root,
      env: {
        ...process.env,
        PUBLIC_DEMO_MODE: 'false',
        ASTRO_TELEMETRY_DISABLED: '1',
      },
      stdio: 'inherit',
    },
  );
  assert.equal(result.status, 0, '生产构建必须成功');
  const dist = join(root, 'dist');
  async function inspect(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) await inspect(file);
      else if (/\.(html|json|js|xml)$/.test(file)) {
        const text = await readFile(file, 'utf8');
        assert.ok(!text.includes(marker), `未发布文本泄露：${file}`);
        ids.forEach((id) =>
          assert.ok(!text.includes(id), `未发布ID泄露：${file}`),
        );
      }
    }
  }
  await inspect(dist);
  const catalog = JSON.parse(
    await readFile(join(dist, 'catalog.json'), 'utf8'),
  );
  assert.equal(catalog.entries.length, publishedCount);
  console.log(
    '生产隔离验收通过：sample/draft 未进入 HTML、浏览器索引、JS、目录或站点地图。',
  );
} finally {
  for (const file of created) await unlink(file);
}
