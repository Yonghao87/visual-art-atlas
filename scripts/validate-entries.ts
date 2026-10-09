import { readAndValidate } from '../src/lib/content-validation';
const { entries, errors } = await readAndValidate();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `内容校验通过：${entries.length} 条，${entries.filter((e) => e.status === 'published').length} 条已发布。`,
  );
  for (const e of entries.filter((e) => e.status === 'published')) {
    const length = [
      e.context,
      ...e.visualFeatures.map((f) => f.description),
      ...e.applications,
    ].join('').length;
    if (length < 500 || length > 800)
      console.warn(
        `提示：${e.id} 主体约 ${length} 字（建议 500–800，非阻断）。`,
      );
  }
}
