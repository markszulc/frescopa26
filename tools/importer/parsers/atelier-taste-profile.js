/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Atelier PDP flavour-DNA radar. Reuses the existing
 * `taste-profile` block (blocks/taste-profile), which renders a six-axis radar
 * and profile toggle buttons and fills readout copy + radar values from a
 * canonical dataset keyed by the profile label (weekday / slow-sunday /
 * after-dinner). Source: atelier.html #dna.
 *
 * Authoring model (from the block): row 1 = copy (eyebrow, heading, lede);
 * rows 2+ = one profile per row, [label, readout title, readout note]. Only the
 * active profile's readout is present statically, so non-active rows carry just
 * the label and the block supplies the rest.
 */
export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const copy = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  const lede = [...element.querySelectorAll('p')].find((p) => t(p).length > 40);
  if (eyebrow && t(eyebrow) && eyebrow !== lede) copy.push(el('p', t(eyebrow)));
  if (h2) copy.push(el('h2', t(h2)));
  if (lede) copy.push(el('p', t(lede)));

  const cells = [[copy]];

  const buttons = [...element.querySelectorAll('[role="group"] button, button')]
    .filter((b) => t(b) && t(b).length < 24);
  const readoutTitle = t(element.querySelector('h4'));
  const readoutNote = [...element.querySelectorAll('p')]
    .map(t).filter((x) => x.length > 30 && x !== t(lede)).pop() || '';

  buttons.forEach((btn) => {
    const label = t(btn);
    const isActive = btn.getAttribute('aria-pressed') === 'true';
    if (isActive) cells.push([label, readoutTitle || label, readoutNote]);
    else cells.push([label]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'taste-profile', cells });
  element.replaceWith(block);
}
