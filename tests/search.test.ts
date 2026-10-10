import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAndValidate } from '../src/lib/content-validation';
import { filterEntries, matchesQuery } from '../src/lib/search';
import { withBase } from '../src/lib/paths';
const entries = (await readAndValidate()).entries.filter(
  (entry) => entry.status === 'published',
);
const wave = entries.find((e) => e.category === 'eastern_art')!;
test('中文、英文大小写和同义词', () => {
  assert.ok(matchesQuery(wave, '北斋'));
  assert.ok(matchesQuery(wave, 'UKIYO-E'));
  assert.ok(matchesQuery(wave, 'negative space'));
});
test('多关键词必须同时匹配', () => {
  assert.equal(filterEntries(entries, { q: '北斋 蓝色' }).length, 1);
  assert.equal(filterEntries(entries, { q: '北斋 混凝土' }).length, 0);
  assert.equal(filterEntries(entries, { q: '   ' }).length, 8);
});
test('作品、人名、特征、摘要参与搜索', () => {
  assert.ok(matchesQuery(wave, 'The Great Wave'));
  assert.ok(matchesQuery(wave, 'Katsushika'));
  assert.ok(matchesQuery(wave, '尺度'));
  assert.ok(matchesQuery(wave, '轮廓'));
});
test('视觉风格速记参与检索', () => {
  assert.ok(matchesQuery(wave, '木版套印'));
  assert.ok(matchesQuery(wave, '不对称构图'));
});
test('类别、类型、标签与查询叠加，日期排序确定', () => {
  assert.equal(
    filterEntries(entries, {
      category: 'eastern_art',
      type: 'movement',
      tag: '留白',
      q: '蓝色',
    }).length,
    1,
  );
  assert.equal(
    filterEntries(entries, { category: 'eastern_art', type: 'artist' }).length,
    0,
  );
  assert.equal(filterEntries(entries)[0]?.date, '2026-10-10');
  assert.equal(
    filterEntries(entries, { sort: 'oldest' })[0]?.date,
    '2026-10-03',
  );
});
test('同日按ID稳定排序', () => {
  assert.deepEqual(
    filterEntries([
      { ...wave, id: 'b' },
      { ...wave, id: 'a' },
    ]).map((e) => e.id),
    ['a', 'b'],
  );
});
test('根路径、GitHub子路径、图片与外部链接', () => {
  assert.equal(withBase('/entries/a/', '/atlas/'), '/atlas/entries/a/');
  assert.equal(withBase('/images/a.jpg', '/atlas'), '/atlas/images/a.jpg');
  assert.equal(withBase('/catalog.json', '/atlas/'), '/atlas/catalog.json');
  assert.equal(withBase('/', '/'), '/');
  assert.equal(withBase('https://museum.org', '/atlas'), 'https://museum.org');
});
