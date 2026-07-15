/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fréscopa Atelier section breaks + section metadata.
 *
 * Section-aware, template-driven. Reads payload.template.sections (populated in
 * page-templates.json for all four templates: home=9, beverages=5, cafe=7,
 * blog=3 sections). For each section:
 *   - inserts an <hr> before it (for every section except the first) to create
 *     an EDS section break;
 *   - when section.style is set, appends a "Section Metadata" block inside the
 *     section carrying the style.
 *
 * Selectors come from each section's `selector` in the template (verified
 * against the captured cleaned.html: home uses "section.<name>",
 * beverages/cafe/blog use "#dc-root section:nth-of-type(N)" and id selectors
 * like "#experience", "#whatson", "#locations", "#tour").
 *
 * Processed in reverse so DOM insertions don't shift the positions of
 * not-yet-processed sections. Runs in afterTransform only.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Runs in beforeTransform (NOT afterTransform): block parsers call
 * element.replaceWith(block), which destroys the whole-section elements that
 * some blocks are mapped to (e.g. section.intro -> columns-editorial). If this
 * ran afterTransform, querySelector('section.intro') would return null for
 * those sections and no break/metadata would be inserted, merging multiple
 * logical sections into one. Running here, before parsing, guarantees every
 * section element still exists.
 *
 * The <hr> break is inserted BEFORE each section and the Section Metadata block
 * AFTER it, both as siblings of the section. Siblings survive the parser's
 * replaceWith(), so breaks/metadata stay correctly positioned around the block
 * the parser produces.
 */
export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const doc = element.ownerDocument;

  const resolved = sections.map((section) => ({
    section,
    el: section.selector ? element.querySelector(section.selector) : null,
  }));

  // Reverse order so inserting nodes around earlier sections does not disturb
  // nth-of-type selectors for later, not-yet-processed sections.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, el } = resolved[i];
    if (!el) continue;

    // Section Metadata block (carrying style) as a sibling AFTER the section, so
    // it stays in the same section region after the parser replaces the section.
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      el.after(metaBlock);
    }

    // Section break before every section except the first.
    if (i > 0) {
      el.before(doc.createElement('hr'));
    }
  }
}
