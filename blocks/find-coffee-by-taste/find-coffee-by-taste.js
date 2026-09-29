// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'The Atelier',
    description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup and reorders beans before you run low.',
    category: 'Bean-to-cup',
    price: 2199,
    price_label: '$2,199 or $184/month',
    image_url: 'https://main--frescopa26--markszulc.aem.live/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=1200&format=pjpg&optimize=medium',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/atelier',
  },
  {
    name: 'The Atelier Mini',
    description: 'The same intelligent taste-learning technology as the flagship, sized for smaller kitchens.',
    category: 'Bean-to-cup',
    price: 799,
    price_label: '$799',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
  {
    name: 'The Barista',
    description: 'A hands-on espresso machine for the morning ritualist, with full manual control over every shot.',
    category: 'Espresso',
    price: 899,
    price_label: '$899',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
  {
    name: 'The Everyday',
    description: 'Honest espresso every single morning with simplified, one-button operation.',
    category: 'Espresso',
    price: 499,
    price_label: '$499',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
  {
    name: 'The Slow Pour',
    description: 'Even saturation and gentle timing for consistent filter coffee.',
    category: 'Filter',
    price: 279,
    price_label: '$279',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
  {
    name: 'The Carafe',
    description: 'Overnight steeping produces smooth, low-acid cold brew, ready from the fridge whenever you need it.',
    category: 'Cold brew',
    price: 179,
    price_label: '$179',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines',
  },
];

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#ba6945', '#d8a24f', '#211914', '#f8f5ee', '#f3ede3', '#2d221b', '#9a4f35'];

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

const CARD_COLORS = ['#ba6945', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

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
      // structuredContent.coffees — bare array outputSchema; key derived from actionName "find_coffee_by_taste"
      items = structuredContent?.coffees || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
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

function makeChip(text) {
  const chip = document.createElement('span');
  chip.className = 'coffee-chip';
  chip.textContent = text;
  return chip;
}

function renderItems(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'coffee-carousel-wrapper';

  const track = document.createElement('div');
  track.className = 'coffee-track';

  const cardWidth = 236; // card + gap

  items.slice(0, 6).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'coffee-card';

    // Image
    const imageBox = document.createElement('div');
    imageBox.className = 'coffee-image';
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
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageBox.appendChild(img);
    } else {
      imageBox.appendChild(colorDiv());
    }
    card.appendChild(imageBox);

    // Content strip
    const content = document.createElement('div');
    content.className = 'coffee-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'coffee-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    const meta = [];
    if (item.origin) meta.push(item.origin);
    if (item.roast) meta.push(item.roast);
    if (item.caffeine_option) meta.push(item.caffeine_option);
    const desc = document.createElement('p');
    desc.className = 'coffee-desc';
    desc.textContent = meta.length ? meta.join(' • ') : (item.description || '');
    content.appendChild(desc);

    // tasting notes / match reason chips
    const chipRow = document.createElement('div');
    chipRow.className = 'coffee-chips';
    const chips = [];
    if (Array.isArray(item.match_reasons)) chips.push(...item.match_reasons);
    else if (Array.isArray(item.tasting_notes)) chips.push(...item.tasting_notes);
    if (chips.length === 0 && item.category) chips.push(item.category);
    chips.slice(0, 3).forEach((c) => chipRow.appendChild(makeChip(c)));
    if (chipRow.childNodes.length) content.appendChild(chipRow);

    const priceRow = document.createElement('div');
    priceRow.className = 'coffee-price-row';
    const price = document.createElement('span');
    price.className = 'coffee-price';
    price.textContent = item.price_label || (item.price != null ? `$${item.price}` : '');
    priceRow.appendChild(price);
    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'coffee-badge';
      badge.textContent = item.category;
      priceRow.appendChild(badge);
    }
    if (item.best_for) {
      const bf = document.createElement('span');
      bf.className = 'coffee-bestfor';
      bf.textContent = item.best_for;
      priceRow.appendChild(bf);
    }
    content.appendChild(priceRow);

    if (Array.isArray(item.available_formats) && item.available_formats.length) {
      const fmt = document.createElement('p');
      fmt.className = 'coffee-formats';
      fmt.textContent = item.available_formats.join(', ');
      content.appendChild(fmt);
    }

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'coffee-cta';
    cta.textContent = 'Choose Options';
    if (bridge) {
      cta.addEventListener('click', () => {
        if (item.product_url) bridge.openLink(item.product_url);
        else bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    content.appendChild(cta);

    card.appendChild(content);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  // right edge fade
  const fade = document.createElement('div');
  fade.className = 'coffee-fade';
  fade.style.cssText = `background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);`;
  wrapper.appendChild(fade);

  // arrows
  const leftBtn = document.createElement('button');
  leftBtn.type = 'button';
  leftBtn.className = 'coffee-arrow coffee-arrow-left';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  const rightBtn = document.createElement('button');
  rightBtn.type = 'button';
  rightBtn.className = 'coffee-arrow coffee-arrow-right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    leftBtn.style.display = track.scrollLeft > 4 ? 'flex' : 'none';
    rightBtn.style.display = track.scrollLeft < maxScroll - 4 ? 'flex' : 'none';
    fade.style.display = track.scrollLeft < maxScroll - 4 ? 'block' : 'none';
  };
  const scrollBy = (dir) => track.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  leftBtn.addEventListener('click', () => scrollBy(-1));
  rightBtn.addEventListener('click', () => scrollBy(1));
  [leftBtn, rightBtn].forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(idx === 0 ? -1 : 1); }
    });
  });
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);

  block.appendChild(wrapper);

  // global CTAs
  const actions = document.createElement('div');
  actions.className = 'coffee-actions';
  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.className = 'coffee-action-btn';
  compareBtn.textContent = 'Compare Coffees';
  const tastingBtn = document.createElement('button');
  tastingBtn.type = 'button';
  tastingBtn.className = 'coffee-action-btn';
  tastingBtn.textContent = 'Find a Café Tasting';
  if (bridge) {
    compareBtn.addEventListener('click', () => bridge.sendMessage('Compare these Fréscopa coffees for me'));
    tastingBtn.addEventListener('click', () => bridge.sendMessage('Find a Fréscopa café tasting near me'));
  }
  actions.appendChild(compareBtn);
  actions.appendChild(tastingBtn);
  block.appendChild(actions);

  requestAnimationFrame(updateArrows);
}
