/**
 * Account sign-in form (demo).
 *
 * Authoring model (rows):
 *   Row 1: [field label, placeholder]  e.g. "Email" | "you@example.com"
 *   Row 2: [button label, optional href/target]  e.g. "Continue" | "#"
 *
 * Renders a labelled email input and a submit button. The demo does not post
 * anywhere; it prevents default and is purely presentational.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const fieldRow = rows[0];
  const buttonRow = rows[1];

  const labelText = fieldRow?.children[0]?.textContent.trim() || 'Email';
  const placeholder = fieldRow?.children[1]?.textContent.trim() || 'you@example.com';
  // Strip a trailing arrow glyph the source merges into the label.
  const buttonText = (buttonRow?.children[0]?.textContent.trim() || 'Continue').replace(/\s*→\s*$/, '');

  const form = document.createElement('form');
  form.className = 'account-signin-form';
  form.setAttribute('novalidate', '');

  const id = 'account-signin-email';
  const label = document.createElement('label');
  label.className = 'account-signin-label';
  label.setAttribute('for', id);
  label.textContent = labelText;

  const input = document.createElement('input');
  input.type = 'email';
  input.id = id;
  input.name = 'email';
  input.className = 'account-signin-input';
  input.placeholder = placeholder;
  input.autocomplete = 'email';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'account-signin-submit';
  button.textContent = buttonText;
  const arrow = document.createElement('span');
  arrow.className = 'account-signin-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  button.append(arrow);

  form.addEventListener('submit', (e) => e.preventDefault());

  form.append(label, input, button);
  block.textContent = '';
  block.append(form);
}
