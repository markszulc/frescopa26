// codegen:layout-pattern=generic-form
// Sample data for standalone/preview mode.
// In production, the submitted registration result comes from bridge.toolResult.
const SAMPLE_MACHINE = {
  machine_name: 'The Atelier Mini',
  category: 'Bean-to-cup',
  price_label: '$799',
  availability: 'Join the list',
  availability_status: 'waitlist',
  image_url: '',
};

// Sample confirmation for preview after submit (mirrors outputSchema).
const SAMPLE_CONFIRMATION = {
  confirmation_id: 'WL-ATLR-MINI-00427',
  status: 'registered',
  machine_name: 'The Atelier Mini',
  email: 'you@example.com',
  message: 'You are on the waitlist for The Atelier Mini. We will email you the moment it becomes available to order.',
};

const CARD_COLORS = ['#ba6945', '#9a4f35', '#d8a24f', '#211914'];

const FOLLOW_UPS = [
  'Compare Available Machines',
  'Find a Showroom',
  'Explore the Machine Range',
];

export default async function decorate(block, bridge) {
  let machine = SAMPLE_MACHINE;
  let confirmation = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (!isPreview) {
      // Production — the tool result is the flat confirmation object.
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      if (structuredContent.confirmation_id || structuredContent.status) {
        confirmation = structuredContent;
        machine = { ...machine, machine_name: structuredContent.machine_name || machine.machine_name };
      }
    }
  }

  block.textContent = '';
  if (confirmation) {
    renderConfirmation(block, confirmation, bridge);
  } else {
    renderForm(block, machine, bridge);
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

function buildImage(machine) {
  const imageWrap = document.createElement('div');
  imageWrap.className = 'jmw-hero';
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${CARD_COLORS[0]};`;
    return d;
  };
  if (machine.image_url) {
    const img = document.createElement('img');
    img.src = machine.image_url;
    img.alt = machine.machine_name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageWrap.appendChild(img);
  } else {
    imageWrap.appendChild(colorDiv());
  }
  return imageWrap;
}

function buildSummary(machine) {
  const summary = document.createElement('div');
  summary.className = 'jmw-summary';

  summary.appendChild(buildImage(machine));

  const meta = document.createElement('div');
  meta.className = 'jmw-summary-meta';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'jmw-eyebrow';
  eyebrow.textContent = machine.availability || 'Join the list';
  meta.appendChild(eyebrow);

  const name = document.createElement('h3');
  name.className = 'jmw-name';
  name.textContent = machine.machine_name;
  meta.appendChild(name);

  const chips = document.createElement('div');
  chips.className = 'jmw-chips';
  if (machine.category) {
    const cat = document.createElement('span');
    cat.className = 'jmw-chip';
    cat.textContent = machine.category;
    chips.appendChild(cat);
  }
  if (machine.price_label) {
    const price = document.createElement('span');
    price.className = 'jmw-price';
    price.textContent = machine.price_label;
    chips.appendChild(price);
  }
  meta.appendChild(chips);

  summary.appendChild(meta);
  return summary;
}

function buildField(labelText, input) {
  const wrap = document.createElement('label');
  wrap.className = 'jmw-field';
  const label = document.createElement('span');
  label.className = 'jmw-label';
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(input);
  return wrap;
}

function renderForm(block, machine, bridge) {
  const card = document.createElement('div');
  card.className = 'jmw-card';

  card.appendChild(buildSummary(machine));

  const form = document.createElement('form');
  form.className = 'jmw-form';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.required = true;
  nameInput.autocomplete = 'name';
  nameInput.placeholder = 'Your full name';
  form.appendChild(buildField('Full name', nameInput));

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.placeholder = 'you@example.com';
  form.appendChild(buildField('Email', emailInput));

  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.name = 'location';
  locInput.autocomplete = 'address-level2';
  locInput.placeholder = 'City, state, or postal code';
  form.appendChild(buildField('Location (optional)', locInput));

  const consentWrap = document.createElement('label');
  consentWrap.className = 'jmw-consent';
  const consent = document.createElement('input');
  consent.type = 'checkbox';
  consent.name = 'marketing_consent';
  const consentText = document.createElement('span');
  consentText.textContent = 'Send me availability updates and related Fréscopa news.';
  consentWrap.appendChild(consent);
  consentWrap.appendChild(consentText);
  form.appendChild(consentWrap);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'jmw-submit';
  submit.textContent = 'Join the Waitlist';
  form.appendChild(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nameInput.value.trim() || !emailInput.value.trim()) return;
    const parts = [
      `Join the waitlist for ${machine.machine_name}.`,
      `Name: ${nameInput.value.trim()}.`,
      `Email: ${emailInput.value.trim()}.`,
    ];
    if (locInput.value.trim()) parts.push(`Location: ${locInput.value.trim()}.`);
    parts.push(`Marketing consent: ${consent.checked ? 'yes' : 'no'}.`);
    if (bridge) {
      bridge.sendMessage(parts.join(' '));
    } else {
      block.textContent = '';
      renderConfirmation(block, {
        ...SAMPLE_CONFIRMATION,
        machine_name: machine.machine_name,
        email: emailInput.value.trim(),
      }, bridge);
    }
  });

  card.appendChild(form);
  block.appendChild(card);
}

function renderConfirmation(block, confirmation, bridge) {
  const card = document.createElement('div');
  card.className = 'jmw-card jmw-confirm';

  const check = document.createElement('div');
  check.className = 'jmw-check';
  check.textContent = '✓';
  card.appendChild(check);

  const heading = document.createElement('h3');
  heading.className = 'jmw-name';
  heading.textContent = `You're on the list${confirmation.machine_name ? ` for ${confirmation.machine_name}` : ''}`;
  card.appendChild(heading);

  if (confirmation.status) {
    const status = document.createElement('span');
    status.className = 'jmw-status-chip';
    status.textContent = confirmation.status;
    card.appendChild(status);
  }

  if (confirmation.message) {
    const msg = document.createElement('p');
    msg.className = 'jmw-message';
    msg.textContent = confirmation.message;
    card.appendChild(msg);
  }

  const details = document.createElement('div');
  details.className = 'jmw-details';
  const addRow = (label, value) => {
    if (!value) return;
    const row = document.createElement('div');
    row.className = 'jmw-detail-row';
    const l = document.createElement('span');
    l.className = 'jmw-detail-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'jmw-detail-value';
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    details.appendChild(row);
  };
  addRow('Confirmation', confirmation.confirmation_id);
  addRow('Email', confirmation.email);
  if (details.childElementCount) card.appendChild(details);

  const actions = document.createElement('div');
  actions.className = 'jmw-actions';
  FOLLOW_UPS.forEach((text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jmw-followup';
    btn.textContent = text;
    if (bridge) {
      btn.addEventListener('click', () => bridge.sendMessage(text));
    }
    actions.appendChild(btn);
  });
  card.appendChild(actions);

  const note = document.createElement('p');
  note.className = 'jmw-note';
  note.textContent = 'Registration reserves your place on the list. It does not guarantee a release date, inventory, or purchase priority.';
  card.appendChild(note);

  block.appendChild(card);
}
