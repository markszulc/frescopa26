/**
 * Bundle purchase cards — pricing tiers for the Atelier PDP.
 *
 * Authoring model (rows):
 *   Row 1 (optional head): eyebrow (p), heading (h2). Single cell.
 *   Row 2+: one bundle per row, a single cell containing:
 *     - optional badge (p, e.g. "Most loved")
 *     - title (h3)
 *     - description (p)
 *     - a price paragraph (may hold the price + a struck original / "save $x")
 *     - a CTA (link or button text)
 *   The featured card is the one carrying a badge.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const t = (el) => (el ? el.textContent.trim() : '');

  let head = null;
  if (rows[0].children.length === 1 && !rows[0].querySelector('h3') && rows[0].querySelector('h2')) {
    const src = rows.shift();
    head = document.createElement('div');
    head.className = 'bundle-cards-head';
    while (src.firstElementChild) head.append(src.firstElementChild);
  }

  const grid = document.createElement('div');
  grid.className = 'bundle-cards-grid';

  rows.forEach((row) => {
    const cell = row.children.length > 1
      ? row.children[row.children.length - 1] : row.firstElementChild;
    if (!cell) return;
    const kids = [...cell.children];
    const heading = kids.find((el) => /^H[1-6]$/.test(el.tagName));
    const paras = kids.filter((el) => el.tagName === 'P');
    const badgeP = paras.find((p) => /most loved|best|popular/i.test(t(p)) && t(p).length < 24);
    const desc = paras.find((p) => p !== badgeP && t(p).length > 24);
    const priceP = paras.find((p) => /[$£€]\s?\d|save/i.test(t(p)));
    const linkEl = cell.querySelector('a');

    const card = document.createElement('div');
    card.className = 'bundle-cards-card';
    if (badgeP) {
      card.classList.add('is-featured');
      const badge = document.createElement('span');
      badge.className = 'bundle-cards-badge';
      badge.textContent = t(badgeP);
      card.append(badge);
    }
    if (heading) {
      const h = document.createElement('h3');
      h.textContent = t(heading);
      card.append(h);
    }
    if (desc) {
      const d = document.createElement('p');
      d.className = 'bundle-cards-desc';
      d.textContent = t(desc);
      card.append(d);
    }
    if (priceP) {
      const priceWrap = document.createElement('div');
      priceWrap.className = 'bundle-cards-price';
      // Split a price line like "$2,799 $2,899" or "$2,399 save $110" into
      // primary price + secondary (struck / note).
      const raw = t(priceP);
      const parts = raw.match(/[$£€]\s?[\d,]+|save\s+[$£€]?[\d,]+/gi) || [raw];
      const [primaryText, secondaryText] = parts;
      const primary = document.createElement('span');
      primary.className = 'bundle-cards-amount';
      primary.textContent = primaryText;
      priceWrap.append(primary);
      if (secondaryText) {
        const secondary = document.createElement('span');
        secondary.className = /save/i.test(secondaryText) ? 'bundle-cards-save' : 'bundle-cards-was';
        secondary.textContent = secondaryText;
        priceWrap.append(secondary);
      }
      card.append(priceWrap);
    }
    const cta = document.createElement('a');
    cta.className = 'bundle-cards-cta';
    cta.href = linkEl ? (linkEl.getAttribute('href') || '#') : '#';
    cta.textContent = linkEl ? t(linkEl).replace(/\s*→\s*$/, '') || 'Add to cart' : 'Add to cart';
    card.append(cta);

    grid.append(card);
  });

  block.textContent = '';
  if (head) block.append(head);
  block.append(grid);
}
