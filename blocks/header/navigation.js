import { getLocalizedFragmentPath, loadLocalizedFragment } from '../fragment/localized-fragment.js';

const DEFAULT_NAV_PATH = '/fragments/nav';

export function getNavigationPath(navMeta, location) {
  return getLocalizedFragmentPath(DEFAULT_NAV_PATH, navMeta, location);
}

export async function loadNavigation(navMeta, location, loadFragment) {
  return loadLocalizedFragment(DEFAULT_NAV_PATH, navMeta, location, loadFragment, 'Navigation');
}

export function getNavigationTool(href, label, location) {
  const { hash } = new URL(href, location);
  const key = hash.slice(1).toLowerCase();
  const tools = ['search', 'account', 'cart'];
  if (tools.includes(key)) return key;
  const labelKey = label.toLowerCase();
  return tools.includes(labelKey) ? labelKey : null;
}
