/* eslint-disable */
/* global WebImporter */
/**
 * Parser for store-locator. Base: store-locator (custom block).
 * Source: https://markszulc.github.io/frescopa-atelier/cafe.html
 *         (#locations > div > div:nth-of-type(2))
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/store-locator/store-locator.js):
 *   Row 1 (optional): single image cell -> map panel.
 *   Remaining rows: one location card each, cell order:
 *     [name] [city] [address] [amenity chips] [hours] [directions link]
 *
 * Source notes: search box + region filter buttons are UI shell built by the
 * block JS and are NOT authored content, so they are ignored. Each location is
 * an <article>. Amenity chips live in a div of spans; hours + directions live
 * in a trailing div. The map is an <img>/<picture> (or image-slot placeholder).
 */
export default function parse(element, { document }) {
  const cells = [];

  // --- Row 1 (optional): map image ---
  // Prefer a real map asset; ignore small inline icon SVGs inside cards.
  const mapImage = element.querySelector(
    '#cafe-map img, image-slot img, [id*="map"] img, [class*="map"] img, [class*="map"] > picture',
  );
  if (mapImage) {
    cells.push([mapImage]);
  }

  // --- Location cards ---
  const cards = [...new Set(Array.from(element.querySelectorAll('article')))];

  // Empty-block guard.
  if (cards.length === 0 && !mapImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cards.forEach((card) => {
    // Card name.
    const name = card.querySelector('h1, h2, h3, h4');

    // City: the sibling element of the heading inside the header block.
    const header = name ? name.parentElement : null;
    let city = null;
    if (header) {
      city = Array.from(header.children).find(
        (c) => c !== name && c.tagName !== 'IMG' && c.textContent.trim(),
      ) || null;
    }

    // Address: the first paragraph in the card.
    const address = card.querySelector('p');

    // Work within the content wrapper (parent of the header block) so that the
    // chips row and hours/actions row are identified as direct children.
    const contentWrap = header ? header.parentElement : card;
    const wrapDivs = contentWrap
      ? Array.from(contentWrap.children).filter((c) => c.tagName === 'DIV')
      : [];

    // Amenity chips: a direct-child div of spans, without a link and without the heading.
    const chips = wrapDivs.find(
      (d) => d.querySelector('span')
        && !d.querySelector('a')
        && !d.querySelector('h1, h2, h3, h4'),
    ) || null;

    // Hours + directions: the direct-child div that contains the directions link.
    const actionsRow = wrapDivs.find((d) => d.querySelector('a'));
    let hours = null;
    let directions = null;
    if (actionsRow) {
      // Hours is the direct-child span of the actions row (not inside the link).
      hours = Array.from(actionsRow.children).find(
        (c) => c.tagName === 'SPAN' && c.textContent.trim(),
      ) || null;
      directions = actionsRow.querySelector('a');
    } else {
      directions = card.querySelector('a');
    }

    cells.push([
      name || '',
      city || '',
      address || '',
      chips || '',
      hours || '',
      directions || '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'store-locator', cells });
  element.replaceWith(block);
}
