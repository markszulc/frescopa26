import { buildPreviewLinks } from './qa-links.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function safeUrl(value, allowLoopback = false) {
  try {
    const url = new URL(value);
    const local = allowLoopback && url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (url.protocol === 'https:' || local) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function link(label, url, allowLoopback = false) {
  const href = safeUrl(url, allowLoopback);
  return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
}

function editorUrl(page, path) {
  const url = safeUrl(page.editorUrl);
  if (!url || path === page.path) return url;
  const editor = new URL(url);
  if (editor.origin !== 'https://da.live' || editor.pathname !== '/edit') return '';
  editor.hash = `/${page.org}/${page.repo}${path}`;
  return editor.href;
}

function initialDraft(snapshot) {
  return snapshot.experiment ? { ...snapshot.experiment } : {
    id: '', challengerPath: '', challengerPercentage: 50, status: 'inactive',
  };
}

function displayDate(value) {
  if (!value) return 'Not set';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

/**
 * DA rail presentation. Source operations and QA assignments stay in their adapters.
 * @param {HTMLElement} root
 * @param {object} adapter
 * @returns {Promise<{destroy: Function}>}
 */
export default async function mountExperimentation(root, adapter) {
  const state = {
    snapshot: null,
    draft: null,
    variant: null,
    view: 'overview',
    tab: 'variants',
    selected: 'control',
    busy: false,
    error: '',
    notice: '',
    review: '',
    dirty: false,
    needsReload: false,
    handoff: null,
    handoffVisible: false,
    discard: '',
    qaUrl: '',
    qa: null,
    previewOpen: false,
    previewSetup: false,
    focusReturn: '',
  };

  function unavailable(operation) {
    if (state.needsReload) return 'Reload the saved page before another action. The last source review is no longer current.';
    if (state.snapshot.experiment?.status === 'active') return 'Active experiments are read-only in this demo.';
    if (state.handoff) return 'Complete the pending native handoff before preparing another operation.';
    if (operation === 'createVariant') {
      return typeof adapter.prepareVariant === 'function' && typeof adapter.verifyVariant === 'function'
        ? '' : 'Native duplication handoff is not available in this adapter.';
    }
    return typeof adapter.prepareExperiment === 'function' && typeof adapter.verifyExperiment === 'function'
      ? '' : 'Native metadata handoff is not available in this adapter.';
  }

  function previewReason() {
    if (state.handoff) return 'Finish the pending native handoff before previewing.';
    return state.snapshot.experiment ? '' : 'Save in DA and verify the experiment before previewing.';
  }

  function messages() {
    return `${state.error ? `<div class="message error" role="alert">${escapeHtml(state.error)}</div>` : ''}
      ${state.notice ? `<p class="message" role="status">${escapeHtml(state.notice)}</p>` : ''}
      ${state.busy ? '<p class="hint" role="status">Working. Please wait.</p>' : ''}`;
  }

  function variants(configure = false) {
    const experiment = configure ? state.draft : state.snapshot.experiment;
    const paths = [state.snapshot.page.path, experiment.challengerPath];
    const rows = paths.map((path, index) => {
      if (!path) return '';
      const key = index ? 'challenger-1' : 'control';
      const name = index ? 'Challenger 1' : 'Control';
      const percentage = index
        ? experiment.challengerPercentage : 100 - experiment.challengerPercentage;
      const url = state.variant?.path === path
        ? state.variant.editorUrl : editorUrl(state.snapshot.page, path);
      return `<li class="variant-row ${state.selected === key ? 'selected' : ''}">
        <div class="variant-main"><button type="button" class="row-select" data-action="select-variant" data-variant="${key}" aria-pressed="${state.selected === key}">${name}</button>
          <span class="variant-split">${percentage}%</span></div>
        <div class="variant-actions">${link(configure ? 'Edit in DA' : 'Open in DA', url)}
          <button type="button" data-action="row-preview" data-variant="${key}" ${previewReason() ? 'disabled' : ''}>Preview</button></div>
      </li>`;
    }).join('');
    return `<ul class="variant-group" aria-label="Content variants">${rows}
      ${configure ? `<li class="add-row"><button type="button" data-action="review-create" ${experiment.challengerPath || unavailable('createVariant') ? 'disabled' : ''}>+ Add new</button>
        ${experiment.challengerPath ? '<span class="hint">One challenger in this demo</span>' : ''}</li>` : ''}</ul>
      ${configure && !experiment.challengerPath && unavailable('createVariant') ? `<p class="action-reason">${escapeHtml(unavailable('createVariant'))}</p>` : ''}
      ${configure && previewReason() ? `<p class="hint">${escapeHtml(previewReason())}</p>` : ''}`;
  }

  function overview() {
    const { experiment } = state.snapshot;
    if (!experiment) {
      return `<section class="empty-state"><div class="empty-symbol" aria-hidden="true">A/B</div>
        <h2>No experiments on this page</h2><p>Create a new experiment to start<br>optimizing your web page.</p>
        <div class="empty-actions">${link('View Docs', 'https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/contextual-experimentation')}
          <button type="button" class="primary" data-action="configure">Create New</button></div></section>`;
    }
    const active = experiment.status === 'active';
    return `<section class="experiment-overview"><p class="page-count">1 on this page</p>
      <article class="summary-card"><span class="summary-symbol" aria-hidden="true">A/B</span>
        <div><strong>${escapeHtml(experiment.id)}</strong><span class="status-dot">${active ? 'Active' : 'Draft'}</span></div></article>
      <div class="experiment-heading"><h2>${escapeHtml(experiment.id)}</h2>
        <div class="summary-actions"><button type="button" data-action="configure">${active ? 'View configuration' : 'Edit'}</button>
          <span class="status-pill">${active ? 'Active' : 'Draft'}</span>
          <button type="button" class="activate" disabled title="Activation is not available in this demo">Activate</button></div>
      </div>
      <p class="hint activation-note">Activation is not available in this demo.</p>
      <dl class="facts"><div><dt>Type</dt><dd>A/B Test</dd></div><div><dt>Optimizing for</dt><dd>Conversion</dd></div>
        <div><dt>Start Date</dt><dd>${escapeHtml(displayDate(experiment.startDate))}</dd></div>
        <div><dt>Est. End Date</dt><dd>${escapeHtml(displayDate(experiment.endDate))}</dd></div></dl>
      <div class="tabs" role="tablist" aria-label="Experiment details">
        <button type="button" id="results-tab" role="tab" tabindex="${state.tab === 'results' ? 0 : -1}" aria-selected="${state.tab === 'results'}" aria-controls="experiment-details" data-action="tab-results">Results</button>
        <button type="button" id="variants-tab" role="tab" tabindex="${state.tab === 'variants' ? 0 : -1}" aria-selected="${state.tab === 'variants'}" aria-controls="experiment-details" data-action="tab-variants">Content Variants (2)</button></div>
      <div id="experiment-details" role="tabpanel" aria-labelledby="${state.tab === 'results' ? 'results-tab' : 'variants-tab'}">
        ${state.tab === 'variants' ? variants() : '<div class="results-empty"><h3>Reporting is not connected</h3><p>No experiment metrics are available in this demo.</p></div>'}
      </div></section>`;
  }

  function configuration() {
    const readOnly = state.snapshot.experiment?.status === 'active' || Boolean(state.handoff);
    return `<button type="button" class="back" data-action="overview">Back to experiments</button>
      <h2 class="config-title">${state.snapshot.experiment ? 'Edit experiment' : 'New experiment on this page'}</h2>
      <form id="experiment-form"><fieldset ${readOnly ? 'disabled' : ''}>
        <label for="experiment-id">Experiment Name <span aria-hidden="true">*</span></label>
        <input id="experiment-id" name="id" required autocomplete="off" value="${escapeHtml(state.draft.id)}">
        <label for="optimizing-for">Optimizing For</label><select id="optimizing-for" disabled><option>Conversion</option></select>
        <div class="variants-section"><div class="section-heading"><h3>Variants</h3>
          <button type="button" class="text-button" data-action="even-split">Even Split</button></div>${variants(true)}
          <input type="hidden" name="challengerPercentage" value="${state.draft.challengerPercentage}">
          <p class="hint" id="allocation-summary">Control ${100 - state.draft.challengerPercentage}% / Challenger ${state.draft.challengerPercentage}%. This demo saves an even split.</p></div>
        ${state.snapshot.capabilities?.dates === true ? `<div class="date-fields">
          <label for="start-date">Start Date <span class="optional">(optional)</span></label>
          <input id="start-date" name="startDate" type="date" value="${escapeHtml(state.draft.startDate || '')}">
          <label for="end-date">End Date <span class="optional">(optional)</span></label>
          <input id="end-date" name="endDate" type="date" value="${escapeHtml(state.draft.endDate || '')}"></div>` : ''}
      </fieldset></form>`;
  }

  function footer() {
    if (state.view !== 'configure') return '';
    const reason = unavailable('saveExperiment') || (!state.draft.challengerPath ? 'Add one challenger before saving.' : '');
    return `<footer class="panel-footer"><span id="save-state">${state.dirty ? 'Unsaved changes' : 'No unsaved changes'}</span>
      <div class="footer-actions"><button type="submit" form="experiment-form" ${reason || state.busy ? 'disabled' : ''}>Save as draft in DA</button>
        <button type="button" class="activate" disabled title="Activation is not available in this demo">Activate</button></div>
      ${reason ? `<p class="action-reason">${escapeHtml(reason)}</p>` : '<p class="hint">Native save and verification required. No activation.</p>'}</footer>`;
  }

  function secondary(title, id, body, buttons, closeAction) {
    return `<dialog aria-labelledby="${id}"><div class="secondary-shell">
      <header class="dialog-heading"><h2 id="${id}" tabindex="-1">${title}</h2><button type="button" class="icon-button" data-action="${closeAction}" aria-label="Close dialog">x</button></header>
      <fieldset ${state.busy ? 'disabled aria-busy="true"' : ''}><div class="dialog-content">${messages()}${body}</div>
        <footer class="dialog-footer">${buttons}</footer></fieldset></div></dialog>`;
  }

  function review() {
    if (state.review === 'create') {
      return secondary(
        'Add challenger',
        'review-title',
        `<p>Create one full-page copy using native DA.</p>
        <p class="hint">Control: ${escapeHtml(state.snapshot.page.path)}</p>
        <label for="destination">Challenger destination</label>
        <input id="destination" name="destination" required value="${escapeHtml(state.destination)}">
        <p>Stop if the destination is occupied. This panel will not create or overwrite a page.</p>
        <details><summary>Reviewed source content</summary><pre>${escapeHtml(state.snapshot.sourceHtml)}</pre></details>`,
        '<button type="button" data-action="cancel-review">Cancel</button><button type="button" class="primary" data-action="confirm">Prepare DA duplication</button>',
        'cancel-review',
      );
    }
    const before = state.snapshot.experiment || {};
    const fields = [['id', 'Name'], ['challengerPath', 'Challenger'], ['challengerPercentage', 'Challenger (%)'], ['status', 'Status'], ['startDate', 'Start date'], ['endDate', 'End date']];
    const changes = fields.filter(([key]) => before[key] !== state.draft[key]);
    return secondary(
      'Save draft in DA',
      'review-title',
      `<p>Review inactive settings for <strong>${escapeHtml(state.snapshot.page.path)}</strong>.</p>
      <div class="diff-scroll"><table><caption>Configuration changes</caption><thead><tr><th>Field</th><th>Saved</th><th>Draft</th></tr></thead><tbody>
      ${changes.map(([key, label]) => `<tr><th>${label}</th><td>${escapeHtml(before[key] ?? '(not set)')}</td><td>${escapeHtml(state.draft[key] || '(not set)')}</td></tr>`).join('')}
      </tbody></table></div>${changes.length ? '' : '<p>No configuration fields changed.</p>'}
      <p>Next, apply these entries in DA metadata and verify the saved source. Preparing this step does not save, activate or publish.</p>`,
      '<button type="button" data-action="cancel-review">Cancel</button><button type="button" class="primary" data-action="confirm">Continue to DA save</button>',
      'cancel-review',
    );
  }

  function handoff() {
    const pending = state.handoff;
    const copy = pending.kind === 'copy';
    const body = copy ? `<p class="pending-label">Pending native action. No challenger has been verified.</p>
      <p>Destination: <strong>${escapeHtml(pending.destinationPath)}</strong></p>
      ${link('Duplicate in DA', pending.editorUrl)}
      <ol>${pending.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join('')}</ol>`
      : `<p class="pending-label">Pending native action. The experiment has not been verified as saved.</p>
        <p>Apply this configuration using the control page's native metadata controls, preserving unrelated rows.</p>
        <label for="metadata-text">Configuration reference</label><textarea id="metadata-text" rows="7" readonly>${escapeHtml(pending.metadataText)}</textarea>
        <div class="inline-actions"><button type="button" data-action="copy-configuration">Copy configuration</button>${link('Open DA metadata', pending.editorUrl)}</div>
        <p class="hint">Reference text only, not a paste/import API. Blank dates mean clear or remove those fields. Keep status inactive.</p>`;
    return secondary(
      copy ? 'Duplicate in native DA' : 'Save in native DA',
      'handoff-title',
      `${body}
      <p class="hint">Keep this rail open; native links open separately. Reloading the tool loses its reviewed baseline and requires a fresh review.</p>
      <details><summary>Native operation limits</summary><p>Stop on an occupied destination or unexpected edits. Native collision checks and later readback are not atomic. No activation or live publication is requested.</p></details>`,
      '<button type="button" data-action="cancel-handoff">Back to configuration</button><button type="button" class="primary" data-action="verify-native">Refresh saved state</button>',
      'cancel-handoff',
    );
  }

  function preview() {
    const name = state.selected === 'control' ? 'Control' : 'Challenger 1';
    const setup = state.previewSetup || !state.qa;
    const selectedUrl = state.selected === 'control' ? state.qa?.controlUrl : state.qa?.challengerUrl;
    return secondary(
      `${name} preview`,
      'preview-title',
      `${setup ? `<form id="qa-form">
        <label for="qa-url">Visitor preview URL</label><input id="qa-url" name="qaPreviewUrl" type="url" required autocomplete="off" value="${escapeHtml(state.qaUrl)}" placeholder="Paste the control visitor URL">
        <p class="hint">Use the actual visitor preview URL, not a DA editor link. Existing query and fragment values are removed.</p>
      </form>` : ''}
      ${state.qa ? `<div class="qa-results"><strong>Forced assignment. Delivery unverified.</strong>
        <p>Saved experiment: ${escapeHtml(state.qa.experimentId)}</p>
        <div class="preview-primary">${link(`Open ${name.toLowerCase()} preview`, selectedUrl, true)}</div>
        <div class="preview-alternatives">${link('Force control (QA)', state.qa.controlUrl, true)}${link('Force challenger (QA)', state.qa.challengerUrl, true)}</div>
        <button type="button" class="text-button" data-action="change-preview-url">Change visitor URL</button>
      </div>` : ''}
      <p class="hint">Uses freshly read saved settings, not unsaved form values. Native preview/publication stays manual and unavailable here. Links do not verify delivery or bypass dates, audience or consent.</p>`,
      `<button type="button" data-action="close-preview">Close</button>${setup ? '<button type="submit" form="qa-form" class="primary">Build preview link</button>' : ''}`,
      'close-preview',
    );
  }

  function render() {
    let content = '<p class="hint" role="status">Connecting to DA...</p>';
    if (state.snapshot) content = state.view === 'overview' ? overview() : configuration();
    const modal = state.review || state.previewOpen
      || (state.handoff && state.handoffVisible) || state.discard;
    const pending = state.handoff && !state.handoffVisible ? `<p class="message">A native handoff is pending.
      <button type="button" data-action="resume-handoff">Resume native verification</button></p>` : '';
    const page = state.snapshot?.page;
    root.innerHTML = `<header class="topbar"><h1>Experimentation</h1><div class="topbar-actions">
      ${page ? `<details class="page-context"><summary>Page</summary><p>${escapeHtml(page.org)}/${escapeHtml(page.repo)}${escapeHtml(page.path)}</p></details>` : ''}
      <button type="button" class="icon-button" data-action="reload" aria-label="Reload saved page" title="Reload saved page" ${state.busy ? 'disabled' : ''}>&#8635;</button></div></header>
      <div class="panel-body"><fieldset class="panel-content" ${state.busy ? 'disabled aria-busy="true"' : ''}>
        ${modal ? '' : messages()}${pending}${content}</fieldset></div>${state.snapshot ? footer() : ''}`;
    if (state.discard) {
      root.insertAdjacentHTML('beforeend', secondary(
        'Discard unsaved changes?',
        'discard-title',
        '<p>Reload discards unsaved configuration and pending handoffs. Native DA changes, if any, are not undone. A new review will be required.</p>',
        '<button type="button" data-action="keep-editing">Keep editing</button><button type="button" data-action="discard-confirm">Discard changes</button>',
        'keep-editing',
      ));
    } else if (state.handoff && state.handoffVisible) root.insertAdjacentHTML('beforeend', handoff());
    else if (state.review) root.insertAdjacentHTML('beforeend', review());
    else if (state.previewOpen) root.insertAdjacentHTML('beforeend', preview());
    const dialog = root.querySelector('dialog');
    if (dialog) {
      dialog.showModal();
      dialog.querySelector('h2').focus();
    }
  }

  function acceptSnapshot(snapshot) {
    if (!snapshot?.page?.path || typeof snapshot.sourceHtml !== 'string'
      || (snapshot.revision !== null && typeof snapshot.revision !== 'string')
      || (snapshot.experiment && !['active', 'inactive'].includes(snapshot.experiment.status))) {
      throw new Error('DA returned an invalid page snapshot. No changes were accepted.');
    }
    state.snapshot = snapshot;
    state.draft = initialDraft(snapshot);
    state.destination = snapshot.page.path.replace(/(\.html)?$/, '-challenger$1');
    state.dirty = false;
    state.needsReload = false;
    state.handoff = null;
    state.handoffVisible = false;
    state.qa = null;
  }

  async function load() {
    if (state.busy) return;
    state.busy = true;
    state.error = '';
    state.notice = '';
    state.review = '';
    state.previewOpen = false;
    state.qa = null;
    render();
    try {
      acceptSnapshot(await adapter.readPage());
      state.variant = null;
      state.view = 'overview';
      state.tab = 'variants';
    } catch (error) {
      state.needsReload = true;
      state.error = `Could not load the saved page. ${error.message || String(error)}`;
    } finally {
      state.busy = false;
      render();
    }
  }

  function showReview(kind) {
    const reason = unavailable(kind === 'create' ? 'createVariant' : 'saveExperiment');
    if (reason) {
      state.error = reason;
      render();
      return;
    }
    if (kind === 'save' && !state.draft.challengerPath) return;
    state.review = kind;
    state.error = '';
    state.notice = '';
    state.qa = null;
    state.focusReturn = kind === 'create'
      ? '[data-action="review-create"]' : '[form="experiment-form"]';
    render();
  }

  async function confirm() {
    if (!state.review || state.busy) return;
    const kind = state.review;
    const reason = unavailable(kind === 'create' ? 'createVariant' : 'saveExperiment');
    if (reason) {
      state.review = '';
      state.error = reason;
      render();
      return;
    }
    if (kind === 'create' && !root.querySelector('#destination').reportValidity()) return;
    state.busy = true;
    state.error = '';
    render();
    try {
      const expectedRevision = state.snapshot.revision;
      if (kind === 'create') {
        const result = await adapter.prepareVariant({
          destinationPath: state.destination, expectedRevision,
        });
        if (result?.destinationPath !== state.destination || !safeUrl(result.editorUrl)
          || !Array.isArray(result.instructions)) {
          throw new Error('DA did not return a valid duplication handoff.');
        }
        state.handoff = { ...result, kind: 'copy', expectedRevision };
      } else {
        const result = await adapter.prepareExperiment({
          draft: { ...state.draft, status: 'inactive' }, expectedRevision,
        });
        if (typeof result?.metadataText !== 'string' || !safeUrl(result.editorUrl) || result.expectedExperiment?.status !== 'inactive') {
          throw new Error('DA did not return valid inactive metadata instructions.');
        }
        state.handoff = { ...result, kind: 'configuration' };
      }
      state.handoffVisible = true;
      state.review = '';
    } catch (error) {
      state.needsReload = true;
      state.error = `${error.code ? `${error.code}: ` : ''}${error.message || String(error)} No automatic retry was made. Reload to review the current saved state.`;
      state.review = '';
    } finally {
      state.busy = false;
      render();
    }
  }

  async function verifyNative() {
    if (!state.handoff || state.busy) return;
    const pending = state.handoff;
    state.busy = true;
    state.error = '';
    state.notice = '';
    render();
    try {
      if (pending.kind === 'copy') {
        const result = await adapter.verifyVariant({
          destinationPath: pending.destinationPath, expectedRevision: pending.expectedRevision,
        });
        if (result?.page?.path !== pending.destinationPath || !safeUrl(result.page.editorUrl)) {
          throw new Error('The saved challenger could not be verified.');
        }
        state.variant = result.page;
        state.draft.challengerPath = result.page.path;
        state.dirty = true;
        state.handoff = null;
        state.handoffVisible = false;
        state.notice = 'Challenger copy verified from saved DA source. Experiment configuration is still unsaved.';
        state.selected = 'challenger-1';
      } else {
        const snapshot = await adapter.verifyExperiment();
        if (snapshot?.experiment?.status !== 'inactive') throw new Error('The saved inactive experiment could not be verified.');
        acceptSnapshot(snapshot);
        state.view = 'overview';
        state.notice = 'Verified native saved state. The draft is inactive.';
      }
    } catch (error) {
      state.error = `${error.code ? `${error.code}: ` : ''}${error.message || String(error)} No verified success was recorded. Complete or correct the native DA action, then refresh again.`;
    } finally {
      state.busy = false;
      render();
    }
  }

  async function copyConfiguration() {
    state.error = '';
    state.notice = '';
    try {
      await navigator.clipboard.writeText(state.handoff.metadataText);
      state.notice = 'Configuration copied. It is not saved. Apply it in native DA, then refresh saved state.';
    } catch (error) {
      state.error = `Could not copy configuration: ${error.message || String(error)} Select the configuration text and copy it manually.`;
    }
    render();
  }

  async function generateQa() {
    if (state.busy || state.handoff) return;
    state.busy = true;
    state.error = '';
    state.notice = '';
    state.qa = null;
    render();
    try {
      const saved = await adapter.readPage();
      const expected = state.snapshot.page;
      if (saved?.page?.org !== expected.org || saved.page.repo !== expected.repo
        || saved.page.path !== expected.path) {
        state.needsReload = true;
        state.review = '';
        throw new Error('The saved page identity changed. Reload and review the current page.');
      }
      const sourceChanged = saved.sourceHtml !== state.snapshot.sourceHtml
        || saved.revision !== state.snapshot.revision;
      if (sourceChanged) {
        state.needsReload = true;
        state.review = '';
      }
      const links = buildPreviewLinks({ previewUrl: state.qaUrl, experiment: saved.experiment });
      state.qa = { ...links, experimentId: saved.experiment.id };
      state.previewSetup = false;
      if (sourceChanged) state.notice = 'QA uses the latest saved settings. The saved source changed; reload before preparing another native handoff.';
    } catch (error) {
      state.previewSetup = true;
      state.error = `Could not build read-only QA links. ${error.message || String(error)}`;
    } finally {
      state.busy = false;
      render();
    }
  }

  function closeSecondary() {
    if (state.handoffVisible) {
      state.handoffVisible = false;
      state.view = 'configure';
      state.focusReturn = '[data-action="resume-handoff"]';
    }
    state.review = '';
    state.previewOpen = false;
    state.discard = '';
    state.error = '';
    state.notice = '';
    render();
    root.querySelector(state.focusReturn || '[data-action="configure"]')?.focus();
  }

  function input(event) {
    if (state.busy) return;
    const { name, value } = event.target;
    if (name === 'qaPreviewUrl') {
      state.qaUrl = value;
      state.qa = null;
      root.querySelector('.qa-results')?.remove();
      return;
    }
    if (name === 'destination') {
      state.destination = value;
      return;
    }
    if (!['id', 'startDate', 'endDate'].includes(name)) return;
    state.draft[name] = value;
    state.dirty = true;
    state.qa = null;
    root.querySelector('#save-state').textContent = 'Unsaved changes';
  }

  function click(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled || state.busy) return;
    const { action } = button.dataset;
    if (['reload', 'overview'].includes(action)) {
      if (state.dirty || state.handoff) {
        state.focusReturn = `[data-action="${action}"]`;
        state.discard = action;
        state.error = '';
        render();
      } else if (action === 'reload') load();
      else {
        state.view = 'overview';
        state.notice = '';
        render();
      }
    } else if (action === 'discard-confirm') {
      state.discard = '';
      state.dirty = false;
      state.handoff = null;
      state.handoffVisible = false;
      load();
    } else if (action === 'configure') {
      state.view = 'configure';
      state.error = '';
      state.notice = '';
      render();
    } else if (action === 'even-split') {
      state.draft.challengerPercentage = 50;
      state.dirty = true;
      state.qa = null;
      render();
    } else if (action === 'review-create') showReview('create');
    else if (action === 'confirm') confirm();
    else if (action === 'verify-native') verifyNative();
    else if (action === 'copy-configuration') copyConfiguration();
    else if (['cancel-review', 'cancel-handoff', 'close-preview', 'keep-editing'].includes(action)) closeSecondary();
    else if (action === 'resume-handoff') {
      state.focusReturn = '[data-action="resume-handoff"]';
      state.handoffVisible = true;
      state.notice = '';
      render();
    } else if (action.startsWith('tab-')) {
      state.tab = action === 'tab-results' ? 'results' : 'variants';
      render();
      root.querySelector(`#${state.tab}-tab`).focus();
    } else if (action === 'select-variant') {
      state.selected = button.dataset.variant;
      render();
      root.querySelector(`[data-action="select-variant"][data-variant="${state.selected}"]`).focus();
    } else if (action === 'row-preview') {
      const reason = previewReason();
      if (reason) {
        state.error = reason;
        render();
        return;
      }
      state.selected = button.dataset.variant;
      state.review = '';
      state.focusReturn = `[data-action="row-preview"][data-variant="${state.selected}"]`;
      state.previewOpen = true;
      state.qa = null;
      state.error = '';
      state.notice = '';
      state.previewSetup = !state.qaUrl;
      if (state.qaUrl) generateQa();
      else render();
    } else if (action === 'change-preview-url') {
      state.previewSetup = true;
      render();
    }
  }

  function submit(event) {
    event.preventDefault();
    if (state.busy || !event.target.reportValidity()) return;
    if (event.target.id === 'qa-form') generateQa();
    else showReview('save');
  }

  function cancel(event) {
    event.preventDefault();
    if (!state.busy) closeSecondary();
  }

  function keydown(event) {
    if (event.target.getAttribute('role') !== 'tab'
      || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') state.tab = 'results';
    else if (event.key === 'End') state.tab = 'variants';
    else state.tab = state.tab === 'results' ? 'variants' : 'results';
    render();
    root.querySelector(`#${state.tab}-tab`).focus();
  }

  root.addEventListener('click', click);
  root.addEventListener('input', input);
  root.addEventListener('submit', submit);
  root.addEventListener('cancel', cancel, true);
  root.addEventListener('keydown', keydown);
  await load();
  return {
    destroy() {
      root.querySelector('dialog')?.close();
      root.removeEventListener('click', click);
      root.removeEventListener('input', input);
      root.removeEventListener('submit', submit);
      root.removeEventListener('cancel', cancel, true);
      root.removeEventListener('keydown', keydown);
    },
  };
}

async function connect(root) {
  let timer;
  try {
    const connection = (async () => {
      const [{ default: sdk }, { createDaExperimentationAdapter }] = await Promise.all([
        import('https://da.live/nx/utils/sdk.js'),
        import('./da-adapter.js'),
      ]);
      const { context, actions } = await sdk;
      return createDaExperimentationAdapter({ context, actions });
    })();
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('DA connection timed out. Open this tool from a DA page and reload.')), 12000);
    });
    const adapter = await Promise.race([connection, timeout]);
    clearTimeout(timer);
    await mountExperimentation(root, adapter);
  } catch (error) {
    root.innerHTML = `<h1>Experimentation</h1><p role="alert">DA connection unavailable. ${escapeHtml(error.message || String(error))}</p>`;
  } finally {
    clearTimeout(timer);
  }
}

const host = document.querySelector('#experimentation[data-da-host]');
if (host) connect(host);
