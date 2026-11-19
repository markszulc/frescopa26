import fetchSheet from './sheets.js';

export const LANGUAGE_SHEET_PATH = '/placeholders/languages.json';

let languageRequest;

function canonicalLocale(value, field, rowNumber) {
  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    throw new Error(`Language sheet row ${rowNumber}: invalid ${field} "${value}".`);
  }
}

export function parseLanguageRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Language sheet must contain a data array.');
  const entries = rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Language sheet row ${index + 1} must be an object.`);
    }
    if (!Object.values(row).some((value) => String(value).trim())) return null;
    const fields = ['Locale', 'Path', 'Code', 'Label', 'Tagline'];
    fields.forEach((field) => {
      if (typeof row[field] !== 'string' || !row[field].trim()) {
        throw new Error(`Language sheet row ${index + 1}: ${field} is required.`);
      }
    });
    const path = row.Path.trim();
    if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)?$/.test(path)) {
      throw new Error(`Language sheet row ${index + 1}: Path must be / or a single lowercase language folder.`);
    }
    return {
      prefix: path.replace(/^\/|\/$/g, ''),
      code: canonicalLocale(row.Code.trim(), 'Code', index + 1),
      locale: canonicalLocale(row.Locale.trim(), 'Locale', index + 1),
      label: row.Label.trim(),
      tagline: row.Tagline.trim(),
    };
  }).filter(Boolean);

  const languages = entries.filter(({ locale }) => locale === 'en').map(({ prefix, code }) => ({
    prefix, code, translations: {},
  }));
  const root = languages.find(({ prefix }) => prefix === '');
  if (!root || root.code !== 'en') {
    throw new Error('Language sheet requires an English row with Locale en, Path /, and Code en.');
  }
  if (new Set(languages.map(({ prefix }) => prefix)).size !== languages.length
    || new Set(languages.map(({ code }) => code)).size !== languages.length) {
    throw new Error('Language sheet English rows must have unique Paths and Codes.');
  }
  entries.forEach((entry) => {
    const language = languages.find(({ prefix }) => prefix === entry.prefix);
    if (!language || language.code !== entry.code) {
      throw new Error(`Language sheet ${entry.locale} row for /${entry.prefix}: Path and Code must match an English row.`);
    }
    if (!languages.some(({ code }) => code === entry.locale)) {
      throw new Error(`Language sheet Locale ${entry.locale} is not a supported Code.`);
    }
    if (language.translations[entry.locale]) {
      throw new Error(`Language sheet has duplicate ${entry.locale} translations for /${entry.prefix}.`);
    }
    language.translations[entry.locale] = { label: entry.label, tagline: entry.tagline };
  });
  return languages;
}

export async function fetchLanguages(fetcher = fetch) {
  return parseLanguageRows(await fetchSheet(LANGUAGE_SHEET_PATH, fetcher, 'Language sheet'));
}

export function loadLanguages() {
  if (!languageRequest) {
    languageRequest = fetchLanguages().catch((error) => {
      languageRequest = undefined;
      throw error;
    });
  }
  return languageRequest;
}

export function getLanguage(pathname, languages) {
  const prefix = pathname.split('/')[1];
  return languages.find((language) => language.prefix === prefix)
    || languages.find((language) => language.prefix === '');
}

export function getLocalizedLanguages(languages, locale) {
  const missing = languages.filter(({ translations }) => !translations[locale]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(`Language sheet is missing ${locale} translations for ${missing.map(({ code }) => code).join(', ')}; showing English labels for those entries.`);
  }
  return languages.map((language) => ({
    ...language,
    ...(language.translations[locale] || language.translations.en),
  }));
}

export function getLanguageHref(language, location, languages) {
  const current = getLanguage(location.pathname, languages);
  const pagePath = current.prefix
    ? location.pathname.slice(current.prefix.length + 1)
    : location.pathname;
  const suffix = pagePath || '/';
  const pathname = language.prefix ? `/${language.prefix}${suffix}` : suffix;
  return `${pathname}${location.search}${location.hash}`;
}
