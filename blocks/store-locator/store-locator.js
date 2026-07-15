import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Store locator.
 *
 * Authored structure (one row per authored item):
 *   Row 1 (optional): a single image cell -> used as the map panel.
 *   Remaining rows: a location card. Cell order:
 *     [name] [city] [address] [amenity chips] [hours] [directions link]
 *   Region for filtering is read from the first cell's data attribute
 *   or a leading "Region:" label when present; otherwise "All".
 *
 * The block renders a search box + region filter buttons and wires up
 * live filtering over the rendered card list.
 */
function normalize(text) {
  return (text || '').toLowerCase();
}

export default function decorate(block) {
  const rows = [...block.children];

  // Detect a leading map row (single image-only cell).
  let mapRow = null;
  if (rows.length && rows[0].children.length === 1
    && rows[0].querySelector('picture, img')
    && !rows[0].textContent.trim()) {
    [mapRow] = rows.splice(0, 1);
  }

  const cards = rows.map((row) => {
    const cells = [...row.children];
    const card = document.createElement('article');
    card.className = 'store-locator-card';

    const region = row.dataset.region || (cells[0] && cells[0].dataset.region) || 'all';
    card.dataset.region = normalize(region);

    // A leading image-only cell becomes the card thumbnail; the remaining
    // cells hold the textual detail and are grouped into a body column.
    let textCells = cells;
    const firstCell = cells[0];
    if (firstCell && firstCell.querySelector('picture, img') && !firstCell.textContent.trim()) {
      const pic = firstCell.querySelector('picture') || firstCell.querySelector('img');
      if (pic) card.append(pic);
      textCells = cells.slice(1);
    }

    const body = document.createElement('div');
    body.className = 'store-locator-card-body';
    const classes = ['name', 'city', 'address', 'chips', 'hours', 'actions'];
    textCells.forEach((cell, i) => {
      cell.className = `store-locator-card-${classes[i] || 'extra'}`;
    });
    // Group the name + city into a single head row (name left, city right).
    const nameCell = textCells[0];
    const cityCell = textCells[1];
    if (nameCell && cityCell
      && cityCell.className === 'store-locator-card-city') {
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
  if (mapRow) {
    while (mapRow.firstElementChild) mapPanel.append(mapRow.firstElementChild);
    mapPanel.querySelectorAll('picture > img').forEach((img) => {
      const pic = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
      img.closest('picture').replaceWith(pic);
    });
  }

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
}
