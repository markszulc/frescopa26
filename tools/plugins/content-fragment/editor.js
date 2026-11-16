import { isEditableField } from './management.js';

function createIconButton(doc, label, path) {
  const button = doc.createElement('button');
  button.className = 'fragment-icon-button';
  button.title = label;
  button.setAttribute('aria-label', label);
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const shape = doc.createElementNS(svg.namespaceURI, 'path');
  shape.setAttribute('d', path);
  svg.append(shape);
  button.append(svg);
  return button;
}

export default function createFragmentEditor(doc, reference, api, onSaved, onUsage = () => {}) {
  const element = doc.createElement('section');
  element.className = 'fragment-editor';
  element.setAttribute('aria-label', 'Edit Content Fragment fields');
  const usage = doc.createElement('p');
  usage.setAttribute('role', 'status');
  const retryUsage = doc.createElement('button');
  retryUsage.type = 'button';
  retryUsage.textContent = 'Retry page usage';
  const content = doc.createElement('div');
  let active = true;
  const trackUsage = async () => {
    retryUsage.hidden = true;
    usage.textContent = 'Recording page usage...';
    try {
      await api.recordUsage(reference);
      usage.textContent = '';
      usage.hidden = true;
      if (active) onUsage();
    } catch (error) {
      usage.textContent = `Page usage not recorded: ${error.message}`;
      usage.hidden = false;
      retryUsage.hidden = false;
    }
  };
  let usageRequest = trackUsage();
  retryUsage.addEventListener('click', () => { usageRequest = trackUsage(); });
  element.append(content, usage, retryUsage);
  const drafts = new Map();
  let options;
  let selected = 'master';
  let pending = false;
  let loaded = false;
  let message = '';
  let load;
  const createDraft = (snapshot) => ({
    snapshot,
    values: new Map(snapshot.data.fields.filter(isEditableField)
      .map((field) => [field.name, field.values[0] ?? ''])),
  });
  const render = () => {
    const label = doc.createElement('label');
    label.textContent = 'Variation (view and edit only)';
    const select = doc.createElement('select');
    select.disabled = pending || !options;
    [{ name: 'master', title: 'Main' }, ...(options || [])].forEach(({ name, title }) => {
      const option = doc.createElement('option');
      option.value = name;
      option.textContent = title || name;
      option.selected = selected === name;
      select.append(option);
    });
    label.append(select);
    const form = doc.createElement('form');
    const draft = drafts.get(selected);
    const readOnly = Boolean(draft && !draft.snapshot.etag);
    const notice = doc.createElement('p');
    notice.id = `fragment-readonly-${reference.id}`;
    notice.className = 'fragment-readonly';
    notice.setAttribute('role', 'status');
    notice.hidden = !readOnly;
    notice.textContent = 'Read-only: AEM is not exposing the ETag header required for safe saves. '
      + 'An AEM administrator must add Access-Control-Expose-Headers: ETag to its CORS policy. '
      + 'For now, use the Edit link above to make changes in AEM.';
    const saveButton = createIconButton(doc, 'Save to AEM', 'M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8');
    saveButton.type = 'submit';
    const canSave = () => !pending && Boolean(draft?.snapshot.etag)
      && [...(draft?.values || [])].some(([name, value]) => (
        value !== (draft.snapshot.data.fields.find((field) => field.name === name).values[0] ?? '')
      ));
    if (draft) {
      draft.snapshot.data.fields.forEach((field) => {
        const fieldLabel = doc.createElement('label');
        fieldLabel.textContent = field.name;
        if (isEditableField(field)) {
          const input = doc.createElement(field.type === 'long-text' ? 'textarea' : 'input');
          input.name = field.name;
          if (field.type === 'long-text') input.rows = 5;
          else input.type = 'text';
          input.value = draft.values.get(field.name);
          input.disabled = pending;
          input.readOnly = readOnly;
          if (readOnly) input.setAttribute('aria-describedby', notice.id);
          input.addEventListener('input', () => {
            draft.values.set(field.name, input.value);
            saveButton.disabled = !canSave();
          });
          fieldLabel.append(input);
          if (field.mimeType && field.mimeType !== 'text/plain') {
            const hint = doc.createElement('small');
            hint.textContent = `Source format: ${field.mimeType}. Formatting is preserved as source.`;
            fieldLabel.append(hint);
          }
        } else {
          const value = doc.createElement('pre');
          value.textContent = JSON.stringify(field.values ?? field, null, 2);
          const hint = doc.createElement('small');
          hint.textContent = field.locked ? 'Locked by AEM.' : 'Use the full AEM editor for this field type.';
          fieldLabel.append(value, hint);
        }
        form.append(fieldLabel);
      });
    }
    saveButton.disabled = !canSave();
    const reload = createIconButton(doc, 'Discard edits and reload', 'M3 10a9 9 0 1 1 2 8M3 4v6h6');
    reload.type = 'button';
    reload.disabled = pending;
    const status = doc.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = message || (readOnly ? ''
      : 'Changes are saved to AEM author only, not published. Reload the page preview after saving.');
    status.hidden = !status.textContent;
    form.append(saveButton, reload);
    content.replaceChildren(notice, label, form, status);
    select.addEventListener('change', () => {
      selected = select.value;
      message = '';
      load();
    });
    reload.addEventListener('click', () => {
      drafts.delete(selected);
      options = undefined;
      message = '';
      load();
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!canSave()) return;
      pending = true;
      message = 'Saving to AEM author...';
      render();
      try {
        await usageRequest;
        const snapshot = await api.save(
          reference,
          draft.snapshot,
          [...draft.values].map(([name, value]) => ({ name, value })),
        );
        drafts.set(selected, createDraft(snapshot));
        message = 'Saved to AEM author. Not published. Reload the page preview to see the changes.';
        if (active) onSaved(snapshot);
      } catch (error) {
        message = error.message;
      } finally {
        pending = false;
        if (active) render();
      }
    });
  };
  load = async () => {
    if (pending || !active) return;
    loaded = true;
    pending = true;
    message = 'Loading fields and variations...';
    render();
    try {
      await usageRequest;
      const [snapshot, variations] = await Promise.all([
        drafts.has(selected) ? drafts.get(selected).snapshot : api.read(reference, selected),
        options || api.variations(reference),
      ]);
      if (!drafts.has(selected)) drafts.set(selected, createDraft(snapshot));
      options = variations;
      message = '';
    } catch (error) {
      message = error.message;
    } finally {
      pending = false;
      if (active) render();
    }
  };
  return {
    element,
    open: () => { if (!loaded) load(); },
    disconnect: () => { active = false; },
  };
}
