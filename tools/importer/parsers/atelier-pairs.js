/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Atelier PDP "Stock the shelf beside it." section. Reuses the
 * existing `cards-product` block (blocks/cards-product), whose decorator treats
 * the first body paragraph as a category badge overlaid on the image and the
 * last paragraph as a merged "price + CTA" line. Source: atelier.html section 11
 * (three product <article> cards: coffee, tea, juice).
 *
 * Emits head default content (eyebrow, heading), then a cards-product block with
 * one row per card: [imageCell, bodyCell(category p, h3, description p, price+CTA p)].
 */
export default function parse(element, { document, url }) {
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try { img.setAttribute('src', new URL(img.getAttribute('src'), url).href); } catch (e) { /* keep */ }
    });
  }
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const headNodes = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  if (eyebrow && t(eyebrow)) headNodes.push(el('p', t(eyebrow)));
  if (h2) headNodes.push(el('h2', t(h2)));

  const rows = [...element.querySelectorAll('article')].map((art) => {
    const imageCell = document.createElement('div');
    const img = art.querySelector('img');
    if (img) {
      const picture = document.createElement('picture');
      const clone = document.createElement('img');
      clone.setAttribute('src', img.getAttribute('src'));
      clone.setAttribute('alt', img.getAttribute('alt') || '');
      picture.append(clone);
      imageCell.append(picture);
    }
    const bodyCell = document.createElement('div');
    const cat = [...art.querySelectorAll('span, div')]
      .find((e) => e.children.length === 0 && /^(coffee|tea|juice)$/i.test(t(e)));
    if (cat) bodyCell.append(el('p', t(cat)));
    const h3 = art.querySelector('h3');
    if (h3) bodyCell.append(el('h3', t(h3)));
    const desc = art.querySelector('p');
    if (desc && t(desc)) bodyCell.append(el('p', t(desc)));
    const price = [...art.querySelectorAll('span, div')]
      .find((e) => e.children.length === 0 && /^[$£€]\d/.test(t(e)));
    // Merge price + CTA so the block splits it into price span + CTA link.
    bodyCell.append(el('p', `${price ? t(price) : ''}Add to cart →`));
    return [imageCell, bodyCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells: rows });
  element.replaceWith(...headNodes, block);
}
