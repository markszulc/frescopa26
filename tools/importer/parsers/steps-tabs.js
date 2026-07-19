/* eslint-disable */
/* global WebImporter */
/**
 * Parser for steps-tabs (Atelier "how it works").
 * Source: atelier.html section #how — an eyebrow/heading/lede head, four step
 * tabs, and a JS-driven detail panel (title + body + image) that only renders
 * the active step in the static DOM.
 *
 * The per-step detail body and image are defined in the page's inline script
 * (howData) and swapped client-side, so the importer's DOM snapshot holds only
 * the active step. The four steps are stable brand content; their titles/teasers
 * are read from the tab buttons in the DOM, and the detail bodies + image
 * sources (verified against the rendered page) are supplied here so every tab
 * has complete content after import.
 *
 * Emits: head default content is dropped INTO the block head row; rows are
 * [titleCell(h3+teaser), detailCell(body p), imageCell(picture)].
 */
const STEP_DETAILS = [
  {
    title: 'It tastes every cup',
    body: 'A ring of sensors watches every extraction — the grind size, how fast the water flows, the strength in the cup, and the temperature at the group head. The same signals a barista feels by hand, read hundreds of times a second.',
    img: 'assets/images/espresso-pour.jpg',
    alt: 'Sensors reading every pour.',
  },
  {
    title: 'It builds your flavour DNA',
    body: 'Those readings roll up into a flavour DNA for each person in the house — how strong, how hot, how much milk, which drink, and when. Every cup you pour nudges the picture a little closer to right.',
    img: 'assets/images/hero-machine.jpg',
    alt: 'The Atelier building your flavour DNA.',
  },
  {
    title: 'It reads the morning',
    body: "Before you've asked, it weighs the time of day, what's on your calendar, the weather outside, and who's already awake. A rushed Tuesday and a slow Sunday call for different cups, and it knows the difference.",
    img: 'assets/images/cafe-interior.jpg',
    alt: 'Reading the shape of the morning.',
  },
  {
    title: 'It acts on its own',
    body: 'Then it acts. It warms up before your alarm, sets the pour to match the morning, and quietly reorders beans before you run low. Less like using a machine, and more like being looked after.',
    img: 'assets/images/sustainability.jpg',
    alt: 'Acting on its own, right down to the grounds.',
  },
];

export default function parse(element, { document, url }) {
  const abs = (src) => {
    try { return url ? new URL(src, url).href : src; } catch (e) { return src; }
  };
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
  const pic = (src, alt) => {
    const p = document.createElement('picture');
    const c = document.createElement('img');
    c.setAttribute('src', abs(src));
    c.setAttribute('alt', alt || '');
    p.append(c);
    return p;
  };

  // Head default content (before the block).
  const headNodes = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  const lede = [...element.querySelectorAll('p')].find((p) => t(p).length > 40);
  if (eyebrow && t(eyebrow) && eyebrow !== lede) headNodes.push(el('p', t(eyebrow)));
  if (h2) headNodes.push(el('h2', t(h2)));
  if (lede) headNodes.push(el('p', t(lede)));

  // Tab teasers from the DOM buttons (title + short line).
  const tabButtons = [...element.querySelectorAll('button')];
  const rows = STEP_DETAILS.map((step, i) => {
    const btn = tabButtons[i];
    const teaser = btn ? t(btn.querySelector('p')) : '';
    const titleCell = document.createElement('div');
    titleCell.append(el('h3', step.title));
    if (teaser) titleCell.append(el('p', teaser));
    const detailCell = document.createElement('div');
    detailCell.append(el('p', step.body));
    const imageCell = document.createElement('div');
    imageCell.append(pic(step.img, step.alt));
    return [titleCell, detailCell, imageCell];
  });

  // Privacy footnote after the block (the last long paragraph, not the lede).
  const footText = [...element.querySelectorAll('p')]
    .map(t).filter((x) => x.length > 40 && x !== t(lede)).pop();

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'steps-tabs', cells: [[headNodes], ...rows],
  });
  const after = footText ? [el('p', footText)] : [];
  element.replaceWith(block, ...after);
}
