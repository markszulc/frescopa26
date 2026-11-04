import { execFile } from 'node:child_process';
import {
  mkdtemp, readFile, writeFile, rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const fixtureRoot = '/drafts/experimentation-runtime';
const publicSite = 'https://main--frescopa26--markszulc.aem.page/';
const run = promisify(execFile);
const helperPath = fileURLToPath(new URL('../coworker-experimentation/scripts/experimentation.py', import.meta.url));

async function helper(...args) {
  const { stdout } = await run('python3', [helperPath, ...args], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  return JSON.parse(stdout);
}

function addExperiment(section, metadata) {
  const end = section.lastIndexOf('</div>');
  const rows = Object.entries(metadata).map(([key, value]) => {
    const cell = key === 'Experiment Variants' ? `<a href="${value}">${value}</a>` : value;
    return `<div><div>${key}</div><div>${cell}</div></div>`;
  }).join('\n');
  return `${section.slice(0, end)}<div class="section-metadata">${rows}</div>${section.slice(end)}`;
}

export function deliveredExport(section, head = '') {
  return `<!doctype html><html><head>${head}</head><body><header></header><main>${section}</main><footer></footer></body></html>`;
}

export default async function createFixtures(origin = 'http://127.0.0.1:3001') {
  const raw = await readFile(new URL('../../drafts/experimentation-runtime/index.plain.html', import.meta.url), 'utf8');
  const head = await readFile(new URL('../../head.html', import.meta.url), 'utf8');
  const original = raw.replaceAll('./media_', `${publicSite}media_`);
  const hero = original.slice(0, original.indexOf('<div class="intro">'));
  const cards = original.slice(original.indexOf('<div class="feed">'), original.indexOf('<div class="sustain">'));
  if (!hero.includes('Every<br>morning,<br>perfected.')
    || !cards.includes('The house pour')
    || !cards.includes('New favourites, found for you.')) {
    throw new Error('Public homepage fixture no longer matches the Hero/cards-product contract.');
  }
  const heroChallenger = hero.replace('Every<br>morning,<br>perfected.', 'Your morning,<br>made yours.');
  const peerExport = await readFile(new URL('../coworker-experimentation/fixtures/cards-challenger.html', import.meta.url), 'utf8');
  const cardsChallenger = `${peerExport.match(/<main>\s*([\s\S]*?)\s*<\/main>/)?.[1] || ''}\n`
    .replaceAll('./media_', `${publicSite}media_`);
  const temporary = await mkdtemp(join(tmpdir(), 'frescopa-helper-'));
  try {
    const pageUrl = `${origin}${fixtureRoot}/control`;
    const heroMetadata = await helper(
      'metadata',
      '--page-url',
      pageUrl,
      '--experiment-id',
      'atelier-hero',
      '--challenger-url',
      `${origin}${fixtureRoot}/hero-challenger`,
    );
    const snapshot = join(temporary, 'sections.json');
    await writeFile(snapshot, JSON.stringify({
      hero: heroMetadata.metadata, products: { style: 'feed' },
    }));
    const cardsMetadata = await helper(
      'metadata',
      '--page-url',
      pageUrl,
      '--experiment-id',
      'house-pour-copy',
      '--challenger-url',
      `${origin}${fixtureRoot}/cards-challenger`,
      '--sections',
      snapshot,
      '--target',
      'products',
    );
    const baseline = join(temporary, 'baseline.html');
    await writeFile(baseline, deliveredExport(original, head));
    const validations = [];
    for (const [block, name, section] of [
      ['hero', 'hero-challenger', heroChallenger],
      ['cards-product', 'cards-challenger', cardsChallenger],
    ]) {
      const path = join(temporary, `${name}.html`);
      await writeFile(path, deliveredExport(section, head));
      const result = await helper(
        'validate-challenger',
        path,
        '--block',
        block,
        '--baseline',
        baseline,
        '--baseline-format',
        'delivered-main',
        '--input-format',
        'delivered-main',
      );
      validations.push({ path: `${fixtureRoot}/${name}`, ...result });
    }
    const previews = [];
    for (const heroVariant of ['control', 'challenger-1']) {
      for (const cardVariant of ['control', 'challenger-1']) {
        const preview = await helper(
          'preview',
          '--page-url',
          `${pageUrl}?rum=off#new-favourites-found-for-you`,
          '--assignment',
          `atelier-hero/${heroVariant}`,
          '--assignment',
          `house-pour-copy/${cardVariant}`,
          '--paired-compatible',
        );
        previews.push({ hero: heroVariant, card: cardVariant, ...preview });
      }
    }
    return {
      head,
      pages: new Map([
        ['original', original],
        ['control', original
          .replace(hero, addExperiment(hero, heroMetadata.metadata))
          .replace(cards, addExperiment(cards, cardsMetadata.metadata))],
        ['hero-challenger', heroChallenger],
        ['cards-challenger', cardsChallenger],
      ]),
      proof: {
        hero: heroMetadata, cards: cardsMetadata, validations, previews,
      },
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
