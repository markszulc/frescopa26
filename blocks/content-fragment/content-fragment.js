import { decorateFaqs, toRows } from '../faq-list-by-sku/faq-list-by-sku.js';

const FAQ_ENDPOINT = 'https://www.frescopa.coffee/faq-data-by-path';
const AUTHOR_ENDPOINT = 'https://author-p137825-e1511252.adobeaemcloud.com/content/_cq_graphql/frescopa/endpoint.json';
const FAQ_QUERY = `query getFaqsByPaths($filter: FaqModelFilter) {
  faqList(filter: $filter) {
    items {
      _path
      question
      answer { plaintext }
    }
  }
}`;

export function isAuthoringContext(
  location = window.location,
  referrer = document.referrer,
) {
  return /(^|\.)(da\.live|experience\.adobe\.com)$/i.test(location.hostname)
    || [referrer, ...Array.from(location.ancestorOrigins || [])].some((url) => (
      /^https:\/\/([a-z0-9-]+\.)*(da\.live|experience\.adobe\.com)([/:]|$)/i.test(url)
    ));
}

async function getAuthorCsrfToken() {
  const response = await fetch(new URL('/libs/granite/csrf/token.json', AUTHOR_ENDPOINT), {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Author CSRF token request returned HTTP ${response.status}`);
  const { token } = await response.json();
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Author CSRF token unavailable. Sign in to AEM author and allow author session cookies.');
  }
  return token;
}

async function fetchFaqs(paths) {
  const authoring = isAuthoringContext();
  const params = new URLSearchParams();
  paths.forEach((path) => params.append('path', path));
  const response = await fetch(authoring ? AUTHOR_ENDPOINT : `${FAQ_ENDPOINT}?${params}`, authoring ? {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'CSRF-Token': await getAuthorCsrfToken(),
    },
    body: JSON.stringify({
      query: FAQ_QUERY,
      variables: {
        filter: {
          _path: {
            _logOp: 'OR',
            _expressions: paths.map((value) => ({ value, _operator: 'EQUALS' })),
          },
        },
      },
    }),
  } : undefined);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const items = authoring ? json?.data?.faqList?.items : json?.items;
  if ((authoring && json?.errors?.length) || !Array.isArray(items) || items.some((item) => {
    if (!item) return true;
    const { question, answer, _path: path } = item;
    return typeof question !== 'string' || typeof answer?.plaintext !== 'string'
      || (authoring && typeof path !== 'string');
  })) {
    throw new Error('Invalid FAQ response');
  }
  if (!authoring) return items;
  const byPath = new Map(items.map((item) => {
    const { _path: path } = item;
    return [path, item];
  }));
  return paths.filter((path) => byPath.has(path)).map((path) => byPath.get(path));
}

function message(block, text) {
  const p = document.createElement('p');
  p.className = 'faq-message';
  p.textContent = text;
  block.replaceChildren(p);
}

function readPaths(block) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const text = [];
  while (walker.nextNode()) text.push(walker.currentNode.textContent);
  return [...new Set(text.join('\n').trim().split(/\s+/).filter(Boolean))];
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
  message(block, 'Loading FAQs...');

  try {
    const items = await fetchFaqs(paths);
    if (!items.length) {
      message(block, 'No FAQs found for these content fragments.');
      return;
    }
    block.replaceChildren(...toRows(items));
    decorateFaqs(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('content-fragment: could not load FAQs', error);
    message(block, 'Could not load FAQs for these content fragments.');
  } finally {
    delete block.dataset.faqState;
  }
}
