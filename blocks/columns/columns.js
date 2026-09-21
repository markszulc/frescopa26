const DAYS = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/;

/**
 * Detects and decorates the "flagship location" variant: a single row whose
 * first cell is a short label (e.g. "Flagship") and whose second cell holds an
 * eyebrow, heading, description, an amenities line, an address/hours line and a
 * "Get directions" link. Rebuilds it as the source's location card — a dashed
 * image-slot with a badge on the left and a structured detail column on the
 * right. Returns true when it handled the block.
 * @param {Element} block the columns block
 */
function decorateLocationCard(block) {
  const rows = [...block.children];
  if (rows.length !== 1) return false;
  const cells = [...rows[0].children];
  if (cells.length !== 2) return false;
  const [labelCell, detailCell] = cells;
  const heading = detailCell.querySelector('h2, h3, h4');
  const hasDirections = [...detailCell.querySelectorAll('a')]
    .some((a) => /directions/i.test(a.textContent));
  // Only treat it as a location card when the left cell is a short label with
  // no media and the right cell has a heading + a directions link.
  if (!heading || !hasDirections || labelCell.querySelector('picture, img')) return false;
  const labelText = labelCell.textContent.trim();
  if (!labelText || labelText.length > 24) return false;

  block.classList.add('columns-location');

  // --- Left: dashed image-slot with a badge + label ---
  const media = document.createElement('div');
  media.className = 'columns-location-media';
  const badge = document.createElement('span');
  badge.className = 'columns-location-badge';
  badge.textContent = labelText;
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('columns-location-icon');
  icon.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  const slotLabel = document.createElement('span');
  slotLabel.className = 'columns-location-slot-label';
  slotLabel.textContent = `Fréscopa ${labelText.toLowerCase()}`;
  media.append(badge, icon, slotLabel);

  // --- Right: structured detail column ---
  const detail = document.createElement('div');
  detail.className = 'columns-location-detail';
  const paras = [...detailCell.querySelectorAll(':scope > p')];
  const eyebrow = paras[0] && !paras[0].querySelector('a') ? paras[0] : null;
  if (eyebrow) {
    eyebrow.className = 'columns-location-eyebrow';
    detail.append(eyebrow);
  }
  detail.append(heading);

  // Description: the first non-link body paragraph after the eyebrow (all body
  // paragraphs follow the heading in this layout).
  const description = paras.find((p) => p !== eyebrow && !p.querySelector('a'));
  if (description) {
    description.className = 'columns-location-desc';
    detail.append(description);
  }

  // Split the remaining paragraphs: amenities (no day-of-week) become pill
  // tags; the address/hours line carries a day-of-week token.
  const linkPara = paras.find((p) => p.querySelector('a'));
  const remaining = paras.filter((p) => p !== eyebrow && p !== description
    && p !== linkPara);
  const amenityPara = remaining.find((p) => !DAYS.test(p.textContent));
  const addressPara = remaining.find((p) => DAYS.test(p.textContent));

  if (amenityPara) {
    const tags = document.createElement('ul');
    tags.className = 'columns-location-tags';
    amenityPara.textContent.trim().split(/\s+/).forEach((word) => {
      const li = document.createElement('li');
      li.textContent = word;
      tags.append(li);
    });
    detail.append(tags);
  }

  if (addressPara) {
    const meta = document.createElement('div');
    meta.className = 'columns-location-meta';
    const text = addressPara.textContent.trim();
    const m = text.match(DAYS);
    const addr = document.createElement('span');
    if (m && m.index > 0) {
      addr.textContent = text.slice(0, m.index).trim();
      const hours = document.createElement('span');
      hours.textContent = text.slice(m.index).trim();
      meta.append(addr, hours);
    } else {
      addr.textContent = text;
      meta.append(addr);
    }
    detail.append(meta);
  }

  if (linkPara) {
    const link = linkPara.querySelector('a');
    link.className = 'columns-location-cta';
    detail.append(link);
  }

  block.replaceChildren(media, detail);
  return true;
}

export default function decorate(block) {
  if (decorateLocationCard(block)) return;

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
