import assert from 'node:assert/strict';
import { test } from 'node:test';
import createFixtures from './fixtures.mjs';

test('real helper CLI produces inactive site metadata, validated exports and paired preview URLs', async () => {
  const { pages, proof } = await createFixtures('http://127.0.0.1:3001');
  assert.ok(pages.get('control').includes('Experiment Status'));
  assert.equal(proof.hero.metadata['Experiment Status'], 'Inactive');
  assert.equal(proof.cards.metadata['Experiment Status'], 'Inactive');
  assert.deepEqual(proof.cards.sections.hero, proof.hero.metadata);
  assert.equal(proof.cards.sections.products.style, 'feed');
  [proof.hero, proof.cards].forEach((result) => {
    assert.equal(result.backend_written, false);
    assert.deepEqual(result.allocation, { control: 50, 'challenger-1': 50 });
  });
  proof.validations.forEach((result) => {
    assert.equal(result.validation, 'baseline-preservation');
    assert.equal(result.sections, 1);
    assert.equal(result.runtime_verified, false);
    assert.equal(result.resource_verified, false);
    assert.equal(result.backend_written, false);
  });
  assert.deepEqual(proof.validations.map(({ block }) => block), ['hero', 'cards-product']);
  assert.equal(proof.previews.length, 4);
  proof.previews.forEach(({ hero, card, candidate_url: candidate }) => {
    const url = new URL(candidate);
    assert.equal(url.pathname, '/drafts/experimentation-runtime/control');
    assert.equal(url.searchParams.get('rum'), 'off');
    assert.deepEqual(url.searchParams.getAll('experiment'), [
      `atelier-hero/${hero}`, `house-pour-copy/${card}`,
    ]);
  });
});
