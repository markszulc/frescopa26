// codegen:layout-pattern=comparison
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    product_id: 'the-atelier',
    name: 'The Atelier',
    category: 'Bean-to-cup',
    price: 2199,
    availability: 'Available now',
    automation_level: 'Fully automatic',
    brewing_methods: ['Espresso', 'Filter', 'Long black', 'Cappuccino', 'Latte', 'Tea'],
    ideal_for: 'Hands-off households wanting barista-quality coffee tailored to each person',
    capacity: '1.8 L water tank, 250 g bean hopper',
    dimensions: '32 × 24 × 41 cm, 9.8 kg',
    key_features: [
      'Learns your taste over ~7 days, no dialing-in',
      "Up to 6 household taste profiles ('flavour DNA')",
      'Contextual intelligence reads calendar, weather and time of day',
      'Automatic warm-up before your alarm and self-reordering beans',
      'Whisper-quiet grinding at 58 dB',
    ],
    image_url: 'https://www.frescopa.coffee/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines/atelier',
    description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup, reads the day ahead, and reorders beans before you run out.',
  },
  {
    product_id: 'the-barista',
    name: 'The Barista',
    category: 'Espresso',
    price: 899,
    availability: 'Waitlist',
    automation_level: 'Manual',
    brewing_methods: ['Espresso'],
    ideal_for: 'People who want to be the barista and enjoy the hands-on ritual',
    capacity: '',
    dimensions: '',
    key_features: [
      'Full manual control over grind, dose and pull',
      'Tactile, built to reward practice',
    ],
    image_url: 'https://www.frescopa.coffee/media_1db811b17fbc255479a69bb6ae75e55e55fbd2ea3.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
    description: 'A hands-on espresso machine for the morning ritualist, with full manual control.',
  },
];

// Brand palette from DESIGN_TOKENS (Warm Atelier). getThemedCardBg darkens PALETTE[0] to
// luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#ba6945', '#9a4f35', '#d4a24a', '#4d2622', '#f8f5ee', '#f3ede3', '#211914', '#2d221b'];
const CARD_COLORS = ['#ba6945', '#9a4f35', '#d4a24a', '#4d2622', '#503d2c', '#6a5540'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

function fmtPrice(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return `$${v.toLocaleString('en-US')}`;
  return String(v);
}

function fmtValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return String(v);
}

function buildImage(container, item, i) {
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

function renderComparison(block, itemsIn, bridge) {
  block.textContent = '';
  const items = (itemsIn || []).slice(0, 2);
  if (items.length < 2) {
    const empty = document.createElement('p');
    empty.className = 'ccm-empty';
    empty.textContent = 'Two machines are needed to compare.';
    block.appendChild(empty);
    return;
  }

  const bg = theme?.bg ?? '#1a1a1a';
  const fg = theme?.fg ?? '#ffffff';

  const wrap = document.createElement('div');
  wrap.className = 'ccm-wrap';
  wrap.style.background = bg;
  wrap.style.color = fg;

  // Header panels — leading spacer matches the table's label column so the
  // panel boundary lines up with the value-column boundary below.
  const heads = document.createElement('div');
  heads.className = 'ccm-heads';
  const headSpacer = document.createElement('div');
  headSpacer.className = 'ccm-head-spacer';
  headSpacer.setAttribute('aria-hidden', 'true');
  heads.appendChild(headSpacer);
  items.forEach((item, i) => {
    const panel = document.createElement('div');
    panel.className = 'ccm-panel';

    const imgBox = document.createElement('div');
    imgBox.className = 'ccm-panel-img';
    buildImage(imgBox, item, i);
    panel.appendChild(imgBox);

    const body = document.createElement('div');
    body.className = 'ccm-panel-body';
    body.style.background = bg;
    body.style.color = fg;

    const name = document.createElement('h3');
    name.className = 'ccm-name';
    name.textContent = item.name || '';
    body.appendChild(name);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'ccm-desc';
      desc.textContent = item.description;
      body.appendChild(desc);
    }

    if (item.availability) {
      const badge = document.createElement('span');
      badge.className = 'ccm-avail';
      badge.textContent = item.availability;
      body.appendChild(badge);
    }

    panel.appendChild(body);
    heads.appendChild(panel);
  });
  wrap.appendChild(heads);

  // Attribute table
  const rows = [
    { label: 'Price', get: (it) => fmtPrice(it.price), lead: true },
    { label: 'Category', get: (it) => fmtValue(it.category) },
    { label: 'Availability', get: (it) => fmtValue(it.availability) },
    { label: 'Automation', get: (it) => fmtValue(it.automation_level) },
    { label: 'Brews', get: (it) => fmtValue(it.brewing_methods) },
    { label: 'Ideal for', get: (it) => fmtValue(it.ideal_for) },
    { label: 'Capacity', get: (it) => fmtValue(it.capacity) },
    { label: 'Footprint', get: (it) => fmtValue(it.dimensions) },
    { label: 'Features', get: (it) => fmtValue(it.key_features) },
  ];

  const table = document.createElement('div');
  table.className = 'ccm-table';
  rows.forEach((row, idx) => {
    const tr = document.createElement('div');
    tr.className = `ccm-row${row.lead ? ' ccm-row-lead' : ''}${idx % 2 ? ' ccm-row-alt' : ''}`;

    const label = document.createElement('div');
    label.className = 'ccm-label';
    label.textContent = row.label;
    tr.appendChild(label);

    const v0 = row.get(items[0]);
    const v1 = row.get(items[1]);
    const differ = v0 !== v1 && v0 !== '—' && v1 !== '—';

    [v0, v1].forEach((val) => {
      const cell = document.createElement('div');
      cell.className = `ccm-cell${differ ? ' ccm-diff' : ''}`;
      cell.textContent = val;
      tr.appendChild(cell);
    });

    table.appendChild(tr);
  });

  // CTA row — one button per machine
  const ctaRow = document.createElement('div');
  ctaRow.className = 'ccm-row ccm-cta-row';
  const spacer = document.createElement('div');
  spacer.className = 'ccm-label';
  ctaRow.appendChild(spacer);
  items.forEach((item) => {
    const cellWrap = document.createElement('div');
    cellWrap.className = 'ccm-cell ccm-cta-cell';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ccm-cta';
    const waitlist = /wait/i.test(item.availability || '');
    btn.textContent = waitlist ? 'Join Waitlist' : 'View Machine';
    if (bridge) {
      btn.addEventListener('click', () => {
        if (item.detail_url) bridge.openLink(item.detail_url);
        else bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    cellWrap.appendChild(btn);
    ctaRow.appendChild(cellWrap);
  });
  table.appendChild(ctaRow);

  wrap.appendChild(table);
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
