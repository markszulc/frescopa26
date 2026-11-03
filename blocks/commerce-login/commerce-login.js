import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import {
  CUSTOMER_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize
import '../../scripts/initializers/auth.js';

export const CUSTOMER_CREATE_PATH = `${CUSTOMER_PATH}/create`;

/**
 * Where to go after sign-in: the same-origin `returnUrl` query parameter if
 * present and safe, otherwise the home page. Customer pages are excluded so a
 * stale login link can't loop back to the login page.
 * @returns {string} A same-origin path
 */
export function getReturnPath() {
  const raw = new URLSearchParams(window.location.search).get('returnUrl');
  if (raw) {
    try {
      const url = new URL(raw, window.location.origin);
      if (url.origin === window.location.origin && !url.pathname.startsWith(`${CUSTOMER_PATH}/`)) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // fall through to the default
    }
  }
  return rootLink('/');
}

/**
 * Links to another auth page, carrying the current safe `returnUrl` along.
 * @param {string} path The auth page path
 * @returns {string} The link
 */
export function withReturnUrl(path) {
  const returnPath = getReturnPath();
  return returnPath === rootLink('/')
    ? rootLink(path)
    : `${rootLink(path)}?returnUrl=${encodeURIComponent(returnPath)}`;
}

/**
 * The auth drop-in marks failing inputs with `dropin-input--error` and links
 * the message via aria-describedby, but only sets aria-invalid on password
 * fields. Mirror the error class into aria-invalid so screen readers announce
 * every invalid field.
 * @param {Element} root The block element
 */
export function syncAriaInvalid(root) {
  const sync = () => root.querySelectorAll('input.dropin-input').forEach((input) => {
    const invalid = input.classList.contains('dropin-input--error') ? 'true' : 'false';
    if (input.getAttribute('aria-invalid') !== invalid) input.setAttribute('aria-invalid', invalid);
  });
  // Only class changes are observed, so our own aria-invalid writes can't loop.
  new MutationObserver(sync).observe(root, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['class'],
  });
  sync();
}

/**
 * Works around a race in the drop-in password input: it only reports its
 * value on `change` (blur), debounced by 200ms, so typing a password and
 * clicking "Sign in" (or pressing Enter) submits before the form knows the
 * password, and nothing happens. Report the value as the user types, and hold
 * a submit that comes within that window until the value has landed.
 * @param {Element} root The block element
 */
export function stabilizePasswordInput(root) {
  const SETTLE_MS = 250;
  let lastInput = 0;
  const isPassword = (el) => el instanceof HTMLInputElement
    // the show/hide toggle switches type to text, so match on name as well
    && (el.type === 'password' || /password/i.test(el.name));
  root.addEventListener('input', (e) => {
    if (!isPassword(e.target)) return;
    lastInput = Date.now();
    e.target.dispatchEvent(new Event('change', { bubbles: true }));
  });
  // A real change (on blur, e.g. the mousedown of a click on Sign in)
  // restarts the drop-in's debounce, so restart the settle window too.
  root.addEventListener('change', (e) => {
    if (e.isTrusted && isPassword(e.target)) lastInput = Date.now();
  });
  root.addEventListener('submit', (e) => {
    const wait = SETTLE_MS - (Date.now() - lastInput);
    if (wait <= 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const form = e.target;
    // re-submitting runs this check again, so a late change defers once more
    setTimeout(() => form.requestSubmit(), wait);
  }, true);
}

/**
 * Moves authored content into the card: row 1 is the intro (an eyebrow
 * paragraph, a heading, and a lede), row 2 an optional note under the form.
 * Both are optional; without an intro the drop-in's own "Sign in" title shows.
 * @param {Element} block The block element
 * @returns {Element} The element to render the sign-in form into
 */
function buildCard(block) {
  const [introRow, noteRow] = [...block.children];
  const cellContent = (row) => (row ? [...row.querySelectorAll(':scope > div > *')] : []);
  const introEls = cellContent(introRow);
  const noteEls = cellContent(noteRow);
  block.textContent = '';

  const hasIntro = introEls.some((el) => el.textContent.trim());
  if (hasIntro) {
    const intro = document.createElement('div');
    intro.className = 'commerce-login-intro';
    const headingIndex = introEls.findIndex((el) => /^H[1-6]$/.test(el.tagName));
    introEls.forEach((el, i) => {
      if (i === headingIndex) el.classList.add('commerce-login-title');
      else if (headingIndex > 0 && i < headingIndex) el.classList.add('commerce-login-eyebrow');
      else el.classList.add('commerce-login-lede');
      intro.append(el);
    });
    block.append(intro);
  }
  block.classList.toggle('commerce-login--intro', hasIntro);

  const form = document.createElement('div');
  form.className = 'commerce-login-form';
  block.append(form);

  if (noteEls.some((el) => el.textContent.trim())) {
    const note = document.createElement('div');
    note.className = 'commerce-login-note';
    note.append(...noteEls);
    block.append(note);
  }
  return form;
}

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = getReturnPath();
  } else {
    const formContainer = buildCard(block);
    syncAriaInvalid(block);
    stabilizePasswordInput(block);
    await authRenderer.render(SignIn, {
      // lets unconfirmed customers resend the confirmation email from here
      enableEmailConfirmation: true,
      renderSignUpLink: true,
      routeSignUp: () => withReturnUrl(CUSTOMER_CREATE_PATH),
      routeRedirectOnSignIn: () => getReturnPath(),
    })(formContainer);
  }
}
