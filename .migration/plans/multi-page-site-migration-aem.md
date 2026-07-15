# Multi-Page Site Migration to AEM Edge Delivery Services

## Overview
Migrate four pages from the Frescopa Atelier site to AEM Edge Delivery Services, reproducing both the content structure and the original visual design. This is a multi-page, design-matching migration.

## Source Pages
- `https://markszulc.github.io/frescopa-atelier/index.html` (Home)
- `https://markszulc.github.io/frescopa-atelier/beverages.html` (Beverages)
- `https://markszulc.github.io/frescopa-atelier/cafe.html` (Cafe)
- `https://markszulc.github.io/frescopa-atelier/blog.html` (Blog)

## Inputs Confirmed
- **Scope**: Multiple pages (the four URLs above).
- **Design fidelity**: Match the original site's look and feel.

## Approach
1. **Analyze the source pages** — Scrape each URL, capture screenshots, extract metadata, and download images. Identify sections, content sequences, and candidate block variants across all four pages.
2. **Catalog templates & blocks** — Group the pages by structural similarity so shared templates and block variants are reused rather than duplicated. Maintain consistent variants across pages via the variant manager.
3. **Build import infrastructure** — Generate block parsers and page transformers, plus per-variant import parser files, then bundle the project import script.
4. **Import content** — Run the bundled import to produce AEM-ready content for each of the four pages.
5. **Migrate the design** — Extract design tokens (colors, typography, spacing) from the original site and apply them globally, then style each block variant to visually match the source.
6. **Migrate navigation & footer** — Instrument the header/nav and footer to match the original site.
7. **Verify & critique** — Preview each imported page, compare against the original, and iterate on styling/structure until it matches.

## Checklist
- [ ] Scrape and analyze all four pages (structure, sections, sequences, images, metadata)
- [ ] Catalog pages into templates and identify shared block variants
- [ ] Reconcile/reuse block variants across pages (avoid duplicates)
- [ ] Generate import infrastructure (parsers + transformers) for each variant
- [ ] Bundle and run the content import for all four pages
- [ ] Extract global design tokens from the original site
- [ ] Apply design tokens site-wide (typography, color, spacing)
- [ ] Style each block variant to match the original design
- [ ] Migrate the site navigation/header
- [ ] Migrate the site footer
- [ ] Preview each imported page in the local dev server
- [ ] Visually critique each page against the original and iterate on fixes
- [ ] Final full-site visual QA pass across all four migrated pages

## Notes
- Execution requires **Execute mode** — this plan is prepared in Plan mode. Once you approve, I'll begin with source analysis of the four pages.
