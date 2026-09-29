// codegen:layout-pattern=detail-split
// Sample data for standalone/preview mode. In production, data comes from bridge.toolResult.
const SAMPLE_DATA = [{"product_id": "the-atelier", "name": "The Atelier", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "description": "AI-enabled bean-to-cup machine that learns your taste cup by cup, reads the day ahead, and reorders beans before you run out.", "price": 2199, "availability": "Available now", "automation_preference": "fully automatic", "automation_level": "Fully automatic", "counter_space": "standard", "bundle_interest": "machine only", "rating": 4.8, "review_count": 214, "finishes": ["Cream", "Charcoal", "Terracotta"], "key_features": ["Learns your taste over ~7 days, no dialing-in", "Up to 6 household taste profiles ('flavour DNA')", "Contextual intelligence reads calendar, weather and time of day", "Automatic warm-up before your alarm and self-reordering beans", "Whisper-quiet grinding at 58 dB"], "brewing_methods": ["Espresso", "Filter", "Long black", "Cappuccino", "Latte", "Tea"], "ideal_for": "Hands-off households wanting barista-quality coffee tailored to each person", "capacity": "1.8 L water tank, 250 g bean hopper", "dimensions": "32 × 24 × 41 cm, 9.8 kg", "image_url": "https://www.frescopa.coffee/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}, {"product_id": "the-atelier-mini", "name": "The Atelier Mini", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "description": "The same intelligent, self-learning heart as the Atelier, sized for smaller kitchens.", "price": 799, "availability": "Waitlist", "automation_preference": "fully automatic", "automation_level": "Fully automatic", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Same clever taste-learning brain in a compact body", "Fits smaller counters"], "brewing_methods": ["Espresso", "Filter", "Milk drinks"], "ideal_for": "Small kitchens that still want a fully automatic bean-to-cup machine", "image_url": "https://www.frescopa.coffee/media_1017eb8d437ebe44b4a61e0865dcaef05ff3d934a.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-barista", "name": "The Barista", "category": "Espresso", "brewing_style": "espresso", "description": "A hands-on espresso machine for the morning ritualist, with full manual control.", "price": 899, "availability": "Waitlist", "automation_preference": "hands-on", "automation_level": "Manual", "counter_space": "standard", "bundle_interest": "machine only", "key_features": ["Full manual control over grind, dose and pull", "Tactile, built to reward practice"], "brewing_methods": ["Espresso"], "ideal_for": "People who want to be the barista and enjoy the hands-on ritual", "image_url": "https://www.frescopa.coffee/media_1db811b17fbc255479a69bb6ae75e55e55fbd2ea3.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-everyday", "name": "The Everyday", "category": "Espresso", "brewing_style": "espresso", "description": "Honest espresso every morning with simplified, no-fuss operation.", "price": 499, "availability": "Waitlist", "automation_preference": "guided", "automation_level": "Semi-automatic", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Simplified operation for a reliable shot each morning"], "brewing_methods": ["Espresso"], "ideal_for": "Anyone who wants a dependable espresso without the learning curve", "image_url": "https://www.frescopa.coffee/media_1dd4513b3aaf352944950aa2185c9927305b2f93d.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-slow-pour", "name": "The Slow Pour", "category": "Filter", "brewing_style": "filter", "description": "Even saturation and gentle timing for consistent, balanced filter coffee.", "price": 279, "availability": "Waitlist", "automation_preference": "guided", "automation_level": "Automatic drip", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Even saturation and gentle timing", "Repeatable, balanced batches"], "brewing_methods": ["Filter"], "ideal_for": "The unhurried cup, sipped through a quiet morning", "image_url": "https://www.frescopa.coffee/media_1d34c4d078381820a4960089ca6fa50b65f695921.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "the-carafe", "name": "The Carafe", "category": "Cold brew", "brewing_style": "cold brew", "description": "Overnight steeping for smooth, low-acid cold brew, ready and waiting by morning.", "price": 179, "availability": "Waitlist", "automation_preference": "hands-off", "automation_level": "Set-and-steep", "counter_space": "compact", "bundle_interest": "machine only", "key_features": ["Overnight steeping while you sleep", "Smooth, low-acid cold brew"], "brewing_methods": ["Cold brew"], "ideal_for": "Cold-brew drinkers who want it poured cold straight from the fridge", "image_url": "https://www.frescopa.coffee/media_1b37b66e87d844199ff136582ca6c1f13bce38563.png?width=2000&format=webply&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines"}, {"product_id": "atelier-year-of-beans", "name": "The Atelier + a year of beans", "category": "Atelier Bundle", "brewing_style": "bean-to-cup", "description": "The Atelier machine plus house beans delivered as you need them for a year — it reorders, so you never run dry.", "price": 2799, "original_price": 2899, "savings": 100, "availability": "Available now", "automation_preference": "fully automatic", "counter_space": "standard", "bundle_interest": "beans", "included_items": ["The Atelier machine", "A year of house beans, delivered as needed", "Automatic bean reordering"], "image_url": "https://www.frescopa.coffee/machines/media_132718180b6190179a138b13595a42c32f51665ed.jpg?width=1200&format=jpg&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}, {"product_id": "atelier-barista-kit", "name": "The Atelier + Barista Kit", "category": "Atelier Bundle", "brewing_style": "bean-to-cup", "description": "The Atelier machine plus a milk jug, tamper and two ceramic cups — for the mornings you want to do it by hand.", "price": 2399, "original_price": 2509, "savings": 110, "availability": "Available now", "automation_preference": "fully automatic", "counter_space": "standard", "bundle_interest": "barista accessories", "included_items": ["The Atelier machine", "Milk jug", "Tamper", "Two ceramic cups"], "image_url": "https://www.frescopa.coffee/machines/media_14dda38183367f1ef5f700eaf66d1a13a59bdd756.jpg?width=1200&format=jpg&optimize=medium", "detail_url": "https://www.frescopa.coffee/machines/atelier"}];

// Brand colors from DESIGN_TOKENS (Warm Atelier). Cream surface + ink text passes WCAG AA,
// so the content panel uses the real editorial cream ground rather than a darkened strip.
const SURFACE = '#f3ede3';
const INK = '#2d221b';
const ACCENT = '#ba6945';
const CARD_COLORS = ['#ba6945', '#9a4f35', '#4d2622', '#d4a24a', '#503d2c'];

function isPurchasable(availability) {
  return typeof availability === 'string' && /available/i.test(availability);
}

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'get-machine-details-card';

  // --- Image panel (left) ---
  const imgPanel = document.createElement('div');
  imgPanel.className = 'get-machine-details-image-panel';
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'get-machine-details-image-placeholder';
    d.style.backgroundColor = CARD_COLORS[0];
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    imgPanel.appendChild(img);
  } else {
    imgPanel.appendChild(colorDiv());
  }
  card.appendChild(imgPanel);

  // --- Content panel (right) ---
  const content = document.createElement('div');
  content.className = 'get-machine-details-content';

  // Section 1: header
  const header = document.createElement('div');
  header.className = 'get-machine-details-header';

  if (item.category) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'get-machine-details-eyebrow';
    eyebrow.textContent = item.category;
    header.appendChild(eyebrow);
  }

  const title = document.createElement('h2');
  title.className = 'get-machine-details-title';
  title.textContent = item.name || '';
  header.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'get-machine-details-meta';
  const purchasable = isPurchasable(item.availability);
  if (item.availability) {
    const badge = document.createElement('span');
    badge.className = 'get-machine-details-badge' + (purchasable ? ' is-available' : ' is-waitlist');
    badge.textContent = item.availability;
    meta.appendChild(badge);
  }
  if (typeof item.rating === 'number') {
    const rating = document.createElement('span');
    rating.className = 'get-machine-details-rating';
    rating.textContent = '★ ' + item.rating + (item.review_count ? ' (' + item.review_count + ')' : '');
    meta.appendChild(rating);
  }
  if (meta.childNodes.length) header.appendChild(meta);

  if (typeof item.price === 'number') {
    const price = document.createElement('div');
    price.className = 'get-machine-details-price';
    price.textContent = '$' + item.price.toLocaleString('en-US');
    header.appendChild(price);
  }

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'get-machine-details-description';
    desc.textContent = item.description;
    header.appendChild(desc);
  }
  content.appendChild(header);

  // Section 2: scannable details (finishes chips + top features)
  const details = document.createElement('div');
  details.className = 'get-machine-details-details';

  const finishes = Array.isArray(item.finishes) ? item.finishes : [];
  if (finishes.length) {
    const wrap = document.createElement('div');
    wrap.className = 'get-machine-details-finishes';
    const label = document.createElement('span');
    label.className = 'get-machine-details-section-label';
    label.textContent = 'Finishes';
    wrap.appendChild(label);
    const chips = document.createElement('div');
    chips.className = 'get-machine-details-chips';
    finishes.forEach((f) => {
      const chip = document.createElement('span');
      chip.className = 'get-machine-details-chip';
      chip.textContent = f;
      chips.appendChild(chip);
    });
    wrap.appendChild(chips);
    details.appendChild(wrap);
  }

  const features = Array.isArray(item.key_features) ? item.key_features : [];
  if (features.length) {
    const wrap = document.createElement('div');
    wrap.className = 'get-machine-details-features';
    const label = document.createElement('span');
    label.className = 'get-machine-details-section-label';
    label.textContent = 'Highlights';
    wrap.appendChild(label);
    const ul = document.createElement('ul');
    features.slice(0, 3).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    details.appendChild(wrap);
  }
  if (details.childNodes.length) content.appendChild(details);

  // Actions (max 2): primary purchase/waitlist + compare
  const actions = document.createElement('div');
  actions.className = 'get-machine-details-actions';

  const primary = document.createElement('button');
  primary.className = 'get-machine-details-cta get-machine-details-cta-primary';
  primary.textContent = purchasable ? 'Choose Purchase Option' : 'Join Waitlist';
  if (bridge) {
    primary.addEventListener('click', () => {
      bridge.openLink(item.purchase_url || item.detail_url || '');
    });
  }
  actions.appendChild(primary);

  const compare = document.createElement('button');
  compare.className = 'get-machine-details-cta get-machine-details-cta-secondary';
  compare.textContent = 'Compare Machine';
  if (bridge) {
    compare.addEventListener('click', () => {
      bridge.sendMessage('Compare ' + (item.name || 'this machine') + ' with other Fréscopa machines');
    });
  }
  actions.appendChild(compare);
  content.appendChild(actions);

  card.appendChild(content);
  block.appendChild(card);
}

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = Array.isArray(SAMPLE_DATA) ? SAMPLE_DATA[0] : SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
  } else {
    item = Array.isArray(SAMPLE_DATA) ? SAMPLE_DATA[0] : SAMPLE_DATA;
  }

  block.textContent = '';
  if (!item?.name) {
    const empty = document.createElement('p');
    empty.className = 'get-machine-details-empty';
    empty.textContent = 'No matching machine was found.';
    block.appendChild(empty);
  } else {
    renderDetail(block, item, bridge);
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
