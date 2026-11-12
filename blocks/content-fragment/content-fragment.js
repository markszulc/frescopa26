import { decorateFaqs, toRows } from '../faq-list-by-sku/faq-list-by-sku.js';

const FAQ_ENDPOINT = 'https://www.frescopa.coffee/faq-data-by-path';

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

  const params = new URLSearchParams();
  paths.forEach((path) => params.append('path', path));
  block.dataset.faqState = 'loading';
  message(block, 'Loading FAQs...');

  try {
    const response = await fetch(`${FAQ_ENDPOINT}?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { items } = await response.json();
    if (!Array.isArray(items) || items.some((item) => (
      !item || typeof item.question !== 'string' || typeof item.answer?.plaintext !== 'string'
    ))) {
      throw new Error('Invalid FAQ response');
    }
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
