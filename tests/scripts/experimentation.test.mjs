/* eslint-env es2021 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isAuthorPreview,
  runExperimentation,
  runExperimentationLazy,
} from '../../scripts/experiment-loader.js';
import { getExperimentConfig } from '../../scripts/experimentation-preview.js';
import {
  MFE_ORIGIN,
  getPageContext,
  getEditorHash,
  getMfeUrl,
  isMfeMessage,
} from '../../tools/plugins/contextual-experimentation/context.js';

const page = getPageContext({
  org: 'sudo-buddy', repo: 'frescopa26', branch: 'main', path: '/index',
});

test('author preview requires the DA canvas controller, quick edit, and an embedded page', () => {
  const preview = `${page.pageUrl}?controller=parent&quick-edit=on`;
  assert.equal(isAuthorPreview(preview, true), true);
  assert.equal(isAuthorPreview(preview, false), false);
  assert.equal(isAuthorPreview(page.pageUrl, true), false);
  assert.equal(isAuthorPreview(`${page.pageUrl}?controller=parent`, true), false);
  assert.equal(isAuthorPreview('https://unrelated.example/?controller=parent&quick-edit=on', true), false);
  assert.equal(isAuthorPreview('http://localhost:3000/?controller=parent&quick-edit=on', true), true);
});

test('ordinary pages skip both phases and eager failures leave page rendering available', async (t) => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  const win = { location: new URL('http://localhost:3000/') };
  win.parent = win;
  globalThis.window = win;
  const doc = {
    head: { querySelector: () => null },
    body: { dataset: {} },
    querySelectorAll: () => [],
  };
  assert.equal(await runExperimentation(doc, {}), false);
  assert.equal(await runExperimentationLazy(doc, {}), false);

  const failure = new Error('Test engine initialization failure');
  doc.head.querySelector = () => ({});
  doc.head.querySelectorAll = () => { throw failure; };
  globalThis.document = doc;
  const errors = t.mock.method(console, 'error', () => {});
  assert.equal(await runExperimentation(doc, {}), false);
  assert.equal(errors.mock.callCount(), 1);
  assert.equal(errors.mock.calls[0].arguments[1], failure);
  assert.equal(await runExperimentationLazy(doc, {}), false);
});

test('empty DA canvas pages initialize the real engine but block its legacy wildcard handshake', async (t) => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  const win = {
    location: new URL(`${page.pageUrl}?controller=parent&quick-edit=on`),
    parent: {},
    hlx: {},
    addEventListener: t.mock.fn(),
  };
  const doc = {
    head: { querySelectorAll: () => [] },
    body: { dataset: {} },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  globalThis.window = win;
  globalThis.document = doc;
  const options = { prodHost: 'main--frescopa26--sudo-buddy.aem.live' };
  assert.equal(await runExperimentation(doc, options), true);
  assert.equal(win.hlx.experimentation.version, '2.0.0');
  assert.deepEqual(win.hlx.experiments, []);
  assert.equal(await runExperimentationLazy(doc, options), true);
  const guard = win.addEventListener.mock.calls.find(({ arguments: args }) => args[2] === true)
    .arguments[1];
  const stop = t.mock.fn();
  guard({ data: { type: 'hlx:experimentation-get-config' }, stopImmediatePropagation: stop });
  assert.equal(stop.mock.callCount(), 1);
  guard({ data: { type: 'da:contextual-experimentation' }, stopImmediatePropagation: stop });
  assert.equal(stop.mock.callCount(), 1);
});

test('DA context resolves the actual code branch and keeps navigation inside this site', () => {
  assert.equal(page.pageUrl, 'https://main--frescopa26--sudo-buddy.preview.da.live/index');
  assert.equal(
    getEditorHash('/variants/new.html?experiment=test#section', page),
    '/sudo-buddy/frescopa26/variants/new',
  );
  assert.equal(getEditorHash('/', page), '/sudo-buddy/frescopa26/index');
  [
    'https://unrelated.example/variant',
    '//unrelated.example/variant',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    `https://user:password@${new URL(page.origin).hostname}/variant`,
  ].forEach((href) => assert.throws(() => getEditorHash(href, page), /outside this DA site/));
  assert.throws(() => getPageContext({ org: 'sudo-buddy', repo: 'frescopa26' }), /code branch/);
});

test('MFE credentials travel only in the production iframe fragment', () => {
  const url = new URL(getMfeUrl({
    pageUrl: page.pageUrl,
    origin: 'http://localhost:3000',
    token: 'test-token-not-a-credential',
    imsOrg: '123ABC@AdobeOrg',
  }));
  assert.equal(url.origin, MFE_ORIGIN);
  assert.equal(url.search, '');
  const data = JSON.parse(atob(decodeURIComponent(url.hash.slice('#ue-data='.length))));
  assert.equal(data.env, 'prod');
  assert.equal(data.pageUrl, page.pageUrl);
  assert.equal(data.imsToken, 'test-token-not-a-credential');
  assert.throws(() => getMfeUrl({ token: 'test', imsOrg: 'invalid' }), /organization ID/);
});

test('MFE messages require both the production origin and the actual iframe window', () => {
  const frame = { contentWindow: {} };
  const event = {
    origin: MFE_ORIGIN,
    source: frame.contentWindow,
    data: { source: 'AEMExperimentation' },
  };
  assert.equal(isMfeMessage(event, frame), true);
  assert.equal(isMfeMessage({ ...event, origin: 'https://unrelated.example' }, frame), false);
  assert.equal(isMfeMessage({ ...event, source: {} }, frame), false);
  assert.equal(isMfeMessage({ ...event, data: {} }, frame), false);
});

test('preview configuration excludes unrelated runtime namespace fields', () => {
  const namespace = {
    experimentation: { version: '2.0.0' },
    experiments: [{ config: { id: 'hero' } }],
    campaigns: [],
    audiences: [],
    unrelated: { privateValue: 'must-not-be-sent' },
  };
  const config = getExperimentConfig(namespace, 'www.example.com');
  assert.equal(config.unrelated, undefined);
  assert.deepEqual(config.experiments, namespace.experiments);
  config.experiments[0].config.id = 'changed';
  assert.equal(namespace.experiments[0].config.id, 'hero');
});
