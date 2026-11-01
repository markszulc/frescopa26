import { loadCSS, createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { fetchSearchResults, isSafeUrl, resolveSearchResult } from '../../scripts/content-ai.js';

const SEARCH_DELAY = 250;
const SEARCH_TIMEOUT = 15000;
const RESULTS_LIMIT = 8;
const MAX_SEARCH_PAGES = 3;

const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2" stroke-linecap="round"></path></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l2.5 1.5" stroke-linecap="round"></path></svg>';

const RECENT = ['atelier mini', 'cold brew beans', 'nearest café'];
const POPULAR = ['bean subscription', 'flavour dna', 'espresso blend', 'gift sets'];
const TRENDING = [
  {
    name: 'The Atelier',
    price: '$2,199',
    href: '/machines/atelier',
    img: '/media_1a775c161149ea61e50ce787b6c0adb646148c6ca.jpg',
  },
  {
    name: 'Morning Blend coffee',
    price: 'from $10',
    href: '/beverages/coffee',
    img: '/media_126153dedaaab1e3fdd811716e201bae4bcfcf30f.jpg',
  },
];

let overlay;
let modal;
let input;
let defaultPanel;
let resultsPanel;
let lastFocused;
let hideTimer;
let searchTimer;
let searchController;
let searchRequestId = 0;
let searchConfig;

async function getSearchConfig(signal) {
  if (searchConfig) return searchConfig;
  const resp = await fetch('/search.plain.html', { signal });
  if (!resp.ok) throw new Error(`Failed to load search configuration: ${resp.status}`);
  const content = document.createElement('div');
  content.innerHTML = await resp.text();
  const block = content.querySelector('.content-ai-search');
  if (!block) throw new Error('Content AI search configuration is missing from /search');
  const config = readBlockConfig(block);
  const baseUrl = (config['base-url'] || '').replace(/\/+$/, '');
  const contentSource = config['content-source'] || '';
  if (!isSafeUrl(baseUrl) || !contentSource) {
    throw new Error('Content AI search requires a valid base URL and content source');
  }
  searchConfig = {
    baseUrl,
    contentSource,
    contentSourceType: config['content-source-type'] || 'AEM_PUBLISH',
  };
  return searchConfig;
}

function labelFromPath(path) {
  let label = path;
  try {
    label = decodeURIComponent(path);
  } catch (error) {
    console.warn('Content AI result has an invalid encoded path', error);
  }
  return label.replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeResults(items) {
  const seen = new Set();
  const rows = [];
  items.forEach((item) => {
    const { url, title } = resolveSearchResult(item);
    if (!isSafeUrl(url)) {
      console.warn('Skipping Content AI result with an invalid URL', item.id);
      return;
    }
    const parsed = new URL(url, window.location.origin);
    // Navigation results represent pages, not individual indexed chunks.
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const identity = parsed.href;
    if (seen.has(identity)) return;
    seen.add(identity);
    const segments = parsed.pathname.split('/').filter(Boolean);
    rows.push({
      label: title || labelFromPath(segments.at(-1) || 'Home'),
      sub: segments.length > 1 ? `in ${labelFromPath(segments[0])}` : '',
      href: parsed.origin === window.location.origin
        ? `${parsed.pathname}${parsed.search}` : parsed.href,
    });
  });
  return rows;
}

function resultRow({ label, sub, href }) {
  const a = document.createElement('a');
  a.className = 'search-result';
  a.href = href;
  const title = document.createElement('span');
  title.className = 'search-result-label';
  title.textContent = label;
  const subtitle = document.createElement('span');
  subtitle.className = 'search-result-sub';
  subtitle.textContent = sub;
  a.append(title, subtitle);
  return a;
}

function showMessage(message, retry = false) {
  resultsPanel.textContent = '';
  const text = document.createElement('p');
  text.className = 'search-empty';
  text.textContent = message;
  resultsPanel.append(text);
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-chip';
    button.dataset.searchRetry = '';
    button.textContent = 'Try again';
    resultsPanel.append(button);
  }
}

function cancelSearch() {
  searchRequestId += 1;
  clearTimeout(searchTimer);
  searchController?.abort();
  resultsPanel?.setAttribute('aria-busy', 'false');
}

async function renderResults(query, requestId) {
  const controller = new AbortController();
  searchController = controller;
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
  try {
    const { baseUrl, contentSource, contentSourceType } = await getSearchConfig(controller.signal);
    let cursor;
    let rows = [];
    const items = [];
    for (let page = 0; page < MAX_SEARCH_PAGES; page += 1) {
      // eslint-disable-next-line no-await-in-loop
      const data = await fetchSearchResults(
        baseUrl,
        contentSource,
        contentSourceType,
        query,
        RESULTS_LIMIT,
        cursor,
        controller.signal,
      );
      if (requestId !== searchRequestId) return;
      items.push(...data.results);
      rows = normalizeResults(items);
      if (rows.length >= RESULTS_LIMIT || !data.cursor || data.cursor === cursor) break;
      cursor = data.cursor;
    }
    resultsPanel.textContent = '';
    if (!rows.length) showMessage(`No results for “${query}”`);
    else rows.slice(0, RESULTS_LIMIT).forEach((row) => resultsPanel.append(resultRow(row)));
  } catch (error) {
    if (requestId !== searchRequestId) return;
    console.error('Navigation search failed', error);
    showMessage('Search is unavailable right now. Please try again.', true);
  } finally {
    clearTimeout(timeout);
    if (requestId === searchRequestId) {
      resultsPanel.setAttribute('aria-busy', 'false');
      searchController = null;
    }
  }
}

function render() {
  cancelSearch();
  const query = input.value.trim();
  const hasQuery = query.length > 0;
  defaultPanel.hidden = hasQuery;
  resultsPanel.hidden = !hasQuery;
  if (hasQuery) {
    showMessage('Searching…');
    resultsPanel.setAttribute('aria-busy', 'true');
    const requestId = searchRequestId;
    searchTimer = setTimeout(() => renderResults(query, requestId), SEARCH_DELAY);
  }
}

function getFocusable() {
  return [...modal.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && el.offsetParent !== null);
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusable = getFocusable();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    // eslint-disable-next-line no-use-before-define
    close();
  } else {
    trapFocus(e);
  }
}

function close() {
  if (!overlay || !overlay.classList.contains('is-open')) return;
  cancelSearch();
  overlay.classList.remove('is-open');
  overlay.inert = true;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
  const restore = lastFocused;
  // transitionend is unreliable (doesn't fire when throttled/backgrounded) and,
  // since it bubbles, fires on whichever transition ends first rather than the
  // longest one — so teardown relies solely on a timeout covering --dur-2
  // (the longest transition, 0.6s), with margin.
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    overlay.hidden = true;
  }, 650);
  if (restore && typeof restore.focus === 'function') restore.focus();
}

function chip(text, withClock) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'search-chip';
  btn.dataset.query = text;
  btn.innerHTML = `${withClock ? `<span class="search-chip-icon">${CLOCK_ICON}</span>` : ''}<span>${text}</span>`;
  return btn;
}

function trendingItem(item) {
  const a = document.createElement('a');
  a.className = 'search-trending-item';
  a.href = item.href;
  const picture = createOptimizedPicture(item.img, '', false, [{ width: '160' }]);
  picture.classList.add('search-trending-thumb');
  const img = picture.querySelector('img');
  if (img) {
    img.width = 56;
    img.height = 56;
    img.addEventListener('error', () => { picture.classList.add('is-empty'); });
  }
  a.append(picture);
  a.insertAdjacentHTML('beforeend', `
    <span class="search-trending-name">${item.name}</span>
    <span class="search-trending-price">${item.price}</span>`);
  return a;
}

function group(title) {
  const section = document.createElement('section');
  section.className = 'search-group';
  section.innerHTML = `<p class="search-group-title">${title}</p>`;
  return section;
}

function renderDefault() {
  defaultPanel.textContent = '';

  const recent = group('Recent');
  const recentChips = document.createElement('div');
  recentChips.className = 'search-chips';
  RECENT.forEach((t) => recentChips.append(chip(t, true)));
  recent.append(recentChips);

  const popular = group('Popular searches');
  const popularChips = document.createElement('div');
  popularChips.className = 'search-chips';
  POPULAR.forEach((t) => popularChips.append(chip(t, false)));
  popular.append(popularChips);

  const trending = group('Trending now');
  const trendingList = document.createElement('div');
  trendingList.className = 'search-trending';
  TRENDING.forEach((item) => trendingList.append(trendingItem(item)));
  trending.append(trendingList);

  defaultPanel.append(recent, popular, trending);
}

function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="search-modal" role="dialog" aria-modal="true" aria-label="Site search">
      <div class="search-bar">
        <span class="search-bar-icon">${SEARCH_ICON}</span>
        <input class="search-input" type="search" autocomplete="off"
          placeholder="Search products, guides, cafés…"
          aria-label="Search products, guides, cafés">
        <button class="search-esc" type="button" aria-label="Close search">ESC</button>
      </div>
      <div class="search-body">
        <div class="search-default"></div>
        <div class="search-results" role="status" aria-live="polite" hidden></div>
      </div>
    </div>`;

  modal = overlay.querySelector('.search-modal');
  input = overlay.querySelector('.search-input');
  defaultPanel = overlay.querySelector('.search-default');
  resultsPanel = overlay.querySelector('.search-results');

  renderDefault();

  input.addEventListener('input', (event) => {
    if (!event.isComposing) render();
    else cancelSearch();
  });
  input.addEventListener('compositionend', render);
  resultsPanel.addEventListener('click', (event) => {
    if (event.target.closest('[data-search-retry]')) render();
  });
  defaultPanel.addEventListener('click', (e) => {
    const c = e.target.closest('.search-chip');
    if (!c) return;
    input.value = c.dataset.query;
    render();
    input.focus();
  });
  overlay.querySelector('.search-esc').addEventListener('click', close);
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) close();
  });

  document.body.append(overlay);
}

function open(trigger) {
  lastFocused = trigger || document.activeElement;
  // Cancel a pending hide from a prior close() so a rapid re-open doesn't get
  // hidden out from under the user.
  clearTimeout(hideTimer);
  if (overlay.hidden) {
    overlay.hidden = false;
    // Force reflow so the transition runs from the hidden state.
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetHeight;
  }
  overlay.classList.add('is-open');
  overlay.inert = false;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown);
  input.value = '';
  render();
  input.focus();
}

/**
 * Opens the modal search overlay, building it on first call.
 * @param {Element} trigger element to restore focus to on close
 */
export default function openSearch(trigger) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/search/search.css`);
  if (!overlay) buildOverlay();
  open(trigger);
}
