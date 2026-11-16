import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { connectAuthorFaqs } from '../../../scripts/content-fragment-author.js';
import { getPageContext } from '../contextual-experimentation/context.js';
import createPanel from './panel.js';

const { showStatus, setPage } = createPanel();

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
  setPage(page.pageUrl);
  const disconnect = connectAuthorFaqs(page.pageUrl, () => token, showStatus);
  window.addEventListener('pagehide', () => {
    disconnect();
    token = undefined;
    window.removeEventListener('message', updateToken, true);
  }, { once: true });
  showStatus('Ready. Waiting for FAQ requests from this page. Use Layout or Split view.', { state: 'waiting' });
}

init().catch((error) => showStatus(error.message, { state: 'error' }));
