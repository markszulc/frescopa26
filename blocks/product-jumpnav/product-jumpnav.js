/**
 * Sticky "Jump to a section" bar for the Atelier PDP.
 *
 * Authoring model (single row, 2 cells):
 *   - cell 1: intro copy ("Still deciding?" + "Jump to") as two lines/paragraphs.
 *   - cell 2: a list of anchor links to on-page sections (#how, #specs, …).
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const linksCell = cells.find((c) => c.querySelector('a')) || cells[cells.length - 1];
  const introCell = cells.find((c) => c !== linksCell);

  const wrap = document.createElement('div');
  wrap.className = 'product-jumpnav-inner';

  if (introCell) {
    const intro = document.createElement('div');
    intro.className = 'product-jumpnav-intro';
    const lines = [...introCell.children].filter((el) => el.textContent.trim());
    const src = lines.length ? lines : [introCell];
    src.forEach((el, i) => {
      const span = document.createElement('span');
      span.className = i === 0 ? 'product-jumpnav-hint' : 'product-jumpnav-label';
      span.textContent = el.textContent.trim();
      intro.append(span);
    });
    wrap.append(intro);
  }

  const nav = document.createElement('nav');
  nav.className = 'product-jumpnav-links';
  nav.setAttribute('aria-label', 'Jump to a section');
  const anchors = [...(linksCell ? linksCell.querySelectorAll('a') : [])];
  anchors.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.textContent = a.textContent.trim();
    nav.append(link);
  });
  wrap.append(nav);

  block.textContent = '';
  block.append(wrap);
}
