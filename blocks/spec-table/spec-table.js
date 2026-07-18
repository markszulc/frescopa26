/**
 * Specification tables block.
 *
 * Authoring model (rows):
 *   Row 1 (optional head): eyebrow (p), heading (h2). Single cell (no group h3).
 *   Row 2+: one spec group per row, 2 cells:
 *     - cell 1: group title (h3)
 *     - cell 2: a list (ul) whose items read "<label> — <value>" (or the label
 *       and value split across nested elements).
 *   Optional final "In the box" group renders as a plain list of items.
 *
 * Renders a responsive grid of spec cards, each a titled label/value table.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const t = (el) => (el ? el.textContent.trim() : '');

  let head = null;
  if (rows[0].children.length === 1 && !rows[0].querySelector('h3')) {
    const src = rows.shift();
    head = document.createElement('div');
    head.className = 'spec-table-head';
    while (src.firstElementChild) head.append(src.firstElementChild);
  }

  const grid = document.createElement('div');
  grid.className = 'spec-table-grid';
  let inBox = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    const titleCell = cells[0];
    const listCell = cells[1] || cells[0];
    const title = t(titleCell.querySelector('h3') || titleCell);
    const items = [...listCell.querySelectorAll('li')];

    if (/in the box/i.test(title)) {
      inBox = document.createElement('div');
      inBox.className = 'spec-table-inbox';
      const h = document.createElement('h3');
      h.textContent = title;
      const ul = document.createElement('ul');
      items.forEach((li) => {
        const item = document.createElement('li');
        item.textContent = t(li).replace(/^[—–-]\s*/, '');
        ul.append(item);
      });
      inBox.append(h, ul);
      return;
    }

    const card = document.createElement('div');
    card.className = 'spec-table-card';
    const h = document.createElement('h3');
    h.textContent = title;
    card.append(h);
    const dl = document.createElement('dl');
    items.forEach((li) => {
      const parts = [...li.children];
      let label; let value;
      if (parts.length >= 2) {
        label = t(parts[0]);
        value = t(parts[1]);
      } else {
        const raw = t(li);
        const m = raw.split(/\s+[—–-]\s+/);
        [label] = m;
        value = m.slice(1).join(' — ');
      }
      const rowEl = document.createElement('div');
      rowEl.className = 'spec-table-row';
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      rowEl.append(dt, dd);
      dl.append(rowEl);
    });
    card.append(dl);
    grid.append(card);
  });

  block.textContent = '';
  if (head) block.append(head);
  block.append(grid);
  if (inBox) block.append(inBox);
}
