/* eslint-disable */
/* global WebImporter */
/**
 * Parser for account-signin. Source: the sign-in section on myatelier.html.
 * Emits the head as default content (eyebrow, heading, lede), then an
 * account-signin block (email field + button), then the disclaimer paragraph.
 */
export default function parse(element, { document }) {
  const textFrom = (el) => (el ? el.textContent.trim() : '');
  const nodes = [];

  const eyebrow = element.querySelector('[class*="eyebrow"]');
  if (eyebrow && textFrom(eyebrow)) {
    const p = document.createElement('p');
    p.textContent = textFrom(eyebrow);
    nodes.push(p);
  }
  const heading = element.querySelector('h1, h2');
  if (heading) {
    const h = document.createElement('h1');
    h.textContent = textFrom(heading);
    nodes.push(h);
  }

  // Lede: the first paragraph that isn't the eyebrow/disclaimer.
  const paras = [...element.querySelectorAll('p')].filter((p) => p !== eyebrow);
  const lede = paras[0];
  if (lede && textFrom(lede)) {
    const p = document.createElement('p');
    p.textContent = textFrom(lede);
    nodes.push(p);
  }

  // The account-signin block: field label + placeholder, and the button label.
  const input = element.querySelector('input');
  const label = element.querySelector('label');
  const button = element.querySelector('button');
  const labelText = label ? textFrom(label).replace(textFrom(input), '').trim() || 'Email' : 'Email';
  const placeholder = input ? (input.getAttribute('placeholder') || 'you@example.com') : 'you@example.com';
  const buttonText = button ? textFrom(button) : 'Continue';

  const labelCell = document.createElement('div');
  labelCell.textContent = labelText;
  const phCell = document.createElement('div');
  phCell.textContent = placeholder;
  const btnCell = document.createElement('div');
  btnCell.textContent = buttonText;
  const emptyCell = document.createElement('div');

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'account-signin',
    cells: [[labelCell, phCell], [btnCell, emptyCell]],
  });
  nodes.push(block);

  // Disclaimer: the last paragraph, if distinct from the lede.
  const disclaimer = paras[paras.length - 1];
  if (disclaimer && disclaimer !== lede && textFrom(disclaimer)) {
    const p = document.createElement('p');
    p.textContent = textFrom(disclaimer);
    nodes.push(p);
  }

  element.replaceWith(...nodes);
}
