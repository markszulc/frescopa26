import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // label sections: brand (with newsletter form), link columns, and legal bar
  const sections = [...footer.children];
  if (sections.length) {
    sections[0].classList.add('footer-brand');
    sections[sections.length - 1].classList.add('footer-legal');
    sections.slice(1, -1).forEach((s) => s.classList.add('footer-column'));
  }

  // build the newsletter signup form inside the brand section (kept out of the
  // portable fragment because DA/EDS strips form controls)
  const brand = footer.querySelector('.footer-brand');
  if (brand) {
    const signup = document.createElement('form');
    signup.className = 'footer-signup';
    signup.innerHTML = `
      <label for="footer-email">A little warmth in your inbox.</label>
      <div class="footer-signup-row">
        <input id="footer-email" type="email" placeholder="you@example.com" autocomplete="email">
        <button type="submit" class="button">Sign up</button>
      </div>`;
    signup.addEventListener('submit', (e) => e.preventDefault());
    brand.append(signup);
  }

  // build the social row inside the legal section
  const legal = footer.querySelector('.footer-legal');
  if (legal) {
    const social = document.createElement('ul');
    social.className = 'footer-social';
    [
      ['Instagram', 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm4.5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.25-3.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z'],
      ['Pinterest', 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2-1.4-3.6-3.9-3.6a4.5 4.5 0 0 0-4.7 4.5c0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.2-1.3-.5-1.9-2-1.9-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2 6.4-5 6.4-1 0-2-.5-2.3-1.2l-.6 2.4c-.2.8-.7 1.8-1.1 2.5A10 10 0 1 0 12 2Z'],
      ['YouTube', 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.8C19.2 5 12 5 12 5s-7.2 0-8.9.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.8c1.7.5 8.9.5 8.9.5s7.2 0 8.9-.5a2.5 2.5 0 0 0 1.7-1.8C23 15.2 23 12 23 12ZM9.8 15.3V8.7l6 3.3-6 3.3Z'],
    ].forEach(([label, path]) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" aria-label="${label}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg></a>`;
      social.append(li);
    });
    legal.prepend(social);
  }

  block.append(footer);
}
