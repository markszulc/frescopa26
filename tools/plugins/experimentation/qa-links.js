const PRIVATE_INPUTS = new Set([
  'accesstoken', 'idtoken', 'refreshtoken', 'token', 'authorization', 'auth',
  'apikey', 'secret', 'clientsecret', 'code', 'controller', 'editor', 'author',
  'context', 'url', 'redirecturi', 'returnurl',
]);

function isPrivateKey(key) {
  return PRIVATE_INPUTS.has(key.toLowerCase().replace(/[^a-z0-9]/g, ''));
}

function visitorUrl(value) {
  if (typeof value !== 'string') throw new TypeError('Enter an absolute visitor preview URL.');
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('Enter an absolute visitor preview URL.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new TypeError('Use HTTPS, or HTTP on a loopback host for local QA.');
  }
  if (url.username || url.password) {
    throw new TypeError('Credentials must not be included in a visitor QA URL.');
  }
  const hostname = url.hostname.replace(/\.+$/, '');
  const authoringHost = (hostname === 'da.live' || hostname.endsWith('.da.live'))
    && !hostname.endsWith('.preview.da.live');
  if (authoringHost || hostname === 'experience.adobe.com'
    || hostname.endsWith('.experience.adobe.com')
    || hostname.endsWith('.adobeaemcloud.com')) {
    throw new TypeError('Use the visitor preview page, not an authoring or controller host.');
  }
  let path;
  let fragment;
  try {
    path = decodeURIComponent(url.pathname);
    fragment = decodeURIComponent(url.hash.slice(1));
  } catch {
    throw new TypeError('The visitor URL contains invalid URL encoding.');
  }
  const authoringPath = /^\/(?:edit(?:or)?(?:\.html)?|canvas|author|tools\/plugins|libs\/granite|aem)(?:[/#?]|$)/i;
  const privateFragment = [...new URLSearchParams(fragment).keys()].some(isPrivateKey);
  if (authoringPath.test(path) || authoringPath.test(`/${fragment.replace(/^\/+/, '')}`)
    || [...url.searchParams.keys()].some(isPrivateKey) || privateFragment) {
    throw new TypeError('Authoring, controller and credential inputs are not visitor QA URLs.');
  }
  url.search = '';
  url.hash = '';
  return url;
}

/**
 * Pure, read-only QA links for v2.0.0 / 1079f967, index.js:743-764,814-820.
 * The caller must independently read saved configuration. This does not verify
 * delivery, bypass date/consent gates, activate, preview-publish or contact a host.
 * @param {{previewUrl:string,experiment:object}} input
 * @returns {{controlUrl:string,challengerUrl:string}}
 */
// eslint-disable-next-line import/prefer-default-export -- Shared named QA contract.
export function buildPreviewLinks({ previewUrl, experiment } = {}) {
  if (!experiment || typeof experiment.id !== 'string'
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(experiment.id)
    || typeof experiment.challengerPath !== 'string'
    || !/^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(experiment.challengerPath)
    || !['active', 'inactive'].includes(experiment.status)
    || !Number.isFinite(experiment.challengerPercentage)
    || experiment.challengerPercentage < 0 || experiment.challengerPercentage > 100) {
    throw new TypeError('QA requires a saved one-challenger experiment with a supported lowercase ID.');
  }
  const page = visitorUrl(previewUrl);
  const assignedUrl = (variant) => {
    const url = new URL(page);
    url.searchParams.set('experiment', `${experiment.id}/${variant}`);
    return url.href;
  };
  return {
    controlUrl: assignedUrl('control'),
    challengerUrl: assignedUrl('challenger-1'),
  };
}
