/**
 * Reviews block — an aggregate rating and a grid of review quotes.
 *
 * Authoring model (rows):
 *   Row 1: head — eyebrow (p), heading (h2), aggregate rating (p, "4.8"),
 *     rating note (p, "from 214 verified owners"). Single cell.
 *   Row 2+: one review per row, 2 cells:
 *     - cell 1: the rating value ("5") or star count for that review
 *     - cell 2: the quote (blockquote/p) + attribution (p)
 *   (If only one cell is present it is treated as the quote with a 5-star rating.)
 */
function stars(n) {
  const wrap = document.createElement('span');
  wrap.className = 'reviews-stars';
  wrap.setAttribute('aria-label', `${n} out of 5 stars`);
  for (let i = 0; i < 5; i += 1) {
    const s = document.createElement('span');
    s.className = i < n ? 'reviews-star is-on' : 'reviews-star';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
    wrap.append(s);
  }
  return wrap;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const t = (el) => (el ? el.textContent.trim() : '');

  const headRow = rows.shift();
  const head = document.createElement('div');
  head.className = 'reviews-head';
  const hcopy = document.createElement('div');
  hcopy.className = 'reviews-head-copy';
  // The head row is a single cell; its heading/paragraphs live one level deeper.
  const headCell = headRow ? headRow.firstElementChild : null;
  const hkids = headCell ? [...headCell.children] : [];
  const paras = hkids.filter((el) => el.tagName === 'P');
  const heading = hkids.find((el) => /^H[1-6]$/.test(el.tagName));
  const headingIdx = heading ? hkids.indexOf(heading) : 0;
  const ratingVal = paras.find((p) => /^\d(\.\d)?$/.test(t(p)));
  // Eyebrow: the short label before the heading. The aggregate note is the
  // "from N verified owners" line after the rating — anchored by position, not
  // just keyword, since the eyebrow ("What owners say") also contains "owner".
  const eyebrow = paras.find((p) => hkids.indexOf(p) < headingIdx && t(p));
  const ratingNote = paras.find((p) => p !== eyebrow && p !== ratingVal
    && /verified|from \d|owner|review/i.test(t(p)));

  if (eyebrow) {
    const e = document.createElement('p');
    e.className = 'reviews-eyebrow';
    e.textContent = t(eyebrow);
    hcopy.append(e);
  }
  if (heading) {
    const h = document.createElement('h2');
    h.textContent = t(heading);
    hcopy.append(h);
  }
  head.append(hcopy);

  if (ratingVal) {
    const agg = document.createElement('div');
    agg.className = 'reviews-aggregate';
    const num = document.createElement('span');
    num.className = 'reviews-aggregate-num';
    num.textContent = t(ratingVal);
    agg.append(num, stars(Math.round(parseFloat(t(ratingVal)))));
    if (ratingNote) {
      const note = document.createElement('p');
      note.className = 'reviews-aggregate-note';
      note.textContent = t(ratingNote);
      agg.append(note);
    }
    head.append(agg);
  }

  const grid = document.createElement('div');
  grid.className = 'reviews-grid';
  rows.forEach((row) => {
    const cells = [...row.children];
    const quoteCell = cells[cells.length - 1];
    const ratingCell = cells.length > 1 ? cells[0] : null;
    const n = ratingCell ? parseInt(t(ratingCell), 10) || 5 : 5;
    // Attribution is the last paragraph in the cell. The quote is the
    // blockquote's own text — but the markdown round-trip can merge the trailing
    // attribution paragraph into the blockquote, so strip it off if present.
    const bqEl = quoteCell.querySelector('blockquote');
    const attrEl = [...quoteCell.querySelectorAll('p')].pop();
    const attrText = attrEl ? t(attrEl) : '';
    let quoteText = t(bqEl || quoteCell.querySelector('p') || quoteCell);
    if (attrText && quoteText.endsWith(attrText)) {
      quoteText = quoteText.slice(0, -attrText.length).trim();
    }

    const fig = document.createElement('figure');
    fig.className = 'reviews-card';
    fig.append(stars(n));
    const bq = document.createElement('blockquote');
    bq.textContent = quoteText;
    fig.append(bq);
    if (attrText) {
      const cap = document.createElement('figcaption');
      cap.textContent = attrText;
      fig.append(cap);
    }
    grid.append(fig);
  });

  block.textContent = '';
  block.append(head, grid);
}
