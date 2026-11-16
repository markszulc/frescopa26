import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import {
  connectAuthorFaqs, fetchAuthorFragmentStatuses, highlightAuthorFragment,
} from '../../../scripts/content-fragment-author.js';
import { getPageContext } from '../contextual-experimentation/context.js';
import createPanel from './panel.js';
import connectContentAdvisor from './advisor.js';

let pageUrl;
const { showStatus, setPage } = createPanel(
  document,
  (path) => highlightAuthorFragment(path, pageUrl),
);

async function init() {
  if (window.parent === window || window.location.ancestorOrigins?.[0] !== 'https://da.live') {
    throw new Error('Open Content Fragment from the Experience Workspace tool panel.');
  }
  let token;
  const updateToken = (event) => {
    if (!event.data?.ready && !Object.hasOwn(event.data || {}, 'token')) return;
    if (event.origin !== 'https://da.live' || event.source !== window.parent) {
      event.stopImmediatePropagation();
      return;
    }
    if (typeof event.data.token === 'string') token = event.data.token;
  };
  window.addEventListener('message', updateToken, true);
  const host = await DA_SDK;
  token = token || host.token;
  if (typeof token !== 'string' || !token.trim()) {
    window.removeEventListener('message', updateToken, true);
    throw new Error('Sign in to DA, then reopen this panel.');
  }
  const page = getPageContext(host.context);
  pageUrl = page.pageUrl;
  setPage(page.pageUrl);
  let closed = false;
  const generations = new Map();
  const disconnect = connectAuthorFaqs(page.pageUrl, () => token, (text, details) => {
    showStatus(text, details);
    if (details.state === 'loading') {
      details.paths.forEach((path) => generations.set(path, (generations.get(path) || 0) + 1));
    }
    if (details.state !== 'connected') return;
    const current = new Map(details.paths.map((path) => [path, generations.get(path)]));
    fetchAuthorFragmentStatuses(details.items, token).then((items) => {
      if (!closed) {
        showStatus('', {
          state: 'publication',
          items: items.filter(({ _path: path }) => current.get(path) === generations.get(path)),
        });
      }
    });
  });
  const disconnectAdvisor = connectContentAdvisor(document, host, () => token);
  window.addEventListener('pagehide', () => {
    closed = true;
    disconnect();
    disconnectAdvisor();
    token = undefined;
    window.removeEventListener('message', updateToken, true);
  }, { once: true });
  showStatus('Ready. Waiting for FAQ requests from this page. Use Layout or Split view.', { state: 'waiting' });
}

init().catch((error) => showStatus(error.message, { state: 'error' }));
