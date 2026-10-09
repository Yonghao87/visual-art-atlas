import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { filterEntries } from '../lib/search';
import { path } from '../lib/paths';
export const prerender = true;
export const GET: APIRoute = async () => {
  const entries = filterEntries(
    (await getCollection('entries'))
      .map((e) => e.data)
      .filter((e) => e.status === 'published'),
  );
  const catalog = {
    schemaVersion: 1,
    entries: entries.map((e) => ({
      id: e.id,
      title: e.title,
      summary: e.summary,
      date: e.date,
      category: e.category,
      topicType: e.topicType,
      tags: e.tags,
      url: path(`/entries/${e.id}/`),
    })),
  };
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
