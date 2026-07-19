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
 * Items share a `name` so opening one closes the others (single-open, matching
 * the source). Affirmative "claim" items (not phrased as a question) get a
 * leading check icon; question items show only the chevron.
 */
let accordionSeq = 0;

const CHECK_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 5 5 9-11" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

  // Claims are affirmative statements and get a check icon; a set where no
  // summary is phrased as a question is treated as claims.
  const summaries = rows.map((row) => t(row.children[0]));
  const isClaims = summaries.length > 0 && !summaries.some((s) => s.endsWith('?'));
  if (isClaims) block.classList.add('accordion-checks');

  // A shared name makes the native <details> group single-open (exclusive).
  accordionSeq += 1;
  const groupName = `accordion-${accordionSeq}`;

  const list = document.createElement('div');
  list.className = 'accordion-items';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const summaryText = t(cells[0]);
    const bodyEl = cells[1];
    if (!summaryText) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.name = groupName;
    if (i === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'accordion-summary';

    const labelWrap = document.createElement('span');
    labelWrap.className = 'accordion-label';
    if (isClaims) {
      const check = document.createElement('span');
      check.className = 'accordion-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = CHECK_ICON;
      labelWrap.append(check);
    }
    const label = document.createElement('span');
    label.textContent = summaryText;
    labelWrap.append(label);

    const chev = document.createElement('span');
    chev.className = 'accordion-chevron';
    chev.setAttribute('aria-hidden', 'true');
    chev.innerHTML = CHEVRON_ICON;
    summary.append(labelWrap, chev);
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
