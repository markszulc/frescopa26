/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-reasons. Base: cards.
 * Source: https://markszulc.github.io/frescopa-atelier/cafe.html
 *         (#dc-root section:nth-of-type(2) > div > div)
 * Generated: 2026-07-15
 *
 * Library convention (Cards): 2 columns, multiple rows. Row 1 = block name.
 * Each subsequent row = one card: cell 1 = icon/image, cell 2 = text (title, description).
 */
export default function parse(element, { document }) {
  // `element` is the grid wrapper; each direct child div is a reason card
  // (icon + heading + description). Icons are inline <svg> or <img>.
  let cards = Array.from(element.children).filter(
    (c) => c.nodeType === 1 && c.querySelector('h1, h2, h3, h4, h5, h6'),
  );

  // Fallback: search descendants for card-like divs (heading + icon).
  if (cards.length < 1) {
    cards = Array.from(element.querySelectorAll('div')).filter(
      (d) => d.querySelector('h1, h2, h3, h4, h5, h6')
        && d.querySelector('img, picture, svg'),
    );
  }
  const uniqueCards = [...new Set(cards)];

  // Empty-block guard.
  if (uniqueCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueCards.forEach((card) => {
    // Icon may be an <img>/<picture> asset or an inline <svg>.
    const image = card.querySelector('img, picture, svg');

    const bodyContent = [];
    const title = card.querySelector('h1, h2, h3, h4, h5, h6');
    const paras = Array.from(card.querySelectorAll('p'));
    if (title) bodyContent.push(title);
    paras.forEach((p) => bodyContent.push(p));

    cells.push([image || '', bodyContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-reasons', cells });
  element.replaceWith(block);
}
