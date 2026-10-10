import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { entrySchema } from '../src/lib/schema';
import { readAndValidate } from '../src/lib/content-validation';
import { dailyEntryErrors } from '../src/lib/daily';

const file = process.argv[2];
if (!file)
  throw new Error(
    '用法：npm run validate:daily -- src/data/entries/YYYY-MM-DD-slug.json',
  );
const entry = entrySchema.parse(
  JSON.parse(await readFile(resolve(file), 'utf8')),
);
if (resolve(file) !== resolve('src/data/entries', `${entry.id}.json`))
  throw new Error('日更门禁必须检查仓库内与 ID 同名的实际发布文件');
const result = await readAndValidate();
const errors = [...result.errors, ...dailyEntryErrors(entry, result.entries)];
if (errors.length) throw new Error(errors.join('\n'));
console.log(`${entry.id}：上海当天日期、唯一日更、成人与亲子双版校验通过。`);
