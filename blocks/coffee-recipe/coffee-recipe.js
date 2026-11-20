const MAX_SCORE = 10;
const STRENGTH_POS = {
  gentle: 12, mild: 25, light: 25, balanced: 55, medium: 55, strong: 80, bold: 88,
};
const SIZES = ['small', 'regular', 'large'];
const DIET_SCHEMA = {
  vegan: 'VeganDiet',
  vegetarian: 'VegetarianDiet',
  'gluten-free': 'GlutenFreeDiet',
};
const BEAN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 16.5c3-1.5 4-5.5 7-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};

const clamp = (n) => Math.max(0, Math.min(100, n));

// "frescopa:flavor/sweet/brown-sugar" becomes "Brown sugar"
function pretty(value) {
  const last = String(value).split('/').pop().replace(/-/g, ' ').trim();
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// "PT5M" becomes "5 min"
function duration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso || '');
  if (!m) return iso || '';
  const parts = [];
  if (m[1]) parts.push(`${m[1]} h`);
  if (m[2]) parts.push(`${m[2]} min`);
  return parts.join(' ') || iso;
}

function values(cell) {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')]
    .map((li) => li.textContent.trim())
    .filter(Boolean);
  if (items.length) return items;
  const t = cell.textContent.trim();
  return t ? [t] : [];
}

function labelRow(label, value) {
  const row = el('div', 'cr-label-row');
  row.append(el('h2', 'cr-label', label));
  if (value) row.append(el('span', 'cr-value', value));
  return row;
}

function slider(pct, description) {
  const s = el('div', 'cr-slider');
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', description);
  const track = el('div', 'cr-track');
  const fill = el('span', 'cr-fill');
  fill.style.width = `${pct}%`;
  track.append(fill);
  const thumb = el('span', 'cr-thumb');
  thumb.style.left = `${pct}%`;
  s.append(track, thumb);
  return s;
}

function addJsonLd(d) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: d.name || undefined,
    description: d.description || undefined,
    image: d.image || undefined,
    recipeCategory: d.category || undefined,
    prepTime: d.prepTime || undefined,
    totalTime: d.totalTime || undefined,
    recipeYield: d.yieldMl ? `${d.yieldMl} ml` : undefined,
    recipeIngredient: d.ingredients.length ? d.ingredients : undefined,
    recipeInstructions: d.steps.length
      ? d.steps.map((text) => ({ '@type': 'HowToStep', text }))
      : undefined,
    keywords: d.keywords.length ? d.keywords.join(', ') : undefined,
    suitableForDiet: d.diets.length ? d.diets : undefined,
    nutrition: d.calories
      ? { '@type': 'NutritionInformation', calories: `${d.calories} kcal` }
      : undefined,
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.append(script);
}

export default function decorate(block) {
  const rows = {};
  [...block.children].forEach((row) => {
    const [label, value] = row.children;
    if (label && value) rows[label.textContent.trim().toLowerCase()] = value;
  });
  const one = (k) => (rows[k] ? rows[k].textContent.trim() : '');
  const num = (k) => {
    const n = parseFloat(one(k));
    return Number.isNaN(n) ? null : n;
  };

  const wrap = el('div', 'cr-wrap');

  // header: eyebrow, title, description, optional photo
  const hcell = rows.header;
  const title = hcell ? hcell.querySelector('h1') : null;
  const picture = hcell ? hcell.querySelector('picture') : null;
  const description = hcell
    ? [...hcell.querySelectorAll('p')].find((p) => !p.querySelector('picture') && p.textContent.trim())
    : null;
  const header = el('header', 'cr-header');
  const intro = el('div', 'cr-intro');
  if (one('style')) intro.append(el('p', 'cr-eyebrow', pretty(one('style'))));
  if (title) intro.append(title);
  if (description) {
    description.className = 'cr-lede';
    intro.append(description);
  }
  header.append(intro);
  if (picture) {
    const photo = el('div', 'cr-photo');
    photo.append(picture);
    header.append(photo);
    header.classList.add('has-image');
  }
  wrap.append(header);

  // left column: predicted cup and beans
  const left = el('div', 'cr-col');
  const cup = [['Body', num('body')], ['Sweetness', num('sweetness')], ['Acidity', num('acidity')]]
    .filter(([, v]) => v !== null);
  if (cup.length) {
    const card = el('section', 'cr-cup');
    card.append(el('h2', 'cr-label', 'Predicted cup'));
    cup.forEach(([label, v]) => {
      const row = el('div', 'cr-bar-row');
      row.append(el('span', '', label));
      const track = el('div', 'cr-track');
      track.setAttribute('role', 'meter');
      track.setAttribute('aria-label', label);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', String(MAX_SCORE));
      track.setAttribute('aria-valuenow', String(v));
      const fill = el('span', 'cr-fill');
      fill.style.width = `${clamp((v / MAX_SCORE) * 100)}%`;
      track.append(fill);
      row.append(track);
      card.append(row);
    });
    left.append(card);
  }
  if (one('bean')) {
    const sec = el('section');
    sec.append(labelRow('Beans'));
    const bean = el('div', 'cr-bean');
    const icon = el('span', 'cr-bean-icon');
    icon.innerHTML = BEAN_ICON;
    const text = el('div', 'cr-bean-text');
    text.append(el('strong', '', one('bean')));
    if (one('bean notes')) text.append(el('span', '', one('bean notes')));
    const check = el('span', 'cr-check');
    check.setAttribute('aria-hidden', 'true');
    bean.append(icon, text, check);
    sec.append(bean);
    left.append(sec);
  }

  // right column: size, strength, brew temperature, milk
  const right = el('div', 'cr-col');
  const yieldMl = num('yield');
  const rawSize = one('size').toLowerCase();
  const sizeKey = rawSize === 'medium' ? 'regular' : rawSize;
  if (yieldMl !== null || SIZES.includes(sizeKey)) {
    const sec = el('section');
    sec.append(labelRow('Size', yieldMl !== null ? `${yieldMl} ml` : ''));
    if (SIZES.includes(sizeKey)) {
      const seg = el('div', 'cr-seg');
      seg.setAttribute('role', 'img');
      seg.setAttribute('aria-label', `Size: ${pretty(sizeKey)}`);
      SIZES.forEach((s) => seg.append(el('span', s === sizeKey ? 'is-active' : '', pretty(s))));
      sec.append(seg);
    }
    right.append(sec);
  }
  const strength = one('strength');
  const dose = num('dose');
  if (strength || dose !== null) {
    const sec = el('section');
    const summary = [strength ? pretty(strength) : '', dose !== null ? `${dose} g` : '']
      .filter(Boolean).join(' \u00B7 ');
    sec.append(labelRow('Strength', summary));
    const pos = STRENGTH_POS[strength.toLowerCase()];
    sec.append(slider(pos === undefined ? 50 : pos, `Strength: ${summary}`));
    const ends = el('div', 'cr-ends');
    ends.append(el('span', '', 'Gentle'), el('span', '', 'Bold'));
    sec.append(ends);
    right.append(sec);
  }
  const brewTemp = num('brew temperature');
  if (brewTemp !== null) {
    const sec = el('section');
    sec.append(labelRow('Brew temperature', `${brewTemp}\u00B0C`));
    sec.append(slider(clamp(((brewTemp - 80) / 20) * 100), `Brew temperature: ${brewTemp}\u00B0C`));
    right.append(sec);
  }
  const milk = one('milk');
  const milkTemp = num('milk temperature');
  if (milk || milkTemp !== null) {
    const sec = el('section');
    const summary = [milk ? pretty(milk) : '', milkTemp !== null ? `${milkTemp}\u00B0C` : '']
      .filter(Boolean).join(' \u00B7 ');
    sec.append(labelRow('Milk', summary));
    right.append(sec);
  }

  const grid = el('div', 'cr-grid');
  grid.append(left, right);
  wrap.append(grid);

  // ingredients and instructions
  const ingredients = values(rows.ingredients);
  const steps = rows.instructions
    ? [...rows.instructions.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean)
    : [];
  if (ingredients.length || rows.instructions) {
    const body = el('div', 'cr-body');
    if (ingredients.length) {
      const sec = el('section', 'cr-ingredients');
      sec.append(el('h2', 'cr-heading', 'Ingredients'));
      const ul = el('ul');
      ingredients.forEach((i) => ul.append(el('li', '', i)));
      sec.append(ul);
      body.append(sec);
    }
    if (rows.instructions && rows.instructions.textContent.trim()) {
      const sec = el('section', 'cr-steps');
      sec.append(el('h2', 'cr-heading', 'Instructions'));
      [...rows.instructions.childNodes].forEach((n) => sec.append(n));
      body.append(sec);
    }
    wrap.append(body);
  }

  // remaining facts
  const facts = [
    ['Prep time', 'prep time', duration],
    ['Total time', 'total time', duration],
    ['Calories', 'calories', (v) => `${v} kcal`],
    ['Difficulty', 'difficulty', pretty],
    ['Diet', 'diet', pretty],
    ['Flavor', 'flavor', pretty],
    ['Roast', 'roast', pretty],
    ['Origin', 'origin', pretty],
    ['Varietal', 'varietal', pretty],
    ['Coffee base', 'coffee base', pretty],
    ['Technique', 'technique', pretty],
    ['Served', 'temperature', pretty],
    ['Occasion', 'occasion', pretty],
    ['Glassware', 'glassware', pretty],
    ['Spirit', 'spirit', pretty],
  ];
  const dl = el('dl', 'cr-details');
  facts.forEach(([label, key, format]) => {
    const vals = values(rows[key]).map(format);
    if (!vals.length) return;
    const wrapper = el('div');
    wrapper.append(el('dt', '', label), el('dd', '', vals.join(', ')));
    dl.append(wrapper);
  });
  if (dl.children.length) wrap.append(dl);

  addJsonLd({
    name: title ? title.textContent.trim() : '',
    description: description ? description.textContent.trim() : '',
    image: picture && picture.querySelector('img') ? picture.querySelector('img').src : '',
    category: one('style') ? pretty(one('style')) : '',
    prepTime: one('prep time'),
    totalTime: one('total time'),
    yieldMl,
    ingredients,
    steps,
    keywords: values(rows.flavor).map(pretty),
    diets: values(rows.diet)
      .map((v) => DIET_SCHEMA[String(v).split('/').pop()])
      .filter(Boolean)
      .map((t) => `https://schema.org/${t}`),
    calories: num('calories'),
  });

  block.replaceChildren(wrap);
}
