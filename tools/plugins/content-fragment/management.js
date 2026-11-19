import {
  AUTHOR_ORIGIN, fetchAuthorCsrfToken, validatePaths,
} from '../../../scripts/content-fragment-author.js';

const USAGE_PROPERTY = 'frescopa:usedOnPages';
const ETAG_ERROR = 'Safe saving requires AEM CORS to expose ETag and allow PATCH, If-Match, Content-Type and CSRF-Token. No changes were sent.';

export function isEditableField(field) {
  return !field.locked && !field.multiple && ['text', 'long-text'].includes(field.type)
    && Array.isArray(field.values) && field.values.length <= 1
    && field.values.every((value) => typeof value === 'string');
}

export default function createFragmentManagement(getToken, pageUrl) {
  const endpoint = ({ id, path }) => {
    validatePaths([path]);
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid Content Fragment UUID.');
    }
    return `${AUTHOR_ORIGIN}/adobe/sites/cf/fragments/${id}`;
  };
  const request = async (url, patch, etag) => {
    const token = getToken();
    if (typeof token !== 'string' || !token.trim()) throw new Error('Sign in to DA and reopen this panel.');
    if (patch && (!etag || etag === '*' || etag.startsWith('W/'))) throw new Error(ETAG_ERROR);
    const headers = { Authorization: `Bearer ${token}` };
    if (patch) {
      headers['If-Match'] = etag;
      headers['Content-Type'] = 'application/json-patch+json';
      headers['CSRF-Token'] = await fetchAuthorCsrfToken(token);
    }
    const response = await fetch(url, {
      method: patch ? 'PATCH' : 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers,
      ...(patch ? { body: JSON.stringify(patch) } : {}),
    });
    if (!response.ok) {
      const error = new Error([409, 412].includes(response.status)
        ? 'The fragment changed in AEM. Your edits are retained; discard and reload before saving again.'
        : `AEM ${patch ? 'save' : 'read'} returned HTTP ${response.status}. Check permissions, model validation and CORS.`);
      error.status = response.status;
      throw error;
    }
    return { data: await response.json(), etag: response.headers.get('ETag') };
  };
  const read = async (reference, variation = 'master') => {
    const base = endpoint(reference);
    if (typeof variation !== 'string' || !variation || ['.', '..'].includes(variation)) {
      throw new Error('Invalid fragment variation.');
    }
    const url = variation === 'master' ? base : `${base}/variations/${encodeURIComponent(variation)}`;
    const result = await request(`${url}?references=direct-hydrated`);
    const { data } = result;
    if (!Array.isArray(data.fields) || data.fields.some((field) => (
      !field || typeof field.name !== 'string' || typeof field.type !== 'string'
    )) || new Set(data.fields.map((field) => field.name)).size !== data.fields.length
      || (variation === 'master' ? data.id !== reference.id || data.path !== reference.path
        : data.name !== variation)) {
      throw new Error('Invalid Content Fragment fields response.');
    }
    return { ...result, variation, url };
  };
  const variations = async (reference) => {
    const url = `${endpoint(reference)}/variations`;
    const items = [];
    const cursors = new Set();
    let cursor;
    do {
      const query = new URLSearchParams({ limit: '50', ...(cursor ? { cursor } : {}) });
      // eslint-disable-next-line no-await-in-loop -- Each cursor comes from the previous page.
      const { data } = await request(`${url}?${query}`);
      if (!Array.isArray(data.items) || data.items.some((item) => (
        !item || typeof item.name !== 'string' || !item.name || ['.', '..', 'master'].includes(item.name)
      ))) throw new Error('Invalid fragment variations response.');
      items.push(...data.items);
      cursor = data.cursor;
      if (cursor && (typeof cursor !== 'string' || cursors.has(cursor))) {
        throw new Error('Invalid fragment variations pagination.');
      }
      if (cursor) cursors.add(cursor);
    } while (cursor);
    return items;
  };
  const save = async (reference, snapshot, changes) => {
    const base = endpoint(reference);
    const expectedUrl = snapshot.variation === 'master' ? base
      : `${base}/variations/${encodeURIComponent(snapshot.variation)}`;
    if (snapshot.url !== expectedUrl) throw new Error('The fragment being edited has changed. Reopen its fields.');
    const patch = [];
    changes.forEach(({ name, value }) => {
      const index = snapshot.data.fields.findIndex((field) => field.name === name);
      const field = snapshot.data.fields[index];
      if (!field || !isEditableField(field) || typeof value !== 'string') {
        throw new Error('This field must be edited in the full AEM editor.');
      }
      if (value === (field.values[0] ?? '')) return;
      patch.push(
        { op: 'test', path: `/fields/${index}/name`, value: name },
        { op: 'replace', path: `/fields/${index}/values`, value: [value] },
      );
    });
    if (!patch.length) throw new Error('No field changes to save.');
    await request(snapshot.url, patch, snapshot.etag);
    return read(reference, snapshot.variation);
  };
  const recordUsage = async (reference) => {
    const page = new URL(pageUrl);
    if (page.origin !== 'https://da.live' || page.pathname !== '/canvas'
      || !/^#\/[a-z0-9-]+\/[a-z0-9-]+(?:\/[^?#]*)?$/.test(page.hash) || page.search) {
      throw new Error('DA has not resolved a valid page URL for usage tracking.');
    }
    const url = `${endpoint(reference)}/metadata`;
    const attempt = async () => {
      const { data, etag } = await request(url);
      if (!Array.isArray(data.fields) || typeof data.schemaId !== 'string') {
        throw new Error('Invalid fragment metadata response.');
      }
      const field = data.fields.find((item) => item.name === USAGE_PROPERTY);
      if (field && (!Array.isArray(field.value) || field.value.some((value) => typeof value !== 'string'))) {
        throw new Error(`${USAGE_PROPERTY} must be a multi-value string metadata property.`);
      }
      if (field?.value.includes(page.href)) return;
      if (!field && data.schemaId !== 'default') {
        throw new Error(`Add ${USAGE_PROPERTY} to the fragment's AEM metadata schema to record page usage.`);
      }
      const pages = [...new Set([...(field?.value || []), page.href])];
      const result = await request(url, [{
        op: 'add', path: `/${USAGE_PROPERTY}`, value: pages,
      }], etag);
      if (!result.data.fields?.some((item) => (
        item.name === USAGE_PROPERTY && Array.isArray(item.value) && item.value.includes(page.href)
      ))) throw new Error('AEM did not confirm the page usage metadata. Reload and retry.');
    };
    try {
      await attempt();
    } catch (error) {
      if (error.status !== 412) throw error;
      await attempt();
    }
  };
  return {
    read, variations, save, recordUsage,
  };
}
