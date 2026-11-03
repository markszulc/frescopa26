export const LANGUAGES = [
  {
    prefix: '', code: 'en', label: 'English', region: 'United Kingdom',
  },
  {
    prefix: 'fr', code: 'fr', label: 'Français', region: 'France',
  },
  {
    prefix: 'de', code: 'de', label: 'Deutsch', region: 'Deutschland',
  },
  {
    prefix: 'es', code: 'es', label: 'Español', region: 'España',
  },
  {
    prefix: 'it', code: 'it', label: 'Italiano', region: 'Italia',
  },
  {
    prefix: 'jp', code: 'ja', label: '日本語', region: '日本',
  },
  {
    prefix: 'kr', code: 'ko', label: '한국어', region: '대한민국',
  },
  {
    prefix: 'cn', code: 'zh-Hans', label: '简体中文', region: '中国大陆',
  },
];

export function getLanguage(pathname) {
  const prefix = pathname.split('/')[1];
  return LANGUAGES.find((language) => language.prefix === prefix) || LANGUAGES[0];
}

export function getLanguageHref(language, location) {
  const current = getLanguage(location.pathname);
  if (language === current) return `${location.pathname}${location.search}${location.hash}`;
  const pagePath = current.prefix
    ? location.pathname.slice(current.prefix.length + 1)
    : location.pathname;
  const suffix = pagePath === '/' ? '' : pagePath;
  const pathname = language.prefix ? `/${language.prefix}${suffix}` : pagePath || '/';
  return `${pathname}${location.search}${location.hash}`;
}

export default function decorateLanguageSelector(navTools) {
  const current = getLanguage(window.location.pathname);
  const item = document.createElement('li');
  item.className = 'nav-language';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-language-button';
  button.setAttribute('aria-label', `Select language, current language: ${current.label}`);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'nav-language-menu');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <ellipse cx="12" cy="12" rx="4" ry="9"></ellipse>
      <path d="M3 12h18"></path>
    </svg>
    <span>${(current.prefix || 'en').toUpperCase()}</span>
    <svg class="nav-language-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;

  const menu = document.createElement('ul');
  menu.id = 'nav-language-menu';
  menu.className = 'nav-language-menu';
  menu.setAttribute('popover', 'auto');
  menu.setAttribute('aria-label', 'Languages');
  LANGUAGES.forEach((language) => {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.href = getLanguageHref(language, window.location);
    link.lang = language.code;
    link.hreflang = language.code;
    if (language === current) link.setAttribute('aria-current', 'true');
    const label = document.createElement('span');
    label.className = 'nav-language-label';
    label.textContent = language.label;
    const region = document.createElement('span');
    region.className = 'nav-language-region';
    region.textContent = language.region;
    link.append(label, region);
    option.append(link);
    menu.append(option);
  });
  item.append(button, menu);
  let toolsList = navTools.querySelector('ul');
  if (!toolsList) {
    toolsList = document.createElement('ul');
    navTools.append(toolsList);
  }
  toolsList.append(item);

  // The top-layer popover stays clear of the mobile navigation's scroll container.
  function positionMenu() {
    const rect = button.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 32);
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const openAbove = below < 320 && above > below;
    menu.style.left = `${Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16))}px`;
    menu.style.top = openAbove ? 'auto' : `${rect.bottom + 8}px`;
    menu.style.bottom = openAbove ? `${window.innerHeight - rect.top + 8}px` : 'auto';
    menu.style.maxHeight = `${Math.max(0, openAbove ? above : below)}px`;
  }

  menu.addEventListener('beforetoggle', (event) => {
    const open = event.newState === 'open';
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      // Refresh links in case the page's query or anchor changed after header loading.
      menu.querySelectorAll('a').forEach((link, index) => {
        link.href = getLanguageHref(LANGUAGES[index], window.location);
      });
      positionMenu();
      window.addEventListener('resize', positionMenu);
      window.addEventListener('scroll', positionMenu, true);
    } else {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    }
  });
  button.addEventListener('click', () => menu.togglePopover({ source: button }));
  item.addEventListener('focusout', (event) => {
    if (!item.contains(event.relatedTarget)) menu.hidePopover();
  });
  item.addEventListener('keydown', (event) => {
    const links = [...menu.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    const open = menu.matches(':popover-open');
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      menu.hidePopover();
      button.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) menu.showPopover({ source: button });
      let next;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = links.length - 1;
      else if (index < 0) next = event.key === 'ArrowDown' ? 0 : links.length - 1;
      else next = (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[next].focus();
    }
  });
}
