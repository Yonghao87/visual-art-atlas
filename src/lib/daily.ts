import type { Entry } from './schema';

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// The global schema stays compatible with historical adult-only entries.
export function dailyEntryErrors(
  entry: Entry,
  existing: Entry[],
  date = shanghaiDate(),
) {
  const errors: string[] = [];
  if (entry.status !== 'published') errors.push('日更候选必须为 published');
  if (entry.date !== date) errors.push('日更日期必须为上海当天日期');
  if (!entry.children) errors.push('新日更必须包含完整的 5–7 岁亲子版');
  if (!entry.style_summary) errors.push('新日更必须包含视觉风格速记');
  if (
    existing.some(
      (other) =>
        other.status === 'published' &&
        other.date === date &&
        other.id !== entry.id,
    )
  )
    errors.push('当天已有另一份正式档案，禁止重复日更');
  return errors;
}
