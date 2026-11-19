/**
 * Saved DA source uses body/main/section divs and div.metadata rows, not editor tables
 * or delivered head meta tags. This is a pure source model, never a persistence API.
 * Public representation: adobe/da-live@117dd433, blocks/shared/prose2aem.js.
 */

export class ExperimentationError extends Error {
  /** sourceSaved describes this adapter's writes, never an operator's unverified native save. */
  constructor(code, message, { operation, status, cause } = {}) {
    super(message);
    this.name = 'ExperimentationError';
    this.code = code;
    this.operation = operation;
    this.sourceSaved = false;
    if (status !== undefined) this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}

const keyName = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isExperimentKey = (key) => key === 'experiment' || key.startsWith('experiment-');

export function normalizePagePath(value) {
  const path = typeof value === 'string' ? value.replace(/\.html$/, '') : '';
  if (!/^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(path)) {
    throw new ExperimentationError('INVALID_PATH', 'Use a same-site page path such as /drafts/challenger.');
  }
  return path;
}

function parseSource(sourceHtml) {
  if (typeof sourceHtml !== 'string' || !/<body[\s>]/i.test(sourceHtml)
    || !/<main[\s>]/i.test(sourceHtml)) {
    throw new ExperimentationError('UNSUPPORTED_SOURCE', 'A complete saved DA body/main document is required.');
  }
  const document = new DOMParser().parseFromString(sourceHtml, 'text/html');
  const mains = document.querySelectorAll('main');
  const main = mains[0];
  if (mains.length !== 1 || main.parentElement !== document.body
    || !main.children.length || [...main.children].some((child) => child.tagName !== 'DIV')
    || document.head.querySelector('meta[name^="experiment" i]')) {
    throw new ExperimentationError('UNSUPPORTED_SOURCE', 'Expected native saved sections, not a delivered page or fragment.');
  }
  const editorMetadata = [...main.querySelectorAll('table')].some((table) => (
    keyName(table.rows[0]?.cells[0]?.textContent || '') === 'metadata'
  ));
  const blocks = [...document.querySelectorAll('.metadata')];
  if (editorMetadata || blocks.length > 1 || blocks.some((block) => (
    block.tagName !== 'DIV' || block.parentElement.parentElement !== main
  ))) {
    throw new ExperimentationError('UNSUPPORTED_SOURCE', 'Expected at most one native page Metadata block.');
  }
  const metadata = blocks[0] || null;
  const rows = new Map();
  [...(metadata?.children || [])].forEach((row) => {
    if (row.tagName !== 'DIV' || row.children.length !== 2
      || [...row.children].some((cell) => cell.tagName !== 'DIV')) {
      throw new ExperimentationError('UNSUPPORTED_SOURCE', 'Metadata rows must have exactly two div cells.');
    }
    const key = keyName(row.children[0].textContent);
    if (isExperimentKey(key) && rows.has(key)) {
      throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', `Duplicate Metadata key: ${key}.`);
    }
    rows.set(key, row);
  });
  return {
    document, main, metadata, rows,
  };
}

function challengerPath(value, page) {
  if (value.startsWith('/') && !value.startsWith('//')) return normalizePagePath(value);
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'The challenger must reference one same-site page.', { cause });
  }
  const suffixes = ['aem.page', 'aem.live', 'hlx.page', 'hlx.live', 'preview.da.live'];
  const sameSite = suffixes.some((suffix) => (
    url.hostname.endsWith(`--${page.repo}--${page.org}.${suffix}`)
  ));
  if (url.protocol !== 'https:' || !sameSite || url.port || url.username || url.password
    || url.search || url.hash) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'The challenger must reference one same-site page.');
  }
  return normalizePagePath(url.pathname);
}

/**
 * @typedef {object} PageExperiment
 * @property {string} id Native experiment name; new drafts use a lowercase slug.
 * @property {string} challengerPath Extensionless, same-site source page path.
 * @property {number} challengerPercentage Challenger share, not control share.
 * @property {'active'|'inactive'} status Missing native status means active.
 * @property {string} [startDate]
 * @property {string} [endDate]
 */

/** @returns {PageExperiment|null} */
export function readExperiment(sourceHtml, page) {
  const { rows } = parseSource(sourceHtml);
  const value = (key) => rows.get(key)?.children[1].textContent.trim() || '';
  const id = value('experiment');
  if (!id) {
    if ([...rows.keys()].some(isExperimentKey)) {
      throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'Experiment Metadata exists without an experiment name.');
    }
    return null;
  }
  const cell = rows.get('experiment-variants')?.children[1];
  const links = [...(cell?.querySelectorAll('a') || [])];
  const variants = links.length ? links.map((link) => link.getAttribute('href')) : value('experiment-variants').split(',');
  if (variants.length !== 1 || !variants[0]?.trim()) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'This rail supports exactly one full-page challenger.');
  }
  const path = challengerPath(variants[0].trim(), page);
  if (path === normalizePagePath(page.path)) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'Control and challenger must be different pages.');
  }
  const rawSplit = value('experiment-split');
  const split = rawSplit ? Number(rawSplit) : 50;
  if ((rawSplit && !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(rawSplit))
    || !Number.isFinite(split) || split < 0 || split > 100) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'Expected one challenger percentage between 0 and 100.');
  }
  const rawStatus = value('experiment-status').toLowerCase();
  if (rawStatus && !['active', 'true', 'on', 'inactive', 'false', 'off'].includes(rawStatus)) {
    throw new ExperimentationError('UNSUPPORTED_EXPERIMENT', 'Unrecognized Experiment Status.');
  }
  return {
    id,
    challengerPath: path,
    challengerPercentage: split,
    status: !rawStatus || ['active', 'true', 'on'].includes(rawStatus) ? 'active' : 'inactive',
    ...(value('experiment-start-date') ? { startDate: value('experiment-start-date') } : {}),
    ...(value('experiment-end-date') ? { endDate: value('experiment-end-date') } : {}),
  };
}

/** Validate a new, inactive one-challenger draft. Only date-only ISO dates are authored here. */
export function validateExperimentDraft(draft, page) {
  if (!draft || typeof draft.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.id)
    || draft.challengerPercentage !== 50 || draft.status !== 'inactive') {
    throw new ExperimentationError('INVALID_DRAFT', 'Use an experiment ID, one 50% challenger, and an explicit inactive status.');
  }
  const path = normalizePagePath(draft.challengerPath);
  if (path === normalizePagePath(page.path)) {
    throw new ExperimentationError('INVALID_DRAFT', 'Control and challenger must be different pages.');
  }
  ['startDate', 'endDate'].forEach((key) => {
    const date = draft[key];
    if (date === undefined || date === '') return;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      throw new ExperimentationError('INVALID_DRAFT', 'Dates must be valid YYYY-MM-DD values.');
    }
  });
  if (draft.startDate && draft.endDate && draft.endDate <= draft.startDate) {
    throw new ExperimentationError('INVALID_DRAFT', 'The end date must be after the start date.');
  }
  return {
    id: draft.id,
    challengerPath: path,
    challengerPercentage: 50,
    status: 'inactive',
    ...(draft.startDate ? { startDate: draft.startDate } : {}),
    ...(draft.endDate ? { endDate: draft.endDate } : {}),
  };
}

function serializeSource(document, original) {
  if (!/<html[\s>]/i.test(original)) return document.body.outerHTML;
  const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
  return `${doctype}${document.documentElement.outerHTML}`;
}

/** Native key/value intent. Empty date values mean clear/remove those native fields. */
export function experimentMetadataRows(draft, page) {
  const valid = validateExperimentDraft(draft, page);
  return [
    { key: 'Experiment', value: valid.id },
    { key: 'Experiment Variants', value: valid.challengerPath },
    { key: 'Experiment Split', value: '50' },
    { key: 'Experiment Status', value: 'Inactive' },
    { key: 'Experiment Start Date', value: valid.startDate || '' },
    { key: 'Experiment End Date', value: valid.endDate || '' },
  ];
}

/**
 * Prepare a review candidate only. Unrelated rows (including unknown Experiment rows),
 * section configuration, body content and DA metadata retain their DOM representation.
 * No source write, editor transaction, save, preview or publication occurs.
 */
export function prepareExperimentSource(sourceHtml, draft, page) {
  const changes = experimentMetadataRows(draft, page);
  readExperiment(sourceHtml, page);
  const parsed = parseSource(sourceHtml);
  const { document, main, rows } = parsed;
  let { metadata } = parsed;
  if (!metadata) {
    metadata = document.createElement('div');
    metadata.className = 'metadata';
    main.lastElementChild.append(metadata);
  }
  changes.forEach(({ key: name, value }) => {
    const existing = rows.get(keyName(name));
    if (!value) {
      existing?.remove();
      return;
    }
    let row = existing;
    if (!row) {
      row = document.createElement('div');
      const key = document.createElement('div');
      key.textContent = name;
      row.append(key, document.createElement('div'));
      metadata.append(row);
    }
    const cell = row.children[1];
    cell.replaceChildren();
    const paragraph = document.createElement('p');
    if (name === 'Experiment Variants') {
      const link = document.createElement('a');
      link.setAttribute('href', value);
      link.textContent = value;
      paragraph.append(link);
    } else {
      paragraph.textContent = value;
    }
    cell.append(paragraph);
  });
  return serializeSource(document, sourceHtml);
}

/**
 * Prepare all saved sections, not a single-section export. Strip the page experiment
 * namespace so the challenger cannot recursively apply the control's configuration.
 * Destination collision, freshness and relative-asset handling still require qualification.
 */
export function prepareVariantSource(sourceHtml) {
  const { document, rows } = parseSource(sourceHtml);
  rows.forEach((row, key) => {
    if (isExperimentKey(key)) row.remove();
  });
  return serializeSource(document, sourceHtml);
}

/** Cross-folder copying needs qualified URL rebasing if the saved page has relative references. */
export function validateVariantDestination(sourceHtml, controlPath, destinationPath) {
  const directory = (path) => normalizePagePath(path).split('/').slice(0, -1).join('/');
  if (directory(controlPath) === directory(destinationPath)) return;
  const { document } = parseSource(sourceHtml);
  const relative = [...document.querySelectorAll('[href], [src], [srcset], [poster]')].some((element) => (
    ['href', 'src', 'srcset', 'poster'].some((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return false;
      const urls = attribute === 'srcset' ? value.split(',').map((part) => part.trim().split(/\s+/)[0]) : [value.trim()];
      return urls.some((url) => url && !/^(?:[/#]|[a-z][a-z0-9+.-]*:)/i.test(url));
    })
  ));
  if (relative) {
    throw new ExperimentationError('UNSUPPORTED_COPY_SOURCE', 'This page has relative links or assets. Choose a challenger in the same folder; cross-folder URL rebasing is not qualified.');
  }
}

function canonicalSource(sourceHtml) {
  const { document } = parseSource(sourceHtml);
  document.querySelectorAll('.metadata:empty').forEach((block) => block.remove());
  document.querySelectorAll('html, head, body, main, div, table, tbody, tr').forEach((element) => {
    const blockChildren = [...element.children].every((child) => (
      /^(HEAD|BODY|HEADER|MAIN|FOOTER|DIV|P|H[1-6]|TABLE|THEAD|TBODY|TR|TD|TH|UL|OL)$/.test(child.tagName)
    ));
    if (blockChildren) {
      [...element.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
      });
    }
  });
  document.querySelectorAll('.metadata:empty').forEach((block) => block.remove());
  return document.documentElement.outerHTML;
}

/**
 * Independent native-copy readback. Only structural indentation and empty Metadata
 * remnants are ignored. Content edits must happen after this initial copy verification.
 */
export function verifyVariantSource(reviewedSourceHtml, savedSourceHtml) {
  const candidate = prepareVariantSource(reviewedSourceHtml);
  if (canonicalSource(candidate) !== canonicalSource(savedSourceHtml)) {
    throw new ExperimentationError('READBACK_MISMATCH', 'The native challenger is not the complete reviewed copy with page Experiment rows removed.');
  }
}

/**
 * Verify saved inactive metadata AND all unrelated control source. A config-shaped
 * read alone cannot prove content/unknown metadata survived the native edit.
 */
export function verifyExperimentSource(reviewedSourceHtml, savedSourceHtml, draft, page) {
  const expected = validateExperimentDraft(draft, page);
  const actual = readExperiment(savedSourceHtml, page);
  const authoredRows = experimentMetadataRows(expected, page);
  const { rows } = parseSource(savedSourceHtml);
  const complete = authoredRows.slice(0, 4).every(({ key }) => rows.has(keyName(key)));
  const inactive = rows.get('experiment-status')?.children[1].textContent.trim().toLowerCase() === 'inactive';
  const fields = ['id', 'challengerPath', 'challengerPercentage', 'status', 'startDate', 'endDate'];
  if (!actual || !complete || !inactive || fields.some((key) => actual[key] !== expected[key])) {
    throw new ExperimentationError('READBACK_MISMATCH', 'The native saved Metadata does not match the reviewed inactive configuration.');
  }
  const untouched = (html) => {
    const parsed = parseSource(html);
    authoredRows.forEach(({ key }) => parsed.rows.get(keyName(key))?.remove());
    return canonicalSource(serializeSource(parsed.document, html));
  };
  if (untouched(reviewedSourceHtml) !== untouched(savedSourceHtml)) {
    throw new ExperimentationError('READBACK_MISMATCH', 'Unrelated control content or Metadata changed during the native configuration handoff.');
  }
}
