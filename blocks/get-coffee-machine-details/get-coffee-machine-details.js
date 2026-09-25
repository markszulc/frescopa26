// codegen:layout-pattern=detail-split
// Sample data for standalone/preview mode. In production, data comes from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'The Atelier',
    description: 'AI-enabled bean-to-cup machine that learns your taste cup by cup and reorders beans before you run low.',
    category: 'Bean-to-cup',
    brewing_style: 'bean-to-cup',
    price: 2199,
    price_label: '$2,199 or $184/month',
    automation_level: 'Fully automatic',
    automation_preference: 'fully automatic',
    counter_space: 'standard',
    footprint: '32 × 24 × 41 cm',
    capacity: '1.8 L water tank, 250 g bean hopper',
    availability: 'Available',
    availability_status: 'available',
    finishes: ['Cream', 'Charcoal', 'Terracotta'],
    feature_highlights: [
      'Learns your taste over ~7 days across up to 6 household profiles',
      'Automatically reorders beans before you run low',
      'Whisper-quiet grinding at 58 dB',
      'Calendar-aware smart warmup and self-rinsing',
    ],
    key_features: [
      'Taste-learning flavour DNA per user',
      'Sensor ring monitors grind, flow, strength and temperature',
      'Automatic motorized milk wand',
      'Wi-Fi + calendar integration',
      '2-year warranty, 30-night trial',
    ],
    tradeoffs: [
      'Highest price in the range',
      'Hands-off automation means less manual control for ritual enthusiasts',
    ],
    image_url: 'https://main--frescopa26--markszulc.aem.live/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=1200&format=pjpg&optimize=medium',
    product_url: 'https://main--frescopa26--markszulc.aem.live/of1/knowledge/atelier',
  },
];

const CARD_COLORS = ['#ba6945', '#9a4f35', '#d8a24f', '#211914'];

function pickImage(item) {
  if (Array.isArray(item.image_urls) && item.image_urls.length) return item.image_urls[0];
  if (item.image_url) return item.image_url;
  return '';
}

function isWaitlist(item) {
  const status = (item.availability_status || '').toLowerCase();
  const avail = (item.availability || '').toLowerCase();
  return status === 'waitlist' || avail.includes('list') || avail.includes('waitlist');
}

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'get-coffee-machine-details-card';

  // Image panel (left)
  const imgPanel = document.createElement('div');
  imgPanel.className = 'get-coffee-machine-details-image-panel';
  const src = pickImage(item);
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'get-coffee-machine-details-image-placeholder';
    d.style.backgroundColor = CARD_COLORS[0];
    return d;
  };
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = item.name || '';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    imgPanel.appendChild(img);
  } else {
    imgPanel.appendChild(colorDiv());
  }
  card.appendChild(imgPanel);

  // Content panel (right)
  const content = document.createElement('div');
  content.className = 'get-coffee-machine-details-content';

  const head = document.createElement('div');
  head.className = 'get-coffee-machine-details-head';
  const title = document.createElement('h2');
  title.className = 'get-coffee-machine-details-title';
  title.textContent = item.name || '';
  head.appendChild(title);
  if (item.availability) {
    const avail = document.createElement('span');
    avail.className = 'get-coffee-machine-details-avail';
    if (isWaitlist(item)) avail.classList.add('is-waitlist');
    avail.textContent = item.availability;
    head.appendChild(avail);
  }
  content.appendChild(head);

  const meta = document.createElement('div');
  meta.className = 'get-coffee-machine-details-meta';
  if (item.category) {
    const badge = document.createElement('span');
    badge.className = 'get-coffee-machine-details-badge';
    badge.textContent = item.category;
    meta.appendChild(badge);
  }
  const priceText = item.price_label
    || (typeof item.price === 'number' ? `$${item.price.toLocaleString()}` : item.price);
  if (priceText) {
    const price = document.createElement('span');
    price.className = 'get-coffee-machine-details-price';
    price.textContent = priceText;
    meta.appendChild(price);
  }
  if (meta.childNodes.length) content.appendChild(meta);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'get-coffee-machine-details-description';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  // Section: Key features
  const features = Array.isArray(item.key_features) ? item.key_features : [];
  if (features.length) {
    const sec = document.createElement('div');
    sec.className = 'get-coffee-machine-details-section';
    const label = document.createElement('div');
    label.className = 'get-coffee-machine-details-section-label';
    label.textContent = 'Key features';
    sec.appendChild(label);
    const ul = document.createElement('ul');
    ul.className = 'get-coffee-machine-details-features';
    features.slice(0, 5).forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    content.appendChild(sec);
  }

  // Section: Finishes
  const finishes = Array.isArray(item.finishes) ? item.finishes : [];
  if (finishes.length) {
    const sec = document.createElement('div');
    sec.className = 'get-coffee-machine-details-section';
    const label = document.createElement('div');
    label.className = 'get-coffee-machine-details-section-label';
    label.textContent = 'Finishes';
    sec.appendChild(label);
    const chips = document.createElement('div');
    chips.className = 'get-coffee-machine-details-chips';
    finishes.forEach((f) => {
      const chip = document.createElement('span');
      chip.className = 'get-coffee-machine-details-chip';
      chip.textContent = f;
      chips.appendChild(chip);
    });
    sec.appendChild(chips);
    content.appendChild(sec);
  }

  // Primary CTA — Choose Purchase Option (available) or Join Waitlist
  const waitlist = isWaitlist(item);
  const cta = document.createElement('button');
  cta.className = 'get-coffee-machine-details-cta';
  cta.textContent = waitlist ? 'Join Waitlist' : 'Choose Purchase Option';
  cta.addEventListener('click', () => {
    if (!bridge) return;
    if (item.product_url) bridge.openLink(item.product_url);
    else if (waitlist) bridge.sendMessage(`Join the waitlist for ${item.name}`);
    else bridge.sendMessage(`Show purchase options for ${item.name}`);
  });
  content.appendChild(cta);

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
  if (!item || !item.name) {
    const empty = document.createElement('p');
    empty.className = 'get-coffee-machine-details-empty';
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
