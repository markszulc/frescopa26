import { getLanguage } from '../header/language-selector.js';

export function getLocalizedFragmentPath(defaultPath, metadata, location) {
  const authoredPath = metadata ? new URL(metadata, location).pathname : defaultPath;
  if (authoredPath !== defaultPath) return authoredPath;
  const { prefix } = getLanguage(location.pathname);
  return prefix ? `/${prefix}${defaultPath}` : defaultPath;
}

export async function loadLocalizedFragment(defaultPath, metadata, location, loadFragment, label) {
  const path = getLocalizedFragmentPath(defaultPath, metadata, location);
  const fragment = await loadFragment(path);
  if (fragment) return { fragment, path };

  const useDefault = !metadata || new URL(metadata, location).pathname === defaultPath;
  if (useDefault && path !== defaultPath) {
    // eslint-disable-next-line no-console
    console.warn(`${label} fragment not found at ${path}; using ${defaultPath}.`);
    const fallback = await loadFragment(defaultPath);
    if (fallback) return { fragment: fallback, path: defaultPath };
  }
  throw new Error(`${label} fragment could not be loaded from ${path}.`);
}
