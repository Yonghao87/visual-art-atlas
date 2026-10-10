const adult = document.getElementById('adult-reading');
const family = document.getElementById('family-reading');
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-edition]'),
];
const note = document.getElementById('edition-note');
const key = 'vaa-reading-edition';
type Edition = 'adult' | 'family';

function saved(): Edition {
  try {
    return localStorage.getItem(key) === 'family' ? 'family' : 'adult';
  } catch {
    return 'adult';
  }
}
function apply(edition: Edition, update = false) {
  if (!adult) return;
  const available = edition === 'family' && Boolean(family);
  adult.hidden = available;
  if (family) family.hidden = !available;
  document
    .querySelectorAll<HTMLElement>('[data-adult-only]')
    .forEach((element) => {
      element.hidden = available;
    });
  buttons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.edition === (available ? 'family' : 'adult')),
    );
  });
  const hiddenPanel = available ? adult : family;
  if (hiddenPanel?.contains(document.activeElement)) {
    buttons
      .find(
        (button) => button.dataset.edition === (available ? 'family' : 'adult'),
      )
      ?.focus({ preventScroll: true });
  }
  if (note)
    note.textContent =
      edition === 'family' && !family
        ? '本篇亲子版尚未收录，先阅读成人版。'
        : '';
  if (update) {
    try {
      localStorage.setItem(key, edition);
    } catch {
      /* Preference is optional. */
    }
    const url = new URL(location.href);
    url.searchParams.set('edition', edition);
    url.hash = '';
    history.pushState(null, '', url);
  }
}
function restore() {
  const value = new URLSearchParams(location.search).get('edition');
  if (value === 'adult' || value === 'family') {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Preference is optional. */
    }
  }
  apply(value === null ? saved() : value === 'family' ? 'family' : 'adult');
}
buttons.forEach((button) => {
  button.hidden = false;
  button.addEventListener('click', () =>
    apply(button.dataset.edition as Edition, true),
  );
});
window.addEventListener('popstate', restore);
restore();

document
  .querySelectorAll<HTMLButtonElement>('[data-copy-entry]')
  .forEach((button) => {
    button.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.hash = '';
      url.searchParams.set(
        'edition',
        family && !family.hidden ? 'family' : 'adult',
      );
      const status =
        button.parentElement?.querySelector<HTMLElement>('[role="status"]');
      try {
        await navigator.clipboard.writeText(url.href);
        if (status) status.textContent = '链接已复制';
      } catch {
        if (status) status.textContent = '复制失败，请从地址栏复制链接';
      }
    });
  });
