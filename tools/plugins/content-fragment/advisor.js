import { loadScript } from '../../../scripts/aem.js';
import { AUTHOR_ORIGIN, validatePaths } from '../../../scripts/content-fragment-author.js';
import { readPaths } from '../../../blocks/content-fragment/content-fragment.js';

const SELECTOR_URL = 'https://experience.adobe.com/solutions/CQ-assets-selectors/static-assets/resources/assets-selectors.js';
const REPOSITORY_ID = new URL(AUTHOR_ORIGIN).hostname;

export async function fetchAdvisorOrganization(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Sign in to DA and reopen Content Advisor.');
  }
  const response = await fetch('https://aem-discovery.adobe.io/repositories', {
    credentials: 'omit',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}`, 'x-api-key': 'exc_app' },
  });
  if (!response.ok) throw new Error(`AEM repository discovery returned HTTP ${response.status}. Check your AEM organization access.`);
  const json = await response.json();
  if (!Array.isArray(json.children)) throw new Error('Invalid AEM repository discovery response.');
  const repository = json.children
    .map((child) => {
      const { _embedded: embedded } = child || {};
      return embedded?.['http://ns.adobe.com/adobecloud/rel/primary'];
    })
    .find((entry) => entry?.['repo:repositoryId'] === REPOSITORY_ID);
  const owner = repository?.['repo:owner'];
  if (owner?.type !== 'org' || !/^[a-z0-9]+@AdobeOrg$/i.test(owner.id)) {
    throw new Error('Could not determine the organization owning this AEM repository. Check repository discovery access and retry.');
  }
  return owner.id;
}

export async function placeFragmentPaths(actions, snapshot, paths) {
  validatePaths(paths);
  if (!snapshot || snapshot.editable !== true) {
    throw new Error('The editor is not ready or is read-only. Select editable content and try again.');
  }
  const { html, selection: { blockIndex } } = snapshot;
  const unique = [...new Set(paths)];
  if (blockIndex === null) {
    actions.sendText(unique.join('\n'));
    return 'Sent fragment paths to the editor at the cursor.';
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const block = doc.querySelectorAll('div[data-block-index]')[blockIndex];
  if (!block?.classList.contains('content-fragment')) {
    throw new Error('Select a Content Fragment block, or place the cursor in text to paste a path. Other blocks are not changed.');
  }
  if ([...block.children].some((row) => row.children.length !== 1)) {
    throw new Error('Select a one-column, path-based Content Fragment block.');
  }
  const existing = readPaths(block);
  if (existing.length) validatePaths(existing);
  const combined = [...new Set([...existing, ...unique])];
  block.replaceChildren(...combined.map((path) => {
    const row = doc.createElement('div');
    const cell = doc.createElement('div');
    cell.textContent = path;
    row.append(cell);
    return row;
  }));
  block.removeAttribute('data-block-index');
  const result = await actions.sendHTML(block.outerHTML, {
    replace: true,
    expected: { html, blockIndex },
  });
  if (!result?.ok) {
    throw new Error(`Could not place fragment paths (${result?.error || 'invalid-response'}). Reselect the block and try again.`);
  }
  return 'Added fragment paths to the selected Content Fragment block.';
}

export default function connectContentAdvisor(doc, host, getToken) {
  const button = doc.querySelector('#browse-fragments');
  const closeButton = doc.querySelector('#close-advisor');
  const insertButton = doc.querySelector('#insert-fragments');
  const footer = doc.querySelector('#advisor-actions');
  const container = doc.querySelector('#content-advisor');
  const message = doc.querySelector('#insert-status');
  let snapshot;
  let closed = false;
  let busy = false;
  let selected;
  const unsubscribe = host.actions.subscribeLiveDocument((value) => { snapshot = value; });
  button.disabled = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    footer.hidden = false;
    closeButton.hidden = false;
    insertButton.disabled = true;
    selected = undefined;
    message.textContent = 'Loading Adobe Content Advisor...';
    let cancelled = false;
    const onClose = () => {
      cancelled = true;
      container.hidden = true;
      closeButton.hidden = true;
      footer.hidden = true;
      button.hidden = false;
      message.textContent = '';
      button.disabled = false;
      host.actions.closeLibrary();
    };
    closeButton.onclick = onClose;
    try {
      const [imsOrg] = await Promise.all([
        fetchAdvisorOrganization(getToken()),
        loadScript(SELECTOR_URL),
      ]);
      if (closed || cancelled) return;
      const selectors = window.PureJSSelectors;
      if (typeof selectors?.renderContentAdvisor !== 'function') {
        throw new Error('Adobe Content Advisor is unavailable. Reopen the panel and try again.');
      }
      const onSubmit = async ({ contentFragments, repoId }) => {
        if (closed || busy) return;
        busy = true;
        insertButton.disabled = true;
        closeButton.disabled = true;
        try {
          if (repoId && repoId !== REPOSITORY_ID) {
            throw new Error('Select fragments from the configured AEM author repository.');
          }
          if (!Array.isArray(contentFragments) || contentFragments.some((fragment) => (
            !fragment || fragment.variations?.some((variation) => variation !== 'master')
          ))) {
            throw new Error('Select main-variation Content Fragments to insert paths.');
          }
          const paths = contentFragments.map((fragment) => fragment.path);
          const text = await placeFragmentPaths(host.actions, snapshot, paths);
          if (!closed) {
            onClose();
            message.textContent = text;
          }
        } catch (error) {
          if (closed || cancelled) return;
          message.textContent = error.message;
        } finally {
          busy = false;
          insertButton.disabled = !selected?.contentFragments?.length;
          closeButton.disabled = false;
        }
      };
      const onSelectionChange = (value) => {
        selected = value;
        const count = Array.isArray(value?.contentFragments) ? value.contentFragments.length : 0;
        insertButton.textContent = count ? `Insert selected fragments (${count})` : 'Insert selected fragments';
        insertButton.disabled = busy || !count;
      };
      insertButton.onclick = () => onSubmit(selected);
      container.hidden = false;
      button.hidden = true;
      closeButton.hidden = false;
      selectors.renderContentAdvisor(container, {
        imsToken: getToken(),
        imsOrg,
        repositoryId: REPOSITORY_ID,
        aemTierType: ['author'],
        featureSet: ['advisor', 'content-fragments'],
        defaultSelectedFeature: 'content-fragments',
        noWrap: true,
        onClose,
        handleSelection: () => {
          onSelectionChange(undefined);
          message.textContent = 'Choose Content Fragments in Content Advisor to insert fragment paths, not media assets.';
        },
        onSwitchFeature: () => onSelectionChange(undefined),
        contentFragmentSelectorProps: {
          imsToken: getToken(),
          orgId: imsOrg,
          repoId: REPOSITORY_ID,
          filters: { folder: '/content/dam/frescopa/en/faqs' },
          selectionType: 'multiple',
          onSelectionChange,
          onSubmit,
          onDismiss: onClose,
        },
      });
      message.textContent = 'Select Content Fragments, then use Insert selected fragments below.';
    } catch (error) {
      if (!window.PureJSSelectors?.renderContentAdvisor) {
        document.head.querySelector(`script[src="${SELECTOR_URL}"]`)?.remove();
      }
      message.textContent = error.message || 'Could not load Adobe Content Advisor. Check network access and try again.';
      button.disabled = false;
      button.hidden = false;
    }
  });
  return () => {
    closed = true;
    unsubscribe();
  };
}
