import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the product cards block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-product-card-image';
      } else {
        div.className = 'cards-product-card-body';
      }
    });

    const image = li.querySelector('.cards-product-card-image');
    const body = li.querySelector('.cards-product-card-body');

    if (body) {
      // First paragraph is the category label -> overlay badge on the image
      const cat = body.querySelector('p');
      if (cat && image) {
        const badge = document.createElement('span');
        badge.className = 'cards-product-cat';
        badge.textContent = cat.textContent.trim();
        image.append(badge);
        cat.remove();
      }

      // Last paragraph holds the price and CTA merged ("£14Add to cart →")
      const foot = body.querySelector('p:last-of-type');
      if (foot) {
        const raw = foot.textContent.trim();
        const match = raw.match(/^([^\d]*\d[\d.,]*)(.*)$/);
        foot.className = 'cards-product-card-foot';
        foot.textContent = '';
        if (match) {
          const price = document.createElement('span');
          price.className = 'cards-product-price';
          price.textContent = match[1].trim();

          const cta = document.createElement('a');
          cta.className = 'cards-product-cta';
          cta.href = '#';
          cta.textContent = match[2].trim();

          foot.append(price, cta);
        } else {
          foot.textContent = raw;
        }
      }
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img
    .closest('picture')
    .replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
