/* eslint-disable */
/* global WebImporter */
/**
 * Parser for bundle-cards (Atelier "ways to buy").
 * Source: atelier.html #bundles — eyebrow/heading head + three bundle cards
 * (title, description, price [+ struck original or "save $x"], CTA). One card
 * carries a "Most loved" badge.
 *
 * Emits: head default content, then a block whose rows are each a single cell
 * holding [badge? p, h3, desc p, price p, CTA link].
 */
export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  // Head default content.
  const headNodes = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  if (eyebrow && t(eyebrow)) headNodes.push(el('p', t(eyebrow)));
  if (h2) headNodes.push(el('h2', t(h2)));

  const cards = [...element.querySelectorAll('*')].filter((e) => e.querySelector(':scope > h3'));
  const rows = cards.map((card) => {
    const cell = document.createElement('div');
    const badge = [...card.querySelectorAll('*')]
      .filter((e) => e.children.length === 0).map(t).find((x) => /most loved|popular|best/i.test(x));
    if (badge) cell.append(el('p', badge));
    const h3 = card.querySelector('h3');
    if (h3) cell.append(el('h3', t(h3)));
    const desc = card.querySelector('p');
    if (desc && t(desc)) cell.append(el('p', t(desc)));
    const priceEls = [...card.querySelectorAll('*')]
      .filter((e) => e.children.length === 0 && /^([$£€][\d,]+|save\b.*)/i.test(t(e))).map(t);
    if (priceEls.length) cell.append(el('p', priceEls.join(' ')));
    const link = card.querySelector('a, button');
    const cta = el('a', link ? t(link).replace(/\s*→\s*$/, '') || 'Add to cart' : 'Add to cart');
    cta.setAttribute('href', link && link.getAttribute('href') ? link.getAttribute('href') : '#');
    cell.append(cta);
    return [cell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'bundle-cards', cells: rows });
  element.replaceWith(...headNodes, block);
}
