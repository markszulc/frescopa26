// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [{"name": "The Atelier", "description": "AI-enabled bean-to-cup machine that learns your taste cup by cup and reorders beans before you run low.", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "price": 2199, "price_label": "$2,199 or $184/month", "automation_level": "Fully automatic", "automation_preference": "fully automatic", "counter_space": "standard", "availability": "Available", "availability_status": "available", "feature_highlights": ["Learns your taste over ~7 days across up to 6 household profiles", "Automatically reorders beans before you run low", "Whisper-quiet grinding at 58 dB", "Calendar-aware smart warmup and self-rinsing"], "image_url": "https://main--frescopa26--markszulc.aem.live/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg?width=1200&format=pjpg&optimize=medium", "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/atelier"}, {"name": "The Atelier Mini", "description": "The same intelligent taste-learning technology as the flagship, sized for smaller kitchens.", "category": "Bean-to-cup", "brewing_style": "bean-to-cup", "price": 799, "price_label": "$799", "automation_level": "Fully automatic", "automation_preference": "fully automatic", "counter_space": "compact", "availability": "Join the list", "availability_status": "waitlist", "feature_highlights": ["Same intelligent taste-learning as the flagship", "Compact design for smaller kitchens", "Automatic motorized milk wand", "Wi-Fi and calendar integration"], "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines"}, {"name": "The Barista", "description": "A hands-on espresso machine for the morning ritualist, with full manual control over every shot.", "category": "Espresso", "brewing_style": "hands-on espresso", "price": 899, "price_label": "$899", "automation_level": "Manual", "automation_preference": "hands-on", "counter_space": "standard", "availability": "Available", "availability_status": "available", "feature_highlights": ["Full manual control — dial in every shot", "Manual steam wand", "Built for espresso-based drinks", "Made for the hands-on ritualist"], "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines"}, {"name": "The Everyday", "description": "Honest espresso every single morning with simplified, one-button operation.", "category": "Espresso", "brewing_style": "espresso", "price": 499, "price_label": "$499", "automation_level": "Semi-automatic (one-button)", "automation_preference": "simple", "counter_space": "compact", "availability": "Available", "availability_status": "available", "feature_highlights": ["Simplified one-button operation", "Reliable, consistent results", "Honest espresso every morning"], "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines"}, {"name": "The Slow Pour", "description": "Even saturation and gentle timing for consistent filter coffee.", "category": "Filter", "brewing_style": "filter", "price": 279, "price_label": "$279", "automation_level": "Automatic pour-over", "automation_preference": "guided", "counter_space": "compact", "availability": "Available", "availability_status": "available", "feature_highlights": ["Even saturation for consistent extraction", "Gentle, controlled timing", "Reliable filter coffee"], "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines"}, {"name": "The Carafe", "description": "Overnight steeping produces smooth, low-acid cold brew, ready from the fridge whenever you need it.", "category": "Cold brew", "brewing_style": "cold brew", "price": 179, "price_label": "$179", "automation_level": "Manual overnight steep", "automation_preference": "hands-off steep", "counter_space": "compact", "availability": "Join the list", "availability_status": "waitlist", "feature_highlights": ["Overnight steeping for smooth flavor", "Low-acid cold brew", "Ready from the fridge anytime"], "product_url": "https://main--frescopa26--markszulc.aem.live/of1/knowledge/machines"}];

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#ba6945', '#d8a24f', '#211914'];
const CARD_COLORS = ['#ba6945', '#d8a24f', '#9a4f35', '#211914', '#2d221b', '#b07a3f'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

// Lightweight, non-authoritative preference match: score compact footprint +
// approachable price + simpler/guided automation. Used only to add a subtle flag,
// never to reorder or filter the list.
function closestMatchIndex(items) {
  if (!items || !items.length) return -1;
  let best = -1;
  let bestScore = -Infinity;
  items.forEach((it, i) => {
    let s = 0;
    const cs = (it.counter_space || '').toLowerCase();
    if (cs === 'compact') s += 2;
    const auto = ((it.automation_level || '') + ' ' + (it.automation_preference || '')).toLowerCase();
    if (/semi|one-button|simple|guided/.test(auto)) s += 2;
    if (typeof it.price === 'number') s += Math.max(0, 3 - it.price / 500);
    if ((it.availability_status || '').toLowerCase() === 'available') s += 1;
    if (s > bestScore) { bestScore = s; best = i; }
  });
  return best;
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
      // structuredContent.machines — bare array outputSchema; key derived from actionName "discover_coffee_machines"
      items = structuredContent?.machines || [];
    }
  } else {
    items = SAMPLE_DATA;
  }
  if (!items || !items.length) items = SAMPLE_DATA;
  // AMCP-360 is_deal partition: this non-deals list concept excludes deal items.
  items = items.filter((it) => it.is_deal !== true);

  renderCarousel(block, items, bridge);

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

function renderCarousel(block, items, bridge) {
  block.textContent = '';
  const matchIdx = closestMatchIndex(items);

  const wrapper = document.createElement('div');
  wrapper.className = 'discover-coffee-machines-wrapper';

  const btnLeft = document.createElement('button');
  btnLeft.className = 'discover-coffee-machines-arrow discover-coffee-machines-arrow-left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.textContent = '◄';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'discover-coffee-machines-track-wrap';

  const track = document.createElement('div');
  track.className = 'discover-coffee-machines-track';

  const btnRight = document.createElement('button');
  btnRight.className = 'discover-coffee-machines-arrow discover-coffee-machines-arrow-right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.textContent = '►';

  const fade = document.createElement('div');
  fade.className = 'discover-coffee-machines-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;

  items.slice(0, 6).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'discover-coffee-machines-card';
    if (i === matchIdx) card.classList.add('is-match');

    if (i === matchIdx) {
      const flag = document.createElement('div');
      flag.className = 'discover-coffee-machines-match-flag';
      flag.textContent = 'Closest to your needs';
      card.appendChild(flag);
    }

    const imgWrap = document.createElement('div');
    imgWrap.className = 'discover-coffee-machines-img';
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

    if (item.availability) {
      const avail = document.createElement('span');
      avail.className = 'discover-coffee-machines-avail';
      if ((item.availability_status || '').toLowerCase() === 'waitlist') avail.classList.add('is-waitlist');
      avail.textContent = item.availability;
      imgWrap.appendChild(avail);
    }
    card.appendChild(imgWrap);

    const info = document.createElement('div');
    info.className = 'discover-coffee-machines-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const badges = document.createElement('div');
    badges.className = 'discover-coffee-machines-badges';
    if (item.brewing_style) {
      const c = document.createElement('span');
      c.className = 'discover-coffee-machines-chip';
      c.textContent = item.brewing_style;
      badges.appendChild(c);
    }
    if (item.automation_level) {
      const c = document.createElement('span');
      c.className = 'discover-coffee-machines-chip';
      c.textContent = item.automation_level;
      badges.appendChild(c);
    }
    if (badges.childNodes.length) info.appendChild(badges);

    const name = document.createElement('div');
    name.className = 'discover-coffee-machines-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'discover-coffee-machines-desc';
      desc.textContent = item.description;
      info.appendChild(desc);
    }

    if (Array.isArray(item.feature_highlights) && item.feature_highlights.length) {
      const ul = document.createElement('ul');
      ul.className = 'discover-coffee-machines-feats';
      item.feature_highlights.slice(0, 3).forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
      });
      info.appendChild(ul);
    }

    const priceRow = document.createElement('div');
    priceRow.className = 'discover-coffee-machines-price-row';
    const price = document.createElement('span');
    price.className = 'discover-coffee-machines-price';
    price.textContent = item.price_label || (typeof item.price === 'number' ? `$${item.price}` : '');
    priceRow.appendChild(price);
    info.appendChild(priceRow);

    const cta = document.createElement('button');
    cta.className = 'discover-coffee-machines-cta';
    cta.textContent = 'View Machine';
    if (bridge) {
      cta.addEventListener('click', () => {
        if (item.product_url) bridge.openLink(item.product_url);
        else bridge.sendMessage(`Tell me more about ${item.name || 'this machine'}`);
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

  const journey = document.createElement('div');
  journey.className = 'discover-coffee-machines-journey';
  const compareBtn = document.createElement('button');
  compareBtn.textContent = 'Compare Machines';
  const showroomBtn = document.createElement('button');
  showroomBtn.textContent = 'Find a Showroom';
  if (bridge) {
    compareBtn.addEventListener('click', () => bridge.sendMessage('Compare these Fréscopa machines'));
    showroomBtn.addEventListener('click', () => bridge.sendMessage('Find a Fréscopa showroom near me'));
  }
  journey.appendChild(compareBtn);
  journey.appendChild(showroomBtn);
  block.appendChild(journey);

  const cardWidth = 220 + 16;
  btnLeft.addEventListener('click', () => track.scrollBy({ left: -cardWidth, behavior: 'smooth' }));
  btnRight.addEventListener('click', () => track.scrollBy({ left: cardWidth, behavior: 'smooth' }));
  const updateArrows = () => {
    btnLeft.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    btnRight.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);
  [btnLeft, btnRight].forEach((b) => b.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
  }));
  updateArrows();
}
