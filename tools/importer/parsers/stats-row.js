/* eslint-disable */
/* global WebImporter */
/**
 * Parser for stats-row. Base: stats-row (custom block).
 * Source: https://markszulc.github.io/frescopa-atelier/cafe.html
 *         (#locations > div > div:nth-of-type(1))
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/stats-row/stats-row.js):
 *   2 columns. Each row is one statistic: cell 1 = big number, cell 2 = label.
 */
export default function parse(element, { document }) {
  // `element` is the stats grid; each direct child div is one stat.
  let stats = Array.from(element.children).filter((c) => c.nodeType === 1);

  // Fallback: find stat groups (a wrapper with two inline children).
  if (stats.length === 0) {
    stats = Array.from(element.querySelectorAll(':scope > div')).filter(
      (d) => d.children.length >= 2,
    );
  }
  const uniqueStats = [...new Set(stats)];

  // Empty-block guard.
  if (uniqueStats.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  uniqueStats.forEach((stat) => {
    const parts = Array.from(stat.children).filter((c) => c.nodeType === 1);
    const number = parts[0] || '';
    const label = parts[1] || '';
    cells.push([number, label]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'stats-row', cells });
  element.replaceWith(block);
}
