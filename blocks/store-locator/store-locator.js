import { loadCSS, loadScript } from '../../scripts/aem.js';

/**
 * Store locator.
 *
 * Authored structure (one row per authored item):
 *   Row 1 (optional): a single image cell -> ignored (legacy static map).
 *   Remaining rows: a location card. Cell order:
 *     [name] [city] [address] [amenity chips] [hours] [directions link]
 *   Region for filtering is read from the first cell's data attribute
 *   or a leading "Region:" label when present; otherwise "All".
 *
 * The block renders a search box + region filter buttons, an interactive
 * Leaflet map, and a live-filtered card list. Selecting a card geocodes
 * its authored address (results are cached) and flies the map to it.
 */

const CODE_BASE = (window.hlx && window.hlx.codeBasePath) || '';
const LEAFLET_CSS = `${CODE_BASE}/blocks/store-locator/vendor/leaflet.css`;
const LEAFLET_JS = `${CODE_BASE}/blocks/store-locator/vendor/leaflet.js`;
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const GEOCODE_INTERVAL = 1100; // ms between geocode requests (usage policy)
const CACHE_KEY = 'store-locator-geocode-v1';
const US_CENTER = [39.5, -98.35];
const US_ZOOM = 4;

function normalize(text) {
  return (text || '').toLowerCase();
}

// --- Geocoding: throttled queue + session cache ------------------------------

const memoryCache = new Map();

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) Object.entries(JSON.parse(raw)).forEach(([k, v]) => memoryCache.set(k, v));
  } catch (e) {
    /* storage unavailable */
  }
}

function writeCache() {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memoryCache)));
  } catch (e) {
    /* storage unavailable */
  }
}

let geocodeChain = Promise.resolve();

async function geocode(address) {
  const key = normalize(address).trim();
  if (!key) return null;
  if (memoryCache.has(key)) return memoryCache.get(key);

  // Chain requests so they never fire faster than GEOCODE_INTERVAL.
  const run = geocodeChain.then(async () => {
    if (memoryCache.has(key)) return memoryCache.get(key);
    let result = null;
    try {
      const url = `${NOMINATIM}?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) {
          result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      result = null;
    }
    if (result) {
      memoryCache.set(key, result);
      writeCache();
    }
    return result;
  });

  // Space out the next queued request only after this one settles.
  geocodeChain = run.then(
    () => new Promise((r) => { setTimeout(r, GEOCODE_INTERVAL); }),
    () => new Promise((r) => { setTimeout(r, GEOCODE_INTERVAL); }),
  );

  return run;
}

// --- Block ------------------------------------------------------------------

function buildCards(rows) {
  return rows.map((row) => {
    const cells = [...row.children];
    const card = document.createElement('article');
    card.className = 'store-locator-card';

    const region = row.dataset.region || (cells[0] && cells[0].dataset.region) || 'all';
    card.dataset.region = normalize(region);

    let textCells = cells;
    const firstCell = cells[0];
    if (firstCell && firstCell.querySelector('picture, img') && !firstCell.textContent.trim()) {
      textCells = cells.slice(1);
    }

    const body = document.createElement('div');
    body.className = 'store-locator-card-body';
    const classes = ['name', 'city', 'address', 'chips', 'hours', 'actions'];
    textCells.forEach((cell, i) => {
      cell.className = `store-locator-card-${classes[i] || 'extra'}`;
    });

    const addressCell = textCells[2];
    if (addressCell) card.dataset.address = addressCell.textContent.trim();
    const nameCell = textCells[0];
    if (nameCell) card.dataset.name = nameCell.textContent.trim();

    const cityCell = textCells[1];
    if (nameCell && cityCell && cityCell.className === 'store-locator-card-city') {
      const head = document.createElement('div');
      head.className = 'store-locator-card-head';
      head.append(nameCell, cityCell);
      body.append(head);
      textCells.slice(2).forEach((cell) => body.append(cell));
    } else {
      textCells.forEach((cell) => body.append(cell));
    }
    card.append(body);

    card.dataset.search = normalize(card.textContent);
    return card;
  });
}

export default async function decorate(block) {
  const rows = [...block.children];

  // Drop a legacy leading map image row if present.
  if (rows.length && rows[0].children.length === 1
    && rows[0].querySelector('picture, img')
    && !rows[0].textContent.trim()) {
    rows.splice(0, 1);
  }

  const cards = buildCards(rows);

  // Build UI shell.
  block.textContent = '';

  const controls = document.createElement('div');
  controls.className = 'store-locator-controls';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'store-locator-search';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search by city, neighborhood or address';
  search.setAttribute('aria-label', 'Search locations');
  searchWrap.append(search);

  const regions = ['All regions', 'East', 'Midwest', 'South', 'West'];
  const filters = document.createElement('div');
  filters.className = 'store-locator-regions';
  let activeRegion = 'all';
  const regionButtons = regions.map((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.region = i === 0 ? 'all' : normalize(label);
    if (i === 0) btn.classList.add('is-active');
    filters.append(btn);
    return btn;
  });

  controls.append(searchWrap, filters);

  const layout = document.createElement('div');
  layout.className = 'store-locator-layout';

  const mapPanel = document.createElement('div');
  mapPanel.className = 'store-locator-map';
  const mapCanvas = document.createElement('div');
  mapCanvas.className = 'store-locator-map-canvas';
  mapCanvas.setAttribute('role', 'application');
  mapCanvas.setAttribute('aria-label', 'Map of café locations');
  mapPanel.append(mapCanvas);

  const listWrap = document.createElement('div');
  listWrap.className = 'store-locator-list';
  const count = document.createElement('p');
  count.className = 'store-locator-count';
  const list = document.createElement('div');
  list.className = 'store-locator-cards';
  cards.forEach((c) => list.append(c));
  listWrap.append(count, list);

  layout.append(mapPanel, listWrap);
  block.append(controls, layout);

  const applyFilters = () => {
    const term = normalize(search.value);
    let visible = 0;
    cards.forEach((card) => {
      const matchRegion = activeRegion === 'all' || card.dataset.region === activeRegion;
      const matchTerm = !term || card.dataset.search.includes(term);
      const show = matchRegion && matchTerm;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = `${visible} café${visible === 1 ? '' : 's'} near you`;
  };

  search.addEventListener('input', applyFilters);
  regionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      regionButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeRegion = btn.dataset.region;
      applyFilters();
    });
  });

  applyFilters();

  // --- Interactive map ------------------------------------------------------
  readCache();

  await Promise.all([
    loadCSS(LEAFLET_CSS),
    loadScript(LEAFLET_JS),
  ]);

  const { L } = window;
  if (!L) return; // graceful fallback: list still works without the map.

  const map = L.map(mapCanvas, {
    center: US_CENTER,
    zoom: US_ZOOM,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // The map panel resolves its final size after Leaflet initializes (sticky +
  // aspect-ratio layout), so tell Leaflet to recompute once the container is
  // sized. Without this only a single tile strip renders on first load.
  const invalidate = () => map.invalidateSize(false);
  requestAnimationFrame(invalidate);
  [100, 300, 600].forEach((ms) => { setTimeout(invalidate, ms); });
  if (typeof ResizeObserver !== 'undefined') {
    let lastW = mapCanvas.offsetWidth;
    let lastH = mapCanvas.offsetHeight;
    const ro = new ResizeObserver(() => {
      const w = mapCanvas.offsetWidth;
      const h = mapCanvas.offsetHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      invalidate();
    });
    ro.observe(mapCanvas);
  }

  const pinIcon = L.divIcon({
    className: 'store-locator-pin',
    html: '<span class="store-locator-pin-dot"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });

  const markers = new Map();

  const setActiveCard = (card) => {
    cards.forEach((c) => c.classList.toggle('is-active', c === card));
  };

  const addMarker = (card, loc) => {
    if (markers.has(card)) return markers.get(card);
    const marker = L.marker([loc.lat, loc.lon], { icon: pinIcon }).addTo(map);
    const name = card.dataset.name || '';
    const address = card.dataset.address || '';
    marker.bindPopup(`<strong>${name}</strong><br>${address}`);
    marker.on('click', () => {
      setActiveCard(card);
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    markers.set(card, marker);
    return marker;
  };

  const selectCard = async (card, { fly = true } = {}) => {
    const { address } = card.dataset;
    if (!address) return;
    setActiveCard(card);
    card.classList.add('is-locating');
    const loc = await geocode(address);
    card.classList.remove('is-locating');
    if (!loc) return;
    const marker = addMarker(card, loc);
    if (fly) {
      map.flyTo([loc.lat, loc.lon], 14, { duration: 0.8 });
      marker.openPopup();
    }
  };

  cards.forEach((card) => {
    if (!card.dataset.address) return;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('click', (e) => {
      // Let the directions link behave normally.
      if (e.target.closest('a')) return;
      selectCard(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('a')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard(card);
      }
    });
  });

  // Progressively geocode all visible locations to drop pins, respecting the
  // throttled queue. Center on the first result without flying every time.
  const firstVisible = cards.find((c) => !c.hidden && c.dataset.address);
  let centered = false;
  cards
    .filter((c) => c.dataset.address)
    .forEach(async (card) => {
      const loc = await geocode(card.dataset.address);
      if (!loc) return;
      addMarker(card, loc);
      if (!centered && card === firstVisible) {
        centered = true;
        map.setView([loc.lat, loc.lon], 11);
      }
    });
}
