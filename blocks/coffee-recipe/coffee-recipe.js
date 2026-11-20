/*
 * coffee-recipe block
 * Rebuilds the rows that the json2html template writes into the Frescopa
 * recipe layout, and adds Recipe JSON-LD to the page head.
 */

// Set these to real pages on the site. Empty means the link is left out.
const RECIPES_URL = ''; // breadcrumb link, for example '/recipes/'
const SHOP_URL = ''; // "Shop this bean" button, for example '/coffee/'

const MAX_SCORE = 10;
const CUP_OPTIONS = [1, 2, 4];
const COUNTRIES = {
  co: 'Colombia', br: 'Brazil', et: 'Ethiopia', ke: 'Kenya', gt: 'Guatemala', pe: 'Peru',
};
const QUANTITY = /^(\d+(?:\.\d+)?)\s*(g|ml|kg|l)?\s+(.*)$/i;
const DIET_SCHEMA = {
  vegan: 'VeganDiet',
  vegetarian: 'VegetarianDiet',
  'gluten-free': 'GlutenFreeDiet',
};

const el = (tagName, cls, txt) => {
  const e = document.createElement(tagName);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};

const cap = (s) => {
  const v = String(s || '');
  return v.charAt(0).toUpperCase() + v.slice(1);
};

// "frescopa:flavor/sweet/brown-sugar" becomes "Brown sugar", "co" becomes "Colombia"
function tag(id) {
  const last = String(id || '').split('/').pop();
  return COUNTRIES[last] || cap(last.replace(/-/g, ' ').trim());
}

// "PT1H5M" becomes "1 h 5 min"
function duration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso || '');
  if (!m) return '';
  return [m[1] ? `${m[1]} h` : '', m[2] ? `${m[2]} min` : ''].filter(Boolean).join(' ');
}

function listValues(cell) {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')]
    .map((li) => li.textContent.trim())
    .filter(Boolean);
  if (items.length) return items;
  const t = cell.textContent.trim();
  return t ? [t] : [];
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
  // read the label and value cells into a lookup
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
  const tags = (k) => listValues(rows[k]).map(tag);

  const name = rows.header && rows.header.querySelector('h1');
  const picture = rows.header && rows.header.querySelector('picture');
  const description = rows.header
    && [...rows.header.querySelectorAll('p')]
      .find((p) => !p.querySelector('picture') && p.textContent.trim());

  const style = cap(one('style'));
  const strength = one('strength');
  const size = one('size');
  const dose = num('dose');
  const brewTemp = num('brew temperature');
  const milk = one('milk');
  const milkTemp = num('milk temperature');
  const yieldMl = num('yield');
  const calories = num('calories');
  const temperature = tags('temperature');
  const ingredients = listValues(rows.ingredients);
  const steps = rows.instructions
    ? [...rows.instructions.querySelectorAll('li')]
      .map((li) => li.textContent.trim()).filter(Boolean)
    : [];
  if (!steps.length && rows.instructions && rows.instructions.textContent.trim()) {
    steps.push(rows.instructions.textContent.trim());
  }

  // send and save state is shared by the hero and the callout buttons
  const sendButtons = [];
  const status = el('p', 'cr-sr-only');
  status.setAttribute('role', 'status');
  let sentTimer;
  const setSent = (sent) => {
    sendButtons.forEach((b) => { b.textContent = sent ? 'Sent. Your Atelier is ready.' : 'Send to my Atelier'; });
    status.textContent = sent ? 'Recipe sent to your Atelier.' : '';
  };
  const makeSendButton = (cls) => {
    const b = el('button', `cr-btn ${cls}`, 'Send to my Atelier');
    b.type = 'button';
    b.addEventListener('click', () => {
      setSent(true);
      clearTimeout(sentTimer);
      sentTimer = setTimeout(() => setSent(false), 3200);
    });
    sendButtons.push(b);
    return b;
  };

  const page = el('div', 'cr-page');

  // ---------- hero ----------
  // a div, not <header>: site-wide header rules would otherwise squash the hero
  const hero = el('div', 'cr-hero');
  const heroInner = el('div', 'cr-inner');
  const heroGrid = el('div', 'cr-hero-grid');
  const copy = el('div', 'cr-hero-copy');

  // a div with a role, not <nav>: site-wide "header nav" and "nav" rules would otherwise apply
  const crumbs = el('div', 'cr-crumbs cr-label');
  crumbs.setAttribute('role', 'navigation');
  crumbs.setAttribute('aria-label', 'Breadcrumb');
  if (RECIPES_URL) {
    const a = el('a', '', 'Recipes');
    a.href = RECIPES_URL;
    crumbs.append(a);
  } else {
    crumbs.append(el('span', '', 'Recipes'));
  }
  if (style) {
    const sep = el('span', '', '/');
    sep.setAttribute('aria-hidden', 'true');
    crumbs.append(sep, el('span', 'is-current', style));
  }
  copy.append(crumbs);

  if (name) {
    name.className = 'cr-title';
    copy.append(name);
  }
  if (description) {
    description.className = 'cr-lede';
    copy.append(description);
  }

  const meta = [
    ['Prep', duration(one('prep time'))],
    ['Total', duration(one('total time'))],
    ['Difficulty', tags('difficulty').join(', ')],
    ['Strength', cap(strength)],
    ['Size', cap(size)],
  ].filter(([, v]) => v);
  if (meta.length) {
    const dl = el('dl', 'cr-meta');
    meta.forEach(([label, value]) => {
      const d = el('div');
      d.append(el('dt', 'cr-label', label), el('dd', '', value));
      dl.append(d);
    });
    copy.append(dl);
  }

  const diet = tags('diet');
  if (diet.length) {
    const ul = el('ul', 'cr-diet');
    ul.setAttribute('aria-label', 'Dietary');
    diet.forEach((t) => ul.append(el('li', '', t)));
    copy.append(ul);
  }

  const actions = el('div', 'cr-actions');
  const save = el('button', 'cr-btn cr-btn-outline', 'Save recipe');
  save.type = 'button';
  save.setAttribute('aria-pressed', 'false');
  save.addEventListener('click', () => {
    const saved = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed', String(saved));
    save.textContent = saved ? 'Saved' : 'Save recipe';
  });
  actions.append(makeSendButton('cr-btn-primary'), save, status);
  copy.append(actions);
  heroGrid.append(copy);

  if (picture) {
    const media = el('div', 'cr-hero-media');
    const photo = el('div', 'cr-photo');
    photo.append(picture);
    media.append(photo);
    const badges = [/decaf/i.test(one('bean')) ? 'Decaf' : '', temperature[0] || ''].filter(Boolean);
    if (badges.length) {
      const wrap = el('div', 'cr-badges');
      badges.forEach((b) => wrap.append(el('span', '', b)));
      media.append(wrap);
    }
    heroGrid.append(media);
    heroGrid.classList.add('has-media');
  }
  heroInner.append(heroGrid);
  hero.append(heroInner);
  page.append(hero);

  // ---------- brew settings strip ----------
  const settings = [
    ['Coffee dose', dose !== null ? `${dose} g` : ''],
    ['Brew temp', brewTemp !== null ? `${brewTemp}\u00B0C` : ''],
    ['Milk', cap(milk)],
    ['Milk temp', milkTemp !== null ? `${milkTemp}\u00B0C` : ''],
    ['Yield', yieldMl !== null ? `${yieldMl} ml` : ''],
    ['Base', tags('coffee base').join(', ')],
  ].filter(([, v]) => v);
  if (settings.length) {
    const strip = el('section', 'cr-settings');
    strip.setAttribute('aria-label', 'Brew settings');
    const inner = el('div', 'cr-inner');
    const dl = el('dl');
    settings.forEach(([label, value]) => {
      const d = el('div');
      d.append(el('dt', 'cr-label', label), el('dd', '', value));
      dl.append(d);
    });
    inner.append(dl);
    strip.append(inner);
    page.append(strip);
  }

  // ---------- method column ----------
  const main = el('div', 'cr-main');
  const mainInner = el('div', 'cr-inner');
  const grid = el('div', 'cr-main-grid');
  const method = el('div', 'cr-method');

  if (ingredients.length) {
    const sec = el('section', 'cr-section');
    sec.setAttribute('aria-labelledby', 'cr-ing-h');
    const head = el('div', 'cr-ing-head');
    const h = el('h2', 'cr-heading', 'Ingredients');
    h.id = 'cr-ing-h';
    const cups = el('div', 'cr-cups');
    cups.setAttribute('role', 'group');
    cups.setAttribute('aria-label', 'Number of cups');
    cups.append(el('span', 'cr-label', 'Cups'));

    const list = el('ul', 'cr-ingredients');
    const items = ingredients.map((line) => {
      const m = QUANTITY.exec(line);
      const li = el('li');
      const label = el('label');
      const box = el('input', 'cr-check');
      box.type = 'checkbox';
      const text = el('span', 'cr-ing-text');
      let qty = null;
      if (m) {
        qty = el('strong');
        text.append(qty, ` ${m[3]}`);
      } else {
        text.append(line);
      }
      label.append(box, text);
      li.append(label);
      list.append(li);
      return { qty, amount: m ? parseFloat(m[1]) : 0, unit: m && m[2] ? ` ${m[2]}` : '' };
    });
    const scale = (n) => items.forEach((i) => {
      if (i.qty) i.qty.textContent = `${Math.round(i.amount * n * 10) / 10}${i.unit}`;
    });
    CUP_OPTIONS.forEach((n) => {
      const b = el('button', 'cr-pill-btn', String(n));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(n === 1));
      b.addEventListener('click', () => {
        scale(n);
        cups.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      cups.append(b);
    });
    scale(1);

    head.append(h, cups);
    sec.append(head, list);
    method.append(sec);
  }

  if (steps.length) {
    const sec = el('section', 'cr-section');
    sec.setAttribute('aria-labelledby', 'cr-method-h');
    const h = el('h2', 'cr-heading', 'Method');
    h.id = 'cr-method-h';
    const ol = el('ol', 'cr-steps');
    steps.forEach((text, i) => {
      const li = el('li', 'cr-step');
      const n = el('span', 'cr-step-n', String(i + 1));
      n.setAttribute('aria-hidden', 'true');
      const body = el('div');
      body.append(el('p', 'cr-label', `Step ${i + 1}`), el('p', 'cr-step-text', text));
      li.append(n, body);
      ol.append(li);
    });
    sec.append(h, ol);
    method.append(sec);
  }

  const callout = el('section', 'cr-section cr-callout');
  callout.setAttribute('aria-label', 'Make it on your Atelier');
  const calloutInner = el('div', 'cr-callout-inner');
  const calloutCopy = el('div', 'cr-callout-copy');
  calloutCopy.append(
    el('p', 'cr-label', 'Own an Atelier?'),
    el('h3', '', 'Let it make this one for you.'),
    el('p', '', 'Send the recipe and it sets the dose, brew temperature and milk for you, then nudges it towards your flavour DNA.'),
  );
  calloutInner.append(calloutCopy, makeSendButton('cr-btn-light'));
  callout.append(calloutInner);
  method.append(callout);
  grid.append(method);

  // ---------- sidebar ----------
  const aside = el('aside', 'cr-aside');

  const scores = [['Body', num('body')], ['Sweetness', num('sweetness')], ['Acidity', num('acidity')]]
    .filter(([, v]) => v !== null);
  if (scores.length) {
    const sweetness = num('sweetness');
    const acidity = num('acidity');
    const summary = sweetness !== null && acidity !== null && sweetness >= 6 && acidity <= 3
      ? 'Soft, sweet and low in acidity. An easy cup.'
      : 'Balanced and bright.';
    const card = el('section', 'cr-card cr-card-soft');
    card.setAttribute('aria-labelledby', 'cr-cup-h');
    const sh = el('h2', 'cr-cup-summary', summary);
    sh.id = 'cr-cup-h';
    const bars = el('div', 'cr-bars');
    scores.forEach(([label, v]) => {
      const row = el('div');
      const head = el('div', 'cr-bar-head');
      head.append(el('span', '', label), el('span', '', `${v} / ${MAX_SCORE}`));
      const track = el('div', 'cr-track');
      track.setAttribute('role', 'img');
      track.setAttribute('aria-label', `${label} ${v} out of ${MAX_SCORE}`);
      const fill = el('span', `cr-fill${label === 'Acidity' ? ' is-acidity' : ''}`);
      fill.style.width = `${Math.max(0, Math.min(100, (v / MAX_SCORE) * 100))}%`;
      track.append(fill);
      row.append(head, track);
      bars.append(row);
    });
    card.append(el('p', 'cr-eyebrow', 'Predicted cup'), sh, bars);
    aside.append(card);
  }

  const bean = one('bean');
  if (bean) {
    const card = el('section', 'cr-card cr-card-raised');
    card.setAttribute('aria-labelledby', 'cr-bean-h');
    const bh = el('h2', 'cr-bean-name', bean);
    bh.id = 'cr-bean-h';
    card.append(el('p', 'cr-eyebrow', 'The bean'), bh);
    if (one('bean notes')) card.append(el('p', 'cr-bean-notes', one('bean notes')));

    const facts = [
      ['Origin', tags('origin').join(', ')],
      ['Varietal', tags('varietal').join(', ')],
      ['Roast', tags('roast').join(', ')],
      ['Technique', tags('technique').join(', ')],
    ].filter(([, v]) => v);
    if (facts.length) {
      const dl = el('dl', 'cr-facts');
      facts.forEach(([label, value]) => {
        const d = el('div');
        d.append(el('dt', '', label), el('dd', '', value));
        dl.append(d);
      });
      card.append(dl);
    }

    const flavours = tags('flavor');
    if (flavours.length) {
      card.append(el('p', 'cr-label is-spaced', 'Flavour notes'));
      const ul = el('ul', 'cr-chips');
      flavours.forEach((f) => ul.append(el('li', '', f)));
      card.append(ul);
    }
    if (SHOP_URL) {
      const a = el('a', 'cr-link', 'Shop this bean ');
      a.href = SHOP_URL;
      const arrow = el('span', '', '\u2192');
      arrow.setAttribute('aria-hidden', 'true');
      a.append(arrow);
      card.append(a);
    }
    aside.append(card);
  }

  const perCup = [
    calories !== null ? `${calories} kcal` : '',
    yieldMl !== null ? `${yieldMl} ml` : '',
    temperature.join(', '),
  ].filter(Boolean);
  if (perCup.length) {
    const sec = el('section', 'cr-per-cup');
    sec.append(el('h2', 'cr-label', 'Per cup'), el('p', 'cr-per-cup-value', perCup.join(' \u00B7 ')));
    aside.append(sec);
  }

  grid.append(aside);
  mainInner.append(grid);
  main.append(mainInner);
  page.append(main);

  addJsonLd({
    name: name ? name.textContent.trim() : '',
    description: description ? description.textContent.trim() : '',
    image: picture && picture.querySelector('img') ? picture.querySelector('img').src : '',
    category: style,
    prepTime: one('prep time'),
    totalTime: one('total time'),
    yieldMl,
    ingredients,
    steps,
    keywords: tags('flavor'),
    diets: listValues(rows.diet)
      .map((v) => DIET_SCHEMA[String(v).split('/').pop()])
      .filter(Boolean)
      .map((t) => `https://schema.org/${t}`),
    calories,
  });

  block.replaceChildren(page);
}
