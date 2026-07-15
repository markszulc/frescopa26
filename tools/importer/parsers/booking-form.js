/* eslint-disable */
/* global WebImporter */
/**
 * Parser for booking-form. Base: booking-form (custom block).
 * Source: https://markszulc.github.io/frescopa-atelier/cafe.html (#tour)
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/booking-form/booking-form.js):
 *   Row 1 (single cell): intro copy — eyebrow, heading, paragraph, benefits list.
 *   Row 2 (single cell): form fields, one paragraph per field using the
 *     "Label | type | options" convention, e.g.
 *       "Café | select | Choose a showroom café, Fréscopa SoHo, ..."
 *       "Date | date"
 *       "I'd most like to see | toggle | The Atelier line, Espresso & milk"
 *       "Request this tour | submit"
 *       "note | We'll confirm by email within one business day."
 *
 * The parser reconstructs those text specs from the rendered form controls.
 */
export default function parse(element, { document }) {
  // ---- Locate the copy column and the form column ----
  // The form column must hold ALL the form controls. Among candidate divs,
  // choose the one containing the most controls but that does NOT also contain
  // the intro heading (so we don't grab a wrapper enclosing the copy column).
  const controlCount = (el) => el.querySelectorAll('select, input, textarea').length;
  const totalControls = controlCount(element);
  const introHeading = element.querySelector('h1, h2');
  const formCandidates = Array.from(element.querySelectorAll('div'))
    .filter((d) => controlCount(d) === totalControls
      && (!introHeading || !d.contains(introHeading)));
  // Smallest wrapper that still holds every control (deepest common ancestor).
  const formHost = formCandidates.sort(
    (a, b) => b.querySelectorAll('*').length - a.querySelectorAll('*').length,
  ).pop() || formCandidates[0] || null;

  // The copy column: the block holding the intro heading, NOT inside the form host.
  const heading = Array.from(element.querySelectorAll('h1, h2')).find(
    (h) => !formHost || !formHost.contains(h),
  );

  const cells = [];

  // ---- Row 1: intro copy ----
  const copyContent = [];
  const copyHost = heading ? heading.parentElement : element;
  if (copyHost) {
    Array.from(copyHost.children).forEach((child) => {
      if (child.matches('span, h1, h2, h3, h4, p, ul, ol')
        && (!formHost || !formHost.contains(child))
        && !child.querySelector('select, input, button[type]')) {
        copyContent.push(child);
      }
    });
  }

  // ---- Row 2: form field specs ----
  const specParagraphs = [];
  const pushSpec = (text) => {
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    specParagraphs.push(p);
  };

  const fieldRoot = formHost || element;

  // Each labelled field is a <label> with a caption span + a control.
  const labels = Array.from(fieldRoot.querySelectorAll('label'));
  labels.forEach((label) => {
    const caption = label.querySelector(':scope > span');
    const labelText = caption ? caption.textContent.replace(/\s+/g, ' ').trim() : '';
    const select = label.querySelector('select');
    const input = label.querySelector('input');

    if (select) {
      const options = Array.from(select.querySelectorAll('option'))
        .map((o) => o.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      pushSpec(`${labelText} | select | ${options.join(', ')}`);
    } else if (input) {
      // Infer field type from the caption text.
      let type = 'text';
      const lower = labelText.toLowerCase();
      if (lower.includes('email')) type = 'email';
      else if (lower.includes('phone') || lower.includes('tel')) type = 'tel';
      else if (lower.includes('date')) type = 'date';
      pushSpec(`${labelText} | ${type}`);
    }
  });

  // Toggle groups: a container of buttons preceded by a caption span/label,
  // that is not the submit action.
  const toggleGroups = Array.from(fieldRoot.querySelectorAll('div')).filter((d) => {
    const btns = Array.from(d.children).filter((c) => c.tagName === 'BUTTON');
    return btns.length >= 2 && btns.every((b) => !/submit|request/i.test(b.textContent));
  });
  toggleGroups.forEach((group) => {
    // Caption: nearest preceding text (a span in the group's parent).
    const parent = group.parentElement;
    let caption = '';
    if (parent) {
      const span = Array.from(parent.children).find(
        (c) => c.tagName === 'SPAN' && c.textContent.trim(),
      );
      if (span) caption = span.textContent.replace(/\s+/g, ' ').trim();
    }
    const options = Array.from(group.children)
      .filter((c) => c.tagName === 'BUTTON')
      .map((b) => b.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    pushSpec(`${caption || 'Options'} | toggle | ${options.join(', ')}`);
  });

  // Submit button.
  const submit = fieldRoot.querySelector(
    'button[type="submit"], button.fr-btn, [class*="btn"] button, button',
  );
  const submitBtn = Array.from(fieldRoot.querySelectorAll('button')).find(
    (b) => /request|book|submit|reserve/i.test(b.textContent),
  ) || submit;
  if (submitBtn) {
    pushSpec(`${submitBtn.textContent.replace(/\s+/g, ' ').trim()} | submit`);
  }

  // Trailing note paragraph.
  const notePara = Array.from(fieldRoot.querySelectorAll('p')).pop();
  if (notePara && notePara.textContent.trim()) {
    pushSpec(`note | ${notePara.textContent.replace(/\s+/g, ' ').trim()}`);
  }

  // Empty-block guard.
  if (copyContent.length === 0 && specParagraphs.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push([copyContent]);
  cells.push([specParagraphs]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'booking-form', cells });
  element.replaceWith(block);
}
