/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Journal article page. Source: a single <article> with a header
 * (breadcrumb, title, lede, byline), a hero figure, a prose body (headings,
 * paragraphs, figures, blockquote, a "short version" aside, a share row and an
 * author bio), and a "More from the Journal" cards section.
 *
 * Emits a flat sequence of default-content nodes plus these blocks:
 *   - article-byline (top compact byline + bio variant)
 *   - article-share
 *   - cards-article (the related-reading cards)
 * Figures become an image + an italic caption paragraph; the aside becomes a
 * cards-reasons-free "key points" list kept as default content.
 */
export default function parse(element, { document, url }) {
  if (url) {
    element.querySelectorAll('img[src]').forEach((img) => {
      try { img.setAttribute('src', new URL(img.getAttribute('src'), url).href); } catch (e) { /* keep */ }
    });
  }

  const article = element.matches('article') ? element : element.querySelector('article');
  if (!article) { element.replaceWith(...element.childNodes); return; }

  const t = (el) => (el ? el.textContent.trim() : '');
  const nodes = [];
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const cloneImg = (img) => {
    const picture = document.createElement('picture');
    const clone = document.createElement('img');
    clone.setAttribute('src', img.getAttribute('src'));
    clone.setAttribute('alt', img.getAttribute('alt') || '');
    picture.append(clone);
    return picture;
  };

  const bylineBlock = (scope, { bio }) => {
    const img = scope.querySelector('img');
    const imageCell = document.createElement('div');
    if (img) imageCell.append(cloneImg(img));
    const bodyCell = document.createElement('div');
    // Label (bio only), name, meta/bio line.
    const heading = scope.querySelector('h1, h2, h3, h4');
    const spans = [...scope.querySelectorAll('span, p')].filter((s) => t(s) && s.children.length === 0);
    // name: heading if present, else the first bold-ish line
    const name = heading ? t(heading) : (spans[0] ? t(spans[0]) : '');
    if (bio) {
      const label = [...scope.querySelectorAll('span, p')].find((s) => /about the author/i.test(t(s)));
      if (label) bodyCell.append(el('p', t(label)));
    }
    bodyCell.append(el(heading ? 'h3' : 'p', name));
    // meta/bio: the longest remaining text line
    const rest = spans.filter((s) => t(s) !== name && !/about the author/i.test(t(s)));
    const metaEl = rest.sort((a, b) => t(b).length - t(a).length)[0];
    if (metaEl) bodyCell.append(el('p', t(metaEl)));
    return WebImporter.Blocks.createBlock(document, {
      name: bio ? 'article-byline (bio)' : 'article-byline',
      cells: [[imageCell, bodyCell]],
    });
  };

  // --- Header: breadcrumb, title, lede, byline ---
  const header = article.querySelector('header') || article;
  const crumbNav = header.querySelector('nav');
  if (crumbNav) {
    const p = el('p');
    p.textContent = [...crumbNav.querySelectorAll('a, span')].map((n) => t(n)).filter(Boolean).join(' / ');
    nodes.push(p);
  }
  const h1 = header.querySelector('h1');
  if (h1) nodes.push(el('h1', t(h1)));
  const lede = header.querySelector('h1') ? header.querySelector('h1').parentElement.querySelector('p') : header.querySelector('p');
  if (lede) nodes.push(el('p', t(lede)));
  // Byline: the element that carries the "· min read" meta line.
  const metaLine = [...header.querySelectorAll('span, p')]
    .find((s) => /·/.test(t(s)) && /read/i.test(t(s)) && s.children.length === 0);
  const bylineScope = metaLine ? metaLine.closest('div').parentElement : null;
  if (bylineScope) nodes.push(bylineBlock(bylineScope, { bio: false }));

  // --- Hero figure ---
  const heroFigure = [...article.children].map((c) => c.querySelector && c.querySelector('figure')).find(Boolean)
    || article.querySelector('figure');
  if (heroFigure) {
    const img = heroFigure.querySelector('img');
    if (img) nodes.push(cloneImg(img));
    const cap = heroFigure.querySelector('figcaption') || heroFigure.querySelector('span');
    if (cap && t(cap)) { const em = el('p'); em.append(el('em', t(cap))); nodes.push(em); }
  }

  // --- Prose body ---
  const prose = [...article.children].find((c) => c.querySelector && c.querySelector('h2') && !c.querySelector('article'));
  if (prose) {
    [...prose.children].forEach((node) => {
      const tag = node.tagName;
      if (/^H[1-6]$/.test(tag)) {
        nodes.push(el('h2', t(node)));
      } else if (tag === 'P') {
        // Preserve inline links in paragraphs that carry them.
        if (node.querySelector('a')) {
          const p = el('p');
          p.innerHTML = node.innerHTML;
          nodes.push(p);
        } else {
          nodes.push(el('p', t(node)));
        }
      } else if (tag === 'BLOCKQUOTE') {
        const bq = el('blockquote', t(node).replace(/^["']|["']$/g, ''));
        nodes.push(bq);
      } else if (tag === 'FIGURE') {
        const img = node.querySelector('img');
        if (img) nodes.push(cloneImg(img));
        const cap = node.querySelector('figcaption') || node.querySelector('span');
        if (cap && t(cap)) { const em = el('p'); em.append(el('em', t(cap))); nodes.push(em); }
      } else if (tag === 'ASIDE') {
        // "The short version" key-points box: a label + a list.
        const label = [...node.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
          || node.querySelector('span, strong');
        const aside = document.createElement('div');
        aside.className = 'article-keypoints';
        if (label && t(label)) aside.append(el('p', t(label)));
        const list = node.querySelector('ol, ul');
        if (list) {
          const ul = el('ul');
          list.querySelectorAll('li').forEach((li) => {
            const item = el('li');
            item.innerHTML = li.innerHTML;
            ul.append(item);
          });
          aside.append(ul);
        }
        nodes.push(aside);
      } else if (tag === 'DIV') {
        // Share row or author bio.
        if (/^share/i.test(t(node))) {
          // Anchors are icon-only (SVG + aria-label) with "#" hrefs, which the
          // importer drops; emit the destination labels as a single cell and let
          // the block render the standard share icons.
          const labels = [...node.querySelectorAll('a')]
            .map((a) => a.getAttribute('aria-label') || t(a)).filter(Boolean);
          const labelCell = el('div', 'Share');
          const linksCell = el('div', labels.join(', ') || 'Share on X, Share by email, Copy link');
          nodes.push(WebImporter.Blocks.createBlock(document, {
            name: 'article-share', cells: [[labelCell, linksCell]],
          }));
        } else if (/about the author/i.test(t(node))) {
          nodes.push(bylineBlock(node, { bio: true }));
        }
      }
    });
  }

  // --- More from the Journal: related cards ---
  const related = [...article.children].find((c) => c.tagName === 'SECTION' && c.querySelector('a'));
  if (related) {
    const label = [...related.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
      || related.querySelector('span');
    const h2 = related.querySelector('h2');
    if (label && t(label)) nodes.push(el('p', t(label)));
    if (h2) nodes.push(el('h2', t(h2)));

    const cardRows = [];
    related.querySelectorAll(':scope a, a').forEach((a) => {
      if (!a.querySelector('h3')) return;
      const imageCell = document.createElement('div');
      const img = a.querySelector('img');
      if (img) imageCell.append(cloneImg(img));
      const bodyCell = document.createElement('div');
      // category label (span/text before heading) + heading
      const cat = [...a.querySelectorAll('span')].find((s) => t(s) && s.children.length === 0
        && t(s) !== t(a.querySelector('h3')));
      if (cat) bodyCell.append(el('p', t(cat)));
      const h3 = a.querySelector('h3');
      const h = el('h3');
      const ha = el('a', t(h3));
      ha.setAttribute('href', a.getAttribute('href') || '#');
      h.append(ha);
      bodyCell.append(h);
      cardRows.push([imageCell, bodyCell]);
    });
    if (cardRows.length) {
      nodes.push(WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells: cardRows }));
    }
    const backLink = [...related.querySelectorAll('a')].find((a) => !a.querySelector('h3') && /back/i.test(t(a)));
    if (backLink) {
      const p = el('p');
      const a = el('a', t(backLink));
      a.setAttribute('href', backLink.getAttribute('href') || '#');
      p.append(a);
      nodes.push(p);
    }
  }

  element.replaceWith(...nodes);
}
