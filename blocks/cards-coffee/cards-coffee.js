import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Coffee product cards — a uniform grid of shop products.
 *
 * Authoring model (rows) — one block per product family:
 *   Row 1+: each row is a product with two cells:
 *     - cell 1: image (picture). Optional — the source uses placeholder
 *       image-slots, so an empty cell renders a placeholder label box.
 *     - cell 2: body — an optional badge paragraph ("Most loved"), a category
 *       paragraph, a heading (h3), a description paragraph, an optional format
 *       list (ul of "Ground / Whole bean / Pods"), a price paragraph
 *       ("from $10"), and a final paragraph holding the "Choose options" link.
 */

function buildMedia(imageCell, title) {
  const media = document.createElement('div');
  media.className = 'cards-coffee-media';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }
    media.append(media.querySelector('picture') || picture);
  } else {
    media.classList.add('cards-coffee-media-placeholder');
    const label = document.createElement('span');
    label.className = 'cards-coffee-placeholder-label';
    label.textContent = title;
    media.append(label);
  }
  return media;
}

function buildCard(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim())
    || cells[cells.length - 1];

  const children = [...bodyCell.children];
  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName));
  const headingIndex = heading ? children.indexOf(heading) : -1;
  const list = children.find((el) => el.tagName === 'UL');
  const paras = children.filter((el) => el.tagName === 'P');

  // Paragraphs before the heading are the label group: badge + category (or
  // just category). The last of them is the category; an earlier one is a badge.
  const preParas = headingIndex >= 0
    ? children.slice(0, headingIndex).filter((el) => el.tagName === 'P')
    : [];
  const badgeEl = preParas.length > 1 ? preParas[0] : null;
  const categoryEl = preParas[preParas.length - 1] || null;

  // After the heading: description, price ("from $"), and the CTA paragraph.
  const postParas = headingIndex >= 0
    ? children.slice(headingIndex + 1).filter((el) => el.tagName === 'P')
    : paras;
  const ctaPara = postParas.find((p) => p.querySelector('a'));
  const priceEl = postParas.find((p) => p !== ctaPara && /\d/.test(p.textContent) && /from|[£$€]/i.test(p.textContent));
  const descEl = postParas.find((p) => p !== ctaPara && p !== priceEl);

  const title = heading ? heading.textContent.trim() : '';

  const card = document.createElement('article');
  card.className = 'cards-coffee-card';

  const media = buildMedia(imageCell, title);
  if (badgeEl) {
    const badge = document.createElement('span');
    badge.className = 'cards-coffee-badge';
    badge.textContent = badgeEl.textContent.trim();
    media.append(badge);
  }

  const body = document.createElement('div');
  body.className = 'cards-coffee-body';

  if (categoryEl) {
    const cat = document.createElement('span');
    cat.className = 'cards-coffee-category';
    cat.textContent = categoryEl.textContent.trim();
    body.append(cat);
  }
  if (heading) {
    heading.classList.add('cards-coffee-title');
    body.append(heading);
  }
  if (descEl) {
    descEl.classList.add('cards-coffee-desc');
    body.append(descEl);
  }
  if (list) {
    list.classList.add('cards-coffee-formats');
    body.append(list);
  }

  // Foot: price ("from $10") + Choose-options link.
  const foot = document.createElement('div');
  foot.className = 'cards-coffee-foot';
  if (priceEl) {
    priceEl.classList.add('cards-coffee-price');
    foot.append(priceEl);
  }
  const link = ctaPara ? ctaPara.querySelector('a') : null;
  if (link) {
    link.classList.add('cards-coffee-cta');
    foot.append(link);
  }
  if (foot.children.length) body.append(foot);

  card.append(media, body);
  return card;
}

export default function decorate(block) {
  const rows = [...block.children];
  const grid = document.createElement('div');
  grid.className = 'cards-coffee-grid';
  rows.forEach((row) => grid.append(buildCard(row)));
  block.textContent = '';
  block.append(grid);
}
