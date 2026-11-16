import { AUTHOR_ORIGIN } from '../../../scripts/content-fragment-author.js';
import createFragmentEditor from './editor.js';

export default function createPanel(doc = document, onHighlight = null) {
  const fragments = new Map();
  const editors = new Map();
  let management;
  let onSaved;
  let expandedPath;
  const instance = doc.querySelector('#author-instance');
  instance.href = AUTHOR_ORIGIN;
  instance.textContent = new URL(AUTHOR_ORIGIN).hostname;

  const render = () => {
    const focused = doc.activeElement;
    const selection = typeof focused?.selectionStart === 'number'
      ? [focused.selectionStart, focused.selectionEnd] : null;
    const focusedPath = doc.activeElement?.classList.contains('fragment-toggle')
      ? doc.activeElement.closest('.fragment-row').dataset.path : undefined;
    editors.forEach((editor, path) => {
      if (editor.id !== fragments.get(path)?.id) {
        editor.disconnect();
        editors.delete(path);
      }
    });
    const rows = [...fragments].flatMap(([path, fragment], index) => {
      const row = doc.createElement('tr');
      row.className = 'fragment-row';
      row.dataset.path = path;
      const content = doc.createElement('td');
      const toggle = doc.createElement('button');
      toggle.type = 'button';
      toggle.className = 'fragment-toggle';
      toggle.id = `fragment-toggle-${index}`;
      toggle.setAttribute('aria-expanded', String(expandedPath === path));
      toggle.setAttribute('aria-controls', `fragment-details-${index}`);
      const name = doc.createElement('strong');
      name.className = 'fragment-name';
      name.textContent = fragment.question || path.split('/').pop();
      toggle.append(name);
      const detailsRow = doc.createElement('tr');
      detailsRow.className = 'fragment-details-row';
      detailsRow.hidden = expandedPath !== path;
      const detailsCell = doc.createElement('td');
      detailsCell.colSpan = 3;
      const details = doc.createElement('div');
      details.id = `fragment-details-${index}`;
      details.setAttribute('role', 'region');
      details.setAttribute('aria-labelledby', toggle.id);
      const fields = doc.createElement('dl');
      if (management && fragment.id && !editors.has(path)) {
        const saved = (snapshot) => {
          const current = fragments.get(path);
          if (!current || current.id !== fragment.id) return;
          if (snapshot.variation === 'master') {
            const values = new Map(snapshot.data.fields
              .map((field) => [field.name, field.values]));
            current.question = values.get('question')?.[0] ?? current.question;
            current.answer = values.get('answer')?.[0] ?? current.answer;
          }
          render();
          onSaved({ id: fragment.id, path });
        };
        const reference = { id: fragment.id, path };
        const editor = createFragmentEditor(
          doc,
          reference,
          management,
          saved,
          () => onSaved(reference),
        );
        editors.set(path, { ...editor, id: fragment.id });
      }
      const editor = editors.get(path);
      const addField = (label, value, list = fields) => {
        const term = doc.createElement('dt');
        term.textContent = label;
        const definition = doc.createElement('dd');
        definition.textContent = value;
        list.append(term, definition);
      };
      const info = doc.createElement('button');
      info.type = 'button';
      info.className = 'fragment-info';
      info.textContent = 'i';
      info.title = 'Fragment information';
      info.setAttribute('aria-label', 'Fragment information');
      info.setAttribute('aria-expanded', 'false');
      const popover = doc.createElement('div');
      popover.id = `fragment-info-${index}`;
      popover.className = 'fragment-info-popover';
      popover.setAttribute('popover', 'auto');
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-label', 'Fragment information');
      info.setAttribute('popovertarget', popover.id);
      info.setAttribute('aria-controls', popover.id);
      info.setAttribute('aria-haspopup', 'dialog');
      const metadata = doc.createElement('dl');
      addField('Publication status', fragment.status, metadata);
      if (fragment.publicationError) addField('Publication error', fragment.publicationError, metadata);
      if (fragment.id) addField('Fragment ID', fragment.id, metadata);
      popover.append(metadata);
      popover.addEventListener('beforetoggle', (event) => {
        const open = event.newState === 'open';
        info.setAttribute('aria-expanded', String(open));
        if (!open) return;
        const rect = info.getBoundingClientRect();
        const view = doc.defaultView;
        const width = Math.min(280, view.innerWidth - 32);
        const top = Math.max(16, Math.min(rect.bottom + 8, view.innerHeight - 180));
        popover.style.left = `${Math.max(16, Math.min(rect.left, view.innerWidth - width - 16))}px`;
        popover.style.top = `${top}px`;
        popover.style.maxHeight = `${Math.max(0, view.innerHeight - top - 16)}px`;
      });
      if (!editor && fragment.question !== undefined) addField('Question', fragment.question);
      if (!editor && fragment.answer !== undefined) addField('Answer', fragment.answer);
      if (!editor && fragment.question === undefined && fragment.answer === undefined) {
        addField('Fields', 'Fragment fields are not available. Load the fragment successfully to view them.');
      }
      details.append(info, popover, fields);
      if (editor) {
        details.append(editor.element);
        if (expandedPath === path) editor.open();
      }
      detailsCell.append(details);
      detailsRow.append(detailsCell);
      const locate = async () => {
        const message = doc.querySelector('#highlight-status');
        try {
          await onHighlight(path);
          message.textContent = '';
          message.hidden = true;
        } catch (error) {
          message.textContent = error.message;
          message.hidden = false;
        }
      };
      const activate = () => {
        expandedPath = expandedPath === path ? undefined : path;
        doc.querySelectorAll('.fragment-row').forEach((header) => {
          const expanded = header.dataset.path === expandedPath;
          header.querySelector('.fragment-toggle').setAttribute('aria-expanded', String(expanded));
          header.nextElementSibling.hidden = !expanded;
        });
        if (expandedPath === path) editor?.open();
        if (typeof onHighlight === 'function') locate();
      };
      toggle.addEventListener('click', activate);
      row.addEventListener('click', (event) => {
        if (!event.target.closest('a, button')) activate();
      });
      const location = doc.createElement('span');
      location.className = 'fragment-path';
      location.textContent = path;
      content.append(toggle, location);
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
        const editorUrl = new URL('https://experience.adobe.com/');
        editorUrl.searchParams.set('repo', new URL(AUTHOR_ORIGIN).hostname);
        editorUrl.hash = `/@mark-szulc/aem/cf/editor/editor/${encodeURIComponent(fragment.id)}`;
        edit.href = editorUrl.href;
        edit.target = '_blank';
        edit.rel = 'noopener noreferrer';
        edit.setAttribute('aria-label', `Edit ${name.textContent} in the Content Fragment editor (opens in a new tab)`);
      } else {
        edit.disabled = true;
        edit.title = 'Fragment UUID unavailable. Load the fragment successfully to enable editing.';
      }
      action.append(edit);
      row.append(content, status, action);
      return [row, detailsRow];
    });
    doc.querySelector('#fragments').replaceChildren(...rows);
    doc.querySelector('#fragment-count').textContent = String(fragments.size);
    doc.querySelector('.table-scroll').hidden = !rows.length;
    doc.querySelector('#empty-state').hidden = Boolean(rows.length);
    const publication = doc.querySelector('#publication-status');
    const errors = [...fragments].filter(([, fragment]) => fragment.publicationError);
    publication.textContent = errors.map(([path, fragment]) => `${path}: ${fragment.publicationError}`).join('\n');
    publication.hidden = !errors.length;
    if (focused && doc.contains(focused)) {
      focused.focus({ preventScroll: true });
      if (selection) focused.setSelectionRange(...selection);
    } else if (focusedPath) {
      [...doc.querySelectorAll('.fragment-row')]
        .find((row) => row.dataset.path === focusedPath)?.querySelector('.fragment-toggle').focus();
    }
  };

  const showStatus = (text, details = {}) => {
    const { state, paths = [], items = [] } = details;
    if (state === 'inventory') {
      const current = new Set(paths);
      fragments.forEach((value, path) => {
        if (!current.has(path)) fragments.delete(path);
      });
      if (!current.has(expandedPath)) expandedPath = undefined;
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
      const byPath = new Map(items.map(({
        _path: path, _id: id, question, answer,
      }) => (
        [path, { id, question, answer: answer?.plaintext }]
      )));
      paths.forEach((path) => {
        if (!fragments.has(path) && state !== 'loading') return;
        const fragment = fragments.get(path) || {};
        let status = { loading: 'Loading', error: 'Failed' }[state];
        if (state === 'connected') status = byPath.has(path) ? 'Checking publication' : 'Not found';
        fragments.set(path, {
          id: byPath.get(path)?.id || (state === 'connected' ? undefined : fragment.id),
          question: byPath.get(path)?.question || fragment.question,
          answer: byPath.get(path)?.answer ?? fragment.answer,
          status,
        });
      });
    }
    render();
  };

  return {
    showStatus,
    setPage: (pageUrl) => { doc.querySelector('#page-path').textContent = new URL(pageUrl).pathname; },
    enableAuthoring: (api, afterSave) => {
      management = api;
      onSaved = afterSave;
      render();
    },
    disconnect: () => { editors.forEach((editor) => editor.disconnect()); },
  };
}
