/* eslint-disable */
/* global WebImporter */
/**
 * Parser for product-hero (Atelier PDP hero + buy panel).
 * Source: atelier.html section 1 — a gallery (hero image + 4 thumbnails) and a
 * buy panel (eyebrow, name, rating, lede, price, finance, finish swatches,
 * quantity, add-to-cart, trust badges).
 *
 * Emits a single 2-cell row: [galleryCell, buyCell]. The gallery pictures and
 * buy-panel copy are read from the rendered DOM; finance/swatch/trust text that
 * is stable is normalised here.
 */
export default function parse(element, { document, url }) {
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try { img.setAttribute('src', new URL(img.getAttribute('src'), url).href); } catch (e) { /* keep */ }
    });
  }
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
  const pic = (img) => {
    const p = document.createElement('picture');
    const c = document.createElement('img');
    c.setAttribute('src', img.getAttribute('src'));
    c.setAttribute('alt', img.getAttribute('alt') || '');
    p.append(c);
    return p;
  };

  // Gallery: the main image + the thumbnail buttons' images.
  const galleryCell = document.createElement('div');
  const mainImg = element.querySelector('img');
  if (mainImg) galleryCell.append(pic(mainImg));
  const thumbImgs = [...element.querySelectorAll('button img')];
  thumbImgs.forEach((img) => {
    // Use the button's aria-label as the alt so the block can label thumbs.
    const label = img.closest('button')?.getAttribute('aria-label') || img.getAttribute('alt') || '';
    const clone = img.cloneNode(true);
    clone.setAttribute('alt', label);
    const p = document.createElement('picture');
    p.append(clone);
    galleryCell.append(p);
  });

  // Buy panel copy.
  const buyCell = document.createElement('div');
  const scope = element.querySelector('h1')?.closest('div') || element;
  const eyebrow = scope.querySelector('span');
  const h1 = scope.querySelector('h1');
  const ratingA = scope.querySelector('a[href*="review"], a[href="#reviews"]');
  const lede = [...scope.querySelectorAll('p')].find((p) => t(p).length > 40);
  const priceEl = [...scope.querySelectorAll('*')].find((e) => e.children.length === 0 && /^[$£€][\d,]+$/.test(t(e)));
  const financeEl = [...scope.querySelectorAll('*')].find((e) => e.children.length === 0 && /\/mo|month/i.test(t(e)));
  const finishLabelEl = [...scope.querySelectorAll('*')].find((e) => e.children.length === 0 && /^finish/i.test(t(e)));
  const finishes = [...scope.querySelectorAll('button[aria-label]')]
    .map((b) => b.getAttribute('aria-label'))
    .filter((l) => l && /^(cream|charcoal|terracotta)$/i.test(l));
  const ledeText = lede ? t(lede) : '';
  const trust = [...scope.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && t(e).length < 70 && t(e) !== ledeText
      && /delivery|guarantee|mornings|return/i.test(t(e)))
    .map(t).filter((x, i, a) => a.indexOf(x) === i);

  if (eyebrow) buyCell.append(el('p', t(eyebrow)));
  if (h1) buyCell.append(el('h1', t(h1)));
  if (ratingA) buyCell.append(el('p', t(ratingA)));
  if (lede) buyCell.append(el('p', t(lede)));
  if (priceEl) buyCell.append(el('p', t(priceEl)));
  if (financeEl) buyCell.append(el('p', t(financeEl)));
  buyCell.append(el('p', finishLabelEl ? t(finishLabelEl) : 'Finish — Cream'));
  if (finishes.length) {
    const ul = el('ul');
    finishes.forEach((f) => ul.append(el('li', f)));
    buyCell.append(ul);
  }
  if (trust.length) {
    const ul = el('ul');
    trust.forEach((tx) => ul.append(el('li', tx)));
    buyCell.append(ul);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-hero', cells: [[galleryCell, buyCell]],
  });
  element.replaceWith(block);
}
