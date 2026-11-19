import mountExperimentation from '../plugins/experimentation/index.js';
import { createDaExperimentationAdapter } from '../plugins/experimentation/da-adapter.js';
import { buildPreviewLinks } from '../plugins/experimentation/qa-links.js';
import {
  prepareExperimentSource,
  prepareVariantSource,
} from '../plugins/experimentation/experiment-model.js';

const root = document.querySelector('#fixture-panel');
const results = document.querySelector('#results');
const checks = [];
const requests = [];
const control = '/demo/ui';
const challenger = '/demo/ui-challenger';
const page = { org: 'markszulc', repo: 'frescopa26', path: control };
let connection;
let qaEvidence;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

function click(action) {
  const button = root.querySelector(`[data-action="${action}"]`);
  assert(button && !button.disabled, `Integrated action ${action} is available`);
  button.click();
}

function rowPreview(variant = 'control') {
  const button = root.querySelector(`[data-action="row-preview"][data-variant="${variant}"]`);
  assert(button && !button.disabled, `Integrated row preview ${variant} is available`);
  button.click();
}

function fill(name, value) {
  const input = root.querySelector(`[name="${name}"]`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function settle() {
  for (let count = 0; count < 10; count += 1) {
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    if (!root.querySelector('[aria-busy="true"]')) return;
  }
  throw new Error('Integrated operation did not settle.');
}

async function run() {
  const fixture = await (await fetch(new URL('./model-source.html', import.meta.url))).text();
  const source = prepareVariantSource(fixture);
  const pages = new Map([[control, { html: source, revision: null }]]);
  const actions = {
    async daFetch(value, options) {
      const url = new URL(value);
      if (url.origin !== 'https://admin.da.live' || options.method !== 'GET') {
        throw new Error('The fake host refuses all source mutations and unexpected hosts.');
      }
      const prefix = '/source/markszulc/frescopa26';
      if (!url.pathname.startsWith(prefix) || !url.pathname.endsWith('.html')) {
        throw new Error('Unexpected fake DA source path.');
      }
      const path = url.pathname.slice(prefix.length, -5);
      requests.push({ path, method: options.method });
      const saved = pages.get(path);
      if (!saved) return new Response('', { status: 404 });
      return new Response(saved.html, {
        headers: {
          'content-type': 'text/html',
          ...(saved.revision ? { etag: saved.revision } : {}),
        },
      });
    },
  };
  const adapter = createDaExperimentationAdapter({ context: { ...page, view: 'edit' }, actions });
  connection = await mountExperimentation(root, adapter);
  assert(root.textContent.includes('No experiments on this page'), 'Real adapter reads the fake saved control');
  click('configure');
  fill('id', 'homepage-headline');
  click('review-create');
  click('confirm');
  await settle();
  const duplicateLink = root.querySelector('dialog a');
  assert(duplicateLink.href === 'https://da.live/edit#/markszulc/frescopa26/demo/ui', 'Native duplication opens the existing control, never a blank destination');
  assert(duplicateLink.target === '_blank' && duplicateLink.rel.includes('noopener'), 'Native navigation preserves the open adapter instance');
  assert(root.textContent.includes('Reloading the tool loses its reviewed baseline'), 'Pending baseline lifetime is explained');
  assert(!pages.has(challenger), 'Preparing a real-adapter handoff creates no source');
  click('cancel-handoff');
  click('resume-handoff');
  click('verify-native');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('PAGE_NOT_FOUND'), 'Real adapter rejects a missing native copy');
  assert(!root.textContent.includes('Challenger copy verified'), 'A missing page never becomes a verified challenger');

  // Fake author action, outside the panel. This is not a DA copy API implementation.
  pages.set(challenger, { html: source, revision: null });
  click('verify-native');
  await settle();
  assert(root.textContent.includes('Challenger copy verified'), 'Actual adapter verifies the complete fake saved challenger');
  const challengerLink = root.querySelector(`a[href$="${challenger}"]`);
  assert(challengerLink?.target === '_blank', 'Verified challenger navigation keeps the rail mounted');
  fill('startDate', '2026-11-10');
  fill('endDate', '2026-11-20');
  root.querySelector('form').requestSubmit();
  click('confirm');
  await settle();
  const metadata = root.querySelector('#metadata-text').value;
  assert(metadata.includes('Experiment Status\tInactive') && metadata.includes('Experiment Split\t50'), 'Real model prepares explicit inactive 50/50 reference rows');
  assert(pages.get(control).html === source, 'Preparing native metadata leaves the real source unchanged');
  assert(root.textContent.includes('Apply this configuration'), 'Metadata instructions require native DA controls');
  assert(!root.textContent.includes('Verified native saved state'), 'Real metadata intent is never reported as saved');
  click('cancel-handoff');
  assert(root.querySelector('#experiment-form fieldset').disabled, 'Pending metadata locks edits while retaining real verification baseline');
  click('resume-handoff');
  click('verify-native');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('READBACK_MISMATCH'), 'Unapplied settings fail actual model readback');

  const draft = {
    id: 'homepage-headline',
    challengerPath: challenger,
    challengerPercentage: 50,
    status: 'inactive',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
  };
  // Fake native metadata/content edits are separate from all panel actions.
  const configured = prepareExperimentSource(source, draft, page);
  pages.set(control, { html: configured.replace('Keep this content.', 'Lost content.'), revision: '"control-v2"' });
  pages.set(challenger, { html: source.replace('A complete page', 'A different headline'), revision: null });
  click('verify-native');
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('READBACK_MISMATCH'), 'Actual readback rejects lost unrelated source even when experiment fields match');
  pages.set(control, { html: configured, revision: '"control-v2"' });
  click('verify-native');
  await settle();
  assert(root.textContent.includes('Verified native saved state'), 'Saved success requires actual adapter configuration and preservation verification');
  assert(root.textContent.includes('homepage-headline'), 'Verified source settings drive the overview');
  assert(!root.querySelector('[data-action="review-preview"]'), 'Unqualified native preview is not a competing product action');
  assert((await adapter.readPage()).capabilities.preview.available === false, 'Actual native preview capability remains unavailable');
  assert(!root.querySelector('.preview-links'), 'The real adapter never fabricates engine simulation URLs');
  assert(requests.every(({ method }) => method === 'GET'), 'The integrated panel issues only source GETs');
  click('reload');
  await settle();
  assert(root.textContent.includes('homepage-headline'), 'Reload reopens actual saved fake-source configuration');
  click('configure');
  assert(root.querySelector('[name="startDate"]').value === '2026-11-10', 'Saved optional dates survive real model round trip');
  fill('id', 'unsaved-headline');
  rowPreview();
  fill('qaPreviewUrl', `${window.location.origin}/demo/ui?utm_source=demo&experiment=old/control#headline`);
  const beforeQa = requests.length;
  root.querySelector('#qa-form').requestSubmit();
  await settle();
  assert(requests.length === beforeQa + 1, 'Integrated QA makes a fresh independent saved-source GET');
  const qaLinks = [...root.querySelectorAll('.preview-alternatives a')].map((anchor) => new URL(anchor.href));
  assert(qaLinks.length === 2 && qaLinks[0].searchParams.get('experiment') === 'homepage-headline/control', 'Real saved model, not unsaved UI values, drives control QA');
  assert(qaLinks[1].searchParams.get('experiment') === 'homepage-headline/challenger-1', 'Real saved model drives challenger QA');
  assert(qaLinks.every((url) => [...url.searchParams].length === 1 && !url.hash), 'Integrated QA sanitizes visitor query and fragment state');
  assert(root.textContent.includes('Forced assignment. Delivery unverified.'), 'Integrated QA is explicitly delivery-unverified');
  assert(root.querySelector('[data-action="review-preview"]') === null, 'QA configuration does not add a native preview capability');
  assert(root.querySelector('[name="id"]').value === 'unsaved-headline', 'Independent QA source binding preserves local edits');
  click('close-preview');

  pages.set(control, { html: configured, revision: null });
  connection.destroy();
  connection = await mountExperimentation(root, adapter);
  click('configure');
  fill('id', 'pending-old-review');
  root.querySelector('#experiment-form').requestSubmit();
  assert(root.querySelector('[data-action="confirm"]'), 'Null-revision configuration has an explicit pending review');
  click('cancel-review');
  rowPreview();
  fill('qaPreviewUrl', `${window.location.origin}/demo/ui`);
  pages.set(control, { html: prepareVariantSource(configured), revision: null });
  root.querySelector('#qa-form').requestSubmit();
  await settle();
  assert(root.querySelector('[role="alert"]').textContent.includes('saved one-challenger experiment'), 'Removed saved settings cause explicit QA helper failure');
  assert(!root.querySelector('[data-action="confirm"]'), 'Changed null-revision source invalidates old confirmation even when QA helper fails');
  assert(root.querySelector('[form="experiment-form"]').disabled, 'Unreviewed source cannot prepare metadata after failed QA');
  assert(!root.querySelector('.qa-results'), 'Failed QA exposes no links after source removal');
  click('close-preview');
  pages.set(control, { html: configured, revision: '"control-v2"' });
  click('reload');
  click('discard-confirm');
  await settle();
  click('configure');
  fill('id', 'unsaved-headline');

  pages.set(control, {
    html: prepareExperimentSource(configured, { ...draft, id: 'updated-saved-headline' }, page),
    revision: '"control-v3"',
  });
  rowPreview();
  await settle();
  assert(new URL(root.querySelector('.qa-results a').href).searchParams.get('experiment') === 'updated-saved-headline/control', 'QA uses a newly saved experiment ID instead of the earlier snapshot');
  assert(root.textContent.includes('reload before preparing another native handoff'), 'A changed saved source invalidates further authoring review');
  click('close-preview');
  click('reload');
  click('discard-confirm');
  await settle();
  click('configure');
  rowPreview();
  await settle();
  const savedQaSnapshot = await adapter.readPage();
  qaEvidence = {
    qualification: 'GET-only fake DA source host; no native connection or delivery verification',
    fixtureSource: 'tools/experimentation-ui-tests/model-source.html',
    fixtureTransform: 'Page Experiment rows removed, then prepareExperimentSource applied for /demo/ui; saved ID updated to updated-saved-headline',
    page: savedQaSnapshot.page,
    revision: savedQaSnapshot.revision,
    previewUrl: `${window.location.origin}/demo/ui`,
    experiment: savedQaSnapshot.experiment,
    output: buildPreviewLinks({
      previewUrl: `${window.location.origin}/demo/ui`,
      experiment: savedQaSnapshot.experiment,
    }),
  };
  assert(root.querySelector('.preview-primary a').href === qaEvidence.output.controlUrl, 'QA evidence captures actual adapter.readPage output and the displayed helper result');
  assert(document.documentElement.scrollWidth <= window.innerWidth, 'Integrated panel has no horizontal overflow');
  if (new URLSearchParams(window.location.search).get('capture') === 'qa') {
    window.parent.scrollTo(0, 0);
  }
  results.textContent = `${checks.length} integrated assertions passed at ${window.innerWidth}px.\n${checks.join('\n')}`;
  document.body.dataset.result = 'passed';
}

run().catch((error) => {
  results.textContent = `${error.stack}\nPassed before failure:\n${checks.join('\n')}`;
  document.body.dataset.result = 'failed';
}).finally(() => {
  connection?.destroy();
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'ui-fixture-result',
      passed: document.body.dataset.result === 'passed',
      result: results.textContent,
      qaEvidence,
    }, window.location.origin);
  }
});
