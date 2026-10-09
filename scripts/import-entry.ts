import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { entrySchema } from '../src/lib/schema';
import { readAndValidate } from '../src/lib/content-validation';
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!file) {
  console.error(
    '用法：npm run import:entry -- /绝对路径/entry.json [--dry-run]',
  );
  process.exit(1);
}
const value = JSON.parse(await readFile(resolve(file), 'utf8'));
const entry = entrySchema.parse(value);
if (entry.status !== 'draft') {
  console.error(
    '入库接口仅接受 draft。来源与版权审核完成后，由人工通过 PR 修改为 published。',
  );
  process.exit(1);
}
const existing = await readAndValidate();
if (existing.errors.length) throw new Error(existing.errors.join('\n'));
if (existing.entries.some((e) => e.id === entry.id))
  throw new Error(`已存在 ${entry.id}；禁止覆盖。`);
for (const id of entry.relatedIds)
  if (!existing.entries.some((e) => e.id === id))
    throw new Error(`关联不存在：${id}`);
const target = resolve('src/data/entries', entry.id + '.json');
if (dryRun) {
  console.log(`DRY RUN 校验通过；不会写入：${target}`);
} else {
  await writeFile(target, JSON.stringify(entry, null, 2) + '\n', {
    flag: 'wx',
  });
  const result = await readAndValidate();
  if (result.errors.length) {
    await unlink(target);
    throw new Error(result.errors.join('\n'));
  }
  console.log(`草稿已入库：${target}。未发布、未调用API、未创建提交。`);
}
