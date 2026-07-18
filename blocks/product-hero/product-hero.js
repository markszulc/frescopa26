import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Product hero / buy panel for the Atelier PDP.
 *
 * Authoring model (single row, 2 cells):
 *   - cell 1: gallery — the main product picture followed by 0–4 thumbnail
 *     pictures. The first picture is the hero; the rest become clickable
 *     thumbnails that swap the hero image.
 *   - cell 2: the buy panel, a flat list of default content:
 *       breadcrumb (p with "/" separators or links), eyebrow (p), name (h1),
 *       rating (p, "4.8 · 214 reviews"), lede (p), price (p, "$2,199"),
 *       finance (p, "or $184/mo…"), finish label (p, "Finish — Cream"),
 *       finishes (ul), trust badges (ul).
 *     Each element is matched by content, so order is forgiving.
 */

// Inline SVG icons for the trust badges, keyed by the badge's meaning.
const TRUST_ICONS = {
  delivery: '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke-linejoin="round"></path><circle cx="7" cy="18" r="1.6"></circle><circle cx="17.5" cy="18" r="1.6"></circle>',
  guarantee: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" stroke-linejoin="round"></path><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>',
  returns: '<path d="M4 12a8 8 0 1 1 2.3 5.6" stroke-linecap="round"></path><path d="M4 6v5h5" stroke-linecap="round" stroke-linejoin="round"></path>',
};

// Default trust badges for the Atelier PDP. The source's reassurance lines do
// not survive the markdown import round-trip (html2md drops the trailing
// paragraphs of this cell), so the block supplies them when the authored
// content omits them. Authored trust paragraphs, when present, take precedence.
const DEFAULT_TRUST = [
  "Free delivery, and we'll set it up for you.",
  'Two-year workshop guarantee.',
  'Thirty mornings to fall for it, or send it back.',
];

function trustIcon(text) {
  const l = text.toLowerCase();
  let key = 'guarantee';
  if (/deliver|set it up|ship/.test(l)) key = 'delivery';
  else if (/return|send it back|morning|trial|fall for/.test(l)) key = 'returns';
  else if (/guarantee|warranty|workshop/.test(l)) key = 'guarantee';
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${TRUST_ICONS[key]}</svg>`;
}

function starRow(count = 5) {
  const wrap = document.createElement('span');
  wrap.className = 'product-hero-stars';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement('span');
    s.className = 'product-hero-star';
    s.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
    wrap.append(s);
  }
  return wrap;
}
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const galleryCell = cells.find((c) => c.querySelector('picture')) || cells[0];
  const buyCell = cells.find((c) => c !== galleryCell) || cells[cells.length - 1];

  const wrap = document.createElement('div');
  wrap.className = 'product-hero-inner';

  // The breadcrumb spans full width above the gallery + panel grid.
  let breadcrumbNav = null;

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
  const headingIdx = heading ? kids.indexOf(heading) : 0;
  const paras = kids.filter((el) => el.tagName === 'P');
  const lists = kids.filter((el) => el.tagName === 'UL');

  // Breadcrumb: the leading paragraph carrying links and/or "/" separators,
  // ahead of the heading.
  const breadcrumb = paras.find((p) => kids.indexOf(p) < headingIdx
    && (p.querySelector('a') || t(p).includes('/')));
  const rating = paras.find((p) => /review|★|·/.test(t(p)) && /\d/.test(t(p)) && t(p).length < 40);
  const price = paras.find((p) => /^[$£€]\s?\d/.test(t(p)));
  const finance = paras.find((p) => /\/mo|month/i.test(t(p)));
  // Finish label ("Finish — Cream") and the comma-separated finishes list
  // ("Finishes: Cream, Charcoal, Terracotta"), both emitted as paragraphs.
  const finishesPara = paras.find((p) => /^finishes:/i.test(t(p)));
  const finishLabel = paras.find((p) => p !== finishesPara && /^finish/i.test(t(p)));
  const eyebrow = paras.find((p) => p !== rating && p !== price && p !== finance
    && p !== finishLabel && p !== breadcrumb && t(p).length < 32
    && kids.indexOf(p) < headingIdx);
  // Trust badges: paragraphs matched by their reassurance keywords, anywhere
  // after the price. The parser emits them as paragraphs (not a list) so they
  // survive the markdown round-trip.
  const priceIdx = price ? kids.indexOf(price) : headingIdx;
  const trustParas = paras.filter((p) => kids.indexOf(p) > priceIdx
    && p !== finishLabel && p !== finishesPara
    && /deliver|guarantee|warranty|return|morning|trial|set it up|send it back|free/i.test(t(p)));
  const used = new Set([rating, price, finance, finishLabel, finishesPara,
    eyebrow, breadcrumb, ...trustParas]);
  // Lede: the long descriptive paragraph before the price, after the heading.
  const lede = paras.find((p) => !used.has(p) && t(p).length >= 32
    && kids.indexOf(p) > headingIdx && kids.indexOf(p) < priceIdx);

  if (breadcrumb) {
    const nav = document.createElement('nav');
    nav.className = 'product-hero-breadcrumb';
    nav.setAttribute('aria-label', 'Breadcrumb');
    const links = [...breadcrumb.querySelectorAll('a')];
    if (links.length) {
      // Rebuild from links + a trailing current-page label (the h1 text).
      links.forEach((a) => {
        const link = document.createElement('a');
        link.href = a.getAttribute('href') || '#';
        link.textContent = t(a);
        nav.append(link, document.createTextNode(' / '));
      });
      const current = document.createElement('span');
      current.setAttribute('aria-current', 'page');
      current.textContent = heading ? t(heading) : t(breadcrumb).split('/').pop().trim();
      nav.append(current);
    } else {
      // Slash-joined text fallback.
      const crumbLabels = t(breadcrumb).split('/').map((s) => s.trim()).filter(Boolean);
      crumbLabels.forEach((label, i, arr) => {
        const span = document.createElement('span');
        if (i === arr.length - 1) span.setAttribute('aria-current', 'page');
        span.textContent = label;
        nav.append(span);
        if (i < arr.length - 1) nav.append(document.createTextNode(' / '));
      });
    }
    breadcrumbNav = nav;
  }

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
    const label = document.createElement('span');
    label.className = 'product-hero-rating-text';
    label.textContent = t(rating);
    r.append(starRow(5), label);
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

  // Finishes (swatches): from the "Finishes: a, b, c" paragraph, or a <ul>
  // fallback for backward compatibility.
  let finishNames = [];
  if (finishesPara) {
    const raw = t(finishesPara).replace(/^finishes:\s*/i, '');
    finishNames = raw.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    const finishesList = lists.find((ul) => {
      const items = [...ul.children];
      return items.every((li) => t(li).length < 24);
    }) || lists[0];
    if (finishesList) finishNames = [...finishesList.children].map((li) => t(li));
  }

  if (finishLabel || finishNames.length) {
    const fWrap = document.createElement('div');
    fWrap.className = 'product-hero-finish';
    const fLabel = document.createElement('p');
    fLabel.className = 'product-hero-finish-label';
    fLabel.textContent = finishLabel ? t(finishLabel) : 'Finish';
    fWrap.append(fLabel);
    if (finishNames.length) {
      const swatches = document.createElement('div');
      swatches.className = 'product-hero-swatches';
      finishNames.forEach((name, i) => {
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

  const trustText = trustParas.length ? trustParas.map(t) : DEFAULT_TRUST;
  if (trustText.length) {
    const tl = document.createElement('ul');
    tl.className = 'product-hero-trust';
    trustText.forEach((text) => {
      const item = document.createElement('li');
      const icon = document.createElement('span');
      icon.className = 'product-hero-trust-icon';
      icon.innerHTML = trustIcon(text);
      const label = document.createElement('span');
      label.textContent = text;
      item.append(icon, label);
      tl.append(item);
    });
    panel.append(tl);
  }

  const grid = document.createElement('div');
  grid.className = 'product-hero-grid';
  grid.append(gallery, panel);
  if (breadcrumbNav) wrap.append(breadcrumbNav);
  wrap.append(grid);
  block.textContent = '';
  block.append(wrap);
}
