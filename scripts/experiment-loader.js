/**
 * Includes DA's authoring iframe, which does not use an aem.page hostname.
 * All other hosts, including custom live domains, are treated as production.
 */
export function isExperimentationPreview({ hostname } = window.location) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    || hostname.endsWith('.aem.page')
    || hostname.endsWith('.hlx.page')
    || hostname.endsWith('.preview.da.live');
}

export function isAuthorPreview(location, embedded = false) {
  const url = new URL(location);
  return embedded && url.searchParams.get('controller') === 'parent'
    && url.searchParams.has('quick-edit')
    && (url.hostname.endsWith('.preview.da.live') || url.hostname === 'localhost');
}

const experimentationConfig = {
  isProd: () => !isExperimentationPreview(),
  simulationUI: 'universal-editor',
};

function hasExperimentationMetadata(doc) {
  return doc.head.querySelector('[name^="experiment"], [name^="campaign-"], [name^="audience-"], [property^="campaign:"], [property^="audience:"]')
    || doc.querySelector('main > div[data-experiment]')
    || [...doc.querySelectorAll('.section-metadata > div > div:first-child')]
      .some((cell) => /^(experiment|campaign|audience)(?:$|[-\s:])/i.test(cell.textContent.trim()));
}

/**
 * Run before site decoration consumes section metadata or transforms blocks.
 * Preview also needs the real engine's config handshake on uninstrumented pages.
 */
export async function runExperimentation(doc) {
  if (!isExperimentationPreview() && !hasExperimentationMetadata(doc)) return;
  try {
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    await loadEager(doc, experimentationConfig);
  } catch (error) {
    // Keep the original site rendering, but do not report a fake empty configuration.
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation (eager):', error);
  }
}

export async function runExperimentationLazy(doc) {
  if (!isExperimentationPreview()) return;
  try {
    const { loadLazy } = await import('../plugins/experimentation/src/index.js');
    await loadLazy(doc, experimentationConfig);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation (lazy):', error);
  }
}
