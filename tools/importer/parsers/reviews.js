/* eslint-disable */
/* global WebImporter */
/**
 * Parser for reviews (Atelier owner reviews).
 * Source: atelier.html section #reviews — eyebrow/heading + aggregate rating
 * ("4.8" / "from 214 verified owners") head, and three review figures (stars,
 * quote blockquote, attribution).
 *
 * Emits a block whose first row is the head (eyebrow, heading, aggregate rating,
 * rating note) and each subsequent row is [ratingCell("5"), quoteCell(quote +
 * attribution)].
 */
export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const headCell = document.createElement('div');
  const h2 = element.querySelector('h2');
  const agg = [...element.querySelectorAll('*')].find((e) => e.children.length === 0 && /^\d(\.\d)?$/.test(t(e)));
  // Eyebrow is the short label before the heading; the aggregate note is the
  // "from N verified owners" line. Both may mention "owners", so anchor the
  // eyebrow to the element preceding the heading rather than a keyword.
  const eyebrow = h2 ? h2.previousElementSibling : element.querySelector('p');
  const aggNote = [...element.querySelectorAll('p')]
    .find((p) => /verified|from \d/i.test(t(p)) && p !== eyebrow);
  if (eyebrow && t(eyebrow) && eyebrow !== aggNote && eyebrow.tagName !== 'H2') headCell.append(el('p', t(eyebrow)));
  if (h2) headCell.append(el('h2', t(h2)));
  if (agg) headCell.append(el('p', t(agg)));
  if (aggNote) headCell.append(el('p', t(aggNote)));

  const rows = [[headCell]];
  [...element.querySelectorAll('figure')].forEach((fig) => {
    const quote = t(fig.querySelector('blockquote'));
    const attr = t(fig.querySelector('figcaption') || [...fig.children].pop());
    const ratingCell = el('div', '5');
    const quoteCell = el('div');
    quoteCell.append(el('blockquote', quote));
    if (attr && attr !== quote) quoteCell.append(el('p', attr));
    rows.push([ratingCell, quoteCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'reviews', cells: rows });
  element.replaceWith(block);
}
