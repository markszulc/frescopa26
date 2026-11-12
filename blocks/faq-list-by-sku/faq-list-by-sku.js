// blocks/faq-list-by-sku/faq-list-by-sku.js
//
// Standalone FAQ block. Two authoring shapes arrive here, both standard EDS
// block-table markup:
//
//   1. SKU row:  | SKU | CSM6001 |
//      What authors write, and what preview, da.live and localhost serve.
//      The block fetches the FAQs, turns them into Q/A rows, then decorates.
//
//   2. Q/A rows: | question | answer |  (one row per FAQ)
//      What the edge function serves on the live site, having already
//      swapped the SKU row for the FAQ content. The block just decorates.
//
// Either way the same decorateFaqs() builds the final DOM, so there's one
// renderer and the live and preview output can't drift apart.

const FAQ_ENDPOINT = 'https://www.frescopa.coffee/faq-data';
const SKU_RE = /^[A-Za-z0-9_-]{1,40}$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

const cellsOf = (row) => [...row.children].map((c) => c.textContent.trim());

// Read the SKU from the block's rows/cells rather than flattened text: the
// da.live canvas renders cells with no whitespace between them.
function readSku(block) {
  let sku = null;
  [...block.children].some((row) => {
    const cells = cellsOf(row);
    if (cells.length >= 2 && /^sku$/i.test(cells[0])) [, sku] = cells;
    return Boolean(sku);
  });
  return sku && SKU_RE.test(sku) ? sku : null;
}

function message(block, text) {
  const p = document.createElement('p');
  p.className = 'faq-message';
  p.textContent = text;
  block.replaceChildren(p);
}

// Built with createElementNS rather than innerHTML (Trusted Types CSP)
function chevron() {
  const wrap = document.createElement('span');
  wrap.className = 'faq-chevron';
  wrap.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  Object.entries({
    viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8',
  }).forEach(([k, v]) => svg.setAttribute(k, v));
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'm6 9 6 6 6-6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  wrap.append(svg);
  return wrap;
}

// Q/A data -> block-table rows, the same shape the edge function serves
export function toRows(items) {
  return items.map((it) => {
    const row = document.createElement('div');
    const q = document.createElement('div');
    q.textContent = it.question ?? '';
    const a = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = it.answer?.plaintext ?? '';
    a.append(p);
    row.append(q, a);
    return row;
  });
}

let groupSeq = 0;

// The one renderer: block-table Q/A rows -> details/summary accordion
export function decorateFaqs(block) {
  groupSeq += 1;
  const groupName = `faq-${groupSeq}`; // shared name = native single-open group

  const list = document.createElement('div');
  list.className = 'faq-items';

  [...block.children].forEach((row) => {
    const [qCell, aCell] = row.children;
    const question = qCell?.textContent.trim();
    if (!question) return;

    const details = document.createElement('details');
    details.className = 'faq-item';
    details.name = groupName;
    if (!list.children.length) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'faq-summary';
    const label = document.createElement('span');
    label.className = 'faq-label';
    const text = document.createElement('span');
    text.textContent = question;
    label.append(text);
    summary.append(label, chevron());

    const body = document.createElement('div');
    body.className = 'faq-body';
    // Move the answer's own nodes across so any formatting in the cell survives
    if (aCell) body.append(...aCell.childNodes);

    details.append(summary, body);
    list.append(details);
  });

  block.replaceChildren(list);
}

export default async function decorate(block) {
  // Already decorated (e.g. decorate() called twice on the same element)
  if (block.querySelector(':scope > .faq-items') || block.dataset.faqState) return;

  const sku = readSku(block);

  // No SKU row: these are Q/A rows from the edge function (or hand-authored)
  if (!sku) {
    const hasQaRows = [...block.children].some((row) => cellsOf(row).length >= 2);
    if (hasQaRows) decorateFaqs(block);
    else message(block, 'Add a product SKU to this block to show its FAQs.');
    return;
  }

  block.dataset.faqState = 'loading'; // claim the block while the fetch runs
  message(block, `Loading FAQs for ${sku}…`);

  try {
    const resp = await fetch(`${FAQ_ENDPOINT}?sku=${encodeURIComponent(sku)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const { items } = await resp.json();
    if (!items?.length) {
      message(block, `No FAQs found for SKU ${sku}.`);
      return;
    }
    block.replaceChildren(...toRows(items));
    decorateFaqs(block);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('faq-list-by-sku: could not load FAQs', e);
    message(block, `Couldn’t load FAQs for ${sku}.`);
  } finally {
    delete block.dataset.faqState;
  }
}
