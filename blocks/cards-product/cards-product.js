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

      // Footer: price + CTA. Build a standalone <div> (not a reused <p>) so the
      // editor's ProseMirror layer leaves it intact -- an editable <p> gets
      // flattened back to the merged "£14Add to cart →" text and loses its
      // styling. Price and CTA may be authored as two paragraphs or merged in
      // a single paragraph.
      const paras = [...body.querySelectorAll('p')];
      const last = paras[paras.length - 1];
      const prev = paras[paras.length - 2];
      const isPrice = (el) => el && /^\D*\d[\d.,]*$/.test(el.textContent.trim());

      if (last) {
        let priceText;
        let ctaText;
        if (isPrice(prev)) {
          // Two paragraphs: a price ("£14") followed by a CTA ("Add to cart").
          priceText = prev.textContent.trim();
          ctaText = last.textContent.trim();
          prev.remove();
        } else {
          // One paragraph with price and CTA merged ("£14Add to cart →").
          const match = last.textContent.trim().match(/^(\D*\d[\d.,]*)(.*)$/);
          priceText = match ? match[1].trim() : last.textContent.trim();
          ctaText = match ? match[2].trim() : '';
        }

        const foot = document.createElement('div');
        foot.className = 'cards-product-card-foot';

        const price = document.createElement('span');
        price.className = 'cards-product-price';
        price.textContent = priceText;
        foot.append(price);

        if (ctaText) {
          const cta = document.createElement('a');
          cta.className = 'cards-product-cta';
          cta.href = '#';
          cta.textContent = ctaText;
          foot.append(cta);
        }

        last.replaceWith(foot);
      }
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img
    .closest('picture')
    .replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
