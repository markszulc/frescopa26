/* eslint-disable */
/* global WebImporter */
/**
 * Parser for product-jumpnav (Atelier PDP sticky jump bar).
 * Source: atelier.html section 2 — "Still deciding? / Jump to" + anchor links to
 * on-page sections (#how, #specs, #reviews, #faq, #bundles).
 *
 * Emits a single 2-cell row: [introCell, linksCell].
 */
export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const introCell = document.createElement('div');
  const hint = [...element.querySelectorAll('span, p')].find((s) => /deciding/i.test(t(s)));
  const label = [...element.querySelectorAll('span, p')].find((s) => /jump to/i.test(t(s)));
  if (hint) introCell.append(el('p', t(hint)));
  if (label) introCell.append(el('p', t(label)));

  const linksCell = document.createElement('div');
  const list = el('ul');
  [...element.querySelectorAll('a')].forEach((a) => {
    const li = el('li');
    const link = el('a', t(a));
    link.setAttribute('href', a.getAttribute('href') || '#');
    li.append(link);
    list.append(li);
  });
  linksCell.append(list);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-jumpnav', cells: [[introCell, linksCell]],
  });
  element.replaceWith(block);
}
