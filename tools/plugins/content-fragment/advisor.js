import { loadScript } from '../../../scripts/aem.js';
import { AUTHOR_ORIGIN, validatePaths } from '../../../scripts/content-fragment-author.js';
import { readPaths } from '../../../blocks/content-fragment/content-fragment.js';

const SELECTOR_URL = 'https://experience.adobe.com/solutions/CQ-assets-selectors/static-assets/resources/assets-selectors.js';

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
  const container = doc.querySelector('#content-advisor');
  const message = doc.querySelector('#insert-status');
  let snapshot;
  let closed = false;
  let busy = false;
  const unsubscribe = host.actions.subscribeLiveDocument((value) => { snapshot = value; });
  button.disabled = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    message.textContent = 'Loading Adobe Content Advisor...';
    try {
      await loadScript(SELECTOR_URL);
      if (closed) return;
      const selectors = window.PureJSSelectors;
      if (typeof selectors?.renderContentAdvisor !== 'function') {
        throw new Error('Adobe Content Advisor is unavailable. Reopen the panel and try again.');
      }
      const onClose = () => {
        container.hidden = true;
        closeButton.hidden = true;
        message.textContent = '';
        button.disabled = false;
      };
      closeButton.onclick = onClose;
      const onSubmit = async ({ contentFragments, repoId }) => {
        if (closed || busy) return;
        busy = true;
        try {
          if (repoId && repoId !== new URL(AUTHOR_ORIGIN).hostname) {
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
          message.textContent = error.message;
        } finally {
          busy = false;
        }
      };
      container.hidden = false;
      closeButton.hidden = false;
      selectors.renderContentAdvisor(container, {
        imsToken: getToken(),
        repositoryId: new URL(AUTHOR_ORIGIN).hostname,
        aemTierType: ['author'],
        featureSet: ['advisor', 'content-fragments'],
        defaultSelectedFeature: 'content-fragments',
        noWrap: true,
        onClose,
        handleSelection: () => {
          message.textContent = 'Choose Content Fragments in Content Advisor to insert fragment paths, not media assets.';
        },
        contentFragmentSelectorProps: {
          imsToken: getToken(),
          repoId: new URL(AUTHOR_ORIGIN).hostname,
          filters: { folder: '/content/dam/frescopa/en/faqs' },
          selectionType: 'multiple',
          onSubmit,
          onDismiss: onClose,
        },
      });
      message.textContent = 'Choose Content Fragments, browse, then confirm your selection to place paths.';
    } catch (error) {
      if (!window.PureJSSelectors?.renderContentAdvisor) {
        document.head.querySelector(`script[src="${SELECTOR_URL}"]`)?.remove();
      }
      message.textContent = error.message || 'Could not load Adobe Content Advisor. Check network access and try again.';
      button.disabled = false;
      closeButton.hidden = true;
    }
  });
  return () => {
    closed = true;
    unsubscribe();
  };
}
