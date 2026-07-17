/**
 * Accordion block — expandable question/answer or claim/detail items.
 *
 * Authoring model (rows):
 *   Row 1 (optional head): eyebrow (p), heading (h2), lede (p), optional CTA
 *     link — a single cell with no answer partner. Detected when the row has one
 *     cell.
 *   Row 2+: one item per row, 2 cells:
 *     - cell 1: the summary / question
 *     - cell 2: the answer body
 *
 * Renders each item as a native <details>/<summary> so it works without JS.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const t = (el) => (el ? el.textContent.trim() : '');

  let head = null;
  if (rows[0].children.length === 1) {
    head = rows.shift();
    const h = document.createElement('div');
    h.className = 'accordion-head';
    while (head.firstElementChild) h.append(head.firstElementChild);
    head = h;
  }

  const list = document.createElement('div');
  list.className = 'accordion-items';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const summaryText = t(cells[0]);
    const bodyEl = cells[1];
    if (!summaryText) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    if (i === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'accordion-summary';
    const label = document.createElement('span');
    label.textContent = summaryText;
    const chev = document.createElement('span');
    chev.className = 'accordion-chevron';
    chev.setAttribute('aria-hidden', 'true');
    chev.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    summary.append(label, chev);
    details.append(summary);

    const body = document.createElement('div');
    body.className = 'accordion-body';
    if (bodyEl) {
      const p = document.createElement('p');
      p.textContent = t(bodyEl.querySelector('p') || bodyEl);
      body.append(p);
    }
    details.append(body);
    list.append(details);
  });

  block.textContent = '';
  if (head) block.append(head);
  block.append(list);
}
