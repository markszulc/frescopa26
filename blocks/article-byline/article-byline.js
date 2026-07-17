import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article byline / author card.
 *
 * Authoring model (single row, 2 cells):
 *   - cell 1: author avatar (picture). Optional — falls back to an initials
 *     monogram derived from the name.
 *   - cell 2: an optional leading label ("About the author"), the author name
 *     (heading or first line), and an optional meta / bio paragraph.
 *
 * Variant: add "bio" to the block (e.g. `article-byline (bio)`) for the larger
 * end-of-article author card; the default is the compact top byline.
 */
export default function decorate(block) {
  const bio = block.classList.contains('bio');
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture')) || null;
  // The body cell is the one with text (name/meta) — not the (possibly empty)
  // image cell.
  const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim())
    || cells[cells.length - 1];

  const wrap = document.createElement('div');
  wrap.className = 'article-byline-inner';

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'article-byline-avatar';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '150' }]));
    avatar.append(avatar.querySelector('picture') || picture);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'article-byline-body';
  const children = bodyCell ? [...bodyCell.children] : [];
  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName));
  const paras = children.filter((el) => el.tagName === 'P');
  let nameText = '';
  if (heading) nameText = heading.textContent.trim();
  else if (paras[0]) nameText = paras[0].textContent.trim();

  // Optional leading label (a paragraph before the name in bio variant).
  if (bio && paras.length && (!heading || paras[0] !== undefined)) {
    const labelCandidate = children[0];
    if (labelCandidate && labelCandidate.tagName === 'P' && labelCandidate !== paras[paras.length - 1]) {
      const label = document.createElement('span');
      label.className = 'article-byline-label';
      label.textContent = labelCandidate.textContent.trim();
      body.append(label);
    }
  }

  // If no picture, render an initials monogram.
  if (!picture && nameText) {
    avatar.classList.add('article-byline-avatar-monogram');
    const initials = nameText.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
    avatar.textContent = initials.toUpperCase();
  }

  const name = document.createElement('span');
  name.className = 'article-byline-name';
  name.textContent = nameText;
  body.append(name);

  // Meta (compact) or bio paragraph (bio variant): the last paragraph that
  // isn't the name.
  const metaPara = paras.filter((p) => p.textContent.trim() !== nameText).pop();
  if (metaPara) {
    const meta = document.createElement('p');
    meta.className = bio ? 'article-byline-bio' : 'article-byline-meta';
    meta.textContent = metaPara.textContent.trim();
    body.append(meta);
  }

  wrap.append(avatar, body);
  block.textContent = '';
  block.append(wrap);
}
