/* eslint-disable */
/* global WebImporter */
/**
 * Parser for taste-profile. Base: taste-profile (custom block).
 * Source: https://markszulc.github.io/frescopa-atelier/ (section.learn)
 * Generated: 2026-07-15
 *
 * Authoring model (from blocks/taste-profile/taste-profile.js):
 *   Row 1: copy — eyebrow, heading, lede, optional points list (single cell).
 *   Row 2+: one profile per row, 3 cells: [label, readout title, readout note].
 *
 * Source notes: profile labels come from `.dna__controls button` (data-profile).
 * The readout title/note are JS-driven (data-flavor-* attributes) and only the
 * default profile's readout is present statically, so we attach the visible
 * readout to the matching/default button and fall back to the label for others.
 */
export default function parse(element, { document }) {
  // --- Row 1: editorial copy ---
  const copySource = element.querySelector('.learn__copy, [class*="copy"]') || element;
  const copyContent = [];
  const eyebrow = copySource.querySelector('.eyebrow, [class*="eyebrow"]');
  const heading = copySource.querySelector('h1, h2, h3, [class*="title"]');
  const lede = copySource.querySelector('.lede, p.lede, [class*="lede"]');
  const points = copySource.querySelector('ul, .learn__points, [class*="points"]');

  if (eyebrow) copyContent.push(eyebrow);
  if (heading) copyContent.push(heading);
  if (lede) copyContent.push(lede);
  // Any additional intro paragraphs (excluding the lede already captured).
  Array.from(copySource.querySelectorAll(':scope > p')).forEach((p) => {
    if (p !== lede && !copyContent.includes(p)) copyContent.push(p);
  });
  if (points) copyContent.push(points);

  // --- Rows 2+: profiles from the control buttons ---
  const buttons = Array.from(
    element.querySelectorAll('.dna__controls button, [class*="controls"] button, [data-profile]'),
  );
  const uniqueButtons = [...new Set(buttons)];

  // The statically rendered readout (belongs to the default/active profile).
  const readout = element.querySelector('.dna__readout, [class*="readout"]');
  const readoutTitle = readout && readout.querySelector('h1, h2, h3, h4, [data-flavor-title]');
  const readoutNote = readout && readout.querySelector('p, [data-flavor-note]');
  const defaultProfile = (element.querySelector('[data-flavor-dna]') || {}).dataset
    ? (element.querySelector('[data-flavor-dna]').dataset.default || '')
    : '';

  // Empty-block guard.
  if (copyContent.length === 0 && uniqueButtons.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([copyContent]);

  uniqueButtons.forEach((btn) => {
    const label = (btn.textContent || '').trim();
    const isDefault = defaultProfile
      ? btn.dataset && btn.dataset.profile === defaultProfile
      : false;

    let title = label;
    let note = '';
    if (isDefault) {
      if (readoutTitle && readoutTitle.textContent.trim()) title = readoutTitle.textContent.trim();
      if (readoutNote && readoutNote.textContent.trim()) note = readoutNote.textContent.trim();
    }

    cells.push([label, title, note]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'taste-profile', cells });
  element.replaceWith(block);
}
