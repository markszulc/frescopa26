/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-editorial. Base: columns.
 * Sources:
 *   home  – section.intro / section.sustain (.intro__grid: lead + body, 2 text cols)
 *   beverages – section:nth-of-type(2..4) (image col + text col)
 *   cafe – #experience > div > div (text col + media col), #locations article (single col)
 * Generated: 2026-07-15
 *
 * Library convention (Columns): flexible column count. Row 1 = block name.
 * Row 2 (+optional additional rows) = one cell per visual column.
 * Approach: locate the grid "row" container and map each of its direct child
 * elements to a column cell. Column count derives from the source layout.
 */
export default function parse(element, { document, url }) {
  // Normalise relative image sources to absolute so the importer's image-URL
  // adjustment can resolve them (the dc-runtime emits src="assets/..." which
  // otherwise gets dropped).
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try {
        img.setAttribute('src', new URL(img.getAttribute('src'), url).href);
      } catch (e) {
        /* leave as-is if it cannot be resolved */
      }
    });
  }

  // Locate the container whose direct children are the visual columns.
  // Preference order: known grid classes, then a descendant CSS grid, then the
  // element itself when it already is the row (e.g. an article or a bare grid div).
  const namedGrid = element.querySelector(
    '.intro__grid, [class*="__grid"], [class*="grid"]',
  );

  let rowContainer = null;

  // Helper: does this element look like a row of columns (2+ block children)?
  const elementChildren = (el) => Array.from(el.children).filter(
    (c) => c.nodeType === 1,
  );

  if (namedGrid && elementChildren(namedGrid).length >= 2) {
    rowContainer = namedGrid;
  } else if (elementChildren(element).length >= 2
    && elementChildren(element).every((c) => c.tagName === 'DIV' || c.tagName === 'FIGURE')) {
    // element itself is the grid row (e.g. #experience > div > div)
    rowContainer = element;
  } else {
    // Fall back to the deepest wrapper that holds multiple column divs.
    const gridDiv = Array.from(element.querySelectorAll('div')).find((d) => {
      const kids = elementChildren(d);
      return kids.length >= 2 && kids.every((k) => k.tagName === 'DIV' || k.tagName === 'FIGURE');
    });
    rowContainer = gridDiv || element;
  }

  let columns = elementChildren(rowContainer);

  // Single-column source (e.g. #locations article): treat the whole element as
  // one column so its content is preserved.
  if (columns.length < 2) {
    columns = [rowContainer];
  }

  // Empty-block guard.
  const hasContent = columns.some(
    (col) => col.textContent.trim() || col.querySelector('img, picture'),
  );
  if (!hasContent) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 2: one cell per column.
  cells.push(columns.map((col) => col));

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-editorial', cells });
  element.replaceWith(block);
}
