import { decorateFaqs, toRows } from '../faq-list-by-sku/faq-list-by-sku.js';

const FAQ_ENDPOINT = 'https://www.frescopa.coffee/faq-data-by-path';

export function isAuthoringContext(
  location = window.location,
  referrer = document.referrer,
) {
  return /(^|\.)(da\.live|experience\.adobe\.com)$/i.test(location.hostname)
    || [referrer, ...Array.from(location.ancestorOrigins || [])].some((url) => (
      /^https:\/\/([a-z0-9-]+\.)*(da\.live|experience\.adobe\.com)([/:]|$)/i.test(url)
    ));
}

async function fetchPublishedFaqs(paths) {
  const params = new URLSearchParams();
  paths.forEach((path) => params.append('path', path));
  const response = await fetch(`${FAQ_ENDPOINT}?${params}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const items = json?.items;
  if (!Array.isArray(items) || items.some((item) => {
    if (!item) return true;
    const { question, answer } = item;
    return typeof question !== 'string' || typeof answer?.plaintext !== 'string';
  })) {
    throw new Error('Invalid FAQ response');
  }
  return items;
}

function message(block, text) {
  const p = document.createElement('p');
  p.className = 'faq-message';
  p.textContent = text;
  block.replaceChildren(p);
}

export function readPaths(block) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const text = [];
  while (walker.nextNode()) text.push(walker.currentNode.textContent);
  return [...new Set(text.join('\n').trim().split(/\s+/).filter(Boolean))];
}

function restorePaths(block, paths) {
  block.replaceChildren(...paths.map((path) => {
    const row = document.createElement('div');
    const cell = document.createElement('div');
    cell.textContent = path;
    row.append(cell);
    return row;
  }));
}

function showError(block, text, error, retry) {
  message(block, text);
  if (!isAuthoringContext()) return;
  const guidance = document.createElement('p');
  guidance.textContent = error.message;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Retry author connection';
  button.addEventListener('click', retry, { once: true });
  block.append(guidance, button);
}

/**
 * Renders FAQs and marks their source. Published content in authoring gets a
 * subtle label, as it may not match the author's current fragments.
 */
function showFaqs(block, items, source) {
  if (!items.length) {
    message(block, source === 'published'
      ? 'These content fragments are not published yet. Open the Content Fragment panel to see author content.'
      : 'No FAQs found for these content fragments.');
  } else {
    block.replaceChildren(...toRows(items));
    decorateFaqs(block);
  }
  if (source) block.dataset.faqSource = source;
  if (source === 'published') {
    const label = document.createElement('p');
    label.className = 'faq-source';
    label.textContent = 'Published';
    label.title = 'Showing published content. Open the Content Fragment panel to see the latest author content.';
    (block.querySelector(':scope > .faq-items') || block).prepend(label);
  }
}

async function renderPublished(block, paths) {
  block.dataset.faqState = 'loading';
  message(block, 'Loading FAQs...');
  try {
    showFaqs(block, await fetchPublishedFaqs(paths));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('content-fragment: could not load FAQs', error);
    message(block, 'Could not load FAQs for these content fragments.');
  } finally {
    delete block.dataset.faqState;
  }
}

/**
 * Authoring: show published content straight away (no sign-in needed), then
 * swap to author content whenever the Content Fragment panel brokers it.
 */
async function renderAuthoring(block, paths, retry) {
  block.dataset.faqState = 'loading';
  message(block, 'Loading FAQs...');
  const { registerAuthorFragments, requestAuthorFaqs } = await import('../../scripts/content-fragment-author.js');
  registerAuthorFragments(block, paths);
  let authorLoaded = false;
  let publishedError;

  const published = fetchPublishedFaqs(paths).then((items) => {
    if (!authorLoaded) showFaqs(block, items, 'published');
  }, (error) => {
    publishedError = error;
    // eslint-disable-next-line no-console
    console.warn('content-fragment: could not load published FAQs', error);
    if (!authorLoaded) {
      message(block, 'Could not load published FAQs. Open the Content Fragment panel to load author content.');
      block.dataset.faqSource = 'published';
    }
  }).finally(() => { delete block.dataset.faqState; });

  requestAuthorFaqs(paths, window.location.href, { isActive: () => block.isConnected })
    .then((items) => {
      authorLoaded = true;
      showFaqs(block, items, 'author');
    }, async (error) => {
      if (error.name === 'AuthorRequestCancelled') return;
      // eslint-disable-next-line no-console
      console.warn('content-fragment: could not load author FAQs', error);
      await published;
      if (publishedError) {
        showError(block, 'Could not load FAQs for these content fragments.', error, retry);
        return;
      }
      // Keep the published content visible and explain why author content is missing.
      const label = block.querySelector('.faq-source');
      if (label) label.title = `Showing published content. Author content could not be loaded: ${error.message}`;
    });
}

export default async function decorate(block) {
  if (block.querySelector(':scope > .faq-items') || block.dataset.faqState
    || block.dataset.faqSource) return;

  const hasQaRows = [...block.children].every((row) => row.children.length >= 2);
  if (block.children.length && hasQaRows) {
    decorateFaqs(block);
    return;
  }

  const paths = readPaths(block);
  if (!paths.length || paths.some((path) => !/^\/content\/dam\/[^?#]+$/.test(path))) {
    message(block, 'Add FAQ content fragment paths to this block to show FAQs.');
    return;
  }

  if (!isAuthoringContext()) {
    await renderPublished(block, paths);
    return;
  }
  // Not awaited: author content arrives whenever the panel opens, so it must
  // never hold back the section (and LCP).
  renderAuthoring(block, paths, () => {
    delete block.dataset.faqSource;
    restorePaths(block, paths);
    decorate(block);
  });
}
