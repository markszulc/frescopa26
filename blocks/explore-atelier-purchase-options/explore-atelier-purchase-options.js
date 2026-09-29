// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [{"product_id": "the-atelier", "name": "The Atelier", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "description": "AI-enabled bean-to-cup machine that learns your taste cup by cup, reads the day ahead, and reorders beans before you run out.", "price": 2199, "availability": "Available now", "automation_preference": "fully automatic", "automation_level": "Fully automatic", "counter_space": "standard", "bundle_interest": "machine only", "rating": 4.8, "review_count": 214, "finishes": ["Cream", "Charcoal", "Terracotta"], "key_features": ["Learns your taste over ~7 days, no dialing-in", "Up to 6 household taste profiles ('flavour DNA')", "Contextual intelligence reads calendar, weather and time of day", "Automatic warm-up before your alarm and self-reordering beans", "Whisper-quiet grinding at 58 dB"], "brewing_methods": ["Espresso", "Filter", "Long black", "Cappuccino", "Latte", "Tea"], "ideal_for": "Hands-off households wanting barista-quality coffee tailored to each person", "capacity": "1.8 L water tank, 250 g bean hopper", "dimensions": "32 × 24 × 41 cm, 9.8 kg", "image_url": "https://www.frescopa.coffee/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}, {"product_id": "the-atelier-mini", "name": "The Atelier Mini", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "description": "The same intelligent, self-learning heart as the Atelier, sized for smaller kitchens.", "price": 799, "availability": "Waitlist", "automation_preference": "fully automatic", "automation_level": "Fully automatic", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Same clever taste-learning brain in a compact body", "Fits smaller counters"], "brewing_methods": ["Espresso", "Filter", "Milk drinks"], "ideal_for": "Small kitchens that still want a fully automatic bean-to-cup machine", "image_url": "https://www.frescopa.coffee/media_1017eb8d437ebe44b4a61e0865dcaef05ff3d934a.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-barista", "name": "The Barista", "category": "Espresso", "brewing_style": "espresso", "description": "A hands-on espresso machine for the morning ritualist, with full manual control.", "price": 899, "availability": "Waitlist", "automation_preference": "hands-on", "automation_level": "Manual", "counter_space": "standard", "bundle_interest": "machine only", "key_features": ["Full manual control over grind, dose and pull", "Tactile, built to reward practice"], "brewing_methods": ["Espresso"], "ideal_for": "People who want to be the barista and enjoy the hands-on ritual", "image_url": "https://www.frescopa.coffee/media_1db811b17fbc255479a69bb6ae75e55e55fbd2ea3.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-everyday", "name": "The Everyday", "category": "Espresso", "brewing_style": "espresso", "description": "Honest espresso every morning with simplified, no-fuss operation.", "price": 499, "availability": "Waitlist", "automation_preference": "guided", "automation_level": "Semi-automatic", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Simplified operation for a reliable shot each morning"], "brewing_methods": ["Espresso"], "ideal_for": "Anyone who wants a dependable espresso without the learning curve", "image_url": "https://www.frescopa.coffee/media_1dd4513b3aaf352944950aa2185c9927305b2f93d.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-slow-pour", "name": "The Slow Pour", "category": "Filter", "brewing_style": "filter", "description": "Even saturation and gentle timing for consistent, balanced filter coffee.", "price": 279, "availability": "Waitlist", "automation_preference": "guided", "automation_level": "Automatic drip", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Even saturation and gentle timing", "Repeatable, balanced batches"], "brewing_methods": ["Filter"], "ideal_for": "The unhurried cup, sipped through a quiet morning", "image_url": "https://www.frescopa.coffee/media_1d34c4d078381820a4960089ca6fa50b65f695921.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-carafe", "name": "The Carafe", "category": "Cold brew", "brewing_style": "cold brew", "description": "Overnight steeping for smooth, low-acid cold brew, ready and waiting by morning.", "price": 179, "availability": "Waitlist", "automation_preference": "hands-off", "automation_level": "Set-and-steep", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Overnight steeping while you sleep", "Smooth, low-acid cold brew"], "brewing_methods": ["Cold brew"], "ideal_for": "Cold-brew drinkers who want it poured cold straight from the fridge", "image_url": "https://www.frescopa.coffee/media_1b37b66e87d844199ff136582ca6c1f13bce38563.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "atelier-year-of-beans", "name": "The Atelier + a year of beans", "category": "Atelier Bundle", "brewing_style": "bean-to-cup", "description": "The Atelier machine plus house beans delivered as you need them for a year — it reorders, so you never run dry.", "price": 2799, "original_price": 2899, "savings": 100, "availability": "Available now", "automation_preference": "fully automatic", "counter_space": "standard", "bundle_interest": "beans", "included_items": ["The Atelier machine", "A year of house beans, delivered as needed", "Automatic bean reordering"], "image_url": "https://www.frescopa.coffee/machines/media_132718180b6190179a138b13595a42c32f51665ed.jpg?width=1200&format=jpg&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}, {"product_id": "atelier-barista-kit", "name": "The Atelier + Barista Kit", "category": "Atelier Bundle", "brewing_style": "bean-to-cup", "description": "The Atelier machine plus a milk jug, tamper and two ceramic cups — for the mornings you want to do it by hand.", "price": 2399, "original_price": 2509, "savings": 110, "availability": "Available now", "automation_preference": "fully automatic", "counter_space": "standard", "bundle_interest": "barista accessories", "included_items": ["The Atelier machine", "Milk jug", "Tamper", "Two ceramic cups"], "image_url": "https://www.frescopa.coffee/machines/media_14dda38183367f1ef5f700eaf66d1a13a59bdd756.jpg?width=1200&format=jpg&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}];

// Brand palette from DESIGN_TOKENS (Warm Atelier — espresso-dark ink for card strips).
const PALETTE = ['#2d221b', '#211914', '#4d2622'];
const ACCENT_REST = '#ba6945';
const ACCENT_HOVER = '#9a4f35';
const CARD_COLORS = ['#503d2c', '#2f2014', '#6a5540', '#4d2622', '#9a4f35', '#ba6945', '#d4a24a', '#211914'];

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
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

function badgeFor(item) {
  const items = Array.isArray(item.included_items) ? item.included_items.join(' ').toLowerCase() : '';
  const bi = (item.bundle_interest || '').toLowerCase();
  if (bi.indexOf('bean') !== -1 || items.indexOf('bean') !== -1) return 'Beans Included';
  if (bi.indexOf('barista') !== -1 || bi.indexOf('accessor') !== -1 || items.indexOf('jug') !== -1 || items.indexOf('tamper') !== -1) return 'Accessories Included';
  return 'Standalone';
}

function fitLabel(item) {
  const auto = (item.automation_preference || '').toLowerCase();
  if (auto.indexOf('hands-on') !== -1 || auto.indexOf('hands on') !== -1) return 'For hands-on baristas';
  if (auto.indexOf('fully') !== -1 || auto.indexOf('automatic') !== -1) return 'For convenience seekers';
  return '';
}

function money(n) {
  if (typeof n !== 'number') return n;
  return '$' + n.toLocaleString('en-US');
}

export default async function decorate(block, bridge) {
  let items;
  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext && bridge.hostContext.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.options — bare array outputSchema; key derived from actionName "explore_atelier_purchase_options"
      items = structuredContent?.options || [];
    }
  } else {
    items = SAMPLE_DATA;
  }
  if (!items || !items.length) items = SAMPLE_DATA;
  items = items.filter((it) => it.is_deal !== true);

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'explore-atelier-purchase-options-wrapper';

  const btnLeft = document.createElement('button');
  btnLeft.className = 'explore-atelier-purchase-options-arrow explore-atelier-purchase-options-arrow-left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.textContent = '◄';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'explore-atelier-purchase-options-track-wrap';

  const track = document.createElement('div');
  track.className = 'explore-atelier-purchase-options-track';

  const btnRight = document.createElement('button');
  btnRight.className = 'explore-atelier-purchase-options-arrow explore-atelier-purchase-options-arrow-right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.textContent = '►';

  const fade = document.createElement('div');
  fade.className = 'explore-atelier-purchase-options-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;

  items.slice(0, 8).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'explore-atelier-purchase-options-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'explore-atelier-purchase-options-img';
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
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(colorDiv());
    }

    const badge = document.createElement('span');
    badge.className = 'explore-atelier-purchase-options-badge';
    badge.textContent = badgeFor(item);
    imgWrap.appendChild(badge);
    card.appendChild(imgWrap);

    const info = document.createElement('div');
    info.className = 'explore-atelier-purchase-options-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#ffffff'};`;

    const name = document.createElement('div');
    name.className = 'explore-atelier-purchase-options-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    const fl = fitLabel(item);
    if (fl) {
      const fit = document.createElement('div');
      fit.className = 'explore-atelier-purchase-options-fit';
      fit.textContent = fl;
      info.appendChild(fit);
    }

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'explore-atelier-purchase-options-desc';
      const d = item.description;
      desc.textContent = d.length > 58 ? d.slice(0, 57).trimEnd() + '…' : d;
      info.appendChild(desc);
    }

    const priceRow = document.createElement('div');
    priceRow.className = 'explore-atelier-purchase-options-price-row';
    if (typeof item.original_price === 'number' && item.original_price > (item.price || 0)) {
      const orig = document.createElement('span');
      orig.className = 'explore-atelier-purchase-options-orig';
      orig.textContent = money(item.original_price);
      priceRow.appendChild(orig);
    }
    const price = document.createElement('span');
    price.className = 'explore-atelier-purchase-options-price';
    price.textContent = money(item.price);
    priceRow.appendChild(price);
    if (typeof item.savings === 'number' && item.savings > 0) {
      const sav = document.createElement('span');
      sav.className = 'explore-atelier-purchase-options-savings';
      sav.textContent = `Save ${money(item.savings)}`;
      priceRow.appendChild(sav);
    }
    info.appendChild(priceRow);

    const cta = document.createElement('button');
    cta.className = 'explore-atelier-purchase-options-cta';
    cta.textContent = 'Select This Option';
    if (bridge) {
      cta.addEventListener('click', () => {
        const url = item.purchase_url || item.detail_url;
        if (url) bridge.openLink(url);
        else bridge.sendMessage('Tell me more about ' + (item.name || ''));
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  trackWrap.appendChild(track);
  trackWrap.appendChild(fade);
  wrapper.appendChild(btnLeft);
  wrapper.appendChild(trackWrap);
  wrapper.appendChild(btnRight);
  block.appendChild(wrapper);

  const cardWidth = 220 + 16;
  btnLeft.addEventListener('click', () => track.scrollBy({ left: -cardWidth, behavior: 'smooth' }));
  btnRight.addEventListener('click', () => track.scrollBy({ left: cardWidth, behavior: 'smooth' }));
  const updateArrows = () => {
    btnLeft.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    btnRight.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);
  updateArrows();

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
