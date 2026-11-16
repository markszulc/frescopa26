import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import {
  connectAuthorFaqs, fetchAuthorFragmentStatuses, highlightAuthorFragment,
} from '../../../scripts/content-fragment-author.js';
import { getPageContext } from '../contextual-experimentation/context.js';
import createPanel from './panel.js';
import connectContentAdvisor from './advisor.js';
import createFragmentManagement from './management.js';

let pageUrl;
const {
  showStatus, setPage, enableAuthoring, disconnect: disconnectEditors,
} = createPanel(
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
  const advisorMode = new URLSearchParams(window.location.search).get('advisor') === '1';
  let closed = false;
  if (!advisorMode) {
    const usagePage = new URL('https://da.live/canvas');
    usagePage.hash = `/${page.org}/${page.site}${new URL(page.pageUrl).pathname}`;
    enableAuthoring(createFragmentManagement(() => token, usagePage.href), async ({ id, path }) => {
      const items = await fetchAuthorFragmentStatuses([{ _id: id, _path: path }], token);
      if (!closed) showStatus('', { state: 'publication', items });
    });
  }
  const generations = new Map();
  const reportStatus = (text, details) => {
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
  };
  const disconnect = advisorMode ? null : connectAuthorFaqs(pageUrl, () => token, reportStatus);
  let disconnectAdvisor;
  if (advisorMode) {
    document.body.classList.add('content-advisor-dialog');
    disconnectAdvisor = connectContentAdvisor(document, host, () => token);
    document.querySelector('#browse-fragments').click();
  } else {
    const browse = document.querySelector('#browse-fragments');
    browse.disabled = false;
    browse.addEventListener('click', () => {
      host.actions.showPanel('content-advisor');
      document.querySelector('#insert-status').textContent = 'Opening Content Advisor in a Workspace dialog. If it does not open, register the Content Advisor fullsize-dialog library entry in DA configuration.';
    });
  }
  window.addEventListener('pagehide', () => {
    closed = true;
    disconnect?.();
    disconnectAdvisor?.();
    disconnectEditors();
    token = undefined;
    window.removeEventListener('message', updateToken, true);
  }, { once: true });
  showStatus('Ready. Waiting for FAQ requests from this page. Use Layout or Split view.', { state: 'waiting' });
}

init().catch((error) => showStatus(error.message, { state: 'error' }));
