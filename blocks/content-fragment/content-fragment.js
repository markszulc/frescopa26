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

async function renderFaqs(block, paths, load, retry) {
  block.dataset.faqState = 'loading';
  message(block, 'Loading FAQs...');

  try {
    const items = await load();
    if (!items.length) {
      message(block, 'No FAQs found for these content fragments.');
      return;
    }
    block.replaceChildren(...toRows(items));
    decorateFaqs(block);
  } catch (error) {
    if (error.name === 'AuthorRequestCancelled') return;
    // eslint-disable-next-line no-console
    console.warn('content-fragment: could not load FAQs', error);
    message(block, 'Could not load FAQs for these content fragments.');
    if (isAuthoringContext()) {
      const guidance = document.createElement('p');
      guidance.textContent = error.message;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Retry author connection';
      button.addEventListener('click', () => {
        block.replaceChildren(...paths.map((path) => {
          const row = document.createElement('div');
          const cell = document.createElement('div');
          cell.textContent = path;
          row.append(cell);
          return row;
        }));
        retry();
      }, { once: true });
      block.append(guidance, button);
    }
  } finally {
    delete block.dataset.faqState;
  }
}

export default async function decorate(block) {
  if (block.querySelector(':scope > .faq-items') || block.dataset.faqState) return;

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

  block.dataset.faqState = 'loading';
  if (!isAuthoringContext()) {
    await renderFaqs(block, paths, () => fetchPublishedFaqs(paths));
    return;
  }

  const { AUTHOR_ORIGIN, loadAuthorFaqs, registerAuthorFragments } = await import('../../scripts/content-fragment-author.js');
  registerAuthorFragments(block, paths);
  // Author content loads in the background so it never holds back the section (and LCP).
  renderFaqs(block, paths, () => loadAuthorFaqs(paths, {
    isActive: () => block.isConnected,
    onWaiting: () => {
      if (!block.dataset.faqState) return;
      message(block, 'Sign in to AEM author, or open the Content Fragment panel, to load FAQs.');
      const signIn = document.createElement('button');
      signIn.type = 'button';
      signIn.textContent = 'Sign in to AEM author';
      // Workspace blocks link navigation in the preview, so open the sign-in explicitly.
      signIn.addEventListener('click', () => window.open(`${AUTHOR_ORIGIN}/ui`, '_blank', 'noopener'));
      block.append(signIn);
    },
  }), () => decorate(block));
}
