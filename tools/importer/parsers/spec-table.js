/* eslint-disable */
/* global WebImporter */
/**
 * Parser for spec-table (Atelier full specification).
 * Source: atelier.html section #specs — eyebrow/heading head, six spec groups
 * (each an h3 title + a set of label/value rows), and an "In the box" list.
 *
 * Emits: head default content, then a block whose rows are
 * [groupTitleCell(h3), listCell(ul of "label — value")]. The "In the box" group
 * becomes a final row with a plain-item list.
 */
export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  // Head default content.
  const headNodes = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  if (eyebrow && t(eyebrow)) headNodes.push(el('p', t(eyebrow)));
  if (h2) headNodes.push(el('h2', t(h2)));

  const rows = [];
  [...element.querySelectorAll('h3')].forEach((h3) => {
    const title = t(h3);
    const wrap = h3.parentElement;
    const titleCell = el('div');
    titleCell.append(el('h3', title));
    const listCell = el('div');
    const ul = el('ul');

    if (/in the box/i.test(title)) {
      // Items are a set of rows, each a "—" marker cell + a label cell. Grab the
      // deepest leaf text of every item so each becomes its own list entry.
      let items = [...wrap.querySelectorAll('li')];
      if (!items.length) {
        // Rows live in the container after the h3; each row's meaningful text is
        // its last leaf (the marker cell is the "—").
        const container = [...wrap.children].find((c) => c !== h3 && c.children.length > 1) || wrap;
        items = [...container.children].filter((c) => c !== h3);
      }
      items.forEach((node) => {
        const text = t(node).replace(/^[—–-]\s*/, '').trim();
        if (text && !/^[—–-]$/.test(text)) ul.append(el('li', text));
      });
    } else {
      // Each spec row is a container with a label cell + a value cell.
      const specRows = [...wrap.children].filter((c) => c !== h3);
      specRows.forEach((r) => {
        const cells = [...r.children];
        let label; let value;
        if (cells.length >= 2) { label = t(cells[0]); value = t(cells[1]); }
        else { const parts = t(r).split(/\s+[—–-]\s+/); label = parts[0]; value = parts.slice(1).join(' — '); }
        if (label) ul.append(el('li', value ? `${label} — ${value}` : label));
      });
    }
    listCell.append(ul);
    rows.push([titleCell, listCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'spec-table', cells: rows });
  element.replaceWith(...headNodes, block);
}
