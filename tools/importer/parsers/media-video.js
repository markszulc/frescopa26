/* eslint-disable */
/* global WebImporter */
/**
 * Parser for media-video (Atelier film teaser).
 * Source: atelier.html section 4 — eyebrow/heading head, a poster image with a
 * play button + duration badge, and a footnote paragraph.
 *
 * Emits rows: [head default content], [poster picture + duration], [footnote].
 */
export default function parse(element, { document, url }) {
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try { img.setAttribute('src', new URL(img.getAttribute('src'), url).href); } catch (e) { /* keep */ }
    });
  }
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const headCell = document.createElement('div');
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  const footText = [...element.querySelectorAll('p')].map(t).find((x) => x.length > 40);
  if (eyebrow && t(eyebrow) && t(eyebrow) !== footText) headCell.append(el('p', t(eyebrow)));
  if (h2) headCell.append(el('h2', t(h2)));

  const posterCell = document.createElement('div');
  const img = element.querySelector('img');
  if (img) {
    const p = document.createElement('picture');
    const c = document.createElement('img');
    c.setAttribute('src', img.getAttribute('src'));
    c.setAttribute('alt', img.getAttribute('alt') || '');
    p.append(c);
    posterCell.append(p);
  }
  const duration = [...element.querySelectorAll('*')]
    .map(t).find((x) => /^\d+:\d+$/.test(x));
  if (duration) posterCell.append(el('p', duration));

  const cells = [[headCell], [posterCell]];
  if (footText) cells.push([el('p', footText)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'media-video', cells });
  element.replaceWith(block);
}
