// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    product_id: 'the-atelier',
    name: 'The Atelier',
    category: 'Bean-to-cup',
    description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup, reads the day ahead, and reorders beans before you run out.',
    price: 2199,
    availability: 'Available now',
    key_features: [
      'Learns your taste over ~7 days, no dialing-in',
      "Up to 6 household taste profiles ('flavour DNA')",
      'Contextual intelligence reads calendar, weather and time of day',
    ],
    image_url: 'https://www.frescopa.coffee/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines/atelier',
  },
  {
    product_id: 'the-atelier-mini',
    name: 'The Atelier Mini',
    category: 'Bean-to-cup',
    description: 'The same intelligent, self-learning heart as the Atelier, sized for smaller kitchens.',
    price: 799,
    availability: 'Waitlist',
    key_features: [
      'Same clever taste-learning brain in a compact body',
      'Fits smaller counters',
    ],
    image_url: 'https://www.frescopa.coffee/media_1017eb8d437ebe44b4a61e0865dcaef05ff3d934a.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
  },
  {
    product_id: 'the-barista',
    name: 'The Barista',
    category: 'Espresso',
    description: 'A hands-on espresso machine for the morning ritualist, with full manual control.',
    price: 899,
    availability: 'Waitlist',
    key_features: [
      'Full manual control over grind, dose and pull',
      'Tactile, built to reward practice',
    ],
    image_url: 'https://www.frescopa.coffee/media_1db811b17fbc255479a69bb6ae75e55e55fbd2ea3.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
  },
  {
    product_id: 'the-everyday',
    name: 'The Everyday',
    category: 'Espresso',
    description: 'Honest espresso every morning with simplified, no-fuss operation.',
    price: 499,
    availability: 'Waitlist',
    key_features: ['Simplified operation for a reliable shot each morning'],
    image_url: 'https://www.frescopa.coffee/media_1dd4513b3aaf352944950aa2185c9927305b2f93d.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
  },
  {
    product_id: 'the-slow-pour',
    name: 'The Slow Pour',
    category: 'Filter',
    description: 'Even saturation and gentle timing for consistent, balanced filter coffee.',
    price: 279,
    availability: 'Waitlist',
    key_features: ['Even saturation and gentle timing', 'Repeatable, balanced batches'],
    image_url: 'https://www.frescopa.coffee/media_1d34c4d078381820a4960089ca6fa50b65f695921.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
  },
  {
    product_id: 'the-carafe',
    name: 'The Carafe',
    category: 'Cold brew',
    description: 'Overnight steeping for smooth, low-acid cold brew, ready and waiting by morning.',
    price: 179,
    availability: 'Waitlist',
    key_features: ['Overnight steeping while you sleep', 'Smooth, low-acid cold brew'],
    image_url: 'https://www.frescopa.coffee/media_1b37b66e87d844199ff136582ca6c1f13bce38563.png?width=2000&format=webply&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines',
  },
  {
    product_id: 'atelier-year-of-beans',
    name: 'The Atelier + a year of beans',
    category: 'Atelier Bundle',
    description: 'The Atelier machine plus house beans delivered as you need them for a year — it reorders, so you never run dry.',
    price: 2799,
    availability: 'Available now',
    key_features: [],
    image_url: 'https://www.frescopa.coffee/machines/media_132718180b6190179a138b13595a42c32f51665ed.jpg?width=1200&format=jpg&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines/atelier',
  },
  {
    product_id: 'atelier-barista-kit',
    name: 'The Atelier + Barista Kit',
    category: 'Atelier Bundle',
    description: 'The Atelier machine plus a milk jug, tamper and two ceramic cups — for the mornings you want to do it by hand.',
    price: 2399,
    availability: 'Available now',
    key_features: [],
    image_url: 'https://www.frescopa.coffee/machines/media_14dda38183367f1ef5f700eaf66d1a13a59bdd756.jpg?width=1200&format=jpg&optimize=medium',
    detail_url: 'https://www.frescopa.coffee/machines/atelier',
  },
];

// Brand colors from DESIGN_TOKENS' color tier (terracotta accent over cream ground).
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
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#ba6945', '#9a4f35', '#d4a24a', '#4d2622', '#503d2c', '#6a5540', '#2f2014', '#211914'];

function money(v) {
  if (typeof v !== 'number') return v || '';
  return `$${v.toLocaleString('en-US')}`;
}

function buildCard(item, i, bridge) {
  const card = document.createElement('div');
  card.className = 'scm-card';

  const media = document.createElement('div');
  media.className = 'scm-media';
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
    img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
    media.appendChild(img);
  } else {
    media.appendChild(colorDiv());
  }

  const avail = (item.availability || '').toLowerCase();
  const isWaitlist = avail.includes('waitlist');
  const availChip = document.createElement('span');
  availChip.className = `scm-avail ${isWaitlist ? 'scm-avail--waitlist' : 'scm-avail--now'}`;
  availChip.textContent = item.availability || '';
  media.appendChild(availChip);

  card.appendChild(media);

  const info = document.createElement('div');
  info.className = 'scm-info';
  info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h3');
  name.className = 'scm-name';
  name.textContent = item.name || '';
  info.appendChild(name);

  const desc = document.createElement('p');
  desc.className = 'scm-desc';
  desc.textContent = item.description || '';
  info.appendChild(desc);

  const meta = document.createElement('div');
  meta.className = 'scm-meta';
  const price = document.createElement('span');
  price.className = 'scm-price';
  price.textContent = money(item.price);
  meta.appendChild(price);
  const cat = document.createElement('span');
  cat.className = 'scm-cat';
  cat.textContent = item.category || '';
  meta.appendChild(cat);
  info.appendChild(meta);

  if (Array.isArray(item.key_features) && item.key_features.length) {
    const feats = document.createElement('ul');
    feats.className = 'scm-feats';
    item.key_features.slice(0, 3).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      feats.appendChild(li);
    });
    info.appendChild(feats);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scm-cta';
  btn.textContent = 'View Machine';
  if (bridge) {
    btn.addEventListener('click', () => {
      if (item.detail_url) bridge.openLink(item.detail_url);
      else bridge.sendMessage(`Tell me more about ${item.name}`);
    });
  }
  info.appendChild(btn);

  card.appendChild(info);
  return card;
}

function renderItems(block, items, bridge) {
  block.textContent = '';
  const root = document.createElement('div');
  root.className = 'scm-root';

  const bar = document.createElement('div');
  bar.className = 'scm-filterbar';
  const styles = Array.from(new Set(items.map((it) => it.category).filter(Boolean)));
  const chips = ['All', ...styles];
  let active = 'All';
  chips.forEach((label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'scm-chip' + (label === active ? ' scm-chip--active' : '');
    chip.textContent = label;
    chip.setAttribute('aria-pressed', label === active ? 'true' : 'false');
    chip.addEventListener('click', () => {
      active = label;
      bar.querySelectorAll('.scm-chip').forEach((c) => {
        const on = c.textContent === active;
        c.classList.toggle('scm-chip--active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const filtered = active === 'All' ? items : items.filter((it) => it.category === active);
      paint(filtered);
    });
    bar.appendChild(chip);
  });
  root.appendChild(bar);

  const wrapper = document.createElement('div');
  wrapper.className = 'scm-wrapper';

  const track = document.createElement('div');
  track.className = 'scm-track';
  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'scm-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;`;
  wrapper.appendChild(fade);

  const leftBtn = document.createElement('button');
  leftBtn.type = 'button';
  leftBtn.className = 'scm-arrow scm-arrow--left';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  const rightBtn = document.createElement('button');
  rightBtn.type = 'button';
  rightBtn.className = 'scm-arrow scm-arrow--right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';

  const cardStep = 236;
  const scrollByCard = (dir) => track.scrollBy({ left: dir * cardStep, behavior: 'smooth' });
  leftBtn.addEventListener('click', () => scrollByCard(-1));
  rightBtn.addEventListener('click', () => scrollByCard(1));
  [leftBtn, rightBtn].forEach((b) => {
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
    });
  });

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    leftBtn.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    rightBtn.style.display = track.scrollLeft >= maxScroll ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= maxScroll ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  root.appendChild(wrapper);
  block.appendChild(root);

  function paint(list) {
    track.textContent = '';
    list.slice(0, 8).forEach((item, i) => track.appendChild(buildCard(item, i, bridge)));
    requestAnimationFrame(updateArrows);
  }

  paint(items);
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
      // structuredContent.machines — bare array outputSchema; key derived from actionName "search_coffee_machines"
      items = structuredContent?.machines || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  renderItems(block, items, bridge);

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
