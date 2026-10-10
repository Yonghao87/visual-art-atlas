import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAndValidate } from '../src/lib/content-validation';
import { entrySchema } from '../src/lib/schema';
import { filterEntries, toSearchRecord } from '../src/lib/search';
import { dailyEntryErrors, shanghaiDate } from '../src/lib/daily';

const entries = (await readAndValidate()).entries;
const pilot = entries.find((entry) => entry.children)!;
test('旧数据可无亲子版；新结构共享作品并完整校验', () => {
  const legacy = structuredClone(pilot);
  delete legacy.children;
  assert.ok(entrySchema.safeParse(legacy).success);
  assert.ok(entrySchema.safeParse(pilot).success);
  for (const mutate of [
    (entry: typeof pilot) => {
      entry.children!.ageRange = '8-12' as '5-7';
    },
    (entry: typeof pilot) => {
      entry.children!.featuredWorkIds = ['missing'];
    },
    (entry: typeof pilot) => {
      entry.children!.observations[0]!.workId = 'missing';
    },
    (entry: typeof pilot) => {
      entry.children!.activity.steps = ['只有一步'];
    },
    (entry: typeof pilot) => {
      entry.children!.activity.durationMinutes = 60;
    },
    (entry: typeof pilot) => {
      entry.works[0]!.id = entry.works[1]!.id;
    },
    (entry: typeof pilot) => {
      entry.works.find(
        (work) => work.id === entry.children!.featuredWorkIds[0],
      )!.image = null;
    },
  ]) {
    const entry = structuredClone(pilot);
    mutate(entry);
    assert.equal(entrySchema.safeParse(entry).success, false);
  }
});
test('亲子筛选与关键词组合，索引不携带活动正文和重复图像', () => {
  const records = entries.map(toSearchRecord);
  const family = filterEntries(records, { edition: 'family' });
  assert.equal(family.length, entries.filter((entry) => entry.children).length);
  assert.ok(family.every((entry) => entry.children));
  const found = filterEntries(records, {
    edition: 'family',
    q: pilot.children!.title,
  });
  assert.ok(found.some((entry) => entry.id === pilot.id));
  const record = toSearchRecord(pilot);
  assert.deepEqual(Object.keys(record.children!).sort(), ['summary', 'title']);
  assert.ok(record.works.every((work) => work.image === null));
});
test('日更门禁要求双版与当天唯一档案，旧数据兼容不等于新日更可缺版', () => {
  assert.deepEqual(dailyEntryErrors(pilot, [pilot], pilot.date), []);
  assert.ok(
    dailyEntryErrors({ ...pilot, children: undefined }, [], pilot.date).some(
      (error) => error.includes('亲子版'),
    ),
  );
  assert.ok(
    dailyEntryErrors(
      pilot,
      [{ ...pilot, id: `${pilot.date}-duplicate` }],
      pilot.date,
    ).some((error) => error.includes('重复')),
  );
  assert.ok(
    dailyEntryErrors(pilot, [], '2020-01-01').some((error) =>
      error.includes('当天'),
    ),
  );
  assert.equal(shanghaiDate(new Date('2026-10-10T16:01:00Z')), '2026-10-11');
});
