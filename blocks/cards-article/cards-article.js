import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.children.length === 1 && cell.querySelector('picture')) {
        cell.className = 'cards-article-card-image';
      } else if (!cell.children.length && !cell.textContent.trim()) {
        // empty authored image cell -- keep as image slot placeholder
        cell.className = 'cards-article-card-image';
      } else {
        cell.className = 'cards-article-card-body';
        const paras = cell.querySelectorAll(':scope > p');
        if (paras.length) {
          // first paragraph before the heading is the category label
          const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
          if (heading && heading.previousElementSibling === paras[0]) {
            paras[0].className = 'cards-article-card-category';
          }
          // last paragraph is the date / read-time meta line
          paras[paras.length - 1].classList.add('cards-article-card-meta');
        }
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
