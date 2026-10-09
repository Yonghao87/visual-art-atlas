import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { entrySchema, type Entry } from './schema';
export function validateRecords(records: { file: string; value: unknown }[]) {
  const errors: string[] = [];
  const entries: Entry[] = [];
  const ids = new Set<string>();
  for (const { file, value } of records) {
    const parsed = entrySchema.safeParse(value);
    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map(
          (i) => `${file} [${i.path.join('.')}] ${i.message}`,
        ),
      );
      continue;
    }
    const e = parsed.data;
    if (basename(file, '.json') !== e.id)
      errors.push(`${file}: 文件名与 id 不一致`);
    if (ids.has(e.id)) errors.push(`${file}: 重复 id ${e.id}`);
    ids.add(e.id);
    entries.push(e);
  }
  const byId = new Map(entries.map((e) => [e.id, e]));
  for (const e of entries)
    for (const id of e.relatedIds) {
      const related = byId.get(id);
      if (
        !related ||
        (e.status === 'published' && related.status !== 'published')
      )
        errors.push(`${e.id}: relatedIds ${id} 不存在或未发布`);
    }
  return { entries, errors };
}
export async function readAndValidate(
  directory = resolve('src/data/entries'),
  publicDir = resolve('public'),
) {
  const records: { file: string; value: unknown }[] = [];
  const errors: string[] = [];
  for (const file of (await readdir(directory))
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    try {
      records.push({
        file,
        value: JSON.parse(await readFile(resolve(directory, file), 'utf8')),
      });
    } catch (error) {
      errors.push(
        `${resolve(directory, file)}: 无法读取 JSON (${String(error)})`,
      );
    }
  }
  const result = validateRecords(records);
  errors.push(...result.errors);
  for (const e of result.entries.filter((e) => e.status === 'published'))
    for (const img of [e.cover, ...e.works.map((w) => w.image)]) {
      if (img?.src?.startsWith('/images/')) {
        try {
          await access(resolve(publicDir, `.${img.src}`));
        } catch {
          errors.push(`${e.id}: 本地图片不存在 ${img.src}`);
        }
      }
    }
  return { entries: result.entries, errors };
}
