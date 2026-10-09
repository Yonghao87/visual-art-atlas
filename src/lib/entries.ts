import { getCollection } from 'astro:content';
import { filterEntries } from './search';
import { visibleEntries } from './visibility';
export const demoMode = import.meta.env.PUBLIC_DEMO_MODE === 'true';
export async function getEntries() {
  const items = await getCollection('entries');
  return filterEntries(
    visibleEntries(
      items.map((e) => e.data),
      demoMode,
    ),
  );
}
