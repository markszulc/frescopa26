/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-event. Base: cards-event (custom block, no images).
 * Source: https://markszulc.github.io/frescopa-atelier/cafe.html
 *         (#whatson > div > div:nth-of-type(2))
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/cards-event/cards-event.js):
 *   Each card is one row of single-cell default content: day label, title,
 *   description, and a time/price meta footer.
 *
 * Source note: the live page renders events via an `sc-for` template loop, so
 * the article(s) may contain `{{ }}` / `sc-interp` placeholders. The parser
 * still captures whatever article content is present.
 */
export default function parse(element, { document }) {
  // Each event is an <article>; unwrap any sc-for template wrapper.
  const cards = Array.from(element.querySelectorAll('article'));
  const uniqueCards = [...new Set(cards)];

  // Empty-block guard.
  if (uniqueCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueCards.forEach((card) => {
    // Single-column card: collect all direct children (day, title, note, meta).
    const content = Array.from(card.children).filter((c) => c.nodeType === 1);
    if (content.length === 0) content.push(card);
    cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-event', cells });
  element.replaceWith(block);
}
