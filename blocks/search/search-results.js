import { getLanguage } from '../../scripts/languages.js';

export function labelFromPath(path) {
  let label = path;
  try {
    label = decodeURIComponent(path);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Content AI result has an invalid encoded path', error);
  }
  return label.replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getResultSection(pathname, languages, navigationLinks) {
  const { prefix } = getLanguage(pathname, languages);
  const segments = pathname.split('/').filter(Boolean);
  if (prefix) segments.shift();
  const section = segments[0];
  if (!section) return '';

  const sectionPath = prefix ? `/${prefix}/${section}` : `/${section}`;
  const link = navigationLinks.find(({ pathname: path, label }) => (
    path.replace(/\/+$/, '') === sectionPath && label.trim()
  ));
  return link ? link.label.trim() : labelFromPath(section);
}
