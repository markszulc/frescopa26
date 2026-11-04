import { loadCSS, createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import {
  fetchSearchAnswer,
  fetchSearchResults,
  isSafeUrl,
  renderMarkdownSummary,
  resolveSearchResult,
} from '../../scripts/content-ai.js';
import { loadLanguages } from '../../scripts/languages.js';
import { getResultSection, labelFromPath } from './search-results.js';
import { formatSearchText, getSearchContent, loadSearchContent } from './search-content.js';

const SEARCH_DELAY = 250;
const SEARCH_TIMEOUT = 15000;
const SUMMARY_TIMEOUT = 30000;
const RESULTS_LIMIT = 8;
const MAX_SEARCH_PAGES = 3;

const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2" stroke-linecap="round"></path></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l2.5 1.5" stroke-linecap="round"></path></svg>';

let overlay;
let modal;
let input;
let defaultPanel;
let resultsPanel;
let summaryPanel;
let summaryText;
let summarySources;
let summaryDisclaimer;
let lastFocused;
let hideTimer;
let searchTimer;
let searchController;
let searchRequestId = 0;
let searchConfig;
let summaryController;
let summaryRequestId = 0;
let contentRequestId = 0;
let searchContent;
let searchLanguages;

function text(key, values = {}) {
  return formatSearchText(searchContent.labels[key], values);
}

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
    disclaimer: config['disclaimer-text'] || '',
  };
  return searchConfig;
}

function normalizeResults(items, languages) {
  const seen = new Set();
  const rows = [];
  const navigationLinks = [...document.querySelectorAll('header .nav-sections a[href]')]
    .map((link) => ({
      pathname: new URL(link.href).pathname,
      label: link.textContent,
    }));
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
    const section = getResultSection(parsed.pathname, languages, navigationLinks);
    rows.push({
      label: title || (section ? labelFromPath(segments.at(-1)) : text('home-label')),
      sub: section ? text('result-location', { section }) : '',
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
  const messageElement = document.createElement('p');
  messageElement.className = 'search-empty';
  messageElement.textContent = message;
  resultsPanel.append(messageElement);
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-chip';
    button.dataset.searchRetry = '';
    button.textContent = text('retry-search');
    resultsPanel.append(button);
  }
}

function showSummaryMessage(message, retry = false) {
  summaryText.textContent = '';
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  summaryText.append(messageElement);
  summarySources.textContent = '';
  summarySources.hidden = true;
  summaryDisclaimer.hidden = true;
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-chip';
    button.dataset.summaryRetry = '';
    button.textContent = text('retry-summary');
    summaryText.append(button);
  }
}

function renderSummarySources(hits) {
  summarySources.textContent = '';
  const seen = new Set();
  hits.forEach((hit) => {
    const { url, title } = resolveSearchResult({
      data: { metadata: hit.metadata, source: hit.source },
    });
    if (!isSafeUrl(url)) {
      console.warn('Skipping Content AI summary source with an invalid URL', hit.id);
      return;
    }
    const parsed = new URL(url, window.location.origin);
    const { href } = parsed;
    if (seen.has(href)) return;
    seen.add(href);
    const link = document.createElement('a');
    link.className = 'search-chip';
    link.href = href;
    const section = getResultSection(parsed.pathname, searchLanguages, []);
    link.textContent = title || (section
      ? labelFromPath(parsed.pathname.split('/').filter(Boolean).at(-1)) : text('home-label'));
    summarySources.append(link);
  });
  summarySources.hidden = !summarySources.childElementCount;
}

async function renderSummary(query, requestId, config) {
  summaryRequestId += 1;
  const summaryId = summaryRequestId;
  summaryController?.abort();
  const controller = new AbortController();
  summaryController = controller;
  const timeout = setTimeout(() => controller.abort(), SUMMARY_TIMEOUT);
  summaryPanel.setAttribute('aria-busy', 'true');
  showSummaryMessage(text('generating-summary'));
  try {
    const {
      baseUrl, contentSource, contentSourceType, disclaimer,
    } = config || await getSearchConfig(controller.signal);
    if (requestId !== searchRequestId || summaryId !== summaryRequestId) return;
    const data = await fetchSearchAnswer(
      baseUrl,
      contentSource,
      contentSourceType,
      query,
      controller.signal,
    );
    if (requestId !== searchRequestId || summaryId !== summaryRequestId) return;
    if (data.result.trim()) {
      summaryText.innerHTML = renderMarkdownSummary(data.result);
      renderSummarySources(data.hits || []);
      const localizedDisclaimer = searchContent.labels['summary-disclaimer']
        ?? (searchContent.locale === 'en' ? disclaimer : '');
      summaryDisclaimer.textContent = localizedDisclaimer;
      summaryDisclaimer.hidden = !localizedDisclaimer;
    } else {
      showSummaryMessage(text('summary-empty'));
    }
  } catch (error) {
    if (requestId !== searchRequestId || summaryId !== summaryRequestId) return;
    console.error('Navigation AI summary failed', error);
    showSummaryMessage(text('summary-error'), true);
  } finally {
    clearTimeout(timeout);
    if (requestId === searchRequestId && summaryId === summaryRequestId) {
      summaryPanel.setAttribute('aria-busy', 'false');
      summaryController = null;
    }
  }
}

function cancelSearch() {
  searchRequestId += 1;
  summaryRequestId += 1;
  clearTimeout(searchTimer);
  searchController?.abort();
  summaryController?.abort();
  summaryController = null;
  resultsPanel?.setAttribute('aria-busy', 'false');
  summaryPanel?.setAttribute('aria-busy', 'false');
}

async function renderResults(query, requestId) {
  const controller = new AbortController();
  searchController = controller;
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
  let config;
  try {
    const [loadedConfig, languages] = await Promise.all([
      getSearchConfig(controller.signal),
      loadLanguages(),
    ]);
    config = loadedConfig;
    if (requestId !== searchRequestId) return;
    const { baseUrl, contentSource, contentSourceType } = config;
    renderSummary(query, requestId, config);
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
      rows = normalizeResults(items, languages);
      if (rows.length >= RESULTS_LIMIT || !data.cursor || data.cursor === cursor) break;
      cursor = data.cursor;
    }
    resultsPanel.textContent = '';
    if (!rows.length) showMessage(text('no-results', { query }));
    else rows.slice(0, RESULTS_LIMIT).forEach((row) => resultsPanel.append(resultRow(row)));
  } catch (error) {
    if (requestId !== searchRequestId) return;
    console.error('Navigation search failed', error);
    showMessage(text('search-error'), true);
    if (!config) {
      showSummaryMessage(text('summary-error'), true);
      summaryPanel.setAttribute('aria-busy', 'false');
    }
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
  summaryPanel.hidden = !hasQuery;
  if (hasQuery) {
    showMessage(text('searching'));
    showSummaryMessage(text('generating-summary'));
    summaryPanel.setAttribute('aria-busy', 'true');
    resultsPanel.setAttribute('aria-busy', 'true');
    const requestId = searchRequestId;
    searchTimer = setTimeout(() => renderResults(query, requestId), SEARCH_DELAY);
  }
}

function getFocusable() {
  return [...modal.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && !el.disabled && el.offsetParent !== null);
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
  contentRequestId += 1;
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

function chip(labelText, withClock) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'search-chip';
  btn.dataset.query = labelText;
  if (withClock) {
    const icon = document.createElement('span');
    icon.className = 'search-chip-icon';
    icon.innerHTML = CLOCK_ICON;
    btn.append(icon);
  }
  const label = document.createElement('span');
  label.textContent = labelText;
  btn.append(label);
  return btn;
}

function trendingItem(item) {
  const a = document.createElement('a');
  a.className = 'search-trending-item';
  a.href = item.href;
  if (item.img) {
    const picture = createOptimizedPicture(item.img, '', false, [{ width: '160' }]);
    picture.classList.add('search-trending-thumb');
    const img = picture.querySelector('img');
    if (img) {
      img.width = 56;
      img.height = 56;
      img.addEventListener('error', () => { picture.classList.add('is-empty'); });
    }
    a.append(picture);
  }
  const name = document.createElement('span');
  name.className = 'search-trending-name';
  name.textContent = item.name;
  const price = document.createElement('span');
  price.className = 'search-trending-price';
  price.textContent = item.price;
  a.append(name, price);
  return a;
}

function group(title) {
  const section = document.createElement('section');
  section.className = 'search-group';
  const heading = document.createElement('p');
  heading.className = 'search-group-title';
  heading.textContent = title;
  section.append(heading);
  return section;
}

function renderDefault() {
  defaultPanel.textContent = '';

  const recent = group(text('recent-title'));
  const recentChips = document.createElement('div');
  recentChips.className = 'search-chips';
  searchContent.recent.forEach((t) => recentChips.append(chip(t, true)));
  recent.append(recentChips);

  const popular = group(text('popular-title'));
  const popularChips = document.createElement('div');
  popularChips.className = 'search-chips';
  searchContent.popular.forEach((t) => popularChips.append(chip(t, false)));
  popular.append(popularChips);

  const trending = group(text('trending-title'));
  const trendingList = document.createElement('div');
  trendingList.className = 'search-trending';
  searchContent.trending.forEach((item) => trendingList.append(trendingItem(item)));
  trending.append(trendingList);

  if (searchContent.recent.length) defaultPanel.append(recent);
  if (searchContent.popular.length) defaultPanel.append(popular);
  if (searchContent.trending.length) defaultPanel.append(trending);
}

function applySearchContent() {
  modal.lang = searchContent.locale;
  defaultPanel.removeAttribute('lang');
  modal.setAttribute('aria-label', text('dialog-label'));
  input.placeholder = text('input-placeholder');
  input.setAttribute('aria-label', text('input-label'));
  const closeButton = overlay.querySelector('.search-esc');
  closeButton.textContent = text('close-text');
  closeButton.setAttribute('aria-label', text('close-label'));
  summaryPanel.setAttribute('aria-label', text('summary-title'));
  summaryPanel.querySelector('.search-group-title').textContent = text('summary-title');
  summarySources.setAttribute('aria-label', text('sources-label'));
  resultsPanel.setAttribute('aria-label', text('results-label'));
  renderDefault();
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
        <div class="search-default" aria-live="polite"></div>
        <section class="search-summary" role="status" aria-live="polite"
          aria-label="AI summary" hidden>
          <p class="search-group-title">AI summary</p>
          <div class="search-summary-text"></div>
          <div class="search-chips search-summary-sources" role="group"
            aria-label="Sources" hidden></div>
          <p class="search-summary-disclaimer" hidden></p>
        </section>
        <div class="search-results" role="status" aria-live="polite" hidden></div>
      </div>
    </div>`;

  modal = overlay.querySelector('.search-modal');
  input = overlay.querySelector('.search-input');
  defaultPanel = overlay.querySelector('.search-default');
  resultsPanel = overlay.querySelector('.search-results');
  summaryPanel = overlay.querySelector('.search-summary');
  summaryText = overlay.querySelector('.search-summary-text');
  summarySources = overlay.querySelector('.search-summary-sources');
  summaryDisclaimer = overlay.querySelector('.search-summary-disclaimer');

  input.addEventListener('input', (event) => {
    if (!event.isComposing) render();
    else cancelSearch();
  });
  input.addEventListener('compositionend', render);
  resultsPanel.addEventListener('click', (event) => {
    if (event.target.closest('[data-search-retry]')) render();
  });
  summaryPanel.addEventListener('click', (event) => {
    if (event.target.closest('[data-summary-retry]')) {
      renderSummary(input.value.trim(), searchRequestId);
    }
  });
  defaultPanel.addEventListener('click', (e) => {
    if (e.target.closest('[data-content-retry]')) {
      // eslint-disable-next-line no-use-before-define
      openSearch(lastFocused);
      return;
    }
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
  (input.disabled ? overlay.querySelector('.search-esc') : input).focus();
}

/**
 * Opens the modal search overlay, building it on first call.
 * @param {Element} trigger element to restore focus to on close
 */
export default async function openSearch(trigger) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/search/search.css`);
  if (!overlay) buildOverlay();
  contentRequestId += 1;
  const requestId = contentRequestId;
  searchContent = undefined;
  input.disabled = true;
  defaultPanel.lang = 'en';
  defaultPanel.textContent = 'Loading search…';
  defaultPanel.setAttribute('aria-busy', 'true');
  open(trigger);
  try {
    const [languages, locales] = await Promise.all([loadLanguages(), loadSearchContent()]);
    if (requestId !== contentRequestId) return;
    searchLanguages = languages;
    searchContent = getSearchContent(locales, window.location.pathname, languages);
    applySearchContent();
    input.disabled = false;
    input.focus();
  } catch (error) {
    if (requestId !== contentRequestId) return;
    console.error('Search modal content failed', error);
    defaultPanel.textContent = '';
    const message = document.createElement('p');
    message.className = 'search-empty';
    message.textContent = 'Search content could not be loaded. Please try again.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'search-chip';
    retry.dataset.contentRetry = '';
    retry.textContent = 'Retry loading search';
    defaultPanel.append(message, retry);
    retry.focus();
  } finally {
    if (requestId === contentRequestId) defaultPanel.setAttribute('aria-busy', 'false');
  }
}
