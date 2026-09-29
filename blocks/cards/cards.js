import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    const image = li.querySelector('.cards-card-image');
    const body = li.querySelector('.cards-card-body');
    const category = body?.querySelector('p');
    const content = body ? [...body.querySelectorAll('p, h3')] : [];
    const headingIndex = content.findIndex((element) => element.tagName === 'H3');
    if (category && image && headingIndex > content.indexOf(category)) {
      const badge = document.createElement('span');
      badge.className = 'cards-cat';
      badge.textContent = category.textContent.trim();
      image.append(badge);
      category.remove();
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
