/**
 * Booking form.
 *
 * Authored structure (two rows):
 *   Row 1: intro copy column (eyebrow, heading, paragraph, benefits list).
 *   Row 2: form column. Each child paragraph/element defines a field using a
 *          "Label | type | options" convention, e.g.
 *            Café | select | Choose a showroom café, Fréscopa SoHo, ...
 *            Date | date
 *            Time | select | Pick a slot, 9:00 AM, 10:30 AM
 *            Name | text
 *            Email | email
 *            Phone (optional) | tel
 *            I'd most like to see | toggle | The Atelier line, Espresso & milk
 *            Request this tour | submit
 *            note | We'll confirm by email within one business day.
 *
 * The block renders a labelled, accessible form. Submission is handled
 * client-side (prevented default) since there is no backend endpoint.
 */
function buildField(spec) {
  const [rawLabel, rawType, rawOptions] = spec.split('|').map((s) => s.trim());
  const type = (rawType || 'text').toLowerCase();
  const options = rawOptions ? rawOptions.split(',').map((o) => o.trim()).filter(Boolean) : [];
  const id = rawLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (type === 'submit') {
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'booking-form-submit';
    const span = document.createElement('span');
    span.textContent = rawLabel.replace(/→\s*$/, '').trim();
    const arrow = document.createElement('span');
    arrow.className = 'booking-form-submit-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    btn.append(span, arrow);
    return btn;
  }

  if (type === 'note' || rawLabel.toLowerCase() === 'note') {
    const note = document.createElement('p');
    note.className = 'booking-form-note';
    // Note text may be authored after the label ("note | message") or after
    // an explicit type ("message | note | ...").
    note.textContent = (rawLabel.toLowerCase() === 'note' ? rawType : rawOptions) || rawLabel;
    return note;
  }

  const field = document.createElement('label');
  field.className = 'booking-form-field';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'booking-form-label';
  labelSpan.innerHTML = rawLabel;
  field.append(labelSpan);

  if (type === 'select') {
    const select = document.createElement('select');
    select.id = id;
    options.forEach((opt) => {
      const option = document.createElement('option');
      option.textContent = opt;
      select.append(option);
    });
    field.append(select);
  } else if (type === 'toggle') {
    field.classList.add('booking-form-field--toggle');
    const group = document.createElement('div');
    group.className = 'booking-form-toggle';
    group.setAttribute('role', 'group');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', () => btn.classList.toggle('is-active'));
      group.append(btn);
    });
    field.append(group);
  } else {
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    field.append(input);
  }
  return field;
}

/**
 * Wraps consecutive fields into a two-column row.
 * @param  {...HTMLElement} fields
 */
function pairRow(...fields) {
  const row = document.createElement('div');
  row.className = 'booking-form-row';
  row.append(...fields);
  return row;
}

export default function decorate(block) {
  const rows = [...block.children];
  const copyRow = rows[0];
  const formRow = rows[1];

  block.textContent = '';

  const copy = document.createElement('div');
  copy.className = 'booking-form-copy';
  if (copyRow) {
    while (copyRow.firstElementChild) copy.append(copyRow.firstElementChild);
    // Benefit list items are authored with a leading arrow ("→text"). Split the
    // marker into its own span so it can be styled and spaced independently.
    copy.querySelectorAll('ul li').forEach((li) => {
      const text = li.textContent.trim();
      const match = text.match(/^([→▸►·-])\s*(.*)$/);
      if (match) {
        const [, markerChar, labelText] = match;
        li.textContent = '';
        const marker = document.createElement('span');
        marker.className = 'booking-form-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = markerChar;
        const label = document.createElement('span');
        label.textContent = labelText;
        li.append(marker, label);
      }
    });
  }

  const form = document.createElement('form');
  form.className = 'booking-form-form';
  form.setAttribute('novalidate', '');
  if (formRow) {
    // Each field is authored as a paragraph using the "Label | type | options"
    // convention. Depending on how EDS wraps the cell, the paragraphs may be
    // direct children of the row or nested one level deeper inside a cell div.
    let specSource = [...formRow.children];
    if (specSource.length === 1 && specSource[0].querySelector('p')) {
      specSource = [...specSource[0].children];
    }
    const specs = specSource.map((el) => el.textContent.trim()).filter(Boolean);
    const built = specs.map((spec) => ({ spec, el: buildField(spec) }));

    // Group specific adjacent fields into two-column rows to match the source
    // layout (Date + Time, Email + Phone).
    const pairKeys = [['date', 'time'], ['email', 'phone']];
    const isPairStart = (label) => pairKeys.some(([a]) => label.startsWith(a));
    const consumed = new Set();

    built.forEach((item, i) => {
      if (consumed.has(i)) return;
      const label = item.spec.split('|')[0].trim().toLowerCase();
      const next = built[i + 1];
      const pair = pairKeys.find(([a]) => label.startsWith(a));
      if (pair && next) {
        const nextLabel = next.spec.split('|')[0].trim().toLowerCase();
        if (nextLabel.startsWith(pair[1])) {
          form.append(pairRow(item.el, next.el));
          consumed.add(i);
          consumed.add(i + 1);
          return;
        }
      }
      if (!isPairStart(label) || !pair) {
        form.append(item.el);
      } else {
        form.append(item.el);
      }
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('is-submitted');
  });

  block.append(copy, form);
}
