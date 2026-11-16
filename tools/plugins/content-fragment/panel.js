import { AUTHOR_ORIGIN } from '../../../scripts/content-fragment-author.js';

export default function createPanel(doc = document) {
  const fragments = new Map();
  const instance = doc.querySelector('#author-instance');
  instance.href = AUTHOR_ORIGIN;
  instance.textContent = new URL(AUTHOR_ORIGIN).hostname;

  const render = () => {
    const rows = [...fragments].map(([path, fragment]) => {
      const row = doc.createElement('tr');
      const content = doc.createElement('td');
      const name = doc.createElement('span');
      name.className = 'fragment-name';
      name.textContent = fragment.question || path.split('/').pop();
      const location = doc.createElement('span');
      location.className = 'fragment-path';
      location.textContent = path;
      content.append(name, location);
      const status = doc.createElement('td');
      status.textContent = fragment.status;
      const action = doc.createElement('td');
      const edit = doc.createElement('a');
      edit.href = `${AUTHOR_ORIGIN}/editor.html${path}`;
      edit.textContent = 'Edit';
      edit.target = '_blank';
      edit.rel = 'noopener noreferrer';
      edit.setAttribute('aria-label', `Edit ${name.textContent} in AEM author (opens in a new tab)`);
      action.append(edit);
      row.append(content, status, action);
      return row;
    });
    doc.querySelector('#fragments').replaceChildren(...rows);
    doc.querySelector('#fragment-count').textContent = String(rows.length);
    doc.querySelector('.table-scroll').hidden = !rows.length;
    doc.querySelector('#empty-state').hidden = Boolean(rows.length);
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
      doc.querySelector('#empty-state').textContent = 'No content fragments referenced on this page.';
    } else {
      if (text) doc.querySelector('#status').textContent = text;
      if (state) {
        const indicator = doc.querySelector('#connection-state');
        indicator.dataset.state = state;
        indicator.textContent = {
          waiting: 'Waiting', loading: 'Loading', connected: 'Connected', error: 'Connection error',
        }[state];
      }
      const byPath = new Map(items.map(({ _path: path, question }) => [path, question]));
      paths.forEach((path) => {
        if (!fragments.has(path) && state !== 'loading') return;
        const fragment = fragments.get(path) || {};
        let status = { loading: 'Loading', error: 'Failed' }[state];
        if (state === 'connected') status = byPath.has(path) ? 'Loaded' : 'Not found';
        fragments.set(path, {
          question: byPath.get(path) || fragment.question,
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
