import type { Entry } from './schema';
export function visibleEntries(entries: Entry[], demo = false) {
  return entries.filter(
    (e) => e.status === 'published' || (demo && e.status === 'sample'),
  );
}
export function relatedEntries(e: Entry, entries: Entry[]) {
  const candidates = entries.filter((x) => x.id !== e.id);
  const score = (x: Entry) =>
    (e.relatedIds.includes(x.id) ? 100 : 0) +
    (x.category === e.category ? 5 : 0) +
    x.tags.filter((t) => e.tags.includes(t)).length * 3;
  return candidates
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        b.date.localeCompare(a.date) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 4);
}
