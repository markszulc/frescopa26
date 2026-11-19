import {
  ExperimentationError,
  experimentMetadataRows,
  normalizePagePath,
  readExperiment,
  validateExperimentDraft,
  validateVariantDestination,
  verifyExperimentSource,
  verifyVariantSource,
} from './experiment-model.js';

export { ExperimentationError };

const DA_ADMIN = 'https://admin.da.live';

const UNAVAILABLE = {
  createVariant: 'Native DA copy can overwrite a destination. An atomic create-if-absent operation tied to the reviewed source is not qualified.',
  saveExperiment: 'Conditional HTML source writes and a guarded page-metadata SDK transaction are not qualified. No source was saved.',
  preview: 'Preview of the reviewed saved control and challenger revisions is not qualified. No preview was requested.',
};

function modelOperation(operation, run) {
  try {
    return run();
  } catch (error) {
    if (error instanceof ExperimentationError) error.operation = operation;
    throw error;
  }
}

function pageIdentity(context) {
  const {
    org, repo = context?.site, site, path,
  } = context || {};
  const validName = (name) => typeof name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
  if (!validName(org) || !validName(repo) || (site && site !== repo)
    || typeof path !== 'string' || (context.view && context.view !== 'edit')) {
    throw new ExperimentationError('INVALID_CONTEXT', 'Open a native DA page with an explicit organization, site and document path.');
  }
  const normalized = normalizePagePath(path.startsWith('/') ? path : `/${path}`);
  return Object.freeze({
    org,
    repo,
    path: normalized,
    editorUrl: `https://da.live/edit#/${org}/${repo}${normalized}`,
  });
}

/**
 * @typedef {object} PageSnapshot
 * @property {{org:string,repo:string,path:string,editorUrl:string}} page Native DA identity.
 * @property {string} sourceHtml Exact saved source, not a live/unsaved editor snapshot.
 * @property {string|null} revision Strong source response ETag, if supplied. Not proof of
 * conditional write support, a local content hash, Last-Modified, or a version-list entry.
 * @property {import('./experiment-model.js').PageExperiment|null} experiment
 * @property {object} capabilities Per-operation availability and truthful unavailable reasons.
 */

/**
 * Application boundary, not additional DA SDK methods. Only actions.daFetch is used.
 *
 * Native mutations intentionally fail closed. DA's POST /copy overwrites; the public
 * source API does not establish atomic HTML If-Match/If-None-Match semantics. Native
 * page metadata uses internal editor transactions, excluded from SDK block selection.
 * saveDocument flushes changes but provides neither that transaction nor a revision.
 *
 * Evidence: docs.da.live/developers/api/{source,copy,version};
 * adobe/da-live@117dd433: blocks/browse/da-list-base/da-list-base.js:432-513,
 * blocks/canvas/editor-utils/{metadata.js,blocks.js}, ew-panel-extensions/iframe-protocol.js.
 * No registration, live credentials, writes, preview publication or automatic save.
 *
 * @param {{context:object,actions:{daFetch:Function}}} sdk
 * @returns {object} Saved-source read, four manual prepare/verify helpers, and three
 * explicitly unavailable automated mutation/preview methods. Preparation is never success.
 */
export function createDaExperimentationAdapter({ context, actions } = {}) {
  const page = pageIdentity(context);
  if (typeof actions?.daFetch !== 'function') {
    throw new ExperimentationError('UNSUPPORTED_HOST', 'The native DA SDK daFetch action is required.');
  }
  let reviewed;
  let variantIntent;
  let experimentIntent;

  async function getSource(target, operation, allowMissing = false) {
    let response;
    try {
      response = await actions.daFetch(`${DA_ADMIN}/source/${page.org}/${page.repo}${target}.html`, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'text/html' },
      });
    } catch (cause) {
      throw new ExperimentationError('SOURCE_READ_FAILED', 'Could not read the native DA source.', { operation, cause });
    }
    if (response.status === 401 || response.status === 403) {
      throw new ExperimentationError('ACCESS_DENIED', 'DA denied access to the page. No write was attempted.', { operation, status: response.status });
    }
    if (response.status === 404) {
      if (allowMissing) return null;
      throw new ExperimentationError('PAGE_NOT_FOUND', 'The native DA source page was not found.', { operation, status: 404 });
    }
    if (!response.ok) {
      throw new ExperimentationError('SOURCE_READ_FAILED', 'Could not read the native DA source.', { operation, status: response.status });
    }
    return response;
  }

  async function readSavedPage(operation, target = page) {
    const response = await getSource(target.path, operation);
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (type !== 'text/html') {
      throw new ExperimentationError('UNSUPPORTED_SOURCE', 'DA did not return HTML source.', { operation });
    }
    let sourceHtml;
    try {
      sourceHtml = await response.text();
    } catch (cause) {
      throw new ExperimentationError('SOURCE_READ_FAILED', 'Could not read the DA source response body.', { operation, cause });
    }
    const etag = response.headers.get('etag');
    return {
      page: target,
      sourceHtml,
      revision: etag && /^"[^"\r\n]*"$/.test(etag) ? etag : null,
      experiment: modelOperation(operation, () => readExperiment(sourceHtml, target)),
      capabilities: {
        ...Object.fromEntries(Object.entries(UNAVAILABLE).map(([name, reason]) => (
          [name, { available: false, reason }]
        ))),
        dates: true,
      },
    };
  }

  async function reviewedPage(expectedRevision, operation) {
    if (typeof expectedRevision !== 'string' || !/^"[^"\r\n]*"$/.test(expectedRevision)) {
      throw new ExperimentationError('UNSUPPORTED_REVISION', 'Review a source with an authoritative strong ETag first.', { operation });
    }
    const current = await readSavedPage(operation);
    if (!current.revision) {
      throw new ExperimentationError('UNSUPPORTED_REVISION', 'DA did not supply an authoritative strong source ETag.', { operation });
    }
    if (current.revision !== expectedRevision) {
      throw new ExperimentationError('STALE_REVISION', 'The saved source changed after review. Read the page again.', { operation });
    }
    return current;
  }

  async function manualBaseline(expectedRevision, operation) {
    if (!reviewed || expectedRevision === undefined || reviewed.revision !== expectedRevision) {
      throw new ExperimentationError('REVIEW_REQUIRED', 'Read and review the current page before preparing a native handoff.', { operation });
    }
    const current = await readSavedPage(operation);
    if (current.revision !== reviewed.revision || current.sourceHtml !== reviewed.sourceHtml) {
      throw new ExperimentationError('STALE_REVISION', 'The saved source changed after review. Read the page again.', { operation });
    }
    return current;
  }

  return {
    /** @returns {Promise<PageSnapshot>} */
    async readPage() {
      const current = await readSavedPage('readPage');
      reviewed = { revision: current.revision, sourceHtml: current.sourceHtml };
      return current;
    },

    /**
     * Manual native-DA instructions only; never returns a created-page success.
     * The handoff opens the existing control editor, not the uncreated destination.
     * Nullable revisions support readback, not an atomic write precondition.
     * @returns {Promise<{destinationPath:string,editorUrl:string,instructions:string[]}>}
     */
    async prepareVariant({ destinationPath, expectedRevision } = {}) {
      variantIntent = null;
      const destination = modelOperation('prepareVariant', () => normalizePagePath(destinationPath));
      if (destination === page.path) {
        throw new ExperimentationError('INVALID_DESTINATION', 'A challenger cannot replace the control page.', { operation: 'prepareVariant' });
      }
      const baseline = await manualBaseline(expectedRevision, 'prepareVariant');
      modelOperation('prepareVariant', () => (
        validateVariantDestination(baseline.sourceHtml, page.path, destination)
      ));
      if (await getSource(destination, 'prepareVariant', true)) {
        throw new ExperimentationError('DESTINATION_EXISTS', 'The challenger destination already exists. Do not overwrite it.', { operation: 'prepareVariant' });
      }
      const target = pageIdentity({ ...page, path: destination });
      variantIntent = { baseline, target };
      return {
        destinationPath: destination,
        editorUrl: page.editorUrl,
        instructions: [
          `In native DA, copy the complete reviewed ${page.path} page to ${destination}.`,
          'Check that the exact destination is still unused. Native copy can overwrite; its browser collision check is not atomic. Stop if the destination exists.',
          'In the challenger, remove only page Metadata keys named Experiment or starting with "Experiment " or "Experiment-". Preserve all other content, metadata and sections, including Section Metadata.',
          'Finish saving in native DA, then verify the saved copy here before editing challenger content. These instructions do not create or save a page.',
        ],
      };
    },

    /*    * @returns {Promise<{page:object,revision:string|null}>} Saved-source readback only. */
    async verifyVariant({ destinationPath, expectedRevision } = {}) {
      const destination = modelOperation('verifyVariant', () => normalizePagePath(destinationPath));
      const intent = variantIntent;
      if (!intent || intent.target.path !== destination
        || intent.baseline.revision !== expectedRevision) {
        throw new ExperimentationError('HANDOFF_REQUIRED', 'Prepare and review this exact native copy handoff first.', { operation: 'verifyVariant' });
      }
      const current = await readSavedPage('verifyVariant');
      if (current.revision !== intent.baseline.revision
        || current.sourceHtml !== intent.baseline.sourceHtml) {
        throw new ExperimentationError('STALE_REVISION', 'The control source changed after the copy handoff. Review it again.', { operation: 'verifyVariant' });
      }
      const challenger = await readSavedPage('verifyVariant', intent.target);
      modelOperation('verifyVariant', () => (
        verifyVariantSource(intent.baseline.sourceHtml, challenger.sourceHtml)
      ));
      return { page: challenger.page, revision: challenger.revision };
    },

    /**
     * Human-readable TSV, not a supported automatic paste/save protocol. Enter these
     * rows using native DA page metadata controls; blank dates mean remove/clear.
     * @returns {Promise<{metadataText:string,editorUrl:string,expectedExperiment:object}>}
     */
    async prepareExperiment({ draft, expectedRevision } = {}) {
      experimentIntent = null;
      const expected = modelOperation('prepareExperiment', () => validateExperimentDraft(draft, page));
      const baseline = await manualBaseline(expectedRevision, 'prepareExperiment');
      if (baseline.experiment?.status === 'active') {
        throw new ExperimentationError('ACTIVE_EXPERIMENT', 'Existing active experiments are read-only in this rail.', { operation: 'prepareExperiment' });
      }
      experimentIntent = { baseline, expected };
      return {
        metadataText: experimentMetadataRows(expected, page).map(({ key, value }) => `${key}\t${value}`).join('\n'),
        editorUrl: page.editorUrl,
        expectedExperiment: { ...expected },
      };
    },

    /**
     * Actual saved-state verification, not proof this operator performed an atomic
     * save. Challenger edits after initial copy verification are allowed.
     * @returns {Promise<PageSnapshot>}
     */
    async verifyExperiment() {
      const intent = experimentIntent;
      if (!intent) {
        throw new ExperimentationError('HANDOFF_REQUIRED', 'Prepare and review the native configuration handoff first.', { operation: 'verifyExperiment' });
      }
      const current = await readSavedPage('verifyExperiment');
      modelOperation('verifyExperiment', () => (
        verifyExperimentSource(
          intent.baseline.sourceHtml,
          current.sourceHtml,
          intent.expected,
          page,
        )
      ));
      const challenger = await readSavedPage('verifyExperiment', pageIdentity({
        ...page, path: intent.expected.challengerPath,
      }));
      if (challenger.experiment) {
        throw new ExperimentationError('READBACK_MISMATCH', 'Remove page Experiment rows from the native challenger before verifying configuration.', { operation: 'verifyExperiment' });
      }
      reviewed = { revision: current.revision, sourceHtml: current.sourceHtml };
      return current;
    },

    /**
     * @param {{destinationPath:string,expectedRevision:string}} input
     * @returns {Promise<{page:object,revision:string}>} Reserved shape; currently rejects.
     */
    async createVariant({ destinationPath, expectedRevision } = {}) {
      const destination = modelOperation('createVariant', () => normalizePagePath(destinationPath));
      if (destination === page.path) {
        throw new ExperimentationError('INVALID_DESTINATION', 'A challenger cannot replace the control page.', { operation: 'createVariant' });
      }
      await reviewedPage(expectedRevision, 'createVariant');
      const existing = await getSource(destination, 'createVariant', true);
      if (existing) {
        throw new ExperimentationError('DESTINATION_EXISTS', 'The challenger destination already exists. Nothing was copied.', { operation: 'createVariant' });
      }
      throw new ExperimentationError('UNSUPPORTED_SAFE_WRITE', UNAVAILABLE.createVariant, { operation: 'createVariant' });
    },

    /**
     * @param {{draft:import('./experiment-model.js').PageExperiment,expectedRevision:string}} input
     * @returns {Promise<PageSnapshot>} Reserved success shape; currently always rejects.
     */
    async saveExperiment({ draft, expectedRevision } = {}) {
      modelOperation('saveExperiment', () => validateExperimentDraft(draft, page));
      const current = await reviewedPage(expectedRevision, 'saveExperiment');
      if (current.experiment?.status === 'active') {
        throw new ExperimentationError('ACTIVE_EXPERIMENT', 'Existing active experiments are read-only in this rail.', { operation: 'saveExperiment' });
      }
      throw new ExperimentationError('UNSUPPORTED_SAFE_WRITE', UNAVAILABLE.saveExperiment, { operation: 'saveExperiment' });
    },

    /**
     * @param {{expectedRevision:string}} input
     * @returns {Promise<{controlUrl:string,challengerUrl:string}>} No URLs imply preview success.
     */
    async preview({ expectedRevision } = {}) {
      const current = await reviewedPage(expectedRevision, 'preview');
      if (!current.experiment) {
        throw new ExperimentationError('NO_EXPERIMENT', 'Save an inactive experiment before previewing it.', { operation: 'preview' });
      }
      throw new ExperimentationError('UNSUPPORTED_PREVIEW', UNAVAILABLE.preview, { operation: 'preview' });
    },
  };
}
