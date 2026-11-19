import mountExperimentation from '../plugins/experimentation/index.js';

const root = document.querySelector('#fixture-panel');
const results = document.querySelector('#results');
const checks = [];
let current;
let productionFrameGeometry;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

function fixture({ experiment = null, available = true, revision = '"control-v1"' } = {}) {
  let saved = {
    page: {
      org: 'markszulc',
      repo: 'frescopa26',
      path: '/demo/ui',
      editorUrl: 'https://da.live/edit#/markszulc/frescopa26/demo/ui',
    },
    sourceHtml: '<main><h1>Fixture control only</h1><p>Preserve the complete page.</p></main>',
    revision,
    experiment,
    capabilities: {
      createVariant: { available, reason: 'Safe full-page copy has not been qualified.' },
      saveExperiment: { available, reason: 'Conditional metadata save has not been qualified.' },
      preview: { available, reason: 'Native preview has not been qualified.' },
      dates: true,
    },
  };
  const calls = [];
  const errors = {};
  let destinationPath;
  let preparedDraft;
  let copyDone = false;
  let configDone = false;
  const adapter = {
    async readPage() {
      calls.push(['readPage']);
      if (errors.readPage) throw errors.readPage;
      return structuredClone(saved);
    },
    async prepareVariant(args) {
      calls.push(['prepareVariant', args]);
      if (errors.prepareVariant) throw errors.prepareVariant;
      destinationPath = args.destinationPath;
      return {
        destinationPath,
        editorUrl: saved.page.editorUrl,
        instructions: ['Use native DA duplication.', 'Stop if the destination exists.'],
      };
    },
    async verifyVariant(args) {
      calls.push(['verifyVariant', args]);
      if (!copyDone) throw Object.assign(new Error('Native copy is not saved.'), { code: 'READBACK_MISMATCH' });
      return {
        page: {
          ...saved.page,
          path: destinationPath,
          editorUrl: `https://da.live/edit#/markszulc/frescopa26${destinationPath}`,
        },
        revision: '"challenger-v1"',
      };
    },
    async prepareExperiment(args) {
      calls.push(['prepareExperiment', args]);
      if (errors.prepareExperiment) throw errors.prepareExperiment;
      preparedDraft = structuredClone(args.draft);
      return {
        metadataText: `Experiment\t${preparedDraft.id}\nExperiment Status\tInactive`,
        editorUrl: saved.page.editorUrl,
        expectedExperiment: preparedDraft,
      };
    },
    async verifyExperiment() {
      calls.push(['verifyExperiment']);
      if (errors.verifyExperiment) throw errors.verifyExperiment;
      if (!configDone) throw Object.assign(new Error('Native configuration is not saved.'), { code: 'READBACK_MISMATCH' });
      return structuredClone(saved);
    },
    async preview(args) {
      calls.push(['preview', args]);
      if (errors.preview) throw errors.preview;
      return {
        controlUrl: 'https://main--frescopa26--markszulc.aem.page/demo/ui?experiment=fixture/control',
        challengerUrl: 'https://main--frescopa26--markszulc.aem.page/demo/ui?experiment=fixture/challenger-1',
      };
    },
  };
  if (!available) {
    delete adapter.prepareVariant;
    delete adapter.verifyVariant;
    delete adapter.prepareExperiment;
    delete adapter.verifyExperiment;
  }
  return {
    adapter,
    calls,
    errors,
    completeCopy() { copyDone = true; },
    completeConfiguration() {
      configDone = true;
      saved = { ...saved, revision: '"control-v2"', experiment: structuredClone(preparedDraft) };
    },
  };
}

function click(action) {
  const target = root.querySelector(`[data-action="${action}"]`);
  assert(target && !target.disabled, `Action ${action} is available`);
  target.click();
}

function rowPreview(variant = 'control') {
  const target = root.querySelector(`[data-action="row-preview"][data-variant="${variant}"]`);
  assert(target && !target.disabled, `Row preview for ${variant} is available`);
  target.click();
}

function fill(name, value) {
  const input = root.querySelector(`[name="${name}"]`);
  assert(input, `Input ${name} exists`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function settle() {
  await new Promise((resolve) => { setTimeout(resolve, 0); });
}

async function mount(options) {
  current?.destroy();
  const host = fixture(options);
  current = await mountExperimentation(root, host.adapter);
  return host;
}

function measureProductionFrame() {
  const banner = document.querySelector('.fixture-notice');
  const oldStyle = root.style.cssText;
  const oldBannerHidden = banner.hidden;
  const oldResultsHidden = results.hidden;
  banner.hidden = true;
  results.hidden = true;
  root.style.setProperty('--panel-height', '100dvh');
  window.scrollTo(0, 0);
  const body = root.querySelector('.panel-body');
  const footer = root.querySelector('.panel-footer');
  const footerBefore = footer.getBoundingClientRect();
  productionFrameGeometry = {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    rootHeight: root.clientHeight,
    rootScrollHeight: root.scrollHeight,
    bodyHeight: body.clientHeight,
    bodyScrollHeight: body.scrollHeight,
    bodyOverflow: getComputedStyle(body).overflowY,
    footerTop: footerBefore.top,
    footerBottom: footerBefore.bottom,
    footerActions: [...footer.querySelectorAll('button, .hint, .action-reason')].map((element) => ({
      text: element.textContent.trim(),
      top: element.getBoundingClientRect().top,
      bottom: element.getBoundingClientRect().bottom,
    })),
  };
  assert(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) <= window.innerHeight + 1, 'Production-chrome frame has no outer vertical scrolling region');
  assert(root.scrollHeight <= root.clientHeight + 1, 'Application root does not add a nested scrolling region');
  assert(getComputedStyle(body).overflowY === 'auto', 'Only the application body owns configuration scrolling');
  assert(body.getBoundingClientRect().bottom <= footerBefore.top + 1, 'Configuration body never overlaps the footer');
  assert(footerBefore.bottom <= window.innerHeight + 1, 'Actual iframe footer is uncut without fixture chrome');
  [...footer.querySelectorAll('button, .hint, .action-reason')].forEach((element) => {
    const rect = element.getBoundingClientRect();
    assert(rect.top >= 0 && rect.bottom <= window.innerHeight + 1, 'Primary/footer action and its reason are fully reachable in the real frame');
  });
  if (window.innerHeight <= 760) assert(body.scrollHeight > body.clientHeight, 'Short real frame scrolls configuration inside the application body');
  body.scrollTop = body.scrollHeight;
  assert(footer.getBoundingClientRect().bottom === footerBefore.bottom, 'Scrolling configuration leaves its primary footer fixed');
  body.scrollTop = 0;
  root.style.cssText = oldStyle;
  banner.hidden = oldBannerHidden;
  results.hidden = oldResultsHidden;
}

const existing = {
  id: 'fixture-test',
  challengerPath: '/demo/ui-challenger',
  challengerPercentage: 50,
  status: 'inactive',
};

async function run() {
  const host = await mount();
  assert(root.textContent.includes('No experiments on this page'), 'Empty overview matches saved state');
  assert(root.querySelector('.empty-actions a').textContent === 'View Docs', 'Empty state follows the View Docs/Create New hierarchy');
  assert(!root.textContent.includes('Saved page loaded') && !root.querySelector('.capabilities'), 'Routine source diagnostics do not dominate the empty screen');
  click('configure');
  fill('id', 'fixture-test');
  assert(root.querySelector('[name="challengerPercentage"]').value === '50', 'New draft starts at 50/50');
  assert(host.calls.length === 1, 'Opening configuration performs no mutation');
  assert(!root.querySelector('#destination'), 'Creation details stay behind Add new');
  assert(root.querySelector('#experiment-form').innerText.indexOf('Optimizing For') < root.querySelector('#experiment-form').innerText.indexOf('Variants'), 'Configuration follows the reference field order');
  assert(!root.querySelector('[role="switch"]'), 'No unsupported consent switch is invented');
  assert(root.querySelector('.panel-footer').getBoundingClientRect().bottom <= window.innerHeight + 1, 'Configuration footer stays visible in the panel viewport');
  click('review-create');
  assert(root.querySelector('#review-title') === document.activeElement, 'Review receives keyboard focus');
  assert(root.querySelector('pre').textContent.includes('<main>'), 'Copy review shows escaped complete source');
  assert(host.calls.length === 1, 'Reviewing copy does not create a page');
  click('cancel-review');
  click('review-create');
  click('confirm');
  root.querySelector('[data-action="confirm"]').click();
  await settle();
  assert(host.calls.filter(([name]) => name === 'prepareVariant').length === 1, 'Busy guard prevents duplicate handoff preparation');
  assert(root.textContent.includes('Pending native action'), 'Duplication handoff remains pending');
  assert(root.querySelector('dialog').open, 'Native steps use a focused secondary dialog');
  assert(root.querySelector('.dialog-footer').getBoundingClientRect().bottom <= window.innerHeight + 1, 'Native handoff confirmation stays visible while details scroll');
  assert(!root.textContent.includes('Challenger copy verified'), 'Preparing handoff does not claim a saved page');
  root.querySelector('.dialog-footer [data-action="cancel-handoff"]').click();
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Back from pending copy focuses its enabled continuation');
  click('resume-handoff');
  root.querySelector('dialog .icon-button').click();
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Closing a pending copy keeps keyboard continuation');
  click('resume-handoff');
  root.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Escape from pending copy focuses native verification');
  assert(root.querySelector('#experiment-form fieldset').disabled, 'Pending native review locks configuration instead of losing its baseline');
  host.completeCopy();
  click('resume-handoff');
  click('verify-native');
  await settle();
  assert(host.calls.find(([name]) => name === 'prepareVariant')[1].expectedRevision === '"control-v1"', 'Copy preparation receives the opaque control revision');
  assert(host.calls.find(([name]) => name === 'verifyVariant')[1].expectedRevision === '"control-v1"', 'Resumed copy verification retains the opaque control revision');
  assert(root.querySelector('a[href*="ui-challenger"]'), 'Created challenger opens in native DA');
  assert(root.textContent.includes('Unsaved changes'), 'Copy does not pretend experiment metadata is saved');
  assert(root.querySelector('[name="challengerPercentage"]').type === 'hidden', 'Allocation is represented once in compact variant rows');
  assert(root.querySelector('#allocation-summary').textContent.includes('Control 50%'), 'Split controls remain complementary');
  click('even-split');
  fill('startDate', '2026-11-10');
  fill('endDate', '2026-11-20');
  root.querySelector('form').requestSubmit();
  assert(root.querySelector('caption').textContent === 'Configuration changes', 'Save reviews field-level differences');
  assert(!host.calls.some(([name]) => name === 'prepareExperiment'), 'Configuration handoff requires separate confirmation');
  click('confirm');
  await settle();
  const save = host.calls.find(([name]) => name === 'prepareExperiment')[1];
  assert(save.expectedRevision === '"control-v1"', 'Challenger revision never replaces the control precondition');
  assert(save.draft.status === 'inactive' && save.draft.challengerPercentage === 50, 'Save sends an inactive 50/50 draft');
  assert(save.draft.startDate === '2026-11-10', 'Optional dates reach the adapter');
  assert(root.querySelector('#metadata-text').value.includes('Experiment Status\tInactive'), 'Native metadata is presented for explicit copying');
  assert(!root.textContent.includes('Verified native saved state'), 'Prepared metadata does not claim a saved experiment');
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let copiedText;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { async writeText(text) { copiedText = text; } },
  });
  click('copy-configuration');
  await settle();
  assert(copiedText.includes('Experiment Status\tInactive'), 'Copy configuration copies the reviewed adapter text');
  assert(root.textContent.includes('It is not saved.'), 'Clipboard success explicitly remains unsaved');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { async writeText() { throw new Error('Clipboard permission denied.'); } },
  });
  click('copy-configuration');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('copy it manually'), 'Clipboard failure exposes the manual text-copy fallback');
  assert(root.querySelector('#metadata-text').value === copiedText, 'Clipboard failure preserves selectable reviewed metadata');
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else delete navigator.clipboard;
  root.querySelector('.dialog-footer [data-action="cancel-handoff"]').click();
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Back from pending metadata focuses its enabled continuation');
  click('resume-handoff');
  root.querySelector('dialog .icon-button').click();
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Closing pending metadata preserves keyboard continuation');
  click('resume-handoff');
  root.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
  assert(document.activeElement.dataset.action === 'resume-handoff', 'Escape from pending metadata focuses native verification');
  click('resume-handoff');
  click('verify-native');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('READBACK_MISMATCH'), 'Unapplied native metadata fails readback');
  host.completeConfiguration();
  click('verify-native');
  await settle();
  assert(!host.calls.some(([name]) => name === 'preview'), 'Native verification never previews automatically');
  assert(root.textContent.includes('Verified native saved state'), 'Saved success is shown only after independent verification');
  assert(root.querySelector('.page-count').textContent === '1 on this page', 'Saved overview has the summary count');
  assert(root.querySelector('#variants-tab').getAttribute('aria-selected') === 'true', 'Content Variants is the useful default tab');
  assert(root.querySelectorAll('.variant-row').length === 2, 'Saved variants are compact grouped rows');
  assert(!root.querySelector('[data-action="review-preview"]'), 'The competing native Preview experiment action is removed');
  click('tab-results');
  assert(root.textContent.includes('Reporting is not connected'), 'Results has an honest unavailable state');
  assert(!root.textContent.includes('No Data Yet'), 'Results does not imply connected reporting');
  click('tab-variants');
  root.querySelector('#variants-tab').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert(root.querySelector('#results-tab').getAttribute('aria-selected') === 'true', 'Result tabs support keyboard navigation');
  root.querySelector('#results-tab').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert(root.querySelector('#variants-tab') === document.activeElement, 'Tab keyboard navigation restores focus');
  const challengerRow = root.querySelector('[data-action="select-variant"][data-variant="challenger-1"]');
  challengerRow.focus();
  challengerRow.click();
  assert(document.activeElement === root.querySelector('[data-action="select-variant"][data-variant="challenger-1"]'), 'Activating a focused variant preserves row keyboard focus after render');
  click('reload');
  await settle();
  assert(root.textContent.includes('fixture-test') && !root.querySelector('.qa-results'), 'Reload reads saved metadata and clears old preview');

  const unavailable = await mount({ available: false });
  click('configure');
  assert(root.querySelector('[data-action="review-create"]').disabled, 'Unqualified native copy is disabled');
  assert(root.textContent.includes('Native duplication handoff is not available'), 'Unavailable native handoff is explained');
  assert(unavailable.calls.length === 1, 'Unavailable native actions never call mutations');

  const nullableCopy = await mount({ revision: null });
  click('configure');
  click('review-create');
  click('confirm');
  await settle();
  click('verify-native');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('READBACK_MISMATCH'), 'Missing native copy fails nullable readback without success');
  nullableCopy.completeCopy();
  click('verify-native');
  await settle();
  const prepareCopyArgs = nullableCopy.calls.find(([name]) => name === 'prepareVariant')[1];
  const verifyCopyArgs = nullableCopy.calls.find(([name]) => name === 'verifyVariant')[1];
  assert(prepareCopyArgs.expectedRevision === null && verifyCopyArgs.expectedRevision === null, 'Null control revision is forwarded unchanged to both manual copy helpers');
  assert(prepareCopyArgs.destinationPath === '/demo/ui-challenger' && verifyCopyArgs.destinationPath === prepareCopyArgs.destinationPath, 'Exact reviewed destination reaches preparation and verification');

  const reloadFailure = await mount();
  click('configure');
  click('review-create');
  reloadFailure.errors.readPage = new Error('Refresh denied.');
  click('reload');
  await settle();
  assert(!root.querySelector('[data-action="confirm"]'), 'A failed reload invalidates the old review confirmation');
  assert(!reloadFailure.calls.some(([name]) => name === 'prepareVariant'), 'Failed reload never bypasses the blocked handoff guard');

  await mount({ experiment: { ...existing, challengerPercentage: 35 } });
  click('configure');
  assert(root.querySelector('#allocation-summary').textContent.includes('Control 65%'), 'Actual saved allocation is displayed without rewriting it');
  click('even-split');
  assert(root.querySelector('[name="challengerPercentage"]').value === '50', 'Even split explicitly restores supported 50/50 settings');

  await mount({ revision: null, experiment: existing });
  assert(!root.querySelector('[data-action="review-preview"]'), 'Null revision never enables a native delivery control');
  assert(!root.querySelector('[data-action="row-preview"]').disabled, 'Read-only row QA remains available with a null revision');
  click('configure');
  assert(!root.querySelector('[type="submit"]').disabled, 'Null revision still permits a manual metadata handoff');

  await mount({ experiment: { ...existing, status: 'active' } });
  assert(root.textContent.includes('Active'), 'Actual active metadata is preserved');
  click('configure');
  assert(root.querySelector('#experiment-form fieldset').disabled, 'Active configuration is read-only');

  const failed = await mount({ experiment: existing });
  failed.errors.prepareExperiment = Object.assign(new Error('Source changed in DA.'), { code: 'STALE_SOURCE' });
  click('configure');
  fill('id', 'changed');
  root.querySelector('form').requestSubmit();
  click('confirm');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('STALE_SOURCE'), 'Stale save is explicit');
  assert(!root.textContent.includes('Verified native saved state'), 'Failed preparation does not claim success');
  assert(root.querySelector('[name="id"]').value === 'changed', 'Failed save preserves draft inputs');
  assert(failed.calls.filter(([name]) => name === 'prepareExperiment').length === 1, 'Failed preparation is not automatically retried');
  click('reload');
  assert(root.textContent.includes('Reload discards unsaved configuration'), 'Reload never silently discards a failed draft');
  assert(root.querySelector('dialog[open]'), 'Discard is a focused confirmation step');
  assert(root.querySelector('[name="id"]').value === 'changed', 'Discard warning preserves unsaved input');

  const occupied = await mount();
  occupied.errors.prepareVariant = Object.assign(new Error('Destination already exists.'), { code: 'DESTINATION_EXISTS' });
  click('configure');
  click('review-create');
  click('confirm');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('DESTINATION_EXISTS'), 'Occupied destination stops handoff preparation');
  assert(!root.textContent.includes('Challenger copy verified'), 'Occupied destination never yields a creation claim');

  const preserved = await mount({ experiment: existing });
  click('configure');
  fill('id', 'preservation-check');
  root.querySelector('form').requestSubmit();
  click('confirm');
  await settle();
  preserved.completeConfiguration();
  preserved.errors.verifyExperiment = Object.assign(new Error('Unrelated source content changed.'), { code: 'READBACK_MISMATCH' });
  click('verify-native');
  await settle();
  assert(root.textContent.includes('Unrelated source content changed.'), 'Preservation failure is exposed by the verification boundary');
  assert(!root.textContent.includes('Verified native saved state'), 'Matching settings alone cannot produce saved success');
  assert(root.querySelector('#metadata-text'), 'Readback failure retains the reviewed native handoff');

  const qaHost = await mount({ experiment: existing });
  click('configure');
  fill('id', 'unsaved-experiment-name');
  rowPreview();
  fill('qaPreviewUrl', 'https://visitor.example.com/demo/ui?utm_source=demo&experiment=old/control#headline');
  const readsBeforeQa = qaHost.calls.filter(([name]) => name === 'readPage').length;
  root.querySelector('#qa-form').requestSubmit();
  await settle();
  assert(qaHost.calls.filter(([name]) => name === 'readPage').length === readsBeforeQa + 1, 'QA independently rereads saved configuration');
  const qaLinks = [...root.querySelectorAll('.preview-alternatives a')].map((anchor) => new URL(anchor.href));
  assert(qaLinks.length === 2 && qaLinks[0].searchParams.get('experiment') === 'fixture-test/control', 'QA ignores unsaved experiment form values');
  assert(qaLinks[1].searchParams.get('experiment') === 'fixture-test/challenger-1', 'QA uses the pinned single-challenger assignment');
  assert(qaLinks.every((url) => [...url.searchParams].length === 1 && !url.hash), 'Panel QA links forward no existing query or fragment state');
  assert(root.textContent.includes('Forced assignment. Delivery unverified.'), 'QA never claims verified delivery');
  assert(root.querySelector('[name="id"]').value === 'unsaved-experiment-name', 'QA reread preserves unsaved form inputs');
  assert(!qaHost.calls.some(([name]) => name === 'preview'), 'Read-only QA never calls native preview');
  assert(root.querySelector('.preview-primary a').textContent.includes('control'), 'Row preview prioritizes the selected variant link');
  click('close-preview');
  const readsBeforeChallenger = qaHost.calls.filter(([name]) => name === 'readPage').length;
  rowPreview('challenger-1');
  await settle();
  assert(qaHost.calls.filter(([name]) => name === 'readPage').length === readsBeforeChallenger + 1, 'Reused visitor URL still requires a fresh saved-source read');
  assert(root.querySelector('.preview-primary a').textContent.includes('challenger'), 'Challenger row selects its own forced link');
  assert(!root.querySelector('#qa-form'), 'Visitor URL is collected once per mounted rail');
  assert(root.querySelector('.variant-row.selected .row-select').textContent === 'Challenger 1', 'Selected row follows the requested variant');
  qaHost.errors.readPage = new Error('QA source read denied.');
  click('close-preview');
  rowPreview('challenger-1');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('QA source read denied.'), 'QA reread failure is explicit');
  assert(!root.querySelector('.qa-results'), 'QA source failure clears earlier forced links');
  root.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
  assert(!root.querySelector('dialog'), 'Escape closes the focused preview step');
  assert(document.activeElement.dataset.variant === 'challenger-1', 'Closing preview returns focus to its variant action');

  const denied = fixture();
  denied.errors.readPage = new Error('Access denied.');
  current.destroy();
  current = await mountExperimentation(root, denied.adapter);
  assert(root.querySelector('[role="alert"]').textContent.includes('Access denied.'), 'Read denial is visible and retryable');
  assert(root.querySelector('[data-action="reload"]'), 'Read failure exposes retry');

  await mount({ experiment: { ...existing, id: '<img src=x onerror=alert(1)>' } });
  assert(!root.querySelector('img'), 'Authored values are escaped, never interpreted as HTML');
  await mount({ experiment: { ...existing, id: 'homepage-headline' } });
  click('configure');
  assert(document.documentElement.scrollWidth <= window.innerWidth, 'Panel has no horizontal overflow at the tested width');
  assert(root.querySelector('label[for="experiment-id"]'), 'Experiment field has a programmatic label');
  assert(root.getBoundingClientRect().width <= Math.min(480, window.innerWidth), 'Panel honors measured width constraint');
  measureProductionFrame();
  results.textContent = `${checks.length} UI assertions passed at ${window.innerWidth}px.\n${checks.join('\n')}`;
  document.body.dataset.result = 'passed';
}

run().catch((error) => {
  results.textContent = `${error.stack}\nPassed before failure:\n${checks.join('\n')}`;
  document.body.dataset.result = 'failed';
}).finally(() => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'ui-fixture-result',
      passed: document.body.dataset.result === 'passed',
      result: results.textContent,
      productionFrameGeometry,
    }, window.location.origin);
  }
});
