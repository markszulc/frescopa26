import { getLanguage, getLanguageHref, getLocalizedLanguages } from '../../scripts/languages.js';

export default function decorateLanguageSelector(navTools, languages) {
  const locale = getLanguage(window.location.pathname, languages).code;
  const options = getLocalizedLanguages(languages, locale);
  const current = getLanguage(window.location.pathname, options);
  const item = document.createElement('li');
  item.className = 'nav-language';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-language-button';
  const labels = navTools.dataset;
  button.setAttribute('aria-label', (labels.selectLanguage || 'Select language, current language: {language}').replace('{language}', current.label));
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'nav-language-menu');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <ellipse cx="12" cy="12" rx="4" ry="9"></ellipse>
      <path d="M3 12h18"></path>
    </svg>
    <svg class="nav-language-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;

  const menu = document.createElement('ul');
  menu.id = 'nav-language-menu';
  menu.className = 'nav-language-menu';
  menu.setAttribute('popover', 'auto');
  menu.setAttribute('aria-label', labels.languages || 'Languages');
  options.forEach((language) => {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.href = getLanguageHref(language, window.location, languages);
    link.lang = locale;
    link.hreflang = language.code;
    if (language === current) link.setAttribute('aria-current', 'true');
    const label = document.createElement('span');
    label.className = 'nav-language-label';
    label.textContent = language.label;
    const tagline = document.createElement('span');
    tagline.className = 'nav-language-tagline';
    tagline.lang = language.code;
    tagline.textContent = language.tagline;
    link.append(label, tagline);
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
        link.href = getLanguageHref(options[index], window.location, languages);
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
