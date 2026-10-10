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
    style_summary: text.optional(),
    children: z
      .object({
        ageRange: z.literal('5-7'),
        title: text,
        summary: text,
        looking: text,
        lesson: z
          .object({
            sections: z
              .array(
                z
                  .object({
                    title: text,
                    paragraphs: z.array(text).min(1).max(4),
                    detail: z
                      .object({
                        workId: text,
                        imageWidth: z.number().int().positive(),
                        imageHeight: z.number().int().positive(),
                        x: z.number().nonnegative(),
                        y: z.number().nonnegative(),
                        width: z.number().positive(),
                        height: z.number().positive(),
                        alt: text,
                        caption: text,
                      })
                      .strict()
                      .optional(),
                  })
                  .strict(),
              )
              .min(2)
              .max(4),
            reflection: text,
          })
          .strict()
          .optional(),
        featuredWorkIds: z.array(text).min(1).max(2),
        observations: z
          .array(z.object({ workId: text, question: text }).strict())
          .min(2)
          .max(3)
          .optional(),
        activity: z
          .object({
            title: text,
            durationMinutes: z.number().int().min(5).max(10),
            materials: z.array(text).min(1).max(6),
            steps: z.array(text).min(2).max(4),
          })
          .strict()
          .optional(),
        takeaway: text,
        parentNote: text,
      })
      .strict()
      .optional(),
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
          id: z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .optional(),
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
    if (
      entry.style_summary &&
      !entry.style_summary.startsWith(`${entry.title}-`)
    )
      issue(['style_summary'], '视觉风格速记必须以档案标题开头');
    if (!entry.id.startsWith(`${entry.date}-`))
      issue(['id'], 'ID 日期必须等于 date');
    if (entry.relatedIds.includes(entry.id))
      issue(['relatedIds'], '不可关联自身');
    if (new Set(entry.relatedIds).size !== entry.relatedIds.length)
      issue(['relatedIds'], '关联不可重复');
    const workIds = entry.works.flatMap((work) => (work.id ? [work.id] : []));
    if (new Set(workIds).size !== workIds.length)
      issue(['works'], '作品 ID 不可重复');
    if (entry.children) {
      const child = entry.children;
      if (new Set(child.featuredWorkIds).size !== child.featuredWorkIds.length)
        issue(['children', 'featuredWorkIds'], '亲子作品引用不可重复');
      child.featuredWorkIds.forEach((id, i) => {
        const work = entry.works.find((w) => w.id === id);
        if (
          !work?.image?.src ||
          ['unknown', 'link_only'].includes(work.image.rights)
        )
          issue(
            ['children', 'featuredWorkIds', i],
            '亲子版必须引用本档案中可展示的作品或原创研究图',
          );
      });
      if (!child.lesson) {
        if (!child.observations)
          issue(['children', 'observations'], '旧版亲子模板需要观察问题');
        if (!child.activity)
          issue(['children', 'activity'], '旧版亲子模板需要活动');
      }
      child.observations?.forEach((observation, i) => {
        if (!child.featuredWorkIds.includes(observation.workId))
          issue(
            ['children', 'observations', i, 'workId'],
            '观察问题必须对应亲子版展示的作品',
          );
      });
      child.lesson?.sections.forEach((section, i) => {
        const detail = section.detail;
        if (!detail) return;
        if (!child.featuredWorkIds.includes(detail.workId))
          issue(
            ['children', 'lesson', 'sections', i, 'detail', 'workId'],
            '局部图必须来自亲子版展示的作品',
          );
        if (
          detail.x + detail.width > detail.imageWidth ||
          detail.y + detail.height > detail.imageHeight
        )
          issue(
            ['children', 'lesson', 'sections', i, 'detail'],
            '局部范围不可超出原图',
          );
      });
    }
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
