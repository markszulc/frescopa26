import { createOptimizedPicture } from '../../scripts/aem.js';

/* Inline line-icons (terracotta stroke) matching the source design.
   Icons are keyed by card order; the source content did not carry the
   original inline SVGs, so we provide equivalent line-art here. */
const ICONS = [
  // cup — taste
  '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M7 4c0 .8-.5 1.2-.5 2M11 4c0 .8-.5 1.2-.5 2"/>',
  // machine / cog — meet the machines
  '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  // people / learn — from the team
  '<circle cx="9" cy="8" r="3"/><path d="M15 11a3 3 0 1 0-2-5.24"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M17 20a5 5 0 0 0-3-4.58"/>',
  // seat / linger — sofa
  '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 12a2 2 0 0 1 2 2v3h16v-3a2 2 0 0 1 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2v1H6v-1a2 2 0 0 0-2-2 2 2 0 0 0-2 2Z"/>',
];

function makeIcon(index) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '30');
  svg.setAttribute('height', '30');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[index % ICONS.length];
  return svg;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row, i) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    let iconCell;
    [...li.children].forEach((div) => {
      if (div.querySelector('h3, p')) {
        div.className = 'cards-reasons-card-body';
      } else {
        div.className = 'cards-reasons-card-icon';
        iconCell = div;
      }
    });
    // If an icon cell exists, populate it: use its image if authored, else inject the line-icon.
    if (iconCell) {
      const authoredImg = iconCell.querySelector('img');
      if (!authoredImg) {
        iconCell.textContent = '';
        iconCell.append(makeIcon(i));
      }
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '120' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
