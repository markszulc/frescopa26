/**
 * Machine filter tabs.
 *
 * Authoring model (rows): each row is a tab with two cells:
 *   - cell 1: tab label (e.g. "Bean-to-cup")
 *   - cell 2: the family key it reveals (e.g. "bean-to-cup"), or "all" to show
 *     every family.
 *
 * Clicking a tab toggles visibility of the family sections on the page, matched
 * by their `data-family` attribute (set from section-metadata). Purely
 * client-side — no navigation.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const tabs = [];

  const toKey = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  rows.forEach((row) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim() || '';
    if (!label) return;
    const family = (cells[1]?.textContent.trim() || label);
    const key = family.toLowerCase() === 'all' ? 'all' : toKey(family);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'machine-filter-tab';
    btn.textContent = label;
    btn.dataset.family = key;
    btn.setAttribute('aria-pressed', 'false');
    tabs.push(btn);
  });

  const applyFilter = (key) => {
    const sections = document.querySelectorAll('main .section[data-family]');
    sections.forEach((section) => {
      const show = key === 'all' || section.dataset.family === key;
      section.classList.toggle('is-filtered-out', !show);
    });
    tabs.forEach((t) => {
      const active = t.dataset.family === key;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.family));
  });

  block.textContent = '';
  const bar = document.createElement('div');
  bar.className = 'machine-filter-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Filter machines by type');
  tabs.forEach((btn) => bar.append(btn));
  block.append(bar);

  // Default to the first tab ("All machines").
  if (tabs.length) applyFilter(tabs[0].dataset.family);
}
