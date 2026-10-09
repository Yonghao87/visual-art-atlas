import { z } from 'zod';
import {
  categoryKeys,
  topicTypeKeys,
  featureKeys,
} from '../constants/taxonomy';
const text = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !/^TBD$/i.test(v), '不能使用 TBD 占位');
const https = z
  .url()
  .refine(
    (v) =>
      new URL(v).protocol === 'https:' &&
      !/(^|\.)example\.(com|org|net)$/.test(new URL(v).hostname),
    '必须为真实 HTTPS 来源',
  );
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const t = Date.parse(v);
    return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
  }, '不存在的日历日期');
export const imageSchema = z
  .object({
    src: text.nullable(),
    alt: text,
    credit: text,
    rights: z.enum([
      'public_domain',
      'cc_licensed',
      'permission_granted',
      'own_work',
      'link_only',
      'unknown',
    ]),
    sourceUrl: https,
    licenseUrl: https.optional(),
    permissionNote: text.optional(),
    allowEmbed: z.boolean().optional(),
  })
  .strict();
export const entrySchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/),
    date: dateSchema,
    status: z.enum(['sample', 'draft', 'published']),
    title: text,
    subtitle: text,
    topicType: z.enum(topicTypeKeys),
    category: z.enum(categoryKeys),
    period: text.nullable(),
    regions: z.array(text),
    tags: z.array(text),
    summary: text,
    visualFeatures: z.array(
      z
        .object({ key: z.enum(featureKeys), label: text, description: text })
        .strict(),
    ),
    context: text,
    people: z.array(z.object({ name: text, role: text }).strict()),
    works: z.array(
      z
        .object({
          title: text,
          creator: text,
          year: text.nullable(),
          sourceUrl: https.nullable(),
          image: imageSchema.nullable(),
        })
        .strict(),
    ),
    comparison: z
      .object({ target: text, description: text })
      .strict()
      .nullable(),
    applications: z.array(text),
    experiment: text.nullable(),
    nextTopics: z.array(text),
    relatedIds: z.array(text),
    cover: imageSchema.nullable(),
    sources: z.array(
      z
        .object({
          title: text,
          url: https,
          publisher: text,
          verifiedAt: dateSchema.optional(),
          verificationNote: text.optional(),
        })
        .strict(),
    ),
    updatedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict()
  .superRefine((entry, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (!entry.id.startsWith(`${entry.date}-`))
      issue(['id'], 'ID 日期必须等于 date');
    if (entry.relatedIds.includes(entry.id))
      issue(['relatedIds'], '不可关联自身');
    if (new Set(entry.relatedIds).size !== entry.relatedIds.length)
      issue(['relatedIds'], '关联不可重复');
    if (entry.status !== 'published') return;
    if (!entry.visualFeatures.length)
      issue(['visualFeatures'], '正式内容需要视觉语言分析');
    if (!entry.applications.length)
      issue(['applications'], '正式内容需要现代应用');
    if (
      !entry.sources.length ||
      entry.sources.some((s) => !s.verifiedAt || !s.verificationNote)
    )
      issue(['sources'], '正式内容需要经过核验的来源及核验记录');
    entry.works.forEach((w, i) => {
      if (!w.sourceUrl) issue(['works', i, 'sourceUrl'], '正式作品必须有来源');
    });
    const inspect = (
      img: z.infer<typeof imageSchema> | null,
      path: (string | number)[],
    ) => {
      if (!img?.src) return;
      if (['unknown', 'link_only'].includes(img.rights))
        issue(path, '图片权利不支持展示');
      if (img.rights === 'cc_licensed' && !img.licenseUrl)
        issue(path, 'CC 图片需要许可链接');
      if (img.rights === 'permission_granted' && !img.permissionNote)
        issue(path, '授权图片需要授权记录');
      if (
        !/^\/images\/[a-zA-Z0-9_./-]+$/.test(img.src) &&
        !(img.src.startsWith('https://') && img.allowEmbed)
      )
        issue(path, '图片仅允许本地 /images/ 路径或明确获准的 HTTPS 嵌入');
      if (img.src.includes('..')) issue(path, '图片路径禁止目录穿越');
    };
    inspect(entry.cover, ['cover']);
    entry.works.forEach((w, i) => inspect(w.image, ['works', i, 'image']));
  });
export type Entry = z.infer<typeof entrySchema>;
