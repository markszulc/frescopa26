import { events } from '@dropins/tools/event-bus.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Turns the nav's cart tool into a mini cart toggle: a live item-count badge
 * driven by cart/data events, and a drawer that lazy-loads the mini cart
 * fragment (commerce-mini-cart block) on first open.
 * @param {Element} link The decorated cart link from the nav tools
 */
async function decorateMiniCart(link) {
  const labels = await fetchPlaceholders();
  const cartLabel = labels.Global?.Cart ?? 'Cart';
  const countLabel = (count) => (count === 1
    ? labels.Global?.CartWithItem?.replace('{count}', count) ?? `${cartLabel}, ${count} item`
    : labels.Global?.CartWithItems?.replace('{count}', count) ?? `${cartLabel}, ${count} items`);
  const updatedLabel = (count) => {
    if (!count) return labels.Global?.CartUpdatedEmpty ?? 'Cart updated, cart is empty';
    return count === 1
      ? labels.Global?.CartUpdatedWithItem?.replace('{count}', count) ?? `Cart updated, ${count} item in cart`
      : labels.Global?.CartUpdatedWithItems?.replace('{count}', count) ?? `Cart updated, ${count} items in cart`;
  };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-cart-button';
  button.innerHTML = link.innerHTML;
  button.setAttribute('aria-label', countLabel(0));
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'minicart-drawer');

  // Kept mounted so count changes are announced; the visual badge is CSS-only.
  const status = document.createElement('span');
  status.className = 'nav-cart-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  link.replaceWith(button);
  button.after(status);

  const overlay = document.createRange().createContextualFragment(`
    <div class="minicart-overlay">
      <div class="minicart-drawer" id="minicart-drawer" role="dialog" aria-modal="true" aria-labelledby="minicart-title" tabindex="-1">
        <div class="minicart-drawer-head">
          <h2 class="minicart-drawer-title" id="minicart-title"></h2>
          <button type="button" class="minicart-close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"></path></svg>
          </button>
        </div>
        <div class="minicart-drawer-body"></div>
      </div>
    </div>
  `).firstElementChild;
  overlay.inert = true;
  overlay.querySelector('.minicart-drawer-title').textContent = cartLabel;
  overlay.querySelector('.minicart-close').setAttribute('aria-label', labels.Global?.CloseCart ?? 'Close cart');
  document.body.append(overlay);

  const drawer = overlay.querySelector('.minicart-drawer');
  const drawerBody = overlay.querySelector('.minicart-drawer-body');
  const closeButton = overlay.querySelector('.minicart-close');
  const title = overlay.querySelector('.minicart-drawer-title');
  let loading;

  const loadMiniCart = () => {
    if (!loading) {
      loading = (async () => {
        drawerBody.setAttribute('aria-busy', 'true');
        const miniCartMeta = getMetadata('mini-cart');
        const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
        const fragment = await loadFragment(miniCartPath);
        if (fragment?.firstElementChild) {
          drawerBody.append(fragment.firstElementChild);
        } else {
          // eslint-disable-next-line no-console
          console.warn(`Mini cart fragment not found at ${miniCartPath}`);
          loading = null;
        }
        drawerBody.removeAttribute('aria-busy');
      })();
    }
    return loading;
  };

  const getFocusable = () => [...drawer.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.offsetParent !== null);

  /* eslint-disable no-use-before-define */
  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      // keep the nav's own Escape handling (on window) from also firing
      e.stopPropagation();
      e.preventDefault();
      closeMiniCart();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) {
      e.preventDefault();
      drawer.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  /* eslint-enable no-use-before-define */

  async function openMiniCart() {
    if (overlay.classList.contains('is-open')) return;
    overlay.inert = false;
    overlay.classList.add('is-open');
    document.body.classList.add('minicart-open');
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKeydown);
    // Focus the dialog itself, not the close button: Chrome activates buttons on
    // the Enter keypress that follows the keydown which opened the drawer.
    drawer.focus();
    await loadMiniCart();
    const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
    publishShoppingCartViewEvent();
  }

  function closeMiniCart() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.inert = true;
    document.body.classList.remove('minicart-open');
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    button.focus();
  }

  button.addEventListener('click', () => {
    if (overlay.classList.contains('is-open')) closeMiniCart();
    else openMiniCart();
  });
  closeButton.addEventListener('click', closeMiniCart);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMiniCart();
  });

  let previousCount;
  events.on('cart/data', (data) => {
    const count = data?.totalQuantity ?? 0;
    if (count) button.dataset.count = count > 99 ? '99+' : count;
    else delete button.dataset.count;
    button.setAttribute('aria-label', countLabel(count));
    title.textContent = count ? `${cartLabel} (${count})` : cartLabel;
    // announce changes only, not the initial count on page load
    if (previousCount !== undefined && previousCount !== count) {
      status.textContent = updatedLabel(count);
    }
    previousCount = count;
  }, { eager: true });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/fragments/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // mark the nav link for the current site section. Choose the link whose
    // path is the longest match for the current page so a deep page like
    // /machines/atelier highlights "The Atelier" rather than "Machines".
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    let currentLink = null;
    let currentLen = -1;
    navSections.querySelectorAll('a[href]').forEach((link) => {
      const linkPath = new URL(link.href, window.location).pathname.replace(/\/+$/, '') || '/';
      const isMatch = linkPath === currentPath
        || (linkPath !== '/' && currentPath.startsWith(`${linkPath}/`));
      if (isMatch && linkPath.length > currentLen) {
        currentLen = linkPath.length;
        currentLink = link;
      }
    });
    if (currentLink) currentLink.setAttribute('aria-current', 'page');

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // decorate nav tools as icon buttons (search / account / cart), matching source
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolIcons = {
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2" stroke-linecap="round"></path>',
      account: '<circle cx="12" cy="8" r="4"></circle><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke-linecap="round"></path>',
      cart: '<path d="M6 8h12l-1 11H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0" stroke-linecap="round"></path>',
    };
    navTools.querySelectorAll('a').forEach((link) => {
      const label = link.textContent.trim();
      // match by href fragment (#search) or by the link label (Search)
      const hrefKey = (link.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
      const key = toolIcons[hrefKey] ? hrefKey : label.toLowerCase();
      const icon = toolIcons[key];
      if (!icon) return;
      link.setAttribute('aria-label', label);
      link.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icon}</svg>`;
      if (key === 'search') {
        link.setAttribute('aria-haspopup', 'dialog');
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            const { default: openSearch } = await import('../search/search.js');
            openSearch(link);
          } catch {
            // If the search module fails to load, fall back to navigating the link.
            window.location.assign(link.href);
          }
        });
      }
      if (key === 'cart') decorateMiniCart(link);
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
