// codegen:layout-pattern=booking-form
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'The Atelier', description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup and reorders beans before you run low.', category: 'Bean-to-cup', price_label: '$2,199 or $184/month', availability: 'Available' },
  { name: 'The Atelier Mini', description: 'The same intelligent taste-learning technology as the flagship, sized for smaller kitchens.', category: 'Bean-to-cup', price_label: '$799', availability: 'Join the list' },
  { name: 'The Barista', description: 'A hands-on espresso machine for the morning ritualist, with full manual control over every shot.', category: 'Espresso', price_label: '$899', availability: 'Available' },
  { name: 'The Everyday', description: 'Honest espresso every single morning with simplified, one-button operation.', category: 'Espresso', price_label: '$499', availability: 'Available' },
  { name: 'The Slow Pour', description: 'Even saturation and gentle timing for consistent filter coffee.', category: 'Filter', price_label: '$279', availability: 'Available' },
  { name: 'The Carafe', description: 'Overnight steeping produces smooth, low-acid cold brew, ready from the fridge whenever you need it.', category: 'Cold brew', price_label: '$179', availability: 'Join the list' },
];

const SHOWROOMS = ['Fréscopa Atelier — Downtown', 'Fréscopa Atelier — Riverside', 'Fréscopa Atelier — Uptown'];
const TIMES = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
const INTERESTS = ['The Atelier line', 'Espresso & milk', 'Cold brew & tea', 'Bean subscriptions'];

// Brand colors from DESIGN_TOKENS (Warm Atelier). getThemedCardBg darkens PALETTE[0].
const PALETTE = ['#ba6945', '#d8a24f', '#211914', '#f8f5ee', '#f3ede3', '#2d221b', '#9a4f35', '#f2ece1'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let result = null;
  const featured = SAMPLE_DATA[0];

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (!isPreview) {
      // Confirmation concept — structuredContent is the flat result object.
      const _result = await bridge.toolResult;
      result = _result?.structuredContent || null;
    }
  }

  block.textContent = '';
  if (result && result.confirmation_id) {
    renderConfirmation(block, result, bridge);
  } else {
    renderForm(block, featured, bridge);
  }

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

function makeField(labelText, inputEl) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(inputEl);
  return wrap;
}

function renderForm(block, featured, bridge) {
  const card = document.createElement('div');
  card.className = 'bat-card';

  const header = document.createElement('div');
  header.className = 'bat-header';
  header.style.cssText = `background:${theme?.bg ?? '#211914'};color:${theme?.fg ?? '#fff'}`;
  const title = document.createElement('h3');
  title.className = 'bat-title';
  title.textContent = 'Book a Private Atelier Tour';
  header.appendChild(title);
  const summary = document.createElement('p');
  summary.className = 'bat-summary';
  summary.textContent = `Seeing ${featured.name} up close · Free, no payment required`;
  header.appendChild(summary);
  card.appendChild(header);

  const form = document.createElement('form');
  form.className = 'bat-form';

  const cafeSel = document.createElement('select');
  cafeSel.name = 'cafe_name';
  SHOWROOMS.forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; cafeSel.appendChild(o); });
  form.appendChild(makeField('Showroom café', cafeSel));

  const row = document.createElement('div');
  row.className = 'bat-row';
  const dateIn = document.createElement('input');
  dateIn.type = 'date';
  dateIn.name = 'date';
  row.appendChild(makeField('Date', dateIn));
  const timeSel = document.createElement('select');
  timeSel.name = 'time';
  TIMES.forEach((t) => { const o = document.createElement('option'); o.value = t; o.textContent = t; timeSel.appendChild(o); });
  row.appendChild(makeField('Time', timeSel));
  form.appendChild(row);

  const guestIn = document.createElement('input');
  guestIn.type = 'number';
  guestIn.name = 'guest_count';
  guestIn.min = '1';
  guestIn.value = '2';
  form.appendChild(makeField('Guests', guestIn));

  const nameIn = document.createElement('input');
  nameIn.type = 'text';
  nameIn.name = 'name';
  nameIn.placeholder = 'Full name';
  form.appendChild(makeField('Name', nameIn));

  const emailIn = document.createElement('input');
  emailIn.type = 'email';
  emailIn.name = 'email';
  emailIn.placeholder = 'you@example.com';
  form.appendChild(makeField('Email', emailIn));

  const phoneIn = document.createElement('input');
  phoneIn.type = 'tel';
  phoneIn.name = 'phone';
  phoneIn.placeholder = 'Optional';
  form.appendChild(makeField('Phone (optional)', phoneIn));

  const interestWrap = document.createElement('div');
  interestWrap.className = 'field';
  const interestLabel = document.createElement('label');
  interestLabel.textContent = 'Interests (optional)';
  interestWrap.appendChild(interestLabel);
  const chips = document.createElement('div');
  chips.className = 'bat-chips';
  const selected = new Set();
  INTERESTS.forEach((it) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'bat-chip';
    chip.textContent = it;
    chip.addEventListener('click', () => {
      if (selected.has(it)) { selected.delete(it); chip.classList.remove('selected'); }
      else { selected.add(it); chip.classList.add('selected'); }
    });
    chips.appendChild(chip);
  });
  interestWrap.appendChild(chips);
  form.appendChild(interestWrap);

  const note = document.createElement('p');
  note.className = 'bat-note';
  note.textContent = 'This tour is free — final confirmation is sent by email.';
  form.appendChild(note);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'bat-submit';
  submit.textContent = 'Request This Tour';
  form.appendChild(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const parts = [
      `Please request a private Fréscopa Atelier tour at ${cafeSel.value}`,
      dateIn.value ? `on ${dateIn.value}` : '',
      `at ${timeSel.value}`,
      `for ${guestIn.value} guest(s)`,
      nameIn.value ? `under ${nameIn.value}` : '',
      emailIn.value ? `(${emailIn.value})` : '',
      phoneIn.value ? `phone ${phoneIn.value}` : '',
      selected.size ? `interested in ${Array.from(selected).join(', ')}` : '',
    ].filter(Boolean);
    if (bridge) bridge.sendMessage(parts.join(' ') + '.');
  });

  card.appendChild(form);
  block.appendChild(card);
}

function renderConfirmation(block, result, bridge) {
  const card = document.createElement('div');
  card.className = 'bat-card';

  const header = document.createElement('div');
  header.className = 'bat-header';
  header.style.cssText = `background:${theme?.bg ?? '#211914'};color:${theme?.fg ?? '#fff'}`;
  const title = document.createElement('h3');
  title.className = 'bat-title';
  title.textContent = 'Tour Request Received';
  header.appendChild(title);
  const status = document.createElement('span');
  status.className = 'bat-status-chip';
  status.textContent = result.status || 'Pending email confirmation';
  header.appendChild(status);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'bat-confirm-body';

  const rows = [
    ['Confirmation', result.confirmation_id],
    ['Showroom', result.cafe_name],
    ['Date', result.date],
    ['Time', result.time],
    ['Guests', result.guest_count != null ? String(result.guest_count) : ''],
    ['Confirmation email', result.confirmation_email],
  ];
  rows.forEach(([k, v]) => {
    if (!v) return;
    const r = document.createElement('div');
    r.className = 'bat-crow';
    const key = document.createElement('span');
    key.className = 'bat-ckey';
    key.textContent = k;
    const val = document.createElement('span');
    val.className = 'bat-cval';
    val.textContent = v;
    r.appendChild(key);
    r.appendChild(val);
    body.appendChild(r);
  });

  if (result.message) {
    const msg = document.createElement('p');
    msg.className = 'bat-message';
    msg.textContent = result.message;
    body.appendChild(msg);
  }

  const actions = document.createElement('div');
  actions.className = 'bat-actions';
  const dir = document.createElement('button');
  dir.type = 'button';
  dir.className = 'bat-cta-secondary';
  dir.textContent = 'Get Directions';
  dir.addEventListener('click', () => { if (bridge) bridge.sendMessage(`Get directions to ${result.cafe_name || 'the Fréscopa showroom'}.`); });
  const explore = document.createElement('button');
  explore.type = 'button';
  explore.className = 'bat-submit';
  explore.textContent = 'Explore Atelier Details';
  explore.addEventListener('click', () => { if (bridge) bridge.sendMessage('Tell me more about The Atelier.'); });
  actions.appendChild(dir);
  actions.appendChild(explore);
  body.appendChild(actions);

  card.appendChild(body);
  block.appendChild(card);
}
