/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-machine. Base: Cards (2 columns: image cell + text cell per row).
 * Source: a product-family section on machines.html.
 *
 * Each family holds one or more <article> machine cards (a large flagship with a
 * photo + feature list, and compact companions with placeholder image-slots).
 * Emits one card row per article: [imageCell, textCell].
 *   - imageCell: the card's <picture>/<img>, or empty when the source used a
 *     placeholder image-slot (companion machines ship without a photo).
 *   - textCell: eyebrow (p), heading (h3), description (p), optional feature
 *     list (ul, flagship), and a price+CTA paragraph. A leading "New" paragraph
 *     is emitted for the flagship badge.
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

  // --- Family head (default content before the cards): label, heading, desc,
  // and the "How they differ" note. The head is the first head-level div in the
  // section (holds an h2); flatten its two columns into clean elements. ---
  const headNodes = [];
  const headHeading = element.querySelector('h2');
  if (headHeading) {
    const headContainer = headHeading.closest('div');
    const columns = headContainer && headContainer.parentElement
      ? [...headContainer.parentElement.children]
      : [headContainer];
    // Left column: label (span) + h2 + description (p).
    const label = headHeading.previousElementSibling;
    if (label && textFrom(label) && label.tagName !== 'H2') {
      const p = document.createElement('p');
      p.textContent = textFrom(label);
      headNodes.push(p);
    }
    const h2 = document.createElement('h2');
    h2.textContent = textFrom(headHeading);
    headNodes.push(h2);
    // Remaining paragraphs in the head container (description + how-they-differ note).
    columns.forEach((col) => {
      col.querySelectorAll('p').forEach((p) => {
        if (textFrom(p)) {
          const np = document.createElement('p');
          np.textContent = textFrom(p);
          headNodes.push(np);
        }
      });
    });
  }

  const rows = articles.map((article) => {
    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');

    // Image cell (mandatory per convention): keep a real picture/img; leave empty
    // when the source used a placeholder image-slot.
    const img = article.querySelector('img');
    if (img) {
      const picture = document.createElement('picture');
      const clone = document.createElement('img');
      clone.setAttribute('src', img.getAttribute('src'));
      clone.setAttribute('alt', img.getAttribute('alt') || '');
      picture.append(clone);
      imageCell.append(picture);
    }

    // Flagship "New" badge (source: span.fr-badge). Emit as a leading paragraph.
    const badge = article.querySelector('[class*="badge"]');
    if (badge && /new/i.test(textFrom(badge))) {
      const p = document.createElement('p');
      p.textContent = textFrom(badge);
      textCell.append(p);
    }

    // Eyebrow: the element directly preceding the heading (e.g. "The flagship").
    const heading = article.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const prev = heading.previousElementSibling;
      const eyebrowText = prev && prev.tagName !== 'IMG' ? textFrom(prev) : '';
      if (eyebrowText) {
        const p = document.createElement('p');
        p.textContent = eyebrowText;
        textCell.append(p);
      }
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = textFrom(heading);
      textCell.append(h);
    }

    // Description paragraph(s).
    article.querySelectorAll('p').forEach((p) => {
      const t = textFrom(p);
      if (t) {
        const np = document.createElement('p');
        np.textContent = t;
        textCell.append(np);
      }
    });

    // Feature list (flagship only).
    const ul = article.querySelector('ul');
    if (ul) {
      const list = document.createElement('ul');
      ul.querySelectorAll('li').forEach((li) => {
        const item = document.createElement('li');
        const spans = [...li.querySelectorAll('span')].reverse();
        const textSpan = spans.find((s) => textFrom(s) && textFrom(s) !== '→');
        item.textContent = textSpan ? textFrom(textSpan) : textFrom(li).replace(/^→\s*/, '');
        list.append(item);
      });
      textCell.append(list);
    }

    // Price + CTA: price span + the anchor, merged into one paragraph.
    const link = article.querySelector('a');
    const priceEl = [...article.querySelectorAll('span')].find((s) => /^[£$€]\s?\d/.test(textFrom(s)));
    const foot = document.createElement('p');
    if (priceEl) foot.append(document.createTextNode(textFrom(priceEl)));
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href') || '#');
      a.textContent = textFrom(link);
      foot.append(a);
    }
    if (foot.textContent.trim()) textCell.append(foot);

    return [imageCell, textCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-machine', cells: rows });
  // Emit the family head as default content, then the cards block.
  element.replaceWith(...headNodes, block);
}
