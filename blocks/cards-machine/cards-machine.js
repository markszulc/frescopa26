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
 *
 * Rendering is split from parsing so other blocks (e.g. cards-commerce) can
 * render the same markup from a plain card object:
 *   {
 *     flagship: boolean,
 *     picture: Element | null,       // null renders the placeholder label box
 *     badge: string,                 // e.g. "New"
 *     eyebrow: string | null,        // null omits the eyebrow
 *     title: string | Element,       // string becomes an <h3>
 *     descriptions: (string | Element)[], // strings become <p>
 *     features: Element | null,      // <ul>, flagship only
 *     price: string | undefined,     // undefined (and no cta) omits the foot
 *     cta: Element | { href, text } | null,
 *   }
 * Strings are always set with textContent.
 */

function textOf(value) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.textContent.trim();
}

/**
 * Parses an authored row into a card object.
 * @param {Element} row The block row
 * @returns {Object} The card object
 */
function parseRow(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim())
    || cells[cells.length - 1];

  const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');

  // A leading "New" paragraph is a badge; pull it before body parsing.
  const first = bodyCell.querySelector('p');
  let badge = '';
  if (first && /^new$/i.test(first.textContent.trim())) {
    badge = first.textContent.trim();
    first.remove();
  }

  const children = [...bodyCell.children];
  const headingIndex = heading ? children.indexOf(heading) : -1;
  const list = children.find((el) => el.tagName === 'UL');
  const paras = children.filter((el) => el.tagName === 'P');
  // Last paragraph is the price/CTA foot; a paragraph before the heading is the eyebrow.
  const foot = paras[paras.length - 1];
  const eyebrowEl = headingIndex > 0
    ? children.slice(0, headingIndex).find((el) => el.tagName === 'P')
    : null;

  // The final paragraph merges a price with a CTA label, e.g. "$2,199View the Atelier →".
  let price;
  let cta = null;
  if (foot) {
    cta = foot.querySelector('a');
    const ctaLabel = cta ? cta.textContent.trim() : '';
    const raw = foot.textContent.trim();
    price = ctaLabel ? raw.slice(0, raw.length - ctaLabel.length).trim() : raw;
  }

  return {
    flagship: !!row.querySelector('ul'),
    picture: imageCell ? imageCell.querySelector('picture') : null,
    badge,
    eyebrow: eyebrowEl ? eyebrowEl.textContent.trim() : null,
    title: heading || '',
    // Description paragraphs: everything that is not the eyebrow or the foot.
    descriptions: paras.filter((p) => p !== eyebrowEl && p !== foot),
    features: list || null,
    price,
    cta,
  };
}

function buildMedia(card) {
  const media = document.createElement('div');
  media.className = 'cards-machine-media';
  if (card.picture) {
    media.append(card.picture);
  } else {
    // Placeholder label box for machines without a photo.
    media.classList.add('cards-machine-media-placeholder');
    const label = document.createElement('span');
    label.className = 'cards-machine-placeholder-label';
    label.textContent = textOf(card.title);
    media.append(label);
  }
  if (card.badge) {
    const badge = document.createElement('span');
    badge.className = 'cards-machine-badge';
    badge.textContent = card.badge;
    media.append(badge);
  }
  return media;
}

function buildFoot(card) {
  const wrap = document.createElement('div');
  wrap.className = 'cards-machine-foot';
  if (card.price) {
    const price = document.createElement('span');
    price.className = 'cards-machine-price';
    price.textContent = card.price;
    wrap.append(price);
  }
  if (card.cta instanceof Element) {
    wrap.append(card.cta);
  } else if (card.cta) {
    const link = document.createElement('a');
    link.href = card.cta.href;
    link.textContent = card.cta.text;
    // match decorateButtons, which titles authored links
    link.title = card.cta.text;
    wrap.append(link);
  }
  return wrap;
}

function buildBody(card, flagship) {
  const body = document.createElement('div');
  body.className = 'cards-machine-body';

  if (card.eyebrow !== null && card.eyebrow !== undefined) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'cards-machine-eyebrow';
    eyebrow.textContent = card.eyebrow;
    body.append(eyebrow);
  }
  if (card.title instanceof Element) {
    card.title.classList.add('cards-machine-title');
    body.append(card.title);
  } else if (card.title) {
    const heading = document.createElement('h3');
    heading.className = 'cards-machine-title';
    heading.textContent = card.title;
    body.append(heading);
  }
  (card.descriptions || []).forEach((desc) => {
    let p = desc;
    if (!(desc instanceof Element)) {
      p = document.createElement('p');
      p.textContent = desc;
    }
    p.classList.add('cards-machine-desc');
    body.append(p);
  });
  if (flagship && card.features) {
    card.features.classList.add('cards-machine-features');
    body.append(card.features);
  }
  if (card.price !== undefined || card.cta) body.append(buildFoot(card));
  return body;
}

/**
 * Renders one card from a card object.
 * @param {Object} card The card object (see top of file)
 * @param {Object} [options]
 * @param {boolean} [options.flagship] Render as the large flagship card
 * @returns {Element} The card <article>
 */
export function renderCard(card, { flagship = false } = {}) {
  const article = document.createElement('article');
  article.className = flagship ? 'cards-machine-card cards-machine-flagship' : 'cards-machine-card cards-machine-companion';
  article.append(buildMedia(card), buildBody(card, flagship));
  return article;
}

/**
 * Lays out cards in the block: the first flagship card (if any), then the
 * remaining cards as a companion grid.
 * @param {Element} block The block element
 * @param {Object[]} cards Card objects
 * @param {Function} [build] Builds a card element: (card, { flagship }) => Element
 */
export function renderCards(block, cards, build = renderCard) {
  const flagshipCard = cards.find((c) => c.flagship);
  const companions = cards.filter((c) => c !== flagshipCard);

  block.textContent = '';

  if (flagshipCard) {
    block.append(build(flagshipCard, { flagship: true }));
  }

  if (companions.length) {
    const group = document.createElement('div');
    group.className = 'cards-machine-companions';
    if (flagshipCard) {
      const label = document.createElement('span');
      label.className = 'cards-machine-group-label';
      label.textContent = 'Also in this family';
      group.append(label);
    }
    const grid = document.createElement('div');
    grid.className = 'cards-machine-grid';
    grid.dataset.count = companions.length;
    companions.forEach((c) => grid.append(build(c, { flagship: false })));
    group.append(grid);
    block.append(group);
  }
}

export default function decorate(block) {
  renderCards(block, [...block.children].map(parseRow));
}
