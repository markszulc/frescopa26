// codegen:layout-pattern=comparison
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'The Atelier',
    description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup and reorders beans before you run low.',
    category: 'Bean-to-cup',
    brewing_style: 'bean-to-cup',
    price: 2199,
    price_label: '$2,199 or $184/month',
    automation_level: 'Fully automatic',
    footprint: '32 × 24 × 41 cm',
    capacity: '1.8 L water tank, 250 g bean hopper',
    availability: 'Available',
    key_features: ['Taste-learning flavour DNA per user', 'Sensor ring monitors grind, flow, strength and temperature', 'Automatic motorized milk wand', 'Wi-Fi + calendar integration', '2-year warranty, 30-night trial'],
    tradeoffs: ['Highest price in the range', 'Hands-off automation means less manual control for ritual enthusiasts'],
    image_url: 'https://main--frescopa26--markszulc.aem.live/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=1200&format=pjpg&optimize=medium',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/atelier',
  },
  {
    name: 'The Barista',
    description: 'A hands-on espresso machine for the morning ritualist, with full manual control over every shot.',
    category: 'Espresso',
    brewing_style: 'hands-on espresso',
    price: 899,
    price_label: '$899',
    automation_level: 'Manual',
    footprint: 'Standard espresso machine',
    capacity: 'Espresso-based drinks',
    availability: 'Available',
    key_features: ['Pure hands-on craft, no automation', 'Manual steam wand', 'Single shared setup'],
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
];

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#ba6945', '#d8a24f', '#211914', '#f8f5ee', '#f3ede3', '#2d221b', '#9a4f35', '#f2ece1'];
const CARD_COLORS = ['#ba6945', '#9a4f35', '#d8a24f', '#211914'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const ATTR_ROWS = [
  { key: 'category', label: 'Category' },
  { key: 'price_label', label: 'Price', lead: true },
  { key: 'availability', label: 'Availability', lead: true },
  { key: 'brewing_style', label: 'Brewing' },
  { key: 'automation_level', label: 'Automation' },
  { key: 'footprint', label: 'Footprint' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'key_features', label: 'Features' },
];

function fmtValue(v) {
  if (Array.isArray(v)) return v.join(', ');
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

function makeImage(item, i, container) {
  const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    container.appendChild(img);
  } else {
    container.appendChild(colorDiv());
  }
}

function renderComparison(block, items, bridge) {
  block.textContent = '';
  const pair = items.slice(0, 2);
  if (pair.length < 2) {
    const empty = document.createElement('p');
    empty.className = 'ccm-empty';
    empty.textContent = 'Two machines are needed to compare.';
    block.appendChild(empty);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'ccm-wrap';

  // Header panels
  const panels = document.createElement('div');
  panels.className = 'ccm-panels ccm-header-row';
  const headSpacer = document.createElement('div');
  headSpacer.className = 'ccm-cta-spacer';
  headSpacer.setAttribute('aria-hidden', 'true');
  panels.appendChild(headSpacer);
  pair.forEach((item, i) => {
    const panel = document.createElement('div');
    panel.className = 'ccm-panel';

    const imgBox = document.createElement('div');
    imgBox.className = 'ccm-panel-img';
    makeImage(item, i, imgBox);
    panel.appendChild(imgBox);

    const body = document.createElement('div');
    body.className = 'ccm-panel-body';
    body.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'ccm-panel-name';
    name.textContent = item.name || '';
    body.appendChild(name);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'ccm-panel-desc';
      desc.textContent = item.description;
      body.appendChild(desc);
    }
    panel.appendChild(body);
    panels.appendChild(panel);
  });
  wrap.appendChild(panels);

  // Attribute table
  const table = document.createElement('div');
  table.className = 'ccm-table';
  table.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  ATTR_ROWS.forEach((row, idx) => {
    const va = fmtValue(pair[0][row.key]);
    const vb = fmtValue(pair[1][row.key]);
    const differ = va !== vb;

    const tr = document.createElement('div');
    tr.className = `ccm-row${idx % 2 ? ' ccm-row-alt' : ''}${row.lead ? ' ccm-row-lead' : ''}`;

    const label = document.createElement('div');
    label.className = 'ccm-label';
    label.textContent = row.label;
    tr.appendChild(label);

    [va, vb].forEach((val) => {
      const cell = document.createElement('div');
      cell.className = `ccm-val${differ ? ' ccm-val-diff' : ''}`;
      cell.textContent = val;
      tr.appendChild(cell);
    });
    table.appendChild(tr);
  });
  wrap.appendChild(table);

  // CTA rows
  const ctas = document.createElement('div');
  ctas.className = 'ccm-ctas';

  const viewRow = document.createElement('div');
  viewRow.className = 'ccm-cta-row';
  const spacer = document.createElement('div');
  spacer.className = 'ccm-cta-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  viewRow.appendChild(spacer);
  pair.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ccm-cta ccm-cta-view';
    btn.textContent = 'View Machine';
    if (bridge && item.product_url) {
      btn.addEventListener('click', () => bridge.openLink(item.product_url));
    }
    viewRow.appendChild(btn);
  });
  ctas.appendChild(viewRow);

  [
    { text: 'Book an Atelier Tour', msg: 'Book an Atelier tour' },
    { text: 'Find a Showroom', msg: 'Find a Fréscopa showroom near me' },
  ].forEach((shared) => {
    const row = document.createElement('div');
    row.className = 'ccm-cta-row ccm-cta-row-shared';
    const sp = document.createElement('div');
    sp.className = 'ccm-cta-spacer';
    sp.setAttribute('aria-hidden', 'true');
    row.appendChild(sp);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ccm-cta ccm-cta-shared';
    btn.textContent = shared.text;
    if (bridge) btn.addEventListener('click', () => bridge.sendMessage(shared.msg));
    row.appendChild(btn);
    ctas.appendChild(row);
  });
  wrap.appendChild(ctas);

  block.appendChild(wrap);
}

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.machines — bare array outputSchema; key derived from actionName "compare_coffee_machines"
      items = structuredContent?.machines || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  renderComparison(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}
