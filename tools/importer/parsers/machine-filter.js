/* eslint-disable */
/* global WebImporter */
/**
 * Parser for machine-filter. The source renders a row of <button> tabs
 * (All machines / Bean-to-cup / Espresso / Filter / Cold brew). Each becomes a
 * block row: [label, family-key], where the key maps to the family sections'
 * data-family attribute ("all" reveals every family).
 */
export default function parse(element, { document }) {
  const buttons = Array.from(element.querySelectorAll('button'));
  if (!buttons.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const toKey = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const rows = buttons.map((btn) => {
    const label = btn.textContent.trim();
    const key = /^all/i.test(label) ? 'all' : toKey(label);
    const labelCell = document.createElement('div');
    labelCell.textContent = label;
    const keyCell = document.createElement('div');
    keyCell.textContent = key;
    return [labelCell, keyCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'machine-filter', cells: rows });
  element.replaceWith(block);
}
