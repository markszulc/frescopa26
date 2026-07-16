/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-media. Base: hero.
 * Source: https://markszulc.github.io/frescopa-atelier/ (section.hero, section.cafe, dark CTA)
 * Generated: 2026-07-15
 *
 * Library convention (Hero): 1 column, 3 rows.
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: title (heading), subheading, CTAs
 * Handles variations: instances with a background image (hero) and dark instances
 * without a background image (cafe promo / CTA).
 */
export default function parse(element, { document }) {
  // Row 2: background image (optional). The hero__media / dark sections wrap the
  // background asset in a dedicated container; ignore the decorative scroll icon.
  const bgImage = element.querySelector(
    '.hero__media img, [class*="media"] > img, :scope > img',
  );

  // Row 3 content: eyebrow, heading, lead paragraph, CTAs. Query directly from the
  // hero element so nested-container scoping never drops content.
  // The eyebrow may carry a class (.eyebrow) or be a bare <span> before the heading
  // (dark CTA sections render it as an unclassed span via the dc-runtime).
  const heading = element.querySelector('h1, h2, h3, .hero__title, [class*="title"]');
  let eyebrow = element.querySelector('.eyebrow, [class*="eyebrow"]');
  if (!eyebrow && heading) {
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'SPAN' && prev.textContent.trim()) eyebrow = prev;
  }

  // Lead paragraphs: prefer classed leads, else any <p> descendants (dark CTA
  // sections render the lead as an unclassed <p>). Never re-include the eyebrow.
  let leads = Array.from(element.querySelectorAll('p.hero__lead, [class*="lead"]'));
  if (leads.length === 0) {
    leads = Array.from(element.querySelectorAll('p')).filter((p) => p !== eyebrow);
  }

  // CTA links: hero actions, generic buttons, or the site's fr-btn buttons.
  const ctaLinks = Array.from(
    element.querySelectorAll(
      '.hero__actions a, [class*="actions"] a, a.btn, a.button, a.fr-btn, [class*="btn"] a',
    ),
  );

  const cells = [];

  // Row 2: optional background image.
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding heading, text and CTAs (1-column block).
  const contentCell = [];
  if (eyebrow) contentCell.push(eyebrow);
  if (heading) contentCell.push(heading);
  contentCell.push(...leads);
  contentCell.push(...ctaLinks);

  // Empty-block guard: bail gracefully if there is no meaningful content.
  if (!heading && contentCell.length === 0 && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-media', cells });
  element.replaceWith(block);
}
