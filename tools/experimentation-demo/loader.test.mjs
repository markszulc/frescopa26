import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isExperimentationPreview } from '../../scripts/experiment-loader.js';

test('only local, AEM preview and DA preview hosts enable experimentation authoring', () => {
  [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
    'https://main--frescopa26--markszulc.aem.page',
    'https://feature--frescopa26--markszulc.hlx.page',
    'https://main--frescopa26--markszulc.preview.da.live',
  ].forEach((url) => assert.equal(isExperimentationPreview(new URL(url)), true, url));

  [
    'https://main--frescopa26--markszulc.aem.live',
    'https://www.frescopa.example',
    'https://example.page',
    'https://main--frescopa26--markszulc.preview.da.live.example.com',
  ].forEach((url) => assert.equal(isExperimentationPreview(new URL(url)), false, url));
});
