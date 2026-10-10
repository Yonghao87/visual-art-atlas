import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAndValidate } from '../src/lib/content-validation';
import { entrySchema } from '../src/lib/schema';
import { filterEntries, toSearchRecord } from '../src/lib/search';
import { dailyEntryErrors, shanghaiDate } from '../src/lib/daily';

const entries = (await readAndValidate()).entries;
const pilot = entries.find((entry) => entry.children)!;
const legacyChild = {
  ...structuredClone(pilot.children!),
  observations: [
    { workId: pilot.children!.featuredWorkIds[0]!, question: '你有什么感觉？' },
    {
      workId: pilot.children!.featuredWorkIds[0]!,
      question: '是什么让你这样感受？',
    },
  ],
  activity: {
    title: '画画自己的感受',
    durationMinutes: 8,
    materials: ['纸', '笔'],
    steps: ['欣赏作品。', '画出自己的感受。'],
  },
};
delete legacyChild.lesson;
test('亲子讲解局部必须引用已展示作品，且位于原图范围内', () => {
  const lessonEntry = entries.find((entry) => entry.children?.lesson)!;
  assert.ok(entrySchema.safeParse(lessonEntry).success);
  const original = lessonEntry.children!.lesson!.sections.find(
    (s) => s.detail,
  )!.detail!;
  for (const overrides of [
    { workId: 'missing' },
    { x: original.imageWidth },
    { height: 0 },
  ]) {
    const entry = structuredClone(lessonEntry);
    const detail = entry.children!.lesson!.sections.find(
      (section) => section.detail,
    )!.detail!;
    Object.assign(detail, overrides);
    assert.equal(entrySchema.safeParse(entry).success, false);
  }
});
test('旧数据可无亲子版；新结构共享作品并完整校验', () => {
  const legacy = structuredClone(pilot);
  delete legacy.children;
  assert.ok(entrySchema.safeParse(legacy).success);
  assert.ok(entrySchema.safeParse(pilot).success);
  assert.ok(entrySchema.safeParse({ ...pilot, children: legacyChild }).success);
  for (const mutate of [
    (entry: typeof pilot) => {
      entry.children!.ageRange = '8-12' as '5-7';
    },
    (entry: typeof pilot) => {
      entry.children!.featuredWorkIds = ['missing'];
    },
    (entry: typeof pilot) => {
      entry.children = structuredClone(legacyChild);
      entry.children.observations![0]!.workId = 'missing';
    },
    (entry: typeof pilot) => {
      entry.children = structuredClone(legacyChild);
      entry.children.activity!.steps = ['只有一步'];
    },
    (entry: typeof pilot) => {
      entry.children = structuredClone(legacyChild);
      entry.children.activity!.durationMinutes = 60;
    },
    (entry: typeof pilot) => {
      entry.works[1]!.id = entry.works[0]!.id;
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
test('讲解版可只欣赏与交谈；旧模板缺问题或活动时拒绝', () => {
  const narrative = structuredClone(pilot);
  delete narrative.children!.observations;
  delete narrative.children!.activity;
  assert.ok(entrySchema.safeParse(narrative).success);
  for (const field of ['observations', 'activity'] as const) {
    const legacy = { ...pilot, children: structuredClone(legacyChild) };
    delete legacy.children[field];
    assert.equal(entrySchema.safeParse(legacy).success, false);
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
    dailyEntryErrors({ ...pilot, children: legacyChild }, [], pilot.date).some(
      (error) => error.includes('lesson'),
    ),
  );
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
