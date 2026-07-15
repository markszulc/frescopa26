/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://markszulc.github.io/frescopa-atelier/blog.html
 *         (#dc-root section:nth-of-type(3) > div > div:nth-of-type(2))
 * Generated: 2026-07-15
 *
 * Library convention (Cards): 2 columns. Row 1 = block name.
 * Each subsequent row = one article card: cell 1 = image, cell 2 = text content
 * (category, title, description, meta). Each card is an <a> link.
 */
export default function parse(element, { document }) {
  // Each article card is an <a> link (the whole card is clickable).
  let cards = Array.from(element.querySelectorAll(':scope > a, a'));
  // Keep only anchors that look like cards (contain a heading).
  cards = cards.filter((a) => a.querySelector('h1, h2, h3, h4, h5, h6'));
  const uniqueCards = [...new Set(cards)];

  // Empty-block guard.
  if (uniqueCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueCards.forEach((card) => {
    // Cell 1: article thumbnail (may be an image-slot placeholder with no img).
    const image = card.querySelector('img, picture');

    // Cell 2: text content — category, title, description, meta.
    const bodyContent = [];
    const title = card.querySelector('h1, h2, h3, h4, h5, h6');

    // Category: a span before the heading; meta: a span after the paragraph.
    const directSpans = Array.from(card.querySelectorAll('span')).filter(
      (s) => !s.querySelector('span') === false || s.children.length,
    );
    // Simpler: take top-level informational spans (category + meta).
    const infoSpans = Array.from(card.children).filter((c) => c.tagName === 'SPAN');
    const paras = Array.from(card.querySelectorAll('p'));

    // Category is the span that appears before the title.
    const category = infoSpans.find(
      (s) => title && (s.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
    // Meta is a span after the title/paragraph.
    const meta = infoSpans.find(
      (s) => title && (s.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_PRECEDING),
    );

    if (category) bodyContent.push(category);
    if (title) bodyContent.push(title);
    paras.forEach((p) => bodyContent.push(p));
    if (meta) bodyContent.push(meta);

    cells.push([image || '', bodyContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
