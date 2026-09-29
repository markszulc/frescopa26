// codegen:layout-pattern=store-locator

// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [{"store_id": "frescopa-soho", "name": "Fréscopa SoHo (Flagship)", "city": "New York, NY", "address": "112 Greene Street, New York, NY", "hours": "Mon–Sun · 7am–8pm", "amenities": ["Café", "Showroom", "Workshops"], "tour_eligible": true, "latitude": 40.7245739, "longitude": -73.999429, "directions_url": "https://www.google.com/maps/search/?api=1&query=112%20Greene%20Street%2C%20New%20York%2C%20NY"}, {"store_id": "frescopa-west-loop", "name": "Fréscopa West Loop", "city": "Chicago, IL", "address": "905 W Fulton Market, Chicago, IL", "hours": "Mon–Sun · 7am–7pm", "amenities": ["Café", "Showroom", "Workshops"], "tour_eligible": true, "latitude": 41.8864169, "longitude": -87.6502131, "directions_url": "https://www.google.com/maps/search/?api=1&query=905%20W%20Fulton%20Market%2C%20Chicago%2C%20IL"}, {"store_id": "frescopa-ponce-city-market", "name": "Fréscopa Ponce City Market", "city": "Atlanta, GA", "address": "675 Ponce De Leon Ave NE, Atlanta, GA", "hours": "Mon–Sun · 7am–8pm", "amenities": ["Café", "Showroom", "Workshops"], "tour_eligible": true, "latitude": 33.7723214, "longitude": -84.3653476, "directions_url": "https://www.google.com/maps/search/?api=1&query=675%20Ponce%20De%20Leon%20Ave%20NE%2C%20Atlanta%2C%20GA"}, {"store_id": "frescopa-wynwood", "name": "Fréscopa Wynwood", "city": "Miami, FL", "address": "2750 NW 3rd Ave, Miami, FL", "hours": "Mon–Sun · 7am–9pm", "amenities": ["Café", "Showroom", "Workshops"], "tour_eligible": true, "latitude": 25.8025107, "longitude": -80.2016599, "directions_url": "https://www.google.com/maps/search/?api=1&query=2750%20NW%203rd%20Ave%2C%20Miami%2C%20FL"}, {"store_id": "frescopa-ferry-building", "name": "Fréscopa Ferry Building", "city": "San Francisco, CA", "address": "1 Ferry Building, San Francisco, CA", "hours": "Mon–Sun · 7am–7pm", "amenities": ["Café", "Showroom"], "tour_eligible": true, "latitude": 37.7955487, "longitude": -122.3934746, "directions_url": "https://www.google.com/maps/search/?api=1&query=1%20Ferry%20Building%2C%20San%20Francisco%2C%20CA"}, {"store_id": "frescopa-arts-district", "name": "Fréscopa Arts District", "city": "Los Angeles, CA", "address": "720 E 3rd St, Los Angeles, CA", "hours": "Mon–Sun · 7am–8pm", "amenities": ["Café", "Showroom", "Workshops"], "tour_eligible": true, "latitude": 34.0455829, "longitude": -118.2372567, "directions_url": "https://www.google.com/maps/search/?api=1&query=720%20E%203rd%20St%2C%20Los%20Angeles%2C%20CA"}];

const ACCENT = '#9a4f35';
const MAX_STORES = 6;

// Brand colors from DESIGN_TOKENS' color tier. getThemedCardBg() darkens PALETTE[0]
// to luminance <= 0.12 so white text has WCAG AA contrast.
const PALETTE = ['#ba6945', '#9a4f35', '#d4a24a'];

function getThemedCardBg(p) {
  if (!p || !p[0]) return null;
  let hex = p[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  const [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r))return null;
  const lum=c=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4)};
  const rl=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(rl(r,g,b)<=0.12)return{bg:'#'+hex,fg:'#fff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;rl(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12?hi=m:lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#fff'};
}

const theme = getThemedCardBg(PALETTE);

// ── Map engine ─────────────────────────────────
const MAP_LEAFLET_VERSION = '1.9.4';
const MAP_LEAFLET_CSS = 'https://unpkg.com/leaflet@' + MAP_LEAFLET_VERSION + '/dist/leaflet.css';
const MAP_LEAFLET_JS = 'https://unpkg.com/leaflet@' + MAP_LEAFLET_VERSION + '/dist/leaflet.js';

const MAP_TILE_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const MAP_TILE_ATTRIB = 'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAP_TILE_MAX_NATIVE_ZOOM = 16;
const MAP_TILE_MAX_ZOOM = 18;

let __mapLeafletPromise = null;

function loadLeaflet() {
  const cssLink = document.querySelector('link[data-leaflet="' + MAP_LEAFLET_VERSION + '"]');
  if (window.L && cssLink && cssLink.dataset.loaded === '1') {
    return Promise.resolve(window.L);
  }
  if (__mapLeafletPromise) return __mapLeafletPromise;

  const cssReady = new Promise(function (resolve) {
    const existing = document.querySelector('link[data-leaflet="' + MAP_LEAFLET_VERSION + '"]');
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', function () { resolve(); }, { once: true });
      setTimeout(resolve, 1500);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAP_LEAFLET_CSS;
    link.dataset.leaflet = MAP_LEAFLET_VERSION;
    link.addEventListener('load', function () { link.dataset.loaded = '1'; resolve(); }, { once: true });
    link.addEventListener('error', function () { resolve(); }, { once: true });
    document.head.appendChild(link);
    setTimeout(resolve, 1500);
  });

  const jsReady = new Promise(function (resolve, reject) {
    if (window.L) { resolve(window.L); return; }
    const script = document.createElement('script');
    script.src = MAP_LEAFLET_JS;
    script.async = true;
    script.onload = function () {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet loaded but window.L is missing'));
    };
    script.onerror = function () { reject(new Error('Failed to load Leaflet')); };
    document.head.appendChild(script);
  });

  __mapLeafletPromise = Promise.all([jsReady, cssReady]).then(function (r) { return r[0]; });
  return __mapLeafletPromise;
}

function mapCoordsOf(item) {
  if (!item) return null;
  const num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };
  const lat = num(item.latitude !== undefined ? item.latitude : item.lat);
  let lngRaw = item.longitude;
  if (lngRaw === undefined) lngRaw = item.lng;
  if (lngRaw === undefined) lngRaw = item.lon;
  const lng = num(lngRaw);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: lat, lng: lng };
}

function mapPointsFrom(items) {
  const out = [];
  (items || []).forEach(function (item, index) {
    const c = mapCoordsOf(item);
    if (c) out.push({ item: item, index: index, lat: c.lat, lng: c.lng });
  });
  return out;
}

function mapProject(points, box) {
  const b = box || [14, 14, 72, 72];
  const lats = points.map(function (p) { return p.lat; });
  const lngs = points.map(function (p) { return p.lng; });
  const minLat = Math.min.apply(null, lats);
  const maxLat = Math.max.apply(null, lats);
  const minLng = Math.min.apply(null, lngs);
  const maxLng = Math.max.apply(null, lngs);
  const spanLat = maxLat - minLat;
  const spanLng = maxLng - minLng;
  return points.map(function (p) {
    const fx = spanLng > 0 ? (p.lng - minLng) / spanLng : 0.5;
    const fy = spanLat > 0 ? (maxLat - p.lat) / spanLat : 0.5;
    return { x: b[0] + fx * b[2], y: b[1] + fy * b[3] };
  });
}

function mapMakePin(point, ordinal, opts, asButton) {
  const pin = document.createElement(asButton ? 'button' : 'span');
  if (asButton) pin.type = 'button';
  const label = String(point.item[opts.labelField] || point.item.name || '').trim();
  point.label = label;
  if (opts.pinStyle === 'label' && label) {
    pin.className = 'find-frescopa-cafe-map-label';
    pin.textContent = label;
  } else {
    pin.className = 'find-frescopa-cafe-map-pin';
    if (opts.pinColor) pin.style.background = opts.pinColor;
    const num = document.createElement('span');
    num.className = 'find-frescopa-cafe-map-pin-num';
    num.textContent = String(ordinal);
    pin.appendChild(num);
  }
  if (asButton) pin.setAttribute('aria-label', label || ('Location ' + ordinal));
  return pin;
}

function mapDemoteLabelToPin(point, ordinal, opts) {
  const pin = point.pin;
  if (!pin || !pin.classList.contains('find-frescopa-cafe-map-label')) return;
  const name = pin.textContent;
  pin.textContent = '';
  pin.className = 'find-frescopa-cafe-map-pin';
  if (opts.pinColor) pin.style.background = opts.pinColor;
  const num = document.createElement('span');
  num.className = 'find-frescopa-cafe-map-pin-num';
  num.textContent = String(ordinal);
  pin.appendChild(num);
  pin.setAttribute('aria-label', name);
  if (point.marker && point.marker.setZIndexOffset) point.marker.setZIndexOffset(1000);
}

function mapPromoteToLabel(point) {
  const pin = point.pin;
  if (!pin || pin.classList.contains('find-frescopa-cafe-map-label')) return;
  pin.textContent = point.label || '';
  pin.className = 'find-frescopa-cafe-map-label';
  pin.style.background = '';
  pin.removeAttribute('aria-label');
  if (point.marker && point.marker.setZIndexOffset) point.marker.setZIndexOffset(0);
}

function mapDeclutterLabels(points, opts) {
  if (opts.pinStyle !== 'label') return;
  points.forEach(function (p) { if (p.pin) mapPromoteToLabel(p); });

  const PAD = 2;
  const overlaps = function (a, b) {
    return a.left < b.right + PAD && b.left < a.right + PAD
      && a.top < b.bottom + PAD && b.top < a.bottom + PAD;
  };
  const rectOf = function (p) {
    const r = p.pin ? p.pin.getBoundingClientRect() : null;
    return r && r.width && r.height ? r : null;
  };

  for (let pass = 0; pass < points.length + 1; pass += 1) {
    const labelled = points.filter(function (p) {
      return p.pin && p.pin.classList.contains('find-frescopa-cafe-map-label');
    });
    if (labelled.length < 1) return;

    const kept = [];
    let demoted = null;
    for (let i = 0; i < labelled.length; i += 1) {
      const p = labelled[i];
      const r = rectOf(p);
      if (!r) continue;
      const hitsLabel = kept.some(function (k) { return overlaps(r, k); });
      if (hitsLabel) { demoted = p; break; }
      kept.push(r);
    }
    if (!demoted) return;
    mapDemoteLabelToPin(demoted, points.indexOf(demoted) + 1, opts);
  }
}

function mapWhenWidthStable(el) {
  return new Promise(function (resolve) {
    let last = -1;
    let stable = 0;
    const started = Date.now();
    const tick = function () {
      const w = el.offsetWidth;
      if (w > 0 && w === last) stable += 1; else stable = 0;
      last = w;
      if ((w > 0 && stable >= 2) || Date.now() - started > 2000) { resolve(w); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function mapRenderFallback(container, points, onSelect, opts) {
  container.classList.add('is-fallback');
  const grid = document.createElement('div');
  grid.className = 'find-frescopa-cafe-map-grid';
  container.appendChild(grid);

  const projected = mapProject(points, opts.fallbackBox);
  const pins = points.map(function (p, i) {
    const anchor = document.createElement('div');
    anchor.className = 'find-frescopa-cafe-map-anchor';
    anchor.style.left = projected[i].x + '%';
    anchor.style.top = projected[i].y + '%';
    const pin = mapMakePin(p, i + 1, opts, true);
    anchor.appendChild(pin);
    pin.addEventListener('click', function () { onSelect(p.index); });
    container.appendChild(anchor);
    return pin;
  });

  return {
    setActive: function (index) {
      points.forEach(function (p, i) { pins[i].classList.toggle('is-active', p.index === index); });
    },
  };
}

function mapDynamicMaxZoom(bounds) {
  const lats = bounds.map(function (b) { return b[0]; });
  const lngs = bounds.map(function (b) { return b[1]; });
  const span = Math.max(
    Math.max.apply(null, lats) - Math.min.apply(null, lats),
    Math.max.apply(null, lngs) - Math.min.apply(null, lngs)
  );
  if (span > 8) return 6;
  if (span > 2) return 8;
  if (span > 0.3) return 10;
  return 11;
}

function mapRenderLeaflet(L, container, points, onSelect, opts) {
  const map = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: opts.zoomControl !== false,
    attributionControl: true,
  });
  if (map.attributionControl) map.attributionControl.setPrefix('');

  const tiles = L.tileLayer(MAP_TILE_URL, {
    attribution: MAP_TILE_ATTRIB,
    detectRetina: false,
    maxNativeZoom: MAP_TILE_MAX_NATIVE_ZOOM,
    maxZoom: MAP_TILE_MAX_ZOOM,
    keepBuffer: 4,
    updateWhenIdle: false,
    updateWhenZooming: true,
  }).addTo(map);

  const bounds = points.map(function (p) { return [p.lat, p.lng]; });
  if (bounds.length === 1) {
    map.setView(bounds[0], opts.singleZoom || 11);
  } else {
    map.fitBounds(bounds, {
      paddingTopLeft: opts.fitPaddingTopLeft || [30, 30],
      paddingBottomRight: opts.fitPaddingBottomRight || [30, 30],
      maxZoom: opts.maxZoom || mapDynamicMaxZoom(bounds),
    });
  }

  points.forEach(function (p, i) {
    const marker = L.marker([p.lat, p.lng], {
      icon: L.divIcon({ className: 'find-frescopa-cafe-map-marker', html: '', iconSize: null, iconAnchor: [0, 0] }),
      keyboard: true,
      riseOnHover: true,
      title: String(p.item[opts.labelField] || p.item.name || ''),
      alt: String(p.item[opts.labelField] || p.item.name || 'Location'),
    }).addTo(map);

    const pin = mapMakePin(p, i + 1, opts, false);
    p.marker = marker;
    p.pin = pin;

    const attach = function () {
      const host = marker.getElement();
      if (host) host.appendChild(pin);
    };
    marker.on('add', attach);
    attach();

    marker.on('click', function () { onSelect(p.index); });
  });

  mapDeclutterLabels(points, opts);
  map.on('zoomend', function () { mapDeclutterLabels(points, opts); });

  const refresh = function () {
    map.invalidateSize(false);
    tiles.redraw();
    mapDeclutterLabels(points, opts);
  };
  requestAnimationFrame(refresh);
  [80, 200, 400, 800, 1400].forEach(function (ms) { setTimeout(refresh, ms); });

  if (typeof ResizeObserver !== 'undefined') {
    let lastW = container.offsetWidth;
    let lastH = container.offsetHeight;
    const ro = new ResizeObserver(function () {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      refresh();
    });
    ro.observe(container);
  }

  return {
    setActive: function (index, pan) {
      points.forEach(function (p) {
        const on = p.index === index;
        if (p.pin) p.pin.classList.toggle('is-active', on);
        if (p.marker && p.marker.setZIndexOffset) p.marker.setZIndexOffset(on ? 1000 : 0);
        if (on && pan) map.panTo([p.lat, p.lng], { animate: true });
      });
    },
    invalidate: refresh,
  };
}

function mountMap(container, points, onSelect, options) {
  if (!points || !points.length) return Promise.resolve(null);
  const opts = Object.assign({ pinStyle: 'number', labelField: 'name' }, options || {});

  const loading = document.createElement('div');
  loading.className = 'find-frescopa-cafe-map-loading';
  loading.textContent = 'Loading map…';
  container.appendChild(loading);

  return Promise.all([loadLeaflet(), mapWhenWidthStable(container)])
    .then(function (r) {
      loading.remove();
      return mapRenderLeaflet(r[0], container, points, onSelect, opts);
    })
    .catch(function () {
      container.textContent = '';
      container.classList.remove('leaflet-container');
      return mapRenderFallback(container, points, onSelect, opts);
    });
}

export default async function decorate(block, bridge) {
  block.textContent = '';

  let allStores = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext && bridge.hostContext.preview === true;
    if (isPreview) {
      allStores = SAMPLE_DATA;
    } else {
      try {
        const _result = await bridge.toolResult;
        const sc = _result?.structuredContent || {};
        // structuredContent.cafes — derived from action name "find_frescopa_cafe" (bare array outputSchema rule)
        allStores = sc.cafes || (Array.isArray(sc) ? sc : null);
      } catch(e) { allStores = null; }
    }
  } else {
    allStores = SAMPLE_DATA;
  }

  function renderNoResults() {
    const empty = document.createElement('div');
    empty.className = 'find-frescopa-cafe-empty';

    const formCard = document.createElement('div');
    formCard.className = 'find-frescopa-cafe-form-card';
    formCard.style.background = theme ? theme.bg : '#f3ede3';

    const pin = document.createElement('span');
    pin.className = 'find-frescopa-cafe-pin';
    pin.textContent = '◎';
    pin.style.color = theme ? theme.fg : '#2d221b';
    formCard.appendChild(pin);

    const heading = document.createElement('h3');
    heading.className = 'find-frescopa-cafe-heading';
    heading.textContent = 'No cafés found';
    heading.style.color = theme ? theme.fg : '#2d221b';
    formCard.appendChild(heading);

    const hint = document.createElement('p');
    hint.className = 'find-frescopa-cafe-hint';
    hint.textContent = 'Try another location.';
    hint.style.color = theme ? theme.fg : '#2d221b';
    formCard.appendChild(hint);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'find-frescopa-cafe-input';
    input.placeholder = 'Enter ZIP code…';
    input.setAttribute('aria-label', 'ZIP code or city');
    formCard.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'find-frescopa-cafe-search-btn';
    btn.textContent = 'Find Nearby';
    formCard.appendChild(btn);

    const submit = function() {
      const value = input.value.trim();
      if (!value) { input.focus(); return; }
      if (bridge && bridge.sendMessage) bridge.sendMessage('Find Fréscopa cafés near ' + value);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submit();
    });

    empty.appendChild(formCard);
    block.appendChild(empty);
  }

  function renderResults(stores) {
    if (!stores || !stores.length) { renderNoResults(); return; }
    const shown = stores.slice(0, MAX_STORES);
    const points = mapPointsFrom(shown);

    const layout = document.createElement('div');
    layout.className = 'find-frescopa-cafe-layout';

    const mapEl = document.createElement('div');
    mapEl.className = 'find-frescopa-cafe-map';
    mapEl.setAttribute('role', 'application');
    mapEl.setAttribute('aria-label', 'Map of ' + points.length + ' location' + (points.length === 1 ? '' : 's'));

    const side = document.createElement('div');
    side.className = 'find-frescopa-cafe-side';

    const rowWrap = document.createElement('div');
    rowWrap.className = 'find-frescopa-cafe-row-wrap';

    const row = document.createElement('div');
    row.className = 'find-frescopa-cafe-row';

    const cards = shown.map(function(store, i) {
      const card = document.createElement('div');
      card.className = 'find-frescopa-cafe-store-card';
      card.tabIndex = 0;
      card.style.background = theme ? theme.bg : '#f3ede3';
      card.style.color = theme ? theme.fg : '#2d221b';

      const head = document.createElement('div');
      head.className = 'find-frescopa-cafe-store-head';

      const pinDiv = document.createElement('div');
      pinDiv.className = 'find-frescopa-cafe-store-pin';
      const pinOrdinal = points.findIndex(function(p) { return p.index === i; });
      pinDiv.textContent = pinOrdinal >= 0 ? String(pinOrdinal + 1) : '◎';
      if (pinOrdinal >= 0) pinDiv.style.background = ACCENT;
      head.appendChild(pinDiv);

      const titles = document.createElement('div');
      titles.className = 'find-frescopa-cafe-store-titles';

      const name = document.createElement('div');
      name.className = 'find-frescopa-cafe-store-name';
      name.textContent = store.name || '';
      titles.appendChild(name);

      if (store.city) {
        const city = document.createElement('div');
        city.className = 'find-frescopa-cafe-store-city';
        city.textContent = store.city;
        titles.appendChild(city);
      }
      head.appendChild(titles);
      card.appendChild(head);

      if (store.address) {
        const addr = document.createElement('div');
        addr.className = 'find-frescopa-cafe-store-addr';
        addr.textContent = store.address;
        card.appendChild(addr);
      }

      const hasDist = typeof store.distance_miles === 'number' && Number.isFinite(store.distance_miles);
      if (store.hours || hasDist) {
        const meta = document.createElement('div');
        meta.className = 'find-frescopa-cafe-store-meta';
        if (hasDist) {
          const dist = document.createElement('span');
          dist.className = 'find-frescopa-cafe-store-dist';
          dist.textContent = store.distance_miles.toFixed(1) + ' mi';
          meta.appendChild(dist);
        }
        if (store.hours) {
          const hours = document.createElement('span');
          hours.textContent = store.hours;
          meta.appendChild(hours);
        }
        card.appendChild(meta);
      }

      if (Array.isArray(store.amenities) && store.amenities.length) {
        const badges = document.createElement('div');
        badges.className = 'find-frescopa-cafe-badges';
        store.amenities.forEach(function(am) {
          const badge = document.createElement('span');
          badge.className = 'find-frescopa-cafe-badge';
          const key = String(am).toLowerCase();
          // Highlight the showroom/workshop amenities the user cares about.
          if (key.indexOf('showroom') >= 0 || key.indexOf('workshop') >= 0) {
            badge.classList.add('is-accent');
          }
          badge.textContent = am;
          badges.appendChild(badge);
        });
        card.appendChild(badges);
      }

      const actions = document.createElement('div');
      actions.className = 'find-frescopa-cafe-actions';

      if (store.directions_url) {
        const dirBtn = document.createElement('button');
        dirBtn.type = 'button';
        dirBtn.className = 'find-frescopa-cafe-cta find-frescopa-cafe-cta-primary';
        dirBtn.textContent = 'Get Directions';
        dirBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (bridge && bridge.openLink) bridge.openLink(store.directions_url);
          else window.open(store.directions_url, '_blank');
        });
        actions.appendChild(dirBtn);
      }

      if (store.tour_eligible) {
        const tourBtn = document.createElement('button');
        tourBtn.type = 'button';
        tourBtn.className = 'find-frescopa-cafe-cta find-frescopa-cafe-cta-secondary';
        tourBtn.textContent = 'Book Atelier Tour';
        tourBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (bridge && bridge.sendMessage) bridge.sendMessage('Book an Atelier tour at ' + (store.name || store.city || 'this location'));
        });
        actions.appendChild(tourBtn);
      }

      if (actions.childNodes.length) card.appendChild(actions);

      card.addEventListener('click', function() { select(i); });
      card.addEventListener('focusin', function() { select(i); });
      row.appendChild(card);
      return card;
    });

    rowWrap.appendChild(row);

    const fade = document.createElement('div');
    fade.className = 'find-frescopa-cafe-fade';
    fade.style.background = 'linear-gradient(to right, transparent, ' + (theme ? theme.bg : '#f3ede3') + 'cc)';
    rowWrap.appendChild(fade);
    side.appendChild(rowWrap);

    if (points.length) layout.appendChild(mapEl);
    layout.appendChild(side);
    block.appendChild(layout);

    let mapApi = null;
    let activeIdx = -1;

    function select(index) {
      if (index === activeIdx) return;
      activeIdx = index;
      cards.forEach(function(c, i) { c.classList.toggle('is-selected', i === index); });
      if (mapApi) mapApi.setActive(index, true);
      const card = cards[index];
      if (card) row.scrollLeft = Math.max(0, card.offsetLeft - row.offsetLeft - 4);
    }

    if (points.length) {
      mountMap(mapEl, points, select, {
        pinStyle: 'number',
        pinColor: ACCENT,
        labelField: 'name',
        maxZoom: 13,
        singleZoom: 13,
      }).then(function(api) {
        mapApi = api;
        if (api && activeIdx >= 0) api.setActive(activeIdx, false);
      });
    }

    if (cards.length) select(0);
  }

  renderResults(allStores);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { bridge.reportSize(block.offsetWidth, block.offsetHeight); }, 150);
    });
    ro.observe(block);
  }
}
