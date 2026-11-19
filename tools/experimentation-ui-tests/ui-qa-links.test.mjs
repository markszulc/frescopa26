import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPreviewLinks } from '../plugins/experimentation/qa-links.js';

const experiment = {
  id: 'rail-demo',
  challengerPath: '/drafts/challenger',
  challengerPercentage: 50,
  status: 'inactive',
};

test('QA links use only pinned-engine forced assignments on the supplied visitor page', () => {
  const links = buildPreviewLinks({
    previewUrl: 'https://main--frescopa26--markszulc.aem.page/drafts/control?utm_source=demo&experiment=old/control&rum=off#headline',
    experiment,
  });
  assert.deepEqual(Object.keys(links), ['controlUrl', 'challengerUrl']);
  [links.controlUrl, links.challengerUrl].forEach((value, index) => {
    const url = new URL(value);
    assert.equal(url.origin, 'https://main--frescopa26--markszulc.aem.page');
    assert.equal(url.pathname, '/drafts/control');
    assert.equal(url.hash, '');
    assert.deepEqual([...url.searchParams], [
      ['experiment', `rail-demo/${index ? 'challenger-1' : 'control'}`],
    ]);
  });
});

test('QA supports operator-supplied visitor preview hosts and ordinary local proof URLs', () => {
  [
    'https://main--frescopa26--markszulc.preview.da.live/drafts/control',
    'https://preview.example.com/drafts/control',
    'http://localhost:3001/drafts/control',
    'http://127.0.0.1:3001/drafts/control',
    'http://[::1]:3001/drafts/control',
  ].forEach((previewUrl) => {
    assert.equal(
      new URL(buildPreviewLinks({ previewUrl, experiment }).controlUrl).origin,
      new URL(previewUrl).origin,
    );
  });
  assert.ok(buildPreviewLinks({
    previewUrl: 'https://preview.example.com/page',
    experiment: { ...experiment, status: 'active' },
  }).challengerUrl);
});

test('QA rejects credential-bearing, non-visitor and authoring/controller inputs', () => {
  [
    'https://user:password@preview.example.com/page',
    'https://preview.example.com/page?access_token=secret',
    'https://preview.example.com/page?Authorization=secret',
    'https://preview.example.com/page?api_key=secret',
    'https://preview.example.com/page#access_token=secret',
    'https://da.live/edit#/markszulc/frescopa26/page',
    'https://admin.da.live/source/markszulc/frescopa26/page.html',
    'https://admin.da.live./source/markszulc/frescopa26/page.html',
    'https://da.live./',
    'https://experience.adobe.com./',
    'https://author-p1-e2.adobeaemcloud.com./content/page',
    'https://experience.adobe.com/#/aem/editor',
    'https://author-p1-e2.adobeaemcloud.com/editor.html/content/page',
    'https://preview.example.com/edit#/page',
    'https://preview.example.com/%65dit/page',
    'https://preview.example.com/#/edit?path=page',
    'https://preview.example.com/page?controller=author',
    'https://preview.example.com/page?url=https://da.live/edit',
    'http://example.com/page',
    // eslint-disable-next-line no-script-url -- Explicit unsafe input regression.
    'javascript:alert(1)',
    'file:///tmp/page.html',
    '/relative/page',
  ].forEach((previewUrl) => {
    assert.throws(() => buildPreviewLinks({ previewUrl, experiment }), TypeError, previewUrl);
  });
});

test('QA rejects absent or unsupported experiment state instead of inventing an assignment', () => {
  [null, {}, { ...experiment, id: 'unsafe/name' }, { ...experiment, id: 'Name With Spaces' },
    { ...experiment, challengerPath: '' }, { ...experiment, status: 'draft' },
    { ...experiment, challengerPercentage: NaN }].forEach((value) => {
    assert.throws(() => buildPreviewLinks({
      previewUrl: 'https://preview.example.com/page', experiment: value,
    }), TypeError);
  });
});
