import createPreviewChannel from './experimentation-channel.js';
import createAuthorHighlighter from './author-highlight.js';

const MESSAGE = 'da:content-fragment';
export const AUTHOR_ORIGIN = 'https://author-p137825-e1511252.adobeaemcloud.com';

export function validatePaths(paths) {
  if (!Array.isArray(paths) || !paths.length || paths.some((path) => (
    typeof path !== 'string' || !/^\/content\/dam\/[A-Za-z0-9._/-]+$/.test(path)
    || path.split('/').slice(3).some((part) => !part || part === '.' || part === '..')
  ))) {
    throw new Error('Expected FAQ content fragment paths under /content/dam/.');
  }
}

let inventoryChannel;
const fragmentPaths = new WeakMap();
// Results loaded by blocks with the author's AEM sign-in, shared with the panel.
const loadedFaqs = new Map();
let publishInventory;

export function recordAuthorFaqs(paths, items) {
  paths.forEach((path) => {
    loadedFaqs.set(path, items.find(({ _path: itemPath }) => itemPath === path) || null);
  });
  publishInventory?.();
}

export function registerAuthorFragments(block, paths) {
  validatePaths(paths);
  fragmentPaths.set(block, paths);
  block.dataset.contentFragmentPaths = '';
  if (inventoryChannel) return;
  inventoryChannel = createPreviewChannel(window.location.href);
  const highlights = createAuthorHighlighter();
  const blocksOnPage = () => [...document.querySelectorAll('.content-fragment[data-content-fragment-paths]')];
  const referencingBlocks = (path) => blocksOnPage()
    .filter((element) => fragmentPaths.get(element)?.includes(path));
  let highlightedPath;
  let fadeTimer;
  let clearTimer;
  let fading = false;
  const clearHighlight = () => {
    clearTimeout(fadeTimer);
    clearTimeout(clearTimer);
    highlightedPath = undefined;
    fading = false;
    highlights.clear();
  };
  let lastPaths;
  const publish = (force = false) => {
    if (highlightedPath) {
      const blocks = referencingBlocks(highlightedPath);
      highlights.highlight(blocks);
      if (fading) highlights.fade();
      if (!blocks.length) clearHighlight();
    }
    const fragments = blocksOnPage()
      .flatMap((element) => fragmentPaths.get(element) || []);
    const pathsOnPage = [...new Set(fragments)];
    const loadedPaths = pathsOnPage.filter((path) => loadedFaqs.has(path));
    const items = loadedPaths.map((path) => loadedFaqs.get(path)).filter(Boolean);
    const snapshot = JSON.stringify([pathsOnPage, loadedPaths, items]);
    if (!force && snapshot === lastPaths) return;
    lastPaths = snapshot;
    inventoryChannel.postMessage({
      type: MESSAGE, action: 'inventory', response: true, paths: pathsOnPage, loadedPaths, items,
    });
  };
  publishInventory = publish;
  inventoryChannel.onmessage = ({ data }) => {
    if (data?.type !== MESSAGE || data.response) return;
    if (data.action === 'inventory') publish(true);
    else if (data.action === 'clear-highlight') {
      clearHighlight();
    } else if (data.action === 'highlight' && typeof data.requestId === 'string') {
      const reply = (result) => inventoryChannel.postMessage({
        type: MESSAGE, action: 'highlight', response: true, requestId: data.requestId, ...result,
      });
      try {
        validatePaths([data.path]);
        const blocks = referencingBlocks(data.path);
        if (!blocks.length) throw new Error('This fragment is no longer referenced in the preview. Reload the preview and try again.');
        clearHighlight();
        highlightedPath = data.path;
        highlights.highlight(blocks);
        fadeTimer = setTimeout(() => {
          fading = true;
          highlights.fade();
        }, 2000);
        clearTimer = setTimeout(clearHighlight, 3000);
        blocks[0].scrollIntoView({
          block: 'center',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
        reply({ count: blocks.length });
      } catch (error) {
        reply({ error: error.message });
      }
    }
  };
  const observer = new MutationObserver(() => publish());
  observer.observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['data-content-fragment-paths'],
  });
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    clearHighlight();
    inventoryChannel.close();
    inventoryChannel = undefined;
    publishInventory = undefined;
  }, { once: true });
  publish();
}

export async function fetchAuthorCsrfToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Sign in to DA and reopen the Content Fragment panel.');
  }
  const headers = { Authorization: `Bearer ${accessToken}` };
  const csrfResponse = await fetch(`${AUTHOR_ORIGIN}/libs/granite/csrf/token.json`, {
    credentials: 'omit',
    cache: 'no-store',
    headers,
  });
  if (!csrfResponse.ok) {
    throw new Error(`Author CSRF token request returned HTTP ${csrfResponse.status}. Check DA sign-in and AEM access.`);
  }
  const { token } = await csrfResponse.json();
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('AEM author did not accept the DA sign-in. Reopen the Content Fragment panel.');
  }
  return token;
}

async function lookupAuthorFaqs(paths, auth) {
  const items = await Promise.all([...new Set(paths)].map(async (path) => {
    const query = new URLSearchParams({ path, limit: '1' });
    const response = await fetch(`${AUTHOR_ORIGIN}/adobe/sites/cf/fragments?${query}`, {
      method: 'GET',
      cache: 'no-store',
      ...auth,
    });
    if (!response.ok) {
      const error = new Error(`Author FAQ request returned HTTP ${response.status}. Check DA sign-in and AEM permissions.`);
      error.status = response.status;
      throw error;
    }
    const json = await response.json();
    if (!Array.isArray(json?.items)) throw new Error('Invalid author FAQ response.');
    const fragment = json.items.find((item) => item?.path === path);
    if (!fragment) return null;
    if (!Array.isArray(fragment.fields)) throw new Error('Invalid author FAQ response.');
    const question = fragment.fields.find((field) => field?.name === 'question');
    const answer = fragment.fields.find((field) => field?.name === 'answer');
    if (typeof fragment.id !== 'string'
      || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(fragment.id)
      || question?.type !== 'text' || question.multiple
      || !Array.isArray(question.values) || question.values.length !== 1
      || typeof question.values[0] !== 'string'
      || answer?.type !== 'long-text' || answer.multiple
      || !Array.isArray(answer.values) || answer.values.length > 1
      || answer.values.some((value) => typeof value !== 'string')
      || (answer.mimeType && !['text/plain', 'text/html'].includes(answer.mimeType))) {
      throw new Error('Invalid author FAQ response.');
    }
    let plaintext = answer.values[0] ?? '';
    if (answer.mimeType === 'text/html') {
      const doc = new DOMParser().parseFromString(plaintext, 'text/html');
      doc.querySelectorAll('script, style').forEach((element) => element.remove());
      doc.querySelectorAll('br').forEach((element) => element.replaceWith('\n'));
      doc.querySelectorAll('p, div, li').forEach((element) => element.append('\n'));
      plaintext = doc.body.textContent.trim();
    }
    return {
      _path: path, _id: fragment.id, question: question.values[0], answer: { plaintext },
    };
  }));
  return items.filter(Boolean);
}

export async function fetchAuthorFaqs(paths, accessToken) {
  validatePaths(paths);
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Sign in to DA and reopen the Content Fragment panel.');
  }
  return lookupAuthorFaqs(paths, {
    credentials: 'omit',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** Reads with the browser's AEM author sign-in cookie; no DA token is involved. */
export async function fetchAuthorFaqsWithSession(paths) {
  validatePaths(paths);
  return lookupAuthorFaqs(paths, { credentials: 'include' });
}

export function isAuthorSessionError(error) {
  return error instanceof TypeError || [401, 403].includes(error?.status);
}

export async function fetchAuthorFragmentStatuses(items, accessToken) {
  return Promise.all(items.map(async ({ _path: path, _id: id }) => {
    try {
      validatePaths([path]);
      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new Error('Sign in to DA and reopen the Content Fragment panel.');
      }
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Invalid Content Fragment UUID.');
      }
      const response = await fetch(`${AUTHOR_ORIGIN}/adobe/sites/cf/fragments/${id}`, {
        credentials: 'omit',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Publication status request returned HTTP ${response.status}. Check AEM access and CORS.`);
      const fragment = await response.json();
      if (fragment.id !== id || fragment.path !== path
        || !['NEW', 'DRAFT', 'PUBLISHED', 'MODIFIED', 'UNPUBLISHED'].includes(fragment.status)) {
        throw new Error('Invalid Content Fragment publication response.');
      }
      return { _path: path, publicationStatus: fragment.status };
    } catch (error) {
      return { _path: path, publicationStatus: 'UNKNOWN', publicationError: error.message };
    }
  }));
}

export function connectAuthorFaqs(pageUrl, getToken, onStatus) {
  const channel = createPreviewChannel(pageUrl);
  const pending = new Set();
  let closed = false;
  channel.onmessage = async ({ data }) => {
    if (data?.type !== MESSAGE) return;
    if (data.action === 'inventory' && data.response && Array.isArray(data.paths)) {
      try {
        if (data.paths.length) validatePaths(data.paths);
        onStatus('', { state: 'inventory', paths: data.paths });
        const loadedPaths = Array.isArray(data.loadedPaths) ? data.loadedPaths : [];
        const loadedItems = Array.isArray(data.items) ? data.items : [];
        if (loadedPaths.length) {
          validatePaths(loadedPaths);
          if (loadedItems.some(({
            _path: itemPath, _id: itemId, question, answer,
          } = {}) => (
            !loadedPaths.includes(itemPath) || typeof itemId !== 'string'
            || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(itemId)
            || typeof question !== 'string' || typeof answer?.plaintext !== 'string'))) {
            throw new Error('Invalid FAQ content from the preview.');
          }
          onStatus(`Connected with your AEM author sign-in. Loaded ${loadedItems.length} FAQs.`, {
            state: 'connected', paths: loadedPaths, items: loadedItems,
          });
        }
      } catch (error) {
        onStatus(error.message, { state: 'error' });
      }
      return;
    }
    if (data.response || typeof data.requestId !== 'string') return;
    const { requestId, action } = data;
    const reply = (result) => {
      if (!closed) {
        channel.postMessage({
          type: MESSAGE, response: true, requestId, action, ...result,
        });
      }
    };
    if (action === 'connect') {
      reply({});
    } else if (action === 'fetch' && !pending.has(requestId)) {
      pending.add(requestId);
      try {
        validatePaths(data.paths);
        onStatus('Loading FAQ content from AEM author...', { state: 'loading', paths: data.paths });
        const items = await fetchAuthorFaqs(data.paths, getToken());
        reply({ items });
        if (!closed) {
          onStatus(`Connected to AEM author. Loaded ${items.length} FAQs.`, {
            state: 'connected', paths: data.paths, items,
          });
        }
      } catch (error) {
        reply({ error: error.message });
        if (!closed) {
          onStatus(error.message, {
            state: 'error', paths: Array.isArray(data.paths) ? data.paths : [],
          });
        }
      } finally {
        pending.delete(requestId);
      }
    }
  };
  channel.postMessage({ type: MESSAGE, action: 'inventory' });
  return () => {
    if (closed) return;
    closed = true;
    channel.postMessage({ type: MESSAGE, action: 'clear-highlight' });
    channel.onmessage = null;
    channel.close();
  };
}

export function highlightAuthorFragment(path, pageUrl = window.location.href) {
  validatePaths([path]);
  const channel = createPreviewChannel(pageUrl);
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let timeout;
    const finish = (error, count) => {
      clearTimeout(timeout);
      channel.close();
      if (error) reject(error);
      else resolve(count);
    };
    timeout = setTimeout(() => finish(new Error(
      'Open Layout or Split view and reload the preview to highlight Content Fragments.',
    )), 3000);
    channel.onmessage = ({ data }) => {
      if (data?.type !== MESSAGE || !data.response
        || data.action !== 'highlight' || data.requestId !== requestId) return;
      if (typeof data.error === 'string') finish(new Error(data.error));
      else if (!Number.isInteger(data.count) || data.count < 1) {
        finish(new Error('Invalid preview highlight response.'));
      } else finish(null, data.count);
    };
    channel.postMessage({
      type: MESSAGE, action: 'highlight', requestId, path,
    });
  });
}

export class AuthorRequestCancelled extends Error {
  name = 'AuthorRequestCancelled';
}

/**
 * Waits, without a deadline, for the Content Fragment panel to broker the request.
 * @param {string[]} paths Fragment paths
 * @param {string} pageUrl Preview page URL
 * @param {{onWaiting?: Function, isActive?: Function, waitingAfter?: number}} options
 */
export function requestAuthorFaqs(paths, pageUrl = window.location.href, {
  onWaiting = () => {}, isActive = () => true, waitingAfter = 2000,
} = {}) {
  validatePaths(paths);
  const channel = createPreviewChannel(pageUrl);
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let connected = false;
    let waiting;
    let poll;
    let cancel;
    const finish = (error, items) => {
      clearTimeout(waiting);
      clearInterval(poll);
      window.removeEventListener('pagehide', cancel);
      channel.close();
      if (error) reject(error);
      else resolve(items);
    };
    cancel = () => finish(new AuthorRequestCancelled('Author request cancelled.'));
    window.addEventListener('pagehide', cancel, { once: true });
    waiting = setTimeout(() => { if (!connected) onWaiting(); }, waitingAfter);
    const connect = () => {
      if (!isActive()) cancel();
      else if (!connected) channel.postMessage({ type: MESSAGE, action: 'connect', requestId });
    };
    poll = setInterval(connect, 1000);
    channel.onmessage = ({ data }) => {
      if (data?.type !== MESSAGE || !data.response || data.requestId !== requestId) return;
      if (data.action === 'connect' && !connected) {
        connected = true;
        clearInterval(poll);
        channel.postMessage({
          type: MESSAGE, action: 'fetch', requestId, paths,
        });
      } else if (data.action === 'fetch') {
        if (typeof data.error === 'string') finish(new Error(data.error));
        else if (!Array.isArray(data.items)) finish(new Error('Invalid author FAQ response.'));
        else finish(null, data.items);
      }
    };
    connect();
  });
}

/**
 * Loads author FAQs with the browser's AEM author sign-in, falling back to the
 * Content Fragment panel broker. While waiting, returning to the tab (for example
 * after signing in to AEM author elsewhere) retries the sign-in.
 */
export async function loadAuthorFaqs(paths, { onWaiting = () => {}, isActive = () => true } = {}) {
  try {
    const items = await fetchAuthorFaqsWithSession(paths);
    recordAuthorFaqs(paths, items);
    return items;
  } catch (error) {
    if (!isAuthorSessionError(error)) throw error;
  }
  let settled = false;
  return new Promise((resolve, reject) => {
    let retry;
    const finish = (error, items) => {
      if (settled) return;
      settled = true;
      document.removeEventListener('visibilitychange', retry);
      window.removeEventListener('focus', retry);
      if (error) reject(error);
      else resolve(items);
    };
    retry = () => {
      if (settled || document.visibilityState !== 'visible' || !isActive()) return;
      fetchAuthorFaqsWithSession(paths).then((items) => {
        if (settled) return;
        recordAuthorFaqs(paths, items);
        finish(null, items);
      }, (error) => {
        if (!isAuthorSessionError(error)) finish(error);
      });
    };
    document.addEventListener('visibilitychange', retry);
    window.addEventListener('focus', retry);
    requestAuthorFaqs(paths, window.location.href, {
      onWaiting,
      isActive: () => !settled && isActive(),
    }).then((items) => finish(null, items), (error) => finish(error));
  });
}
