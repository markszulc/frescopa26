// codegen:layout-pattern=booking-form
// Sample data for standalone/preview mode. In production, the confirmation comes
// from bridge.toolResult (flat structuredContent object matching outputSchema).
const SHOWROOMS = [
  'Seattle — Pike Place',
  'Portland — Pearl District',
  'San Francisco — Hayes Valley',
];
const TIME_SLOTS = ['11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
const INTERESTS = [
  'The Atelier line',
  'Espresso & milk',
  'Cold brew & tea',
  'Bean subscriptions',
];

// Brand colors from DESIGN_TOKENS' color tier. getThemedCardBg() darkens PALETTE[0]
// to luminance <= 0.12 so cream text keeps WCAG AA contrast on the header block.
const PALETTE = ['#ba6945', '#9a4f35', '#d4a24a', '#4d2622', '#f8f5ee', '#f3ede3', '#211914', '#2d221b'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#f3ede3' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#f3ede3' };
}
const theme = getThemedCardBg(PALETTE);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function buildHeader() {
  const header = el('div', 'bat-header');
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
  const eyebrow = el('span', 'bat-eyebrow', 'Private showroom tour');
  const title = el('h3', 'bat-title', 'Book a private Atelier tour');
  const meta = el('div', 'bat-meta');
  ['45 minutes', 'One-to-one', 'Free — no payment'].forEach((m) => meta.appendChild(el('span', 'bat-chip', m)));
  header.append(eyebrow, title, meta);
  return header;
}

function field(labelText, control) {
  const wrap = el('div', 'bat-field');
  const label = el('label', 'bat-label', labelText);
  const id = `bat-${labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  label.setAttribute('for', id);
  control.id = id;
  wrap.append(label, control);
  return wrap;
}

function selectControl(options, placeholder) {
  const s = el('select', 'bat-input');
  if (placeholder) {
    const o = el('option', null, placeholder);
    o.value = '';
    o.disabled = true;
    o.selected = true;
    s.appendChild(o);
  }
  options.forEach((opt) => {
    const o = el('option', null, opt);
    o.value = opt;
    s.appendChild(o);
  });
  return s;
}

function renderForm(block, bridge) {
  block.textContent = '';
  const card = el('div', 'bat-card');
  card.appendChild(buildHeader());

  const form = el('form', 'bat-form');

  const showroom = selectControl(SHOWROOMS, 'Choose a showroom café');
  const date = el('input', 'bat-input'); date.type = 'date';
  const time = selectControl(TIME_SLOTS, 'Select a time slot');
  const guests = el('input', 'bat-input'); guests.type = 'number'; guests.min = '1'; guests.max = '8'; guests.value = '2';
  const name = el('input', 'bat-input'); name.type = 'text'; name.placeholder = 'Full name';
  const email = el('input', 'bat-input'); email.type = 'email'; email.placeholder = 'you@example.com';
  const phone = el('input', 'bat-input'); phone.type = 'tel'; phone.placeholder = 'Optional';

  form.append(
    field('Showroom', showroom),
    field('Date', date),
    field('Time', time),
    field('Guests', guests),
    field('Name', name),
    field('Email', email),
    field('Phone', phone),
  );

  const interestWrap = el('div', 'bat-field');
  interestWrap.appendChild(el('span', 'bat-label', 'Interests (optional)'));
  const chips = el('div', 'bat-interests');
  const chosen = new Set();
  INTERESTS.forEach((intname) => {
    const b = el('button', 'bat-interest', intname);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const on = chips.contains(b) && b.getAttribute('aria-pressed') === 'true';
      if (on) { chosen.delete(intname); b.setAttribute('aria-pressed', 'false'); b.classList.remove('is-on'); } else { chosen.add(intname); b.setAttribute('aria-pressed', 'true'); b.classList.add('is-on'); }
    });
    chips.appendChild(b);
  });
  interestWrap.appendChild(chips);
  form.appendChild(interestWrap);

  const submit = el('button', 'bat-submit', 'Request my tour');
  submit.type = 'submit';
  form.appendChild(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!bridge) return;
    const parts = [
      `Please request a private Atelier tour at ${showroom.value || 'the Seattle showroom'}`,
      date.value ? `on ${date.value}` : '',
      time.value ? `at ${time.value}` : '',
      `for ${guests.value || '2'} guest(s)`,
      name.value ? `under the name ${name.value}` : '',
      email.value ? `(email ${email.value}${phone.value ? `, phone ${phone.value}` : ''})` : '',
      chosen.size ? `Interests: ${[...chosen].join(', ')}.` : '',
    ].filter(Boolean);
    bridge.sendMessage(parts.join(' '));
  });

  card.appendChild(form);
  block.appendChild(card);
}

function ctaButton(text, onClick) {
  const b = el('button', 'bat-cta', text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function renderConfirmation(block, item, bridge) {
  block.textContent = '';
  const card = el('div', 'bat-card bat-confirm');

  const header = el('div', 'bat-header');
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
  const status = el('span', 'bat-status', item.status || 'Pending confirmation');
  const title = el('h3', 'bat-title', 'Tour request received');
  header.append(status, title);
  if (item.confirmation_id) header.appendChild(el('span', 'bat-conf-id', `Ref ${item.confirmation_id}`));
  card.appendChild(header);

  const body = el('div', 'bat-summary');
  const rows = [
    ['Showroom', item.showroom_name],
    ['Address', item.address],
    ['When', [item.requested_date, item.requested_time].filter(Boolean).join(' · ')],
    ['Guests', item.guest_count != null ? String(item.guest_count) : null],
    ['Duration', item.duration_minutes != null ? `${item.duration_minutes} minutes` : null],
  ];
  rows.forEach(([k, v]) => {
    if (!v) return;
    const row = el('div', 'bat-row');
    row.append(el('span', 'bat-row-k', k), el('span', 'bat-row-v', v));
    body.appendChild(row);
  });
  if (item.message) body.appendChild(el('p', 'bat-message', item.message));
  card.appendChild(body);

  const actions = el('div', 'bat-actions');
  if (bridge && item.directions_url) {
    actions.appendChild(ctaButton('Get Directions', () => bridge.openLink(item.directions_url)));
  }
  const detailUrl = item.detail_url || 'https://www.frescopa.coffee/machines/atelier';
  if (bridge) actions.appendChild(ctaButton('Explore Atelier', () => bridge.openLink(detailUrl)));
  if (actions.children.length) card.appendChild(actions);

  block.appendChild(card);
}

export default async function decorate(block, bridge) {
  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      renderForm(block, bridge);
    } else {
      const _result = await bridge.toolResult;
      const item = _result?.structuredContent || {};
      if (item && item.confirmation_id) {
        renderConfirmation(block, item, bridge);
      } else {
        renderForm(block, bridge);
      }
    }
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  } else {
    renderForm(block, null);
  }
}
