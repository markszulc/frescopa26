import { AUTHOR_ORIGIN } from '../../../scripts/content-fragment-author.js';

export default function createPanel(doc = document, onHighlight = null) {
  const fragments = new Map();
  const instance = doc.querySelector('#author-instance');
  instance.href = AUTHOR_ORIGIN;
  instance.textContent = new URL(AUTHOR_ORIGIN).hostname;

  const render = () => {
    const rows = [...fragments].map(([path, fragment]) => {
      const row = doc.createElement('tr');
      row.className = 'fragment-row';
      const content = doc.createElement('td');
      const name = doc.createElement('strong');
      name.className = 'fragment-name';
      name.textContent = fragment.question || path.split('/').pop();
      const locate = async () => {
        const message = doc.querySelector('#highlight-status');
        try {
          const count = await onHighlight(path);
          message.textContent = `Highlighted ${count} ${count === 1 ? 'block' : 'blocks'} in the preview. Highlight fades after 7.5 seconds.`;
        } catch (error) {
          message.textContent = error.message;
        }
        message.hidden = false;
      };
      if (typeof onHighlight === 'function') {
        row.tabIndex = 0;
        row.title = 'Locate referencing blocks in the page preview';
        row.setAttribute('aria-label', `Locate ${name.textContent} in the page preview`);
        row.addEventListener('click', (event) => {
          if (!event.target.closest('a, button')) locate();
        });
        row.addEventListener('keydown', (event) => {
          if (event.target !== row || !['Enter', ' '].includes(event.key)) return;
          event.preventDefault();
          locate();
        });
      }
      const location = doc.createElement('span');
      location.className = 'fragment-path';
      location.textContent = path;
      content.append(name, location);
      const status = doc.createElement('td');
      const light = doc.createElement('span');
      light.className = 'fragment-status';
      light.dataset.state = fragment.status;
      light.setAttribute('role', 'img');
      light.setAttribute('aria-label', fragment.status);
      light.title = fragment.publicationError
        ? `${fragment.status}: ${fragment.publicationError}` : fragment.status;
      status.append(light);
      const action = doc.createElement('td');
      const edit = doc.createElement(fragment.id ? 'a' : 'button');
      edit.textContent = 'Edit';
      if (fragment.id) {
        const editor = new URL('https://experience.adobe.com/');
        editor.searchParams.set('repo', new URL(AUTHOR_ORIGIN).hostname);
        editor.hash = `/@mark-szulc/aem/cf/editor/editor/${encodeURIComponent(fragment.id)}`;
        edit.href = editor.href;
        edit.target = '_blank';
        edit.rel = 'noopener noreferrer';
        edit.setAttribute('aria-label', `Edit ${name.textContent} in the Content Fragment editor (opens in a new tab)`);
      } else {
        edit.disabled = true;
        edit.title = 'Fragment UUID unavailable. Load the fragment successfully to enable editing.';
      }
      action.append(edit);
      row.append(content, status, action);
      return row;
    });
    doc.querySelector('#fragments').replaceChildren(...rows);
    doc.querySelector('#fragment-count').textContent = String(rows.length);
    doc.querySelector('.table-scroll').hidden = !rows.length;
    doc.querySelector('#empty-state').hidden = Boolean(rows.length);
    const publication = doc.querySelector('#publication-status');
    const errors = [...fragments].filter(([, fragment]) => fragment.publicationError);
    publication.textContent = errors.map(([path, fragment]) => `${path}: ${fragment.publicationError}`).join('\n');
    publication.hidden = !errors.length;
  };

  const showStatus = (text, details = {}) => {
    const { state, paths = [], items = [] } = details;
    if (state === 'inventory') {
      const current = new Set(paths);
      fragments.forEach((value, path) => {
        if (!current.has(path)) fragments.delete(path);
      });
      paths.forEach((path) => {
        if (!fragments.has(path)) fragments.set(path, { status: 'Waiting' });
      });
      doc.querySelector('#empty-state').textContent = 'No Content Fragments referenced on this page.';
    } else if (state === 'publication') {
      const labels = {
        PUBLISHED: 'Published',
        MODIFIED: 'Published (modified)',
        NEW: 'Not published',
        DRAFT: 'Not published',
        UNPUBLISHED: 'Not published',
        UNKNOWN: 'Publication unknown',
      };
      items.forEach(({ _path: path, publicationStatus, publicationError }) => {
        const fragment = fragments.get(path);
        if (fragment) {
          fragment.status = labels[publicationStatus] || 'Publication unknown';
          fragment.publicationError = publicationError;
        }
      });
    } else {
      if (text) doc.querySelector('#status').textContent = text;
      if (state) {
        const indicator = doc.querySelector('#connection-state');
        indicator.dataset.state = state;
        indicator.textContent = {
          waiting: 'Waiting', loading: 'Loading', connected: 'Connected', error: 'Connection error',
        }[state];
      }
      const byPath = new Map(items.map(({ _path: path, _id: id, question }) => (
        [path, { id, question }]
      )));
      paths.forEach((path) => {
        if (!fragments.has(path) && state !== 'loading') return;
        const fragment = fragments.get(path) || {};
        let status = { loading: 'Loading', error: 'Failed' }[state];
        if (state === 'connected') status = byPath.has(path) ? 'Checking publication' : 'Not found';
        fragments.set(path, {
          id: byPath.get(path)?.id || (state === 'connected' ? undefined : fragment.id),
          question: byPath.get(path)?.question || fragment.question,
          status,
        });
      });
    }
    render();
  };

  return {
    showStatus,
    setPage: (pageUrl) => { doc.querySelector('#page-path').textContent = new URL(pageUrl).pathname; },
  };
}
