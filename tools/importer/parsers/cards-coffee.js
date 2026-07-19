/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-coffee. Base: Cards (2 columns: image cell + text cell per row).
 * Source: a product-family section on coffee.html.
 *
 * Each family holds one or more <article> product cards (placeholder image-slot,
 * optional "Most loved" badge, category, heading link, description, format chips,
 * a "from $price", an Add-to-bag button, and a Choose-options link). Emits one
 * card row per article: [imageCell, textCell] where textCell holds:
 *   [badge?] [category] <h3> [description] [formats ul] [price] [cta].
 */
export default function parse(element, { document, url }) {
  // Normalise relative image sources to absolute so the importer can resolve them.
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try {
        img.setAttribute('src', new URL(img.getAttribute('src'), url).href);
      } catch (e) { /* leave as-is */ }
    });
  }

  const articles = Array.from(element.querySelectorAll('article'));
  if (!articles.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textFrom = (el) => (el ? el.textContent.trim() : '');

  // --- Family head (default content ahead of the grid): label + heading + desc. ---
  const headNodes = [];
  const headHeading = element.querySelector('h2');
  if (headHeading) {
    const label = headHeading.previousElementSibling;
    if (label && textFrom(label) && label.tagName !== 'H2') {
      const p = document.createElement('p');
      p.textContent = textFrom(label);
      headNodes.push(p);
    }
    const h2 = document.createElement('h2');
    h2.textContent = textFrom(headHeading);
    headNodes.push(h2);
    const headContainer = headHeading.closest('div');
    const scope = headContainer && headContainer.parentElement ? headContainer.parentElement : headContainer;
    if (scope) {
      scope.querySelectorAll('p').forEach((p) => {
        if (textFrom(p)) {
          const np = document.createElement('p');
          np.textContent = textFrom(p);
          headNodes.push(np);
        }
      });
    }
  }

  const rows = articles.map((article) => {
    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');

    // Image cell (mandatory per convention): keep a real picture/img; leave
    // empty for placeholder image-slots.
    const img = article.querySelector('img');
    if (img) {
      const picture = document.createElement('picture');
      const clone = document.createElement('img');
      clone.setAttribute('src', img.getAttribute('src'));
      clone.setAttribute('alt', img.getAttribute('alt') || '');
      picture.append(clone);
      imageCell.append(picture);
    }

    // Badge ("Most loved").
    const badge = article.querySelector('[class*="badge"]');
    if (badge && textFrom(badge)) {
      const p = document.createElement('p');
      p.textContent = textFrom(badge);
      textCell.append(p);
    }

    // Category + heading. The category is the label group directly before the
    // heading in the body (e.g. "Blends & roasts").
    const heading = article.querySelector('h3, h2, h4');
    if (heading) {
      const category = heading.previousElementSibling;
      if (category && textFrom(category) && !/^h[1-6]$/i.test(category.tagName)) {
        const p = document.createElement('p');
        p.textContent = textFrom(category);
        textCell.append(p);
      }
      const h = document.createElement('h3');
      const hLink = heading.querySelector('a');
      if (hLink) {
        const a = document.createElement('a');
        a.setAttribute('href', hLink.getAttribute('href') || '#');
        a.textContent = textFrom(heading);
        h.append(a);
      } else {
        h.textContent = textFrom(heading);
      }
      textCell.append(h);
    }

    // Description (the article's paragraph).
    const desc = article.querySelector('p');
    if (desc && textFrom(desc)) {
      const np = document.createElement('p');
      np.textContent = textFrom(desc);
      textCell.append(np);
    }

    // Format chips (Ground / Whole bean / Raw bean / Pods / Regular / Decaf).
    const formatWords = /^(ground|whole bean|raw bean|pods|regular|decaf)$/i;
    const chipSpans = [...article.querySelectorAll('span')]
      .filter((s) => s.children.length === 0 && formatWords.test(textFrom(s)));
    if (chipSpans.length) {
      const ul = document.createElement('ul');
      const seen = new Set();
      chipSpans.forEach((s) => {
        const t = textFrom(s);
        if (seen.has(t.toLowerCase())) return;
        seen.add(t.toLowerCase());
        const li = document.createElement('li');
        li.textContent = t;
        ul.append(li);
      });
      textCell.append(ul);
    }

    // Price: "from $10".
    const priceAmount = [...article.querySelectorAll('span')]
      .find((s) => s.children.length === 0 && /^[£$€]\s?\d/.test(textFrom(s)));
    if (priceAmount) {
      const fromLabel = [...article.querySelectorAll('span')]
        .find((s) => s.children.length === 0 && /^from$/i.test(textFrom(s)));
      const p = document.createElement('p');
      p.textContent = `${fromLabel ? `${textFrom(fromLabel)} ` : ''}${textFrom(priceAmount)}`;
      textCell.append(p);
    }

    // CTA: the "Choose options" link.
    const ctaLink = article.querySelector('a[class*="link"]')
      || [...article.querySelectorAll('a')].pop();
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', ctaLink.getAttribute('href') || '#');
      a.textContent = textFrom(ctaLink) || 'Choose options';
      p.append(a);
      textCell.append(p);
    }

    return [imageCell, textCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-coffee', cells: rows });
  element.replaceWith(...headNodes, block);
}
