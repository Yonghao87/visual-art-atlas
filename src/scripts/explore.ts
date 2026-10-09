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
    ['q', 'category', 'type', 'tag', 'sort'].map((key) => [
      key,
      String(data.get(key) ?? ''),
    ]),
  ) as Filters;
}
function restore() {
  const params = new URLSearchParams(location.search);
  form.reset();
  for (const key of ['q', 'category', 'type', 'tag', 'sort']) {
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
  matches.forEach((e) => grid.append(cards.get(e.id)!));
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
