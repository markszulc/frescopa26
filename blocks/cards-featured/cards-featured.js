import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Featured post card: a large horizontal card with an image on one side and,
 * on the other, a category label, a "Featured" badge, a heading, a description,
 * a meta line (date / read-time) and a "Read the story" link.
 *
 * Authored structure (single row):
 *   div (row)
 *     div  -> image cell (picture, optional)
 *     div  -> body: <p>[Featured][Category]</p> <h2> <p>desc</p> <p>meta</p> <p><a>link</a></p>
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];

  // Identify the image cell (contains a picture/img) vs the body cell.
  const imageCell = cells.find((c) => c.querySelector('picture, img')) || cells[0];
  const bodyCell = cells.find((c) => c !== imageCell) || cells[1];

  // --- Media half ---
  const media = document.createElement('div');
  media.className = 'cards-featured-media';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      picture.replaceWith(optimized);
    }
    media.append(picture.isConnected ? picture : imageCell.querySelector('picture'));
  }

  // --- Body half ---
  const body = document.createElement('div');
  body.className = 'cards-featured-body';

  const bodyChildren = bodyCell ? [...bodyCell.children] : [];
  const heading = bodyChildren.find((el) => /^H[1-6]$/.test(el.tagName));
  const linkPara = bodyChildren.find((el) => el.tagName === 'P' && el.querySelector('a'));
  const link = linkPara ? linkPara.querySelector('a') : null;

  // First paragraph carries the "Featured" badge + category label combined.
  const labelPara = bodyChildren.find((el) => el.tagName === 'P' && el !== linkPara);
  let category = '';
  let hasFeatured = false;
  if (labelPara) {
    const raw = labelPara.textContent.trim();
    hasFeatured = /^featured/i.test(raw);
    category = raw.replace(/^featured/i, '').trim();
  }

  // Category label
  if (category) {
    const cat = document.createElement('span');
    cat.className = 'cards-featured-category';
    cat.textContent = category;
    body.append(cat);
  }

  // Heading
  if (heading) {
    heading.classList.add('cards-featured-title');
    body.append(heading);
  }

  // Description paragraphs (any remaining <p> that is not label, link, or meta)
  const metaPara = bodyChildren
    .filter((el) => el.tagName === 'P' && el !== labelPara && el !== linkPara)
    .pop();
  bodyChildren
    .filter((el) => el.tagName === 'P' && el !== labelPara && el !== linkPara && el !== metaPara)
    .forEach((p) => {
      p.classList.add('cards-featured-desc');
      body.append(p);
    });

  // Meta row: date/read-time + read link
  const metaRow = document.createElement('div');
  metaRow.className = 'cards-featured-meta';
  if (metaPara) {
    const metaText = document.createElement('span');
    metaText.className = 'cards-featured-meta-text';
    metaText.textContent = metaPara.textContent.trim();
    metaRow.append(metaText);
  }
  if (link) {
    link.className = 'cards-featured-link';
    metaRow.append(link);
  }
  if (metaRow.children.length) body.append(metaRow);

  // Featured badge overlay on the media half
  if (hasFeatured) {
    const badge = document.createElement('span');
    badge.className = 'cards-featured-badge';
    badge.textContent = 'Featured';
    media.append(badge);
  }

  // Rebuild the card
  const card = document.createElement('div');
  card.className = 'cards-featured-card';
  card.append(media, body);

  // If a single link is present, make the whole card clickable via an overlay.
  if (link && link.href) {
    const href = link.getAttribute('href');
    card.classList.add('cards-featured-card-linked');
    const overlay = document.createElement('a');
    overlay.className = 'cards-featured-overlay';
    overlay.href = href;
    overlay.setAttribute('aria-label', heading ? heading.textContent.trim() : 'Read the story');
    card.append(overlay);
  }

  block.textContent = '';
  block.append(card);
}
