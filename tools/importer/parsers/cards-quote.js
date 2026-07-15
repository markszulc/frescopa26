/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-quote. Base: cards (no images variant).
 * Source: https://markszulc.github.io/frescopa-atelier/ (section.voices .voices__grid)
 * Generated: 2026-07-15
 *
 * Library convention (Cards, no images): 1 column, multiple rows. Row 1 = block name.
 * Each subsequent row = one card with text content (quote + citation).
 */
export default function parse(element, { document }) {
  // Each testimonial is a <blockquote class="voices__item">.
  const items = Array.from(
    element.querySelectorAll(':scope > blockquote, blockquote.voices__item, blockquote, .voices__item'),
  );
  const uniqueItems = [...new Set(items)];

  // Empty-block guard.
  if (uniqueItems.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueItems.forEach((item) => {
    // Single-column card: collect the quote paragraph(s) and citation.
    const content = [];
    const quotes = Array.from(item.querySelectorAll('p'));
    const cite = item.querySelector('cite, [class*="cite"], footer');

    quotes.forEach((q) => content.push(q));
    if (cite) content.push(cite);

    // Fallback: if no structured children, use the whole item.
    if (content.length === 0) content.push(item);

    cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quote', cells });
  element.replaceWith(block);
}
