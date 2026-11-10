import { runExperimentation, runExperimentationLazy } from '../../scripts/experiment-loader.js';
import { decorateSections, decorateBlocks, loadBlock } from '../../scripts/aem.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function mainFrom(name) {
  const response = await fetch(`/drafts/experimentation-runtime/${name}`);
  assert(response.ok, `Fixture ${name} is available`);
  return new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('main');
}

function requestConfig() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('No v2 config reply')), 1000);
    const listener = ({ data }) => {
      if (data?.type !== 'hlx:experimentation-config') return;
      window.removeEventListener('message', listener);
      clearTimeout(timeout);
      resolve(data);
    };
    window.addEventListener('message', listener);
    window.postMessage({ type: 'hlx:experimentation-get-config' }, window.location.origin);
  });
}

async function decorate(main) {
  main.querySelectorAll('.section-metadata').forEach((meta) => meta.remove());
  decorateSections(main);
  decorateBlocks(main);
  await Promise.all([...main.querySelectorAll('.hero, .cards-product')].map(loadBlock));
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function checkVariants() {
  const proofResponse = await fetch('/tools/experimentation-demo/proof.json');
  assert(proofResponse.ok, 'Real helper proof is available');
  const proof = await proofResponse.json();
  const baselineResponse = await fetch('/drafts/experimentation-runtime/original');
  const baselineHash = await sha256(await baselineResponse.text());
  for (const validation of proof.validations) {
    const response = await fetch(validation.path);
    assert(response.ok, 'Actual served challenger is available');
    const html = await response.text();
    assert(await sha256(html) === validation.candidate_sha256, 'Helper validated exact served export bytes');
    assert(baselineHash === validation.baseline_sha256, 'Helper compared exact served baseline bytes');
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    assert(parsed.querySelectorAll('main').length === 1 && parsed.querySelectorAll('main > div').length === 1, 'Single-section full HTML export');
    assert(parsed.head.querySelector('script') && parsed.head.querySelector('link'), 'Actual site head is present but not executed');
  }
  const original = await mainFrom('original');
  const baseline = original.cloneNode(true);
  document.body.append(baseline);
  await decorate(baseline);
  const baseCards = [...baseline.querySelectorAll('.cards-product li')];
  const baseHero = baseline.querySelector('.hero').outerHTML;
  const cardHead = baseline.querySelector('.feed .default-content-wrapper').outerHTML;
  const baseSections = [...baseline.children].map((section) => section.outerHTML);
  baseline.remove();
  for (const { hero, card, candidate_url: candidate } of proof.previews) {
    const main = await mainFrom('control');
    document.body.append(main);
    const url = new URL(candidate);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    await runExperimentation(document);
    assert(window.hlx.experiments.length === 2, 'Two independent experiments');
    window.hlx.experiments.forEach(({ type, config }) => {
      assert(type === 'section', 'No page/fragment scope substitution');
      assert(config.variants.control.percentageSplit === '0.5000', '50% control');
      assert(config.variants['challenger-1'].percentageSplit === '0.5000', '50% challenger');
      assert(config.status === 'Inactive' && config.run, 'Forced preview runs without activating draft metadata');
      const selected = config.id === 'atelier-hero' ? hero : card;
      assert(config.selectedVariant === selected, 'Generated paired URL selects the exact requested variant');
    });
    await decorate(main);
    const cards = [...main.querySelectorAll('.cards-product li')];
    assert(cards.length === 3, 'All three authored cards remain');
    assert(main.querySelector('.feed .default-content-wrapper').outerHTML === cardHead, 'Section heading and intro unchanged');
    assert(cards[1].outerHTML === baseCards[1].outerHTML, 'Tea unchanged');
    assert(cards[2].outerHTML === baseCards[2].outerHTML, 'Juice unchanged');
    ['.cards-product-card-image', '.cards-product-card-foot'].forEach((selector) => {
      assert(
        cards[0].querySelector(selector).outerHTML
            === baseCards[0].querySelector(selector).outerHTML,
        `Coffee image and purchase footer unchanged: ${selector}`,
      );
    });
    const expectedCoffee = card === 'control' ? baseCards[0].outerHTML : baseCards[0].outerHTML
      .replace('The house pour', 'Your next everyday favourite')
      .replace(
        "Our everyday blend, coaxed a little rounder for the season. The one you'll reach for on autopilot.",
        'A round, balanced blend for the cup you look forward to each morning.',
      );
    assert(cards[0].outerHTML === expectedCoffee, 'Only Coffee heading/body change');
    assert(cards[0].querySelector('h3').textContent === (card === 'control' ? 'The house pour' : 'Your next everyday favourite'), 'Coffee headline');
    const expectedHero = hero === 'control' ? baseHero
      : baseHero.replace('Every<br>morning,<br>perfected.', 'Your morning,<br>made yours.');
    assert(main.querySelector('.hero').outerHTML === expectedHero, 'Hero changes independently and retains CTA');
    assert(main.children.length === original.children.length, 'All original sections retained');
    [...main.children].forEach((section, index) => {
      if (index !== 0 && index !== 4) {
        assert(section.outerHTML === baseSections[index], `Untargeted section ${index} unchanged`);
      }
    });
    main.remove();
  }
  assert(
    !performance.getEntriesByType('resource').some(({ name }) => /\/scripts\/(scripts|commerce)\.js$/.test(name)),
    'Fetched export head scripts are not loaded or executed by section replacement',
  );
}

async function checkInactive() {
  const baseline = await mainFrom('original');
  document.body.append(baseline);
  await decorate(baseline);
  const hero = baseline.querySelector('.hero').outerHTML;
  const cards = baseline.querySelector('.cards-product').outerHTML;
  baseline.remove();
  const main = await mainFrom('control');
  document.body.append(main);
  await runExperimentation(document);
  assert(window.hlx.experiments.length === 2, 'Both inactive configurations are readable');
  window.hlx.experiments.forEach(({ config, el }) => {
    assert(config.status === 'Inactive' && !config.run, 'Unforced inactive draft does not run');
    assert(el.dataset.variant === 'control', 'Unforced traffic stays on control');
  });
  await decorate(main);
  assert(main.querySelector('.hero').outerHTML === hero, 'Unforced Hero stays unchanged');
  assert(main.querySelector('.cards-product').outerHTML === cards, 'Unforced three cards stay unchanged');
  assert(!performance.getEntriesByType('resource').some(({ name }) => /\/(hero|cards)-challenger$/.test(name)), 'Unforced inactive traffic does not fetch challengers');
  assert(!sessionStorage.getItem('unified-decisioning-experiments'), 'Inactive traffic creates no variant assignment');
}

async function checkLegacy() {
  const main = await mainFrom('legacy');
  document.body.append(main);
  await runExperimentation(document);
  assert(window.hlx.experiments.length === 2, 'Legacy section metadata remains supported');
}

async function checkPartialAttributes() {
  const main = await mainFrom('partial');
  document.body.append(main);
  await runExperimentation(document);
  assert(window.hlx.experiments.length === 2, 'Partial exported attributes do not suppress complete legacy metadata');
}

async function checkMixed() {
  const main = await mainFrom('mixed');
  document.body.append(main);
  await runExperimentation(document);
  assert(window.hlx.experiments.length === 2, 'Mixed metadata registers each section once');
  window.hlx.experiments.forEach(({ config }) => {
    assert(config.status === 'Inactive' && !config.run, 'Exported attributes take precedence over legacy metadata');
  });
  assert(!performance.getEntriesByType('resource').some(({ name }) => /\/(hero|cards)-challenger$/.test(name)), 'Inactive exported metadata does not fetch challengers');
}

async function checkCustomPrefix() {
  const main = await mainFrom('custom');
  document.body.append(main);
  const { loadEager } = await import('../../plugins/experimentation/src/index.js');
  await loadEager(document, {
    experimentsMetaTagPrefix: 'test-experiment',
    experimentsQueryParameter: 'test-experiment',
    simulationUI: false,
  });
  assert(window.hlx.experiments.length === 2, 'Configured prefixes discover exported section metadata');
}

async function checkProduction() {
  document.body.append(await mainFrom('original'));
  await runExperimentation(document);
  await runExperimentationLazy(document);
  assert(
    !performance.getEntriesByType('resource').some(({ name }) => name.includes('/plugins/experimentation/')),
    'No experimentation download for an uninstrumented production page',
  );
  assert(!window.hlx.experimentation, 'No production authoring handshake initialization');
}

async function checkProductionMetadata() {
  document.body.append(await mainFrom('control'));
  await runExperimentation(document);
  assert(window.hlx.experiments.length === 2, 'Production discovers exported experiment metadata');
  assert(
    performance.getEntriesByType('resource').some(({ name }) => name.includes('/plugins/experimentation/')),
    'Production imports the engine when exported experiment metadata is present',
  );
}

async function checkProductionOutsideMetadata() {
  document.body.dataset.experiment = 'not-a-section';
  document.body.append(await mainFrom('original'));
  await runExperimentation(document);
  assert(
    !performance.getEntriesByType('resource').some(({ name }) => name.includes('/plugins/experimentation/')),
    'Production ignores exported experiment attributes outside direct main sections',
  );
}

async function checkGeometry() {
  assert(window.innerWidth === 1280 && window.innerHeight === 720, 'Exact 1280x720 content viewport');
  const main = await mainFrom('control');
  document.body.append(main);
  const { default: renderPreview } = await import('./preview.js');
  await renderPreview(main);
  const headline = main.querySelector('.hero h1');
  const heroRect = headline.getBoundingClientRect();
  assert(
    heroRect.width > 0 && heroRect.top >= 0 && heroRect.bottom < window.innerHeight,
    `Hero headline above fold (${window.innerWidth}x${window.innerHeight}): ${JSON.stringify(heroRect.toJSON())}`,
  );
  const coffee = main.querySelector('.cards-product li h3');
  const beforeScroll = coffee.getBoundingClientRect();
  assert(beforeScroll.top > window.innerHeight, 'Lower Coffee card starts below fold');
  coffee.scrollIntoView({ block: 'center', behavior: 'instant' });
  const afterScroll = coffee.getBoundingClientRect();
  assert(afterScroll.top >= 0 && afterScroll.bottom <= window.innerHeight, 'Coffee target visible after scrolling');
  assert(document.elementFromPoint(afterScroll.x + 5, afterScroll.y + 5) === coffee, 'Coffee target not hidden or covered');
}

async function checkEmpty() {
  document.body.append(await mainFrom('original'));
  await runExperimentation(document);
  const { config, source } = await requestConfig();
  assert(source === 'index-js', 'Actual engine owns handshake');
  assert(config.experimentation.version === '2.0.0', 'Pinned engine version');
  ['experiments', 'audiences', 'campaigns'].forEach((key) => {
    assert(Array.isArray(config[key]) && config[key].length === 0, `Empty ${key} readback`);
  });
  await runExperimentationLazy(document);
  assert(!performance.getEntriesByType('resource').some(({ name }) => name.endsWith('/simulation.js')), 'UE mode does not fetch Sidekick UI');
}

async function checkError() {
  document.body.append(await mainFrom('original'));
  const errors = [];
  const log = console.error;
  console.error = (...args) => { errors.push(args); log(...args); };
  try {
    await runExperimentation(document);
  } finally {
    console.error = log;
  }
  assert(errors.length === 1 && errors[0][0].includes('experimentation'), 'Loader error is explicit');
  assert(!window.hlx.experiments, 'Failure does not manufacture empty experiment config');
  let replied = false;
  window.addEventListener('message', ({ data }) => {
    if (data?.type === 'hlx:experimentation-config') replied = true;
  });
  window.postMessage({ type: 'hlx:experimentation-get-config' }, window.location.origin);
  await new Promise((resolve) => { setTimeout(resolve, 100); });
  assert(!replied, 'Failure does not install a success-shaped empty config handshake');
}

try {
  document.documentElement.dataset.viewportHeight = window.innerHeight;
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'variants') await checkVariants();
  else if (mode === 'inactive') await checkInactive();
  else if (mode === 'legacy') await checkLegacy();
  else if (mode === 'partial') await checkPartialAttributes();
  else if (mode === 'mixed') await checkMixed();
  else if (mode === 'custom-prefix') await checkCustomPrefix();
  else if (mode === 'empty') await checkEmpty();
  else if (mode === 'error') await checkError();
  else if (mode === 'production') await checkProduction();
  else if (mode === 'production-metadata') await checkProductionMetadata();
  else if (mode === 'production-outside-metadata') await checkProductionOutsideMetadata();
  else if (mode === 'geometry') await checkGeometry();
  else throw new Error(`Unknown test mode: ${mode}`);
  document.documentElement.dataset.result = 'passed';
  document.body.innerHTML = '<pre id="results">All runtime assertions passed.</pre>';
} catch (error) {
  document.documentElement.dataset.result = 'failed';
  const result = document.createElement('pre');
  result.id = 'results';
  result.textContent = error.stack;
  document.body.replaceChildren(result);
}
