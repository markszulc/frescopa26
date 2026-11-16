import createPreviewChannel from './experimentation-channel.js';

const MESSAGE = 'da:content-fragment';
export const AUTHOR_ORIGIN = 'https://author-p137825-e1511252.adobeaemcloud.com';
const FAQ_QUERY = `query getFaqsByPaths($filter: FaqModelFilter) {
  faqList(filter: $filter) {
    items {
      _path
      _id
      question
      answer { plaintext }
    }
  }
}`;

function validatePaths(paths) {
  if (!Array.isArray(paths) || !paths.length || paths.some((path) => (
    typeof path !== 'string' || !/^\/content\/dam\/[A-Za-z0-9._/-]+$/.test(path)
    || path.split('/').slice(3).some((part) => !part || part === '.' || part === '..')
  ))) {
    throw new Error('Expected FAQ content fragment paths under /content/dam/.');
  }
}

let inventoryChannel;
const fragmentPaths = new WeakMap();

export function registerAuthorFragments(block, paths) {
  validatePaths(paths);
  fragmentPaths.set(block, paths);
  block.dataset.contentFragmentPaths = '';
  if (inventoryChannel) return;
  inventoryChannel = createPreviewChannel(window.location.href);
  let lastPaths;
  const publish = (force = false) => {
    const fragments = [...document.querySelectorAll('.content-fragment[data-content-fragment-paths]')]
      .flatMap((element) => fragmentPaths.get(element) || []);
    const pathsOnPage = [...new Set(fragments)];
    const snapshot = JSON.stringify(pathsOnPage);
    if (!force && snapshot === lastPaths) return;
    lastPaths = snapshot;
    inventoryChannel.postMessage({
      type: MESSAGE, action: 'inventory', response: true, paths: pathsOnPage,
    });
  };
  inventoryChannel.onmessage = ({ data }) => {
    if (data?.type === MESSAGE && data.action === 'inventory' && !data.response) publish(true);
  };
  const observer = new MutationObserver(() => publish());
  observer.observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['data-content-fragment-paths'],
  });
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    inventoryChannel.close();
    inventoryChannel = undefined;
  }, { once: true });
  publish();
}

export async function fetchAuthorFaqs(paths, accessToken) {
  validatePaths(paths);
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
  const response = await fetch(`${AUTHOR_ORIGIN}/content/_cq_graphql/frescopa/endpoint.json`, {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    headers: { ...headers, 'Content-Type': 'application/json', 'CSRF-Token': token },
    body: JSON.stringify({
      query: FAQ_QUERY,
      variables: {
        filter: {
          _path: {
            _logOp: 'OR',
            _expressions: [...new Set(paths)].map((value) => ({ value, _operator: 'EQUALS' })),
          },
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Author FAQ request returned HTTP ${response.status}. Check DA sign-in and AEM permissions.`);
  }
  const json = await response.json();
  const items = json?.data?.faqList?.items;
  if (json?.errors?.length || !Array.isArray(items) || items.some((item) => {
    if (!item) return true;
    const {
      _path: path, _id: id, question, answer,
    } = item;
    return typeof path !== 'string' || typeof question !== 'string'
      || typeof id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
      || typeof answer?.plaintext !== 'string';
  })) {
    throw new Error('Invalid author FAQ response.');
  }
  const byPath = new Map(items.map(({
    _path: path, _id: id, question, answer,
  }) => (
    [path, {
      _path: path, _id: id, question, answer: { plaintext: answer.plaintext },
    }]
  )));
  return [...new Set(paths)].filter((path) => byPath.has(path)).map((path) => byPath.get(path));
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
    closed = true;
    channel.onmessage = null;
    channel.close();
  };
}

export function requestAuthorFaqs(paths, pageUrl = window.location.href) {
  validatePaths(paths);
  const channel = createPreviewChannel(pageUrl);
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let connected = false;
    let timeout;
    let poll;
    const finish = (error, items) => {
      clearTimeout(timeout);
      clearInterval(poll);
      channel.close();
      if (error) reject(error);
      else resolve(items);
    };
    timeout = setTimeout(() => finish(new Error(
      'Open the Content Fragment panel in Workspace on this code branch, then retry.',
    )), 15000);
    const connect = () => channel.postMessage({
      type: MESSAGE, action: 'connect', requestId,
    });
    poll = setInterval(connect, 500);
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
