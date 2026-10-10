import { filterEntries, type SearchRecord, type Filters } from '../lib/search';
const entries = JSON.parse(
  document.getElementById('search-index')?.textContent ?? '[]',
) as SearchRecord[];
const form = document.getElementById('filters') as HTMLFormElement;
const grid = document.getElementById('results')!;
const cards = new Map(
  [...grid.querySelectorAll<HTMLElement>('[data-entry-id]')].map((card) => [
    card.dataset.entryId!,
    card,
  ]),
);
function state(): Filters {
  const data = new FormData(form);
  return Object.fromEntries(
    ['q', 'category', 'type', 'tag', 'sort', 'edition'].map((key) => [
      key,
      String(data.get(key) ?? ''),
    ]),
  ) as Filters;
}
function restore() {
  const params = new URLSearchParams(location.search);
  form.reset();
  for (const key of ['q', 'category', 'type', 'tag', 'sort', 'edition']) {
    const item = form.elements.namedItem(key);
    const value = params.get(key);
    if (value === null) continue;
    if (item instanceof RadioNodeList) {
      const radio = [
        ...form.querySelectorAll<HTMLInputElement>('input[name="category"]'),
      ].find((el) => el.value === value);
      if (radio) radio.checked = true;
    } else if (item instanceof HTMLInputElement) item.value = value;
    else if (
      item instanceof HTMLSelectElement &&
      [...item.options].some((o) => o.value === value)
    )
      item.value = value;
  }
  render(false);
}
function render(update = true) {
  const filters = state();
  const matches = filterEntries(entries, filters);
  const ids = new Set(matches.map((e) => e.id));
  cards.forEach((card, id) => (card.hidden = !ids.has(id)));
  // Do not detach the clicked card on the search input's blur/change event.
  filterEntries(entries, { sort: filters.sort }).forEach((entry, index) => {
    const card = cards.get(entry.id)!;
    if (grid.children[index] !== card)
      grid.insertBefore(card, grid.children[index] ?? null);
  });
  cards.forEach((card, id) => {
    const entry = entries.find((e) => e.id === id)!;
    const family = filters.edition === 'family' && entry.children;
    const title = card.querySelector<HTMLElement>('[data-card-title]');
    const summary = card.querySelector<HTMLElement>('[data-card-summary]');
    if (title) title.textContent = family ? entry.children!.title : entry.title;
    if (summary)
      summary.textContent = family ? entry.children!.summary : entry.summary;
    const link = card.querySelector<HTMLAnchorElement>('.card-link')!;
    const url = new URL(link.href);
    if (family) url.searchParams.set('edition', 'family');
    else url.searchParams.delete('edition');
    link.href = url.href;
  });
  document.getElementById('result-count')!.textContent =
    `${matches.length} 份档案${matches.length !== entries.length ? ` / 共 ${entries.length} 份` : ''}`;
  document.getElementById('empty-state')!.hidden = matches.length > 0;
  if (update) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value && !(key === 'sort' && value === 'newest'))
        params.set(key, value);
    const query = params.toString();
    const next = `${location.pathname}${query ? '?' + query : ''}${location.hash}`;
    if (next !== `${location.pathname}${location.search}${location.hash}`)
      history.pushState(null, '', next);
  }
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  render();
});
form.addEventListener('change', () => render());
let timer: ReturnType<typeof setTimeout>;
form.querySelector('input[type="search"]')?.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => render(), 180);
});
form.addEventListener('reset', () => {
  clearTimeout(timer);
  requestAnimationFrame(() => render());
});
document.getElementById('clear-filters')?.addEventListener('click', () => {
  form.reset();
  (form.elements.namedItem('q') as HTMLInputElement).focus();
});
window.addEventListener('popstate', restore);
restore();
