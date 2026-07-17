import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Product hero / buy panel for the Atelier PDP.
 *
 * Authoring model (single row, 2 cells):
 *   - cell 1: gallery — the main product picture followed by 0–4 thumbnail
 *     pictures. The first picture is the hero; the rest become clickable
 *     thumbnails that swap the hero image.
 *   - cell 2: the buy panel, a flat list of default content:
 *       eyebrow (p), name (h1), rating (p, "4.8 · 214 reviews"),
 *       lede (p), price (p, "$2,199"), finance (p, "or $184/mo…"),
 *       finish label (p, "Finish — Cream"), finishes (ul), trust badges (ul).
 *     Each element is matched by content, so order is forgiving.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const galleryCell = cells.find((c) => c.querySelector('picture')) || cells[0];
  const buyCell = cells.find((c) => c !== galleryCell) || cells[cells.length - 1];

  const wrap = document.createElement('div');
  wrap.className = 'product-hero-inner';

  // --- Gallery ---
  const gallery = document.createElement('div');
  gallery.className = 'product-hero-gallery';
  const pictures = [...(galleryCell ? galleryCell.querySelectorAll('picture') : [])];
  pictures.forEach((p) => {
    const img = p.querySelector('img');
    if (img) p.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  const freshPics = [...(galleryCell ? galleryCell.querySelectorAll('picture') : [])];

  const stage = document.createElement('div');
  stage.className = 'product-hero-stage';
  const heroImg = freshPics[0] ? freshPics[0].querySelector('img').cloneNode(true) : null;
  if (heroImg) {
    heroImg.removeAttribute('width');
    heroImg.removeAttribute('height');
    stage.append(heroImg);
  }
  gallery.append(stage);

  if (freshPics.length > 1) {
    const thumbs = document.createElement('div');
    thumbs.className = 'product-hero-thumbs';
    freshPics.forEach((pic, i) => {
      const img = pic.querySelector('img');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'product-hero-thumb';
      if (i === 0) btn.classList.add('is-active');
      btn.setAttribute('aria-label', img.alt || `View image ${i + 1}`);
      const timg = img.cloneNode(true);
      timg.alt = '';
      btn.append(timg);
      btn.addEventListener('click', () => {
        if (heroImg) { heroImg.src = img.src; heroImg.alt = img.alt || ''; }
        thumbs.querySelectorAll('.product-hero-thumb').forEach((t) => t.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
      thumbs.append(btn);
    });
    gallery.append(thumbs);
  }

  // --- Buy panel ---
  const panel = document.createElement('div');
  panel.className = 'product-hero-panel';
  const kids = buyCell ? [...buyCell.children] : [];
  const t = (el) => (el ? el.textContent.trim() : '');

  const heading = kids.find((el) => /^H[1-6]$/.test(el.tagName));
  const paras = kids.filter((el) => el.tagName === 'P');
  const lists = kids.filter((el) => el.tagName === 'UL');

  const rating = paras.find((p) => /review|★|·/.test(t(p)) && /\d/.test(t(p)) && t(p).length < 40);
  const price = paras.find((p) => /^[$£€]\s?\d/.test(t(p)));
  const finance = paras.find((p) => /\/mo|month/i.test(t(p)));
  const finishLabel = paras.find((p) => /^finish/i.test(t(p)));
  const eyebrow = paras.find((p) => p !== rating && p !== price && p !== finance
    && p !== finishLabel && t(p).length < 32 && kids.indexOf(p) < kids.indexOf(heading));
  const used = new Set([rating, price, finance, finishLabel, eyebrow]);
  const lede = paras.find((p) => !used.has(p) && t(p).length >= 32);

  if (eyebrow) {
    const e = document.createElement('span');
    e.className = 'product-hero-eyebrow';
    e.textContent = t(eyebrow);
    panel.append(e);
  }
  if (heading) {
    const h = document.createElement('h1');
    h.className = 'product-hero-name';
    h.textContent = t(heading);
    if (heading.id) h.id = heading.id;
    panel.append(h);
  }
  if (rating) {
    const r = document.createElement('a');
    r.className = 'product-hero-rating';
    r.href = '#reviews';
    r.textContent = t(rating);
    panel.append(r);
  }
  if (lede) {
    const l = document.createElement('p');
    l.className = 'product-hero-lede';
    l.textContent = t(lede);
    panel.append(l);
  }

  const priceRow = document.createElement('div');
  priceRow.className = 'product-hero-price';
  if (price) {
    const p = document.createElement('span');
    p.className = 'product-hero-amount';
    p.textContent = t(price);
    priceRow.append(p);
  }
  if (finance) {
    const f = document.createElement('span');
    f.className = 'product-hero-finance';
    f.textContent = t(finance);
    priceRow.append(f);
  }
  if (priceRow.children.length) panel.append(priceRow);

  // Finishes (swatches). The list precedes trust; identify by short items.
  const finishes = lists.find((ul) => [...ul.children].every((li) => t(li).length < 24));
  const trust = lists.find((ul) => ul !== finishes);

  if (finishLabel || finishes) {
    const fWrap = document.createElement('div');
    fWrap.className = 'product-hero-finish';
    const fLabel = document.createElement('p');
    fLabel.className = 'product-hero-finish-label';
    fLabel.textContent = finishLabel ? t(finishLabel) : 'Finish';
    fWrap.append(fLabel);
    if (finishes) {
      const swatches = document.createElement('div');
      swatches.className = 'product-hero-swatches';
      [...finishes.children].forEach((li, i) => {
        const name = t(li);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'product-hero-swatch';
        btn.dataset.finish = name.toLowerCase();
        if (i === 0) btn.classList.add('is-active');
        btn.setAttribute('aria-label', name);
        btn.addEventListener('click', () => {
          swatches.querySelectorAll('.product-hero-swatch').forEach((s) => s.classList.remove('is-active'));
          btn.classList.add('is-active');
          fLabel.textContent = `Finish — ${name}`;
        });
        swatches.append(btn);
      });
      fWrap.append(swatches);
    }
    panel.append(fWrap);
  }

  // Quantity stepper + add to cart.
  const actions = document.createElement('div');
  actions.className = 'product-hero-actions';
  const qty = document.createElement('div');
  qty.className = 'product-hero-qty';
  let count = 1;
  const dec = document.createElement('button');
  dec.type = 'button';
  dec.setAttribute('aria-label', 'Decrease quantity');
  dec.textContent = '−';
  const num = document.createElement('span');
  num.textContent = String(count);
  const inc = document.createElement('button');
  inc.type = 'button';
  inc.setAttribute('aria-label', 'Increase quantity');
  inc.textContent = '+';
  dec.addEventListener('click', () => { count = Math.max(1, count - 1); num.textContent = String(count); });
  inc.addEventListener('click', () => { count += 1; num.textContent = String(count); });
  qty.append(dec, num, inc);
  const cart = document.createElement('button');
  cart.type = 'button';
  cart.className = 'product-hero-cart';
  cart.textContent = 'Add to cart';
  actions.append(qty, cart);
  panel.append(actions);

  if (trust) {
    const tl = document.createElement('ul');
    tl.className = 'product-hero-trust';
    [...trust.children].forEach((li) => {
      const item = document.createElement('li');
      item.textContent = t(li);
      tl.append(item);
    });
    panel.append(tl);
  }

  wrap.append(gallery, panel);
  block.textContent = '';
  block.append(wrap);
}
