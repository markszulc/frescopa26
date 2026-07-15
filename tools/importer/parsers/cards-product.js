/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base: cards.
 * Source: https://markszulc.github.io/frescopa-atelier/ (section.feed .feed__grid)
 * Generated: 2026-07-15
 *
 * Library convention (Cards): 2 columns, multiple rows. Row 1 = block name.
 * Each subsequent row = one card: cell 1 = image (mandatory),
 * cell 2 = text content (title, description, CTA).
 */
export default function parse(element, { document }) {
  // Each card is an <article class="card"> in the grid.
  const cards = Array.from(
    element.querySelectorAll(':scope > article, :scope > .card, article.card, .card'),
  );

  // De-duplicate in case selectors overlap.
  const uniqueCards = [...new Set(cards)];

  // Empty-block guard.
  if (uniqueCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueCards.forEach((card) => {
    // Cell 1: card image.
    const image = card.querySelector('.card__media img, [class*="media"] img, img, picture');

    // Cell 2: text content — category, title, note, price, CTA.
    const bodyContent = [];
    const category = card.querySelector('.card__cat, [class*="cat"]');
    const title = card.querySelector('.card__title, h2, h3, h4, [class*="title"]');
    const notes = Array.from(card.querySelectorAll('.card__note, [class*="note"], p'));
    const price = card.querySelector('.card__price, [class*="price"]');
    const cta = card.querySelector('.card__foot a, a.link, a.button, .card__foot button, button.link');

    if (category) bodyContent.push(category);
    if (title) bodyContent.push(title);
    notes.forEach((n) => bodyContent.push(n));
    if (price) bodyContent.push(price);
    if (cta) bodyContent.push(cta);

    cells.push([image || '', bodyContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
