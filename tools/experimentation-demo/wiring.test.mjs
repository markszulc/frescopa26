import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('site resolves variants before Commerce initialization and site decoration', async () => {
  const source = await readFile(new URL('../../scripts/scripts.js', import.meta.url), 'utf8');
  const eager = source.slice(source.indexOf('async function loadEager('), source.indexOf('async function loadLazy('));
  const experiment = eager.indexOf('await runExperimentation(doc)');
  assert.ok(experiment >= 0);
  assert.ok(experiment < eager.indexOf('await initializeCommerce()'));
  assert.ok(experiment < eager.indexOf('decorateMain(main)'));
  assert.match(eager, /if \(commerceReady\)[\s\S]*await loadCommerceEager\(\)/);

  const lazy = source.slice(source.indexOf('async function loadLazy('));
  assert.ok(lazy.indexOf('await runExperimentationLazy(doc)') > lazy.indexOf('await loadSections(main)'));
  assert.match(lazy, /if \(commerceReady\) await loadCommerceLazy\(\)/);
});
