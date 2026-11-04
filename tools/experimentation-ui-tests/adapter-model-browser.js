import {
  prepareExperimentSource, prepareVariantSource, readExperiment, validateExperimentDraft,
  verifyExperimentSource, verifyVariantSource,
} from '../plugins/experimentation/experiment-model.js';
import { createDaExperimentationAdapter } from '../plugins/experimentation/da-adapter.js';

const source = await (await fetch(new URL('./model-source.html', import.meta.url))).text();
const page = { org: 'markszulc', repo: 'frescopa26', path: '/drafts/control' };
const results = [];
const draft = {
  id: 'morning-copy',
  challengerPath: '/drafts/challenger',
  challengerPercentage: 50,
  status: 'inactive',
};

function equal(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected ${JSON.stringify(expected)}\nGot ${JSON.stringify(actual)}`);
  }
}

async function check(name, run) {
  await run();
  results.push(name);
}

async function rejects(run, code, operation) {
  let caught;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  if (!caught) throw new Error(`Expected ${code}, but the operation succeeded`);
  equal(caught.code, code, 'Error code');
  if (operation) equal(caught.operation, operation, 'Failed operation');
  equal(caught.sourceSaved, false, 'Must not report a saved source');
  return caught;
}

await check('reads saved native source without treating section metadata as page metadata', () => {
  equal(readExperiment(source, page), {
    id: 'morning-copy',
    challengerPath: '/drafts/challenger',
    challengerPercentage: 50,
    status: 'inactive',
  }, 'Page experiment');
});

await check('a split with exponent notation is refused instead of disagreeing with engine parseFloat', () => (
  rejects(() => readExperiment(source.replace('<p>50</p>', '<p>5e1</p>'), page), 'UNSUPPORTED_EXPERIMENT')
));

await check('prepares inactive 50/50 Metadata while preserving every unrelated DOM node', () => {
  const updatedDraft = {
    id: 'new-copy',
    challengerPath: '/drafts/another',
    challengerPercentage: 50,
    status: 'inactive',
    startDate: '2026-11-05',
    endDate: '2026-11-10',
  };
  const prepared = prepareExperimentSource(source, updatedDraft, page);
  equal(readExperiment(prepared, page), updatedDraft, 'Prepared experiment');
  const original = new DOMParser().parseFromString(source, 'text/html');
  const updated = new DOMParser().parseFromString(prepared, 'text/html');
  const untouched = [
    'header', 'footer', '.hero', '.section-metadata', 'table', '.da-metadata',
    '.metadata > div:nth-child(1)', '.metadata > div:nth-child(2)',
    '.metadata > div:nth-child(7)', '.metadata > div:nth-child(8)',
  ];
  untouched.forEach((selector) => equal(
    updated.querySelector(selector).outerHTML,
    original.querySelector(selector).outerHTML,
    `Preserved ${selector}`,
  ));
});

await check('a full-page challenger candidate strips only page-level Experiment rows', () => {
  const prepared = prepareVariantSource(source);
  equal(readExperiment(prepared, page), null, 'Challenger must not reapply the control experiment');
  const original = new DOMParser().parseFromString(source, 'text/html');
  const updated = new DOMParser().parseFromString(prepared, 'text/html');
  original.querySelectorAll('.metadata > div').forEach((row) => {
    if (row.children[0].textContent.startsWith('Experiment')) row.remove();
  });
  equal(updated.body.outerHTML, original.body.outerHTML, 'Entire page outside experiment rows');
  equal(updated.querySelectorAll('main > div').length, 2, 'Both sections remain');
});

function host(replies, context = page) {
  const requests = [];
  const actions = {
    daFetch: async (url, options) => {
      requests.push({ url, options });
      const reply = replies.shift();
      if (!reply) throw new Error('Unexpected request');
      if (reply instanceof Error) throw reply;
      return new Response(reply.body ?? source, {
        status: reply.status || 200,
        headers: { 'content-type': 'text/html', ...reply.headers },
      });
    },
  };
  return {
    adapter: createDaExperimentationAdapter({ context, actions }),
    requests,
  };
}

await check('accepts the native Canvas host payload and preserves its editor route', async () => {
  const context = {
    org: 'markszulc',
    repo: 'frescopa26',
    site: 'frescopa26',
    path: '/beverages/coffee',
    view: 'canvas',
  };
  const { adapter, requests } = host([
    {}, {}, { status: 404 }, {}, { body: prepareVariantSource(source) },
    {}, { body: prepareExperimentSource(source, draft, context) },
    { body: prepareVariantSource(source) },
  ], context);
  const snapshot = await adapter.readPage();
  equal(snapshot.page.editorUrl, 'https://da.live/canvas#/markszulc/frescopa26/beverages/coffee', 'Canvas control route');
  equal(requests[0].url, 'https://admin.da.live/source/markszulc/frescopa26/beverages/coffee.html', 'Explicit Canvas identity drives source GET');
  const copy = await adapter.prepareVariant({
    destinationPath: '/beverages/coffee-challenger', expectedRevision: null,
  });
  equal(copy.editorUrl, snapshot.page.editorUrl, 'Copy opens the Canvas control');
  const verified = await adapter.verifyVariant({
    destinationPath: '/beverages/coffee-challenger', expectedRevision: null,
  });
  equal(verified.page.editorUrl, 'https://da.live/canvas#/markszulc/frescopa26/beverages/coffee-challenger', 'Verified copy stays in Canvas');
  const configuration = await adapter.prepareExperiment({ draft, expectedRevision: null });
  equal(configuration.editorUrl, snapshot.page.editorUrl, 'Metadata handoff stays in Canvas');
  equal((await adapter.verifyExperiment()).page.editorUrl, snapshot.page.editorUrl, 'Config readback keeps Canvas identity');
  equal(requests.every(({ options }) => options.method === 'GET'), true, 'Canvas operations never write native source');
});

await check('accepts explicit legacy edit context and rejects invalid native identity or views', async () => {
  const context = { ...page, site: page.repo, view: 'edit' };
  const { adapter } = host([{}], context);
  equal((await adapter.readPage()).page.editorUrl, 'https://da.live/edit#/markszulc/frescopa26/drafts/control', 'Legacy edit route preserved');
  const invalid = [
    { ...context, view: 'browse' }, { ...context, view: 'preview' },
    { ...context, view: 'canvas/other' }, { ...context, view: '' },
    { ...context, view: null }, { ...context, view: false },
    { ...context, repo: 'another-site' }, { ...context, org: undefined },
    { ...context, repo: undefined, site: undefined }, { ...context, path: undefined },
  ];
  const actions = { daFetch: () => { throw new Error('Invalid context must not fetch'); } };
  for (const candidate of invalid) {
    await rejects(() => createDaExperimentationAdapter({ context: candidate, actions }), 'INVALID_CONTEXT');
  }
  for (const path of ['/beverages/../coffee', '/beverages/%2e%2e/coffee', '//other/page', 'https://other.example/page']) {
    await rejects(() => createDaExperimentationAdapter({
      context: { ...context, view: 'canvas', path }, actions,
    }), 'INVALID_PATH');
  }
});

await check('reads the content namespace through SDK daFetch and exposes honest capabilities', async () => {
  const { adapter, requests } = host([{ headers: { etag: '"server-1"' } }]);
  const snapshot = await adapter.readPage();
  equal(snapshot.page, { ...page, editorUrl: 'https://da.live/edit#/markszulc/frescopa26/drafts/control' }, 'DA page identity');
  equal(snapshot.sourceHtml, source, 'Exact saved source');
  equal(snapshot.revision, '"server-1"', 'Authoritative response ETag');
  equal(snapshot.experiment.id, 'morning-copy', 'Experiment read');
  ['createVariant', 'saveExperiment', 'preview'].forEach((operation) => {
    equal(snapshot.capabilities[operation].available, false, `${operation} unavailable`);
    if (!snapshot.capabilities[operation].reason) throw new Error(`${operation} needs a reason`);
  });
  equal(requests.length, 1, 'One source read');
  equal(requests[0].url, 'https://admin.da.live/source/markszulc/frescopa26/drafts/control.html', 'Native source endpoint');
  equal(requests[0].options.cache, 'no-store', 'Fresh source read');
  equal(requests[0].options.method, 'GET', 'No write on read');
});

await check('create/save/preview methods refuse unqualified operations without any SDK mutation', async () => {
  const { adapter, requests } = host([
    { headers: { etag: '"server-1"' } }, { status: 404 },
    { headers: { etag: '"server-1"' } },
    { headers: { etag: '"server-1"' } },
  ]);
  await rejects(() => adapter.createVariant({
    destinationPath: '/drafts/new-challenger',
    expectedRevision: '"server-1"',
  }), 'UNSUPPORTED_SAFE_WRITE', 'createVariant');
  await rejects(() => adapter.saveExperiment({
    draft, expectedRevision: '"server-1"',
  }), 'UNSUPPORTED_SAFE_WRITE', 'saveExperiment');
  await rejects(() => adapter.preview({
    expectedRevision: '"server-1"',
  }), 'UNSUPPORTED_PREVIEW', 'preview');
  equal(requests.length, 4, 'Source reviews and destination probe only');
  equal(requests.every(({ options }) => options.method === 'GET'), true, 'Only GET is allowed');
});

await check('a nullable-revision native copy handoff succeeds only after independent full-source readback', async () => {
  const { adapter, requests } = host([
    {}, {}, { status: 404 }, {}, { body: prepareVariantSource(source) },
  ]);
  const reviewed = await adapter.readPage();
  equal(reviewed.revision, null, 'No invented revision');
  const intent = await adapter.prepareVariant({
    destinationPath: '/drafts/manual-copy', expectedRevision: null,
  });
  equal(intent.destinationPath, '/drafts/manual-copy', 'Exact destination');
  equal(intent.editorUrl, reviewed.page.editorUrl, 'Copy handoff opens the existing control editor');
  equal(intent.instructions[0], 'In native DA, copy the complete reviewed /drafts/control page to /drafts/manual-copy.', 'Instructions retain the exact source and destination');
  if (!intent.instructions.length) throw new Error('Native copy instructions are required');
  equal(intent.page, undefined, 'Preparation cannot claim creation');
  const verified = await adapter.verifyVariant({
    destinationPath: '/drafts/manual-copy', expectedRevision: null,
  });
  equal(verified.page.path, '/drafts/manual-copy', 'Only readback returns a created-page descriptor');
  equal(verified.page.editorUrl, 'https://da.live/edit#/markszulc/frescopa26/drafts/manual-copy', 'Only verified copy navigation opens the challenger');
  equal(verified.revision, null, 'Readback does not invent an atomic revision');
  equal(requests.length, 5, 'Independent control and challenger reads');
  equal(requests.every(({ options }) => options.method === 'GET'), true, 'Manual handoff never writes');
});

await check('configuration handoff is pending intent until saved source and preservation are read back', async () => {
  const expected = { ...draft, id: 'new-native-copy' };
  const configured = prepareExperimentSource(source, expected, page);
  const editedChallenger = prepareVariantSource(source).replace('A complete page', 'A new native headline');
  const { adapter, requests } = host([
    {}, {}, { body: configured, headers: { etag: '"saved-native"' } },
    { body: editedChallenger },
  ]);
  await adapter.readPage();
  const intent = await adapter.prepareExperiment({ draft: expected, expectedRevision: null });
  equal(intent.expectedExperiment, expected, 'Normalized expected configuration');
  equal(intent.editorUrl, 'https://da.live/edit#/markszulc/frescopa26/drafts/control', 'Native control editor');
  if (!intent.metadataText.includes('Experiment Status\tInactive')
    || !intent.metadataText.includes('Experiment Split\t50')) {
    throw new Error('The handoff must include explicit inactive status and challenger percentage');
  }
  equal(intent.sourceSaved, undefined, 'Preparation cannot claim saving');
  const verified = await adapter.verifyExperiment();
  equal(verified.experiment, expected, 'Verified native saved state');
  equal(verified.revision, '"saved-native"', 'Actual saved-source ETag');
  equal(requests.length, 4, 'Readback must independently read both native pages');
  equal(requests.every(({ options }) => options.method === 'GET'), true, 'Configuration handoff never writes');
});

await check('native reads honor omitted active status, aliases and default one-challenger allocation', () => {
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  parsed.querySelectorAll('.metadata > div').forEach((row) => {
    if (['Experiment Status', 'Experiment Split'].includes(row.children[0].textContent)) row.remove();
  });
  equal(readExperiment(parsed.body.outerHTML, page), { ...draft, status: 'active' }, 'Omitted status is active, not inactive');
  equal(readExperiment(source.replace('<p>Inactive</p>', '<p>Off</p>'), page).status, 'inactive', 'Native inactive alias');
  equal(readExperiment(source.replace('<p>Inactive</p>', '<p>On</p>'), page).status, 'active', 'Native active alias');
});

await check('new Metadata is authored without losing complete page content or a full HTML wrapper', () => {
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  parsed.querySelector('.metadata').remove();
  equal(readExperiment(parsed.body.outerHTML, page), null, 'No experiment');
  const wrapped = `<!doctype html><html lang="en"><head><title>Preserve</title></head>${parsed.body.outerHTML}</html>`;
  const configured = prepareExperimentSource(wrapped, draft, page);
  equal(readExperiment(configured, page), draft, 'Inserted Metadata');
  equal(configured.startsWith('<!DOCTYPE html>'), true, 'Preserved doctype');
  equal(new DOMParser().parseFromString(configured, 'text/html').head.innerHTML, '<title>Preserve</title>', 'Preserved head');
});

await check('invalid drafts cannot activate, change allocation, target the control or author bad dates', async () => {
  const invalid = [
    { status: 'active' }, { status: undefined }, { challengerPercentage: 60 },
    { challengerPercentage: '50' }, { id: 'name/with/slashes' },
    { challengerPath: '/drafts/control' }, { startDate: '2026-02-30' },
    { startDate: '2026-11-10', endDate: '2026-11-05' }, { endDate: 'tomorrow' },
  ];
  await Promise.all(invalid.map((change) => rejects(() => validateExperimentDraft({ ...draft, ...change }, page), 'INVALID_DRAFT')));
});

await check('ambiguous and out-of-scope source representations are explicitly refused', async () => {
  const missing = new DOMParser().parseFromString(source, 'text/html');
  missing.querySelector('.metadata').children[2].remove();
  await rejects(() => readExperiment(missing.body.outerHTML, page), 'UNSUPPORTED_EXPERIMENT');
  await rejects(() => readExperiment('<div><h1>A fragment</h1></div>', page), 'UNSUPPORTED_SOURCE');
  await rejects(() => readExperiment('<body><main><p>No native sections</p></main></body>', page), 'UNSUPPORTED_SOURCE');
  await rejects(() => readExperiment(source.replace('<div class="metadata">', '<div class="metadata"><div><div>Experiment</div><div>duplicate</div></div>'), page), 'UNSUPPORTED_EXPERIMENT');
  await rejects(() => readExperiment(source.replace('<div class="metadata">', '<table><tr><td>Metadata</td></tr></table><div class="metadata">'), page), 'UNSUPPORTED_SOURCE');
  await rejects(() => readExperiment(source.replace('href="/drafts/challenger"', 'href="https://elsewhere.example/challenger"'), page), 'UNSUPPORTED_EXPERIMENT');
  await rejects(() => readExperiment(source.replace('<p>50</p>', '<p>50, 50</p>'), page), 'UNSUPPORTED_EXPERIMENT');
  await rejects(() => readExperiment(source.replace('href="/drafts/challenger"', 'href="/drafts/challenger"><span></span></a><a href="/drafts/another"'), page), 'UNSUPPORTED_EXPERIMENT');
});

await check('same-site absolute challenger links resolve to the native page path', () => {
  const absolute = source.replace('href="/drafts/challenger"', 'href="https://demo--frescopa26--markszulc.aem.page/drafts/challenger"');
  equal(readExperiment(absolute, page), draft, 'Same-site absolute reference');
});

await check('readback accepts structural indentation changes but not a truncated or edited copy', async () => {
  const copy = prepareVariantSource(source);
  verifyVariantSource(source, copy.replace(/>\s+</g, '><'));
  await rejects(() => verifyVariantSource(source, copy.replace('<h2>More content</h2>', '')), 'READBACK_MISMATCH');
  await rejects(() => verifyVariantSource(source, copy.replace('Keep this content.', 'Changed too early')), 'READBACK_MISMATCH');
  await rejects(() => verifyVariantSource(source, source), 'READBACK_MISMATCH');
});

await check('configuration readback requires explicit inactive rows and preserves unknown Metadata', async () => {
  const configured = prepareExperimentSource(source, draft, page);
  const absentSplit = new DOMParser().parseFromString(configured, 'text/html');
  absentSplit.querySelectorAll('.metadata > div').forEach((row) => {
    if (row.children[0].textContent === 'Experiment Split') row.remove();
  });
  await rejects(() => verifyExperimentSource(source, absentSplit.body.outerHTML, draft, page), 'READBACK_MISMATCH');
  await rejects(() => verifyExperimentSource(source, configured.replace('Original title &amp; details', 'Lost title'), draft, page), 'READBACK_MISMATCH');
  await rejects(() => verifyExperimentSource(source, configured.replace('<p>true</p>', '<p>false</p>'), draft, page), 'READBACK_MISMATCH');
  await rejects(() => verifyExperimentSource(source, configured.replace('Keep this content.', 'Lost content'), draft, page), 'READBACK_MISMATCH');
  await rejects(() => verifyExperimentSource(source, configured.replace('<p>Inactive</p>', '<p>Active</p>'), draft, page), 'READBACK_MISMATCH');
});

await check('missing/weak revisions never become fake hashes or version-history preconditions', async () => {
  const { adapter } = host([
    { headers: { etag: 'W/"weak"', 'last-modified': 'Wed, 04 Nov 2026 10:00:00 GMT' } },
    { headers: { etag: 'not-an-etag' } },
  ]);
  equal((await adapter.readPage()).revision, null, 'Weak ETag is not a strong revision');
  equal((await adapter.readPage()).revision, null, 'Opaque local string is not a source ETag');
  await rejects(() => adapter.saveExperiment({ draft, expectedRevision: 'local-hash' }), 'UNSUPPORTED_REVISION', 'saveExperiment');
});

await check('denied, missing and failed native reads retain typed operation/status errors', async () => {
  await Promise.all([
    [401, 'ACCESS_DENIED'], [403, 'ACCESS_DENIED'], [404, 'PAGE_NOT_FOUND'], [500, 'SOURCE_READ_FAILED'],
  ].map(async ([status, code]) => {
    const { adapter } = host([{ status }]);
    const error = await rejects(() => adapter.readPage(), code, 'readPage');
    equal(error.status, status, 'Native HTTP status');
  }));
  const { adapter } = host([new Error('Offline')]);
  const offline = await rejects(() => adapter.readPage(), 'SOURCE_READ_FAILED', 'readPage');
  equal(offline.cause.message, 'Offline', 'Network cause is not swallowed');
});

await check('source ETag changes refuse automated create/save/preview before any write', async () => {
  const { adapter, requests } = host([
    { headers: { etag: '"server-2"' } },
    { headers: { etag: '"server-2"' } },
    { headers: { etag: '"server-2"' } },
  ]);
  await rejects(() => adapter.createVariant({ destinationPath: '/drafts/unused', expectedRevision: '"server-1"' }), 'STALE_REVISION', 'createVariant');
  await rejects(() => adapter.saveExperiment({ draft, expectedRevision: '"server-1"' }), 'STALE_REVISION', 'saveExperiment');
  await rejects(() => adapter.preview({ expectedRevision: '"server-1"' }), 'STALE_REVISION', 'preview');
  equal(requests.length, 3, 'No destination operation after stale source');
});

await check('native and automated copy flows refuse existing destinations', async () => {
  const { adapter, requests } = host([
    { headers: { etag: '"reviewed"' } },
    { headers: { etag: '"reviewed"' } }, {},
    { headers: { etag: '"reviewed"' } }, {},
  ]);
  await adapter.readPage();
  await rejects(() => adapter.prepareVariant({ destinationPath: '/drafts/occupied', expectedRevision: '"reviewed"' }), 'DESTINATION_EXISTS', 'prepareVariant');
  await rejects(() => adapter.createVariant({ destinationPath: '/drafts/occupied', expectedRevision: '"reviewed"' }), 'DESTINATION_EXISTS', 'createVariant');
  equal(requests.every(({ options }) => options.method === 'GET'), true, 'No overwrite request');
});

await check('a changed source with no ETag invalidates a reviewed manual handoff', async () => {
  const { adapter, requests } = host([{}, { body: source.replace('Keep this content.', 'Concurrent edit') }]);
  await adapter.readPage();
  await rejects(() => adapter.prepareVariant({ destinationPath: '/drafts/new-copy', expectedRevision: null }), 'STALE_REVISION', 'prepareVariant');
  equal(requests.length, 2, 'Source-string comparison is a manual review guard, never a write precondition');
});

await check('a cross-directory native copy cannot silently change relative link/asset meaning', async () => {
  const relative = source.replace('href="/about"', 'href="./about"');
  const { adapter } = host([{ body: relative }, { body: relative }]);
  await adapter.readPage();
  await rejects(() => adapter.prepareVariant({
    destinationPath: '/another-folder/new-copy', expectedRevision: null,
  }), 'UNSUPPORTED_COPY_SOURCE', 'prepareVariant');
});

await check('native readback methods cannot infer success from an unprepared draft or destination', async () => {
  const { adapter, requests } = host([]);
  await rejects(() => adapter.verifyVariant({ destinationPath: '/drafts/new-copy', expectedRevision: null }), 'HANDOFF_REQUIRED', 'verifyVariant');
  await rejects(() => adapter.verifyExperiment(), 'HANDOFF_REQUIRED', 'verifyExperiment');
  await rejects(() => adapter.prepareExperiment({ draft, expectedRevision: null }), 'REVIEW_REQUIRED', 'prepareExperiment');
  equal(requests.length, 0, 'No implicit source operation');
});

await check('existing active experiments remain read-only even through manual configuration handoffs', async () => {
  const active = source.replace('<p>Inactive</p>', '<p>Active</p>');
  const { adapter } = host([{ body: active }, { body: active }]);
  await adapter.readPage();
  await rejects(() => adapter.prepareExperiment({ draft, expectedRevision: null }), 'ACTIVE_EXPERIMENT', 'prepareExperiment');
});

await check('no saved-state success is returned when native Metadata differs from the prepared draft', async () => {
  const { adapter } = host([{}, {}, {}]);
  await adapter.readPage();
  await adapter.prepareExperiment({ draft: { ...draft, id: 'not-saved' }, expectedRevision: null });
  await rejects(() => adapter.verifyExperiment(), 'READBACK_MISMATCH', 'verifyExperiment');
});

await check('failed challenger readback after matching control config remains a real failure', async () => {
  const expected = { ...draft, id: 'saved-control-only' };
  const { adapter } = host([
    {}, {}, { body: prepareExperimentSource(source, expected, page) }, { status: 404 },
  ]);
  await adapter.readPage();
  await adapter.prepareExperiment({ draft: expected, expectedRevision: null });
  await rejects(() => adapter.verifyExperiment(), 'PAGE_NOT_FOUND', 'verifyExperiment');
});

await check('context comes only from the native host, with plugin ref independent of content identity', async () => {
  const unexpectedFetch = () => { throw new Error('Unexpected request'); };
  await rejects(() => createDaExperimentationAdapter({ context: { ...page, repo: 'other', site: page.repo }, actions: { daFetch: unexpectedFetch } }), 'INVALID_CONTEXT');
  await rejects(() => createDaExperimentationAdapter({ context: { ...page, path: '/drafts/../control' }, actions: { daFetch: unexpectedFetch } }), 'INVALID_PATH');
  await rejects(() => createDaExperimentationAdapter({ context: page, actions: {} }), 'UNSUPPORTED_HOST');
  const adapter = createDaExperimentationAdapter({
    context: {
      org: page.org, site: page.repo, path: 'drafts/control.html', ref: 'local', branch: 'demo',
    },
    actions: { daFetch: async () => new Response(source, { headers: { 'content-type': 'text/html' } }) },
  });
  equal((await adapter.readPage()).page.path, page.path, 'Native source path normalized without fork/ref guessing');
});

document.documentElement.dataset.result = 'passed';
document.getElementById('results').textContent = `${results.length} checks passed:\n${results.join('\n')}`;
