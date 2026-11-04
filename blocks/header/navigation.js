import { getLanguage } from './language-selector.js';

const DEFAULT_NAV_PATH = '/fragments/nav';

export function getNavigationPath(navMeta, location) {
  const authoredPath = navMeta ? new URL(navMeta, location).pathname : DEFAULT_NAV_PATH;
  if (authoredPath !== DEFAULT_NAV_PATH) return authoredPath;
  const { prefix } = getLanguage(location.pathname);
  return prefix ? `/${prefix}${DEFAULT_NAV_PATH}` : DEFAULT_NAV_PATH;
}

export async function loadNavigation(navMeta, location, loadFragment) {
  const path = getNavigationPath(navMeta, location);
  const fragment = await loadFragment(path);
  if (fragment) return { fragment, path };

  const useDefault = !navMeta || new URL(navMeta, location).pathname === DEFAULT_NAV_PATH;
  if (useDefault && path !== DEFAULT_NAV_PATH) {
    // eslint-disable-next-line no-console
    console.warn(`Navigation fragment not found at ${path}; using ${DEFAULT_NAV_PATH}.`);
    const fallback = await loadFragment(DEFAULT_NAV_PATH);
    if (fallback) return { fragment: fallback, path: DEFAULT_NAV_PATH };
  }
  throw new Error(`Navigation fragment could not be loaded from ${path}.`);
}

export function getNavigationTool(href, label, location) {
  const { hash } = new URL(href, location);
  const key = hash.slice(1).toLowerCase();
  const tools = ['search', 'account', 'cart'];
  if (tools.includes(key)) return key;
  const labelKey = label.toLowerCase();
  return tools.includes(labelKey) ? labelKey : null;
}
