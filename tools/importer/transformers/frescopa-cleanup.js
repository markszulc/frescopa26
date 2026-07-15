/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fréscopa Atelier site-wide cleanup.
 *
 * The source is a "dc-runtime" / Document Authoring rendered site. Two DOM
 * variants were observed across the captured pages:
 *   - Static homepage (index.html): <header class="header">, <footer class="footer">,
 *     semantic <section class="hero|intro|...">.
 *   - dc-runtime pages (beverages.html, cafe.html, blog.html): wrapped in
 *     <div id="dc-root"><div class="sc-host"><div>...</div></div></div>, with
 *     <header class="fr-hdr">, <footer class="fr-ftr">, many inert
 *     <div class="sc-host-x"> inline wrappers, and <span class="sc-interp">
 *     interpolated-text wrappers.
 *
 * All selectors below were verified against the captured cleaned.html for
 * home / beverages / cafe / blog under migration-work/pages/.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Unwrap dc-runtime interpolated-text spans to plain text.
    // Observed on beverages/cafe/blog: <span class="sc-interp">text</span>.
    // Done before parsing so block parsers see clean text nodes, not nested spans.
    element.querySelectorAll('span.sc-interp').forEach((span) => {
      span.replaceWith(...span.childNodes);
    });

    // Flatten the inert inline wrapper divs added by dc-runtime around badges,
    // buttons, links and image-slots: <div class="sc-host-x">...</div>.
    // These add no semantic value. Unwrap (keep children) so parsing sees the
    // real content. Section selectors in page-templates.json target
    // "#dc-root section:nth-of-type(N)" so #dc-root and .sc-host are NOT removed
    // here (removing/flattening them would break those section selectors).
    element.querySelectorAll('div.sc-host-x').forEach((wrap) => {
      wrap.replaceWith(...wrap.childNodes);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove site-wide chrome. Header (nav) and footer are migrated separately.
    // Static homepage variant: header.header / footer.footer.
    // dc-runtime variant: header.fr-hdr / footer.fr-ftr.
    WebImporter.DOMUtils.remove(element, [
      'header.header',
      'footer.footer',
      'header.fr-hdr',
      'footer.fr-ftr',
      'header',
      'footer',
      'nav',
    ]);

    // Drop decorative / social / utility icons. On every page these are inline
    // base64 SVG data URIs (search, account, cart, scroll chevron, social).
    // They are not authorable content.
    element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
      img.remove();
    });

    // Remove non-authorable interactive utility controls left behind after the
    // header/footer removal (icon buttons, nav toggles, newsletter signup form
    // inputs). Observed: button.iconbtn, button.nav-toggle, button.fr-iconbtn,
    // button.fr-hdr__toggle, form.signup, form.fr-ftr__signup.
    WebImporter.DOMUtils.remove(element, [
      'form.signup',
      'form.fr-ftr__signup',
    ]);

    // Remove the accessibility "Skip to content" link. It targets the source's
    // in-page anchor, is part of site chrome (not authorable content), and when
    // left in the page it renders above the hero and pushes it down.
    element.querySelectorAll('a[href="#main"], a.skip-link, a.skip-to-content').forEach((a) => {
      const text = a.textContent.trim().toLowerCase();
      if (a.getAttribute('href') === '#main' || text === 'skip to content') {
        (a.closest('p') || a).remove();
      }
    });
  }
}
