// blocks/faq-list-by-sku/faq-list-by-sku.js
//
// Standalone FAQ block. No dependency on any other block.
//
// Live site: the edge function has already rendered the finished markup
// (data-ssr="inlined"), so this does nothing. Preview, da.live and localhost
// don't go through the edge function, so here the block fetches the FAQs and
// builds the same markup itself. Keep buildFaqItems() in step with
// renderFaqs() in the edge function's faq.js.

const FAQ_ENDPOINT = 'https://www.frescopa.coffee/faq-data';
const SKU_RE = /^[A-Za-z0-9_-]{1,40}$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

// Read the SKU from the block's rows/cells rather than its flattened text.
// Published HTML has whitespace between cells ("SKU CSM6001"), but the
// da.live canvas re-renders the block with none ("SKUCSM6001"), which a
// text match can't split. Cells don't care about whitespace.
function readSku(block) {
  const rows = [...block.children];
  let sku = null;

  rows.some((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    if (cells.length >= 2 && /^sku$/i.test(cells[0])) [, sku] = cells;
    else if (cells.length === 1 && SKU_RE.test(cells[0])) [sku] = cells; // bare SKU, no label
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

function buildFaqItems(sku, items) {
  const list = document.createElement('div');
  list.className = 'faq-items';

  items.forEach((it, i) => {
    const details = document.createElement('details');
    details.className = 'faq-item';
    details.name = `faq-${sku}`; // shared name = native single-open group
    if (i === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'faq-summary';
    const label = document.createElement('span');
    label.className = 'faq-label';
    const text = document.createElement('span');
    text.textContent = it.question ?? '';
    label.append(text);
    summary.append(label, chevron());

    const body = document.createElement('div');
    body.className = 'faq-body';
    const p = document.createElement('p');
    p.textContent = it.answer?.plaintext ?? '';
    body.append(p);

    details.append(summary, body);
    list.append(details);
  });

  return list;
}

// Done already if the edge rendered it or an earlier decorate() claimed it
function alreadyRendered(block) {
  return Boolean(block.dataset.ssr) || Boolean(block.querySelector(':scope > .faq-items'));
}

export default async function decorate(block) {
  if (alreadyRendered(block)) return;
  block.dataset.ssr = 'pending'; // claim the block so a second decorate() bails out

  const sku = readSku(block);
  if (!sku) {
    message(block, 'Add a product SKU to this block to show its FAQs.');
    return;
  }

  block.dataset.sku = sku;
  message(block, `Loading FAQs for ${sku}…`);

  try {
    const resp = await fetch(`${FAQ_ENDPOINT}?sku=${encodeURIComponent(sku)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const { items } = await resp.json();
    if (!items?.length) {
      message(block, `No FAQs found for SKU ${sku}.`);
      return;
    }
    block.replaceChildren(buildFaqItems(sku, items));
    block.dataset.ssr = 'client';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('faq-list-by-sku: could not load FAQs', e);
    message(block, `Couldn’t load FAQs for ${sku}.`);
  }
}