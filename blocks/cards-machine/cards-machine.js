import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Machine product cards.
 *
 * Authoring model (rows) — one block per product family:
 *   Row 1+: each row is a machine card with two cells:
 *     - cell 1: image (picture). Optional — companion machines ship without a
 *       photo, so an empty cell renders a placeholder label box.
 *     - cell 2: body — eyebrow/category (p), heading (h3), description (p),
 *       optional feature list (ul, flagship only), and a final paragraph that
 *       merges price + CTA ("$2,199 View the Atelier →").
 *
 * A card carrying a feature <ul> is the flagship (rendered large). When a
 * flagship is present, the remaining cards are grouped under an "Also in this
 * family" label; otherwise all cards render as a companion grid.
 */

function splitPriceCta(foot) {
  // The final paragraph merges a price with a CTA label, e.g. "$2,199View the Atelier →".
  const link = foot.querySelector('a');
  const ctaLabel = link ? link.textContent.trim() : '';
  const raw = foot.textContent.trim();
  const priceText = ctaLabel ? raw.slice(0, raw.length - ctaLabel.length).trim() : raw;

  const wrap = document.createElement('div');
  wrap.className = 'cards-machine-foot';
  if (priceText) {
    const price = document.createElement('span');
    price.className = 'cards-machine-price';
    price.textContent = priceText;
    wrap.append(price);
  }
  if (link) wrap.append(link);
  return wrap;
}

function buildBody(bodyCell, { flagship }) {
  const body = document.createElement('div');
  body.className = 'cards-machine-body';

  const children = [...bodyCell.children];
  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName));
  const headingIndex = heading ? children.indexOf(heading) : -1;
  const list = children.find((el) => el.tagName === 'UL');
  const paras = children.filter((el) => el.tagName === 'P');
  // Last paragraph is the price/CTA foot; a paragraph before the heading is the eyebrow.
  const foot = paras[paras.length - 1];
  const eyebrowEl = headingIndex > 0
    ? children.slice(0, headingIndex).find((el) => el.tagName === 'P')
    : null;

  if (eyebrowEl) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'cards-machine-eyebrow';
    eyebrow.textContent = eyebrowEl.textContent.trim();
    body.append(eyebrow);
  }
  if (heading) {
    heading.classList.add('cards-machine-title');
    body.append(heading);
  }
  // Description paragraphs: everything that is not the eyebrow or the foot.
  paras.filter((p) => p !== eyebrowEl && p !== foot).forEach((p) => {
    p.classList.add('cards-machine-desc');
    body.append(p);
  });
  if (flagship && list) {
    list.classList.add('cards-machine-features');
    body.append(list);
  }
  if (foot) body.append(splitPriceCta(foot));
  return body;
}

function buildMedia(imageCell, title) {
  const media = document.createElement('div');
  media.className = 'cards-machine-media';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }
    media.append(media.querySelector('picture') || picture);
  } else {
    // Placeholder label box for machines without a photo.
    media.classList.add('cards-machine-media-placeholder');
    const label = document.createElement('span');
    label.className = 'cards-machine-placeholder-label';
    label.textContent = title;
    media.append(label);
  }
  return media;
}

function buildCard(row, { flagship }) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim())
    || cells[cells.length - 1];

  const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');
  const title = heading ? heading.textContent.trim() : '';

  // A leading "New" paragraph is a badge; pull it before body parsing.
  const first = bodyCell.querySelector('p');
  let badgeText = '';
  if (first && /^new$/i.test(first.textContent.trim())) {
    badgeText = first.textContent.trim();
    first.remove();
  }

  const card = document.createElement('article');
  card.className = flagship ? 'cards-machine-card cards-machine-flagship' : 'cards-machine-card cards-machine-companion';

  const media = buildMedia(imageCell, title);
  if (badgeText) {
    const badge = document.createElement('span');
    badge.className = 'cards-machine-badge';
    badge.textContent = badgeText;
    media.append(badge);
  }
  const body = buildBody(bodyCell, { flagship });
  card.append(media, body);
  return card;
}

export default function decorate(block) {
  const rows = [...block.children];
  const cards = rows.map((row) => ({
    row,
    flagship: !!row.querySelector('ul'),
  }));

  const flagshipEntry = cards.find((c) => c.flagship);
  const companions = cards.filter((c) => c !== flagshipEntry);

  block.textContent = '';

  if (flagshipEntry) {
    block.append(buildCard(flagshipEntry.row, { flagship: true }));
  }

  if (companions.length) {
    const group = document.createElement('div');
    group.className = 'cards-machine-companions';
    if (flagshipEntry) {
      const label = document.createElement('span');
      label.className = 'cards-machine-group-label';
      label.textContent = 'Also in this family';
      group.append(label);
    }
    const grid = document.createElement('div');
    grid.className = 'cards-machine-grid';
    grid.dataset.count = companions.length;
    companions.forEach((c) => grid.append(buildCard(c.row, { flagship: false })));
    group.append(grid);
    block.append(group);
  }
}
