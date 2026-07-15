/* eslint-disable */
/* global WebImporter */
/**
 * Parser for mood-calendar. Base: mood-calendar (custom block).
 * Source: https://markszulc.github.io/frescopa-atelier/ (section.mood)
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/mood-calendar/mood-calendar.js):
 *   Row 1: copy — eyebrow, heading, lede, hint (single cell).
 *   Row 2+: one selectable day per row, 4 cells: [day, brew tag, brew title, brew note].
 *
 * Source notes: selectable days are `.cal__day` <button> elements (muted <span>
 * days are non-interactive and skipped). Per-day brew data lives in
 * data-brew-tag / data-brew-title / data-brew-note attributes.
 */
export default function parse(element, { document }) {
  // --- Row 1: editorial copy ---
  const copySource = element.querySelector('.mood__copy, [class*="copy"]') || element;
  const copyContent = [];
  const eyebrow = copySource.querySelector('.eyebrow, [class*="eyebrow"]');
  const heading = copySource.querySelector('h1, h2, h3, [class*="title"]');
  const lede = copySource.querySelector('.lede, p.lede, [class*="lede"]');
  const hint = copySource.querySelector('.mood__hint, [class*="hint"]');

  if (eyebrow) copyContent.push(eyebrow);
  if (heading) copyContent.push(heading);
  if (lede) copyContent.push(lede);
  if (hint) copyContent.push(hint);

  // --- Rows 2+: selectable calendar days (buttons only) ---
  const dayButtons = Array.from(
    element.querySelectorAll('button.cal__day, .cal__day button, button[data-day], [class*="cal__day"]'),
  ).filter((el) => el.tagName === 'BUTTON');
  const uniqueDays = [...new Set(dayButtons)];

  // Empty-block guard.
  if (copyContent.length === 0 && uniqueDays.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([copyContent]);

  uniqueDays.forEach((btn) => {
    const day = (btn.textContent || '').trim();
    const tag = btn.getAttribute('data-brew-tag') || '';
    const title = btn.getAttribute('data-brew-title') || '';
    const note = btn.getAttribute('data-brew-note') || '';
    cells.push([day, tag, title, note]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'mood-calendar', cells });
  element.replaceWith(block);
}
