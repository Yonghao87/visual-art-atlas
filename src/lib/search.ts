import { synonyms, type Category, type TopicType } from '../constants/taxonomy';
import type { Entry } from './schema';
export type SearchRecord = Pick<
  Entry,
  | 'id'
  | 'title'
  | 'subtitle'
  | 'summary'
  | 'style_summary'
  | 'category'
  | 'topicType'
  | 'date'
  | 'tags'
  | 'people'
  | 'works'
  | 'visualFeatures'
  | 'regions'
  | 'period'
>;
export type Filters = {
  q: string;
  category: string;
  type: string;
  tag: string;
  sort: string;
};
export function searchable(e: SearchRecord) {
  return [
    e.title,
    e.subtitle,
    e.summary,
    e.style_summary ?? '',
    e.period,
    ...e.regions,
    ...e.tags,
    ...e.people.map((p) => p.name),
    ...e.works.map((w) => `${w.title} ${w.creator}`),
    ...e.visualFeatures.map((f) => `${f.label} ${f.description}`),
  ]
    .join(' ')
    .normalize('NFKC')
    .toLocaleLowerCase();
}
function normalizeTerm(term: string) {
  return term.normalize('NFKC').toLocaleLowerCase();
}
export function matchesQuery(e: SearchRecord, q: string) {
  const haystack = searchable(e);
  let query = normalizeTerm(q);
  for (const group of synonyms) {
    for (const phrase of group) {
      if (phrase.includes(' '))
        query = query.replaceAll(normalizeTerm(phrase), group[0]);
    }
  }
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((raw) => {
      const word = normalizeTerm(raw);
      const group = synonyms.find((g) =>
        g.some((s) => normalizeTerm(s) === word),
      );
      return (group ?? [word]).some((s) => haystack.includes(normalizeTerm(s)));
    });
}
export function filterEntries<T extends SearchRecord>(
  entries: T[],
  filters: Partial<Filters> = {},
) {
  return entries
    .filter(
      (e) =>
        (!filters.category || e.category === (filters.category as Category)) &&
        (!filters.type || e.topicType === (filters.type as TopicType)) &&
        (!filters.tag || e.tags.includes(filters.tag)) &&
        matchesQuery(e, filters.q ?? ''),
    )
    .sort((a, b) =>
      filters.sort === 'oldest'
        ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
        : b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    );
}
export function toSearchRecord(e: Entry): SearchRecord {
  return {
    id: e.id,
    title: e.title,
    subtitle: e.subtitle,
    summary: e.summary,
    style_summary: e.style_summary,
    category: e.category,
    topicType: e.topicType,
    date: e.date,
    tags: e.tags,
    people: e.people,
    works: e.works.map((w) => ({ ...w, image: null })),
    visualFeatures: e.visualFeatures,
    regions: e.regions,
    period: e.period,
  };
}
