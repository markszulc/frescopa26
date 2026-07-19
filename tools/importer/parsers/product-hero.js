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

  // Gallery: the thumbnail buttons' images. The first thumbnail is the source's
  // main/hero image, so emitting only the thumbnails avoids a duplicate first
  // tile — the block uses picture[0] as the initial hero. Fall back to the lone
  // main image when there are no thumbnail buttons.
  const galleryCell = document.createElement('div');
  const thumbImgs = [...element.querySelectorAll('button img')];
  if (thumbImgs.length) {
    thumbImgs.forEach((img) => {
      // Use the button's aria-label as the alt so the block can label thumbs.
      const label = img.closest('button')?.getAttribute('aria-label') || img.getAttribute('alt') || '';
      const clone = img.cloneNode(true);
      clone.setAttribute('alt', label);
      const p = document.createElement('picture');
      p.append(clone);
      galleryCell.append(p);
    });
  } else {
    const mainImg = element.querySelector('img');
    if (mainImg) galleryCell.append(pic(mainImg));
  }

  // Buy panel copy.
  const buyCell = document.createElement('div');
  const scope = element.querySelector('h1')?.closest('div') || element;

  // Breadcrumb: the section's leading <nav> (Home / Machines / The Atelier).
  const crumbNav = element.querySelector('nav');
  if (crumbNav) {
    const p = el('p');
    const parts = [...crumbNav.children].filter((c) => c.tagName === 'A' || c.tagName === 'SPAN');
    parts.forEach((c, i) => {
      const label = t(c);
      if (!label) return;
      if (c.tagName === 'A' && label !== '/') {
        const a = el('a', label);
        a.setAttribute('href', c.getAttribute('href') || '#');
        p.append(a);
      } else if (label !== '/') {
        p.append(document.createTextNode(label));
      }
      // Re-insert separators between crumb items (drop the source spans' glyph).
      const next = parts[i + 1];
      if (next && t(next) && label !== '/' && t(next) !== '/') p.append(document.createTextNode(' / '));
    });
    // If separators collapsed (all spans), fall back to a slash-joined line.
    if (!p.textContent.includes('/')) {
      p.textContent = parts.map(t).filter((x) => x && x !== '/').join(' / ');
    }
    if (t(p)) buyCell.append(p);
  }

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
  // Finishes as a comma-separated paragraph (not a <ul>): inside a block table
  // cell, the markdown round-trip drops sibling paragraphs that precede a list,
  // which was dropping the trust badges. Keeping the cell list-free preserves
  // every line. The block splits this into swatch buttons.
  if (finishes.length) buyCell.append(el('p', `Finishes: ${finishes.join(', ')}`));
  // Trust badges as trailing paragraphs, matched by keyword in the block.
  trust.forEach((tx) => buyCell.append(el('p', tx)));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-hero', cells: [[galleryCell, buyCell]],
  });
  element.replaceWith(block);
}
