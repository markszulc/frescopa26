import { getLanguage, getLanguageHref } from '../../scripts/languages.js';
import fetchSheet from '../../scripts/sheets.js';

export const SEARCH_SHEET_PATH = '/placeholders/search.json';
export const SEARCH_LABEL_KEYS = [
  'dialog-label', 'input-placeholder', 'input-label', 'close-label', 'close-text',
  'recent-title', 'popular-title', 'trending-title', 'summary-title', 'sources-label',
  'results-label', 'searching', 'generating-summary', 'no-results', 'search-error',
  'retry-search', 'summary-empty', 'summary-error', 'retry-summary', 'home-label',
  'result-location',
];

let contentRequest;

export function parseSearchRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Search sheet must contain a data array.');
  const locales = new Map();
  const keys = new Set();
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Search sheet row ${rowNumber} must be an object.`);
    }
    if (!Object.values(row).some((value) => String(value).trim())) return;
    ['Locale', 'Type', 'Key'].forEach((field) => {
      if (typeof row[field] !== 'string' || !row[field].trim()) {
        throw new Error(`Search sheet row ${rowNumber}: ${field} is required.`);
      }
    });
    let locale;
    try {
      [locale] = Intl.getCanonicalLocales(row.Locale.trim());
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      throw new Error(`Search sheet row ${rowNumber}: invalid Locale "${row.Locale}".`);
    }
    const type = row.Type.trim();
    const key = row.Key.trim();
    const text = typeof row.Text === 'string' ? row.Text.trim() : '';
    if (!['label', 'recent', 'popular', 'trending'].includes(type)) {
      throw new Error(`Search sheet row ${rowNumber}: invalid Type "${type}".`);
    }
    if (type === 'label' && ![...SEARCH_LABEL_KEYS, 'summary-disclaimer'].includes(key)) {
      throw new Error(`Search sheet row ${rowNumber}: unknown label Key "${key}".`);
    }
    if (!text && !(type === 'label' && key === 'summary-disclaimer')) {
      throw new Error(`Search sheet row ${rowNumber}: Text is required.`);
    }
    const identity = `${locale}:${type}:${key}`;
    if (keys.has(identity)) throw new Error(`Search sheet has duplicate ${identity}.`);
    keys.add(identity);
    if (!locales.has(locale)) {
      locales.set(locale, {
        labels: {}, recent: [], popular: [], trending: [],
      });
    }
    const content = locales.get(locale);
    if (type === 'label') {
      const token = { 'no-results': '{query}', 'result-location': '{section}' }[key];
      if (token && !text.includes(token)) {
        throw new Error(`Search sheet row ${rowNumber}: ${key} must contain ${token}.`);
      }
      content.labels[key] = text;
    } else if (type === 'trending') {
      const href = typeof row.URL === 'string' ? row.URL.trim() : '';
      const img = typeof row.Image === 'string' ? row.Image.trim() : '';
      if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')
        || new URL(href, 'https://search.invalid').origin !== 'https://search.invalid') {
        throw new Error(`Search sheet row ${rowNumber}: URL must be a site-relative path.`);
      }
      if (img && !['http:', 'https:'].includes(new URL(img, 'https://search.invalid').protocol)) {
        throw new Error(`Search sheet row ${rowNumber}: Image must use an HTTP(S) URL or path.`);
      }
      content.trending.push({
        name: text, href, img, price: typeof row.Price === 'string' ? row.Price.trim() : '',
      });
    } else {
      content[type].push(text);
    }
  });
  const english = locales.get('en');
  const missing = SEARCH_LABEL_KEYS.filter((key) => !english?.labels[key]);
  if (missing.length) {
    throw new Error(`Search sheet requires English labels: ${missing.join(', ')}.`);
  }
  return locales;
}

export async function fetchSearchContent(fetcher = fetch) {
  return parseSearchRows(await fetchSheet(SEARCH_SHEET_PATH, fetcher, 'Search sheet'));
}

export function loadSearchContent() {
  if (!contentRequest) {
    contentRequest = fetchSearchContent().catch((error) => {
      contentRequest = undefined;
      throw error;
    });
  }
  return contentRequest;
}

export function getSearchContent(locales, pathname, languages) {
  const language = getLanguage(pathname, languages);
  const english = locales.get('en');
  const localized = locales.get(language.code);
  const missing = SEARCH_LABEL_KEYS.filter((key) => !localized?.labels[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(`Search sheet is missing ${language.code} translations for ${missing.join(', ')}; using English for missing content.`);
  }
  const content = localized || english;
  const labels = { ...english.labels, ...localized?.labels };
  // Legal copy must be explicitly authored for a locale, not inherited from English.
  labels['summary-disclaimer'] = localized?.labels['summary-disclaimer'];
  return {
    locale: language.code,
    labels,
    recent: content.recent,
    popular: content.popular,
    trending: content.trending.map((item) => ({
      ...item,
      href: getLanguageHref(language, new URL(item.href, 'https://search.invalid'), languages),
    })),
  };
}

export function formatSearchText(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (
    Object.hasOwn(values, key) ? String(values[key]) : match
  ));
}
