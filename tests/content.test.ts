import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readAndValidate,
  validateRecords,
} from '../src/lib/content-validation';
import { categoryKeys } from '../src/constants/taxonomy';
import { visibleEntries, relatedEntries } from '../src/lib/visibility';
import { entrySchema } from '../src/lib/schema';
const seed = (await readAndValidate()).entries;
const first = seed[0]!;
function invalid(change: object) {
  return !entrySchema.safeParse({ ...structuredClone(first), ...change })
    .success;
}
test('至少七条已发布内容覆盖七大类别', async () => {
  const result = await readAndValidate();
  assert.deepEqual(result.errors, []);
  assert.ok(seed.filter((e) => e.status === 'published').length >= 7);
  assert.deepEqual(new Set(seed.map((e) => e.category)), new Set(categoryKeys));
});
test('拒绝无效日历日期、类别、类型与schema版本', () => {
  for (const change of [
    { date: '2026-02-30' },
    { category: 'other' },
    { topicType: 'style' },
    { schemaVersion: 2 },
  ])
    assert.ok(invalid(change));
});
test('视觉风格速记简洁可检索，旧条目缺字段仍兼容', () => {
  assert.ok(
    invalid({
      style_summary: first.style_summary!.slice(first.title.length + 1),
    }),
    '有速记时必须包含该档案主题标题',
  );
  for (const entry of seed) {
    const summary = entry.style_summary;
    assert.ok(summary, `${entry.id} 缺少视觉风格速记`);
    assert.ok(
      summary.startsWith(`${entry.title}-`),
      `${entry.id} 的风格速记应以主题标题开头`,
    );
    assert.ok(summary.length >= 30 && summary.length <= 65);
    const descriptors = summary.slice(entry.title.length + 1).split('，');
    assert.ok(descriptors.length >= 4 && descriptors.length <= 7);
  }
  const legacy = structuredClone(first);
  delete legacy.style_summary;
  assert.equal(entrySchema.safeParse(legacy).success, true);
});
test('正式来源需要核验记录，作品需要出处', () => {
  assert.ok(invalid({ sources: [] }));
  assert.ok(
    invalid({
      sources: [
        { title: '来源', url: 'https://museum.org', publisher: '机构' },
      ],
    }),
  );
  assert.ok(invalid({ works: [{ ...first.works[0], sourceUrl: null }] }));
});
test('图片许可、alt、来源和本地路径门禁', () => {
  const image = {
    src: '/images/test.jpg',
    alt: '作品',
    credit: '机构',
    rights: 'unknown',
    sourceUrl: 'https://museum.org',
  };
  assert.ok(invalid({ cover: image }));
  assert.ok(invalid({ cover: { ...image, rights: 'public_domain', alt: '' } }));
  assert.ok(invalid({ cover: { ...image, rights: 'cc_licensed' } }));
  assert.ok(invalid({ cover: { ...image, rights: 'permission_granted' } }));
  assert.ok(
    invalid({
      cover: { ...image, rights: 'public_domain', src: '/images/../secret' },
    }),
  );
  assert.ok(
    invalid({
      cover: {
        ...image,
        rights: 'public_domain',
        src: 'https://museum.org/a.jpg',
      },
    }),
  );
});
test('文件名、重复ID、关联完整性', () => {
  assert.match(
    validateRecords([{ file: 'wrong.json', value: first }]).errors.join(),
    /文件名/,
  );
  assert.match(
    validateRecords([
      { file: first.id + '.json', value: first },
      { file: first.id + '.json', value: first },
    ]).errors.join(),
    /重复/,
  );
  assert.match(
    validateRecords([
      {
        file: first.id + '.json',
        value: { ...first, relatedIds: ['missing'] },
      },
    ]).errors.join(),
    /不存在/,
  );
  assert.ok(invalid({ relatedIds: [first.id] }));
});
test('正式条目不能关联未发布内容', () => {
  const [a, b] = seed;
  const result = validateRecords([
    { file: a!.id + '.json', value: { ...a, relatedIds: [b!.id] } },
    { file: b!.id + '.json', value: { ...b, status: 'draft', relatedIds: [] } },
  ]);
  assert.match(result.errors.join(), /未发布/);
});
test('破损JSON报告完整路径', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-test-'));
  try {
    await writeFile(join(dir, 'broken.json'), '{');
    const result = await readAndValidate(dir);
    assert.match(result.errors.join(), /broken.json.*JSON/);
  } finally {
    await rm(dir, { recursive: true });
  }
});
test('不存在本地图像阻止发布', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-test-'));
  try {
    await writeFile(
      join(dir, first.id + '.json'),
      JSON.stringify({
        ...first,
        relatedIds: [],
        cover: {
          src: '/images/missing.jpg',
          alt: '测试',
          credit: '测试',
          rights: 'public_domain',
          sourceUrl: 'https://museum.org',
        },
      }),
    );
    assert.match((await readAndValidate(dir)).errors.join(), /本地图片不存在/);
  } finally {
    await rm(dir, { recursive: true });
  }
});
test('草稿永不显示，示例仅显式Demo模式', () => {
  const importedDraft = {
    ...first,
    id: 'sample-draft',
    status: 'draft' as const,
  };
  assert.ok(
    !visibleEntries([first, importedDraft]).some(
      (entry) => entry.id === importedDraft.id,
    ),
  );
  const records = [
    { ...first, status: 'published' as const },
    { ...first, id: 'sample', status: 'sample' as const },
    { ...first, id: 'draft', status: 'draft' as const },
  ];
  assert.deepEqual(
    visibleEntries(records).map((e) => e.id),
    [first.id],
  );
  assert.deepEqual(
    visibleEntries(records, true).map((e) => e.id),
    [first.id, 'sample'],
  );
});
test('关联推荐去重且指向可见档案', () => {
  const result = relatedEntries(first, seed);
  assert.equal(new Set(result.map((e) => e.id)).size, result.length);
  assert.ok(
    result.every((e) => seed.some((s) => s.id === e.id) && e.id !== first.id),
  );
  assert.ok(first.relatedIds.includes(result[0]!.id));
});
