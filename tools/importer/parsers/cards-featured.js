/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-featured. Base: cards.
 * Source: https://markszulc.github.io/frescopa-atelier/blog.html
 *         (#dc-root section:nth-of-type(2))
 * Generated: 2026-07-15
 *
 * Library convention (Cards): 2 columns. Row 1 = block name.
 * Each subsequent row = one card: cell 1 = image, cell 2 = text content
 * (category, title, description, meta, CTA). This is a single featured post.
 */
export default function parse(element, { document }) {
  // The featured post is the card wrapper inside the section.
  const card = element.querySelector(':scope > div, .card, article') || element;

  // Cell 1: hero image.
  const image = card.querySelector('img, picture');

  // Cell 2: text content.
  const bodyContent = [];
  const badge = card.querySelector('.fr-badge, [class*="badge"]');
  const category = card.querySelector('h2, h3').previousElementSibling
    && /span/i.test((card.querySelector('h2, h3').previousElementSibling || {}).tagName || '')
    ? card.querySelector('h2, h3').previousElementSibling
    : null;
  const title = card.querySelector('h1, h2, h3, [class*="title"]');
  const paras = Array.from(card.querySelectorAll('p'));
  // Meta line (date / read time): a span sibling that is not the category/title.
  const metaSpans = Array.from(card.querySelectorAll('span')).filter(
    (s) => /min read|·|\d{4}/i.test(s.textContent) && !s.querySelector('span'),
  );
  const cta = card.querySelector('a.fr-link, a[class*="link"], a.button');

  if (badge) bodyContent.push(badge);
  if (category) bodyContent.push(category);
  if (title) bodyContent.push(title);
  paras.forEach((p) => bodyContent.push(p));
  if (metaSpans[0]) bodyContent.push(metaSpans[0]);
  if (cta) bodyContent.push(cta);

  // Empty-block guard.
  if (!image && bodyContent.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', bodyContent]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-featured', cells });
  element.replaceWith(block);
}
