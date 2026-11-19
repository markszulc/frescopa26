import { getLanguage, loadLanguages } from './languages.js';

export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveSearchResult(item) {
  const data = item.data || {};
  const meta = data.metadata || {};
  const rawMeta = meta.meta && typeof meta.meta === 'object' ? meta.meta : {};
  return {
    url: meta.canonicalUrl || meta.canonical_url || meta.canonical
      || rawMeta.canonical || rawMeta['og:url'] || meta.url || meta.source || data.source || '',
    title: meta.title || rawMeta.title || data.title || '',
    description: meta.description || rawMeta.description || data.description || '',
    image: meta.image || rawMeta.image || '',
  };
}

function matchesLocale(value, code) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const actual = new Intl.Locale(value.trim().replace(/_/g, '-')).maximize();
    const expected = new Intl.Locale(code).maximize();
    return actual.language === expected.language && actual.script === expected.script;
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return false;
  }
}

function matchesLanguage(item, language, languages) {
  const result = item.data ? item : { data: { metadata: item.metadata, source: item.source } };
  const metadata = result.data.metadata || {};
  const locales = [metadata.language, metadata.locale]
    .filter((value) => value != null && value !== '');
  if (locales.length) return locales.every((value) => matchesLocale(value, language.code));

  const { url } = resolveSearchResult(result);
  if (!isSafeUrl(url)) return false;
  const { pathname } = new URL(url, window.location.origin);
  return getLanguage(pathname, languages).code === language.code;
}

async function getSearchLanguage() {
  const languages = await loadLanguages();
  return { languages, language: getLanguage(window.location.pathname, languages) };
}

export async function filterSearchResults(data) {
  if (!Array.isArray(data.results)
    || data.results.some((item) => !item || typeof item !== 'object')) {
    throw new Error('Content AI search returned invalid results');
  }
  const { language, languages } = await getSearchLanguage();
  return {
    ...data,
    unfilteredResultCount: data.results.length,
    results: data.results.filter((item) => matchesLanguage(item, language, languages)),
  };
}

export async function filterSearchAnswer(data) {
  if (typeof data.result !== 'string'
    || (data.hits != null && (!Array.isArray(data.hits)
      || data.hits.some((hit) => !hit || typeof hit !== 'object')))) {
    throw new Error('Content AI returned an invalid answer');
  }
  const { language, languages } = await getSearchLanguage();
  const hits = data.hits || [];
  const matchingHits = hits.filter((hit) => matchesLanguage(hit, language, languages));
  // Removing citations cannot remove foreign-language content from a generated answer.
  if (data.result.trim() && (!hits.length || matchingHits.length !== hits.length)) {
    throw new Error(`Content AI summary is not grounded exclusively in ${language.code} content`);
  }
  return { ...data, hits: matchingHits };
}

export async function fetchSearchAnswer(baseUrl, contentSource, contentSourceType, query, signal) {
  const { language } = await getSearchLanguage();
  const scope = language.prefix
    ? `pages under /${language.prefix}/`
    : 'English pages without a language folder prefix';
  const resp = await fetch(`${baseUrl}/gensearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contentSource: { name: contentSource, type: contentSourceType },
      query: `${query}\n\nRespond in ${language.code}. Use only ${language.code} content from ${scope}.`,
    }),
  });
  if (!resp.ok) throw new Error(`Content AI request failed: ${resp.status}`);
  return filterSearchAnswer(await resp.json());
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkifyBareUrls(html) {
  return html.split(/(<a\b[^>]*>.*?<\/a>)/g).map((part) => {
    if (/^<a\b/.test(part)) return part;
    return part.replace(/https?:\/\/[^\s<]+/g, (url) => {
      const trailingMatch = url.match(/[).,;:!?]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : '';
      const cleanUrl = trailing ? url.slice(0, -trailing.length) : url;
      if (!isSafeUrl(cleanUrl)) return url;
      return `<a href="${cleanUrl}" target="_blank" rel="noopener">${cleanUrl}</a>${trailing}`;
    });
  }).join('');
}

function renderMarkdownInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => (
    isSafeUrl(url) ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : label
  ));
  return linkifyBareUrls(html);
}

export function renderMarkdownSummary(text) {
  const lines = String(text || '').split(/\r?\n/);
  let html = '';
  let listOpen = false;
  lines.forEach((line) => {
    const trimmed = line.replace(/^\s+/, '');
    if (/^[-*]\s+/.test(trimmed)) {
      if (!listOpen) {
        html += '<ul>';
        listOpen = true;
      }
      html += `<li>${renderMarkdownInline(trimmed.replace(/^[-*]\s+/, ''))}</li>`;
    } else {
      if (listOpen) {
        html += '</ul>';
        listOpen = false;
      }
      if (trimmed.length > 0) html += `<p>${renderMarkdownInline(trimmed)}</p>`;
    }
  });
  if (listOpen) html += '</ul>';
  return html;
}

// Candidate pool of the vector query. Also caps how many results can be paged through
// for queries the full-text query does not match, so keep it well above the page size.
const VECTOR_NUM_CANDIDATES = 50;
// Only the result fields the callers read (paths are relative to each result's "data"),
// including those used by resolveSearchResult and the language filter.
const RESULT_FIELDS = [
  'text',
  'source',
  'title',
  'name',
  'metadata.url',
  'metadata.source',
  'metadata.title',
  'metadata.description',
  'metadata.image',
  'metadata.language',
  'metadata.locale',
  'metadata.canonicalUrl',
  'metadata.canonical_url',
  'metadata.canonical',
  'metadata.meta.image',
  'metadata.meta.canonical',
];

// Longer, natural-language queries are better served by the semantic vector match than by
// literal term matching, so the full-text boost shrinks with the number of words.
function fulltextBoost(query) {
  const tokens = query.trim().split(/\s+/).length;
  return tokens > 1 ? 1 / (5 * tokens) : 1;
}

function buildSearchQuery(text) {
  return {
    type: 'composite',
    operator: 'OR',
    queries: [
      { type: 'vector', text, options: { numCandidates: VECTOR_NUM_CANDIDATES, boost: 1 } },
      {
        type: 'fulltext',
        text,
        options: { boost: fulltextBoost(text), operator: 'AND', matchStrategy: 'COMBINED_FIELDS' },
      },
    ],
  };
}

export async function fetchSearchResults(
  baseUrl,
  contentSource,
  contentSourceType,
  query,
  limit,
  cursor,
  signal,
) {
  const resp = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contentSource: { name: contentSource, type: contentSourceType },
      query: buildSearchQuery(query),
      queryOptions: {
        resultFields: { includes: RESULT_FIELDS },
        pagination: {
          limit,
          ...(cursor ? { cursor } : {}),
        },
      },
    }),
  });
  if (!resp.ok) throw new Error(`Content AI search failed: ${resp.status}`);
  return filterSearchResults(await resp.json());
}
