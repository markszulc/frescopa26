/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion (Atelier claims + FAQ sections).
 * Source: atelier.html section 5 ("Every promise, backed up.") and section #faq
 * ("Every last hesitation, handled."). Both render an eyebrow/heading/lede head
 * plus a list of expandable items. The item bodies are JS-driven (claimData /
 * faqRaw in the page's inline script) and only the open item is present in the
 * static DOM, so the full answer text is supplied here (verified against the
 * rendered page); item titles are read from the DOM buttons.
 *
 * Follows the EDS "Accordion" convention: a 2-column table where each row is one
 * item — [title cell, content cell]. The section head (eyebrow/heading/lede/CTA)
 * is emitted as default content BEFORE the block.
 */
const CLAIMS = {
  'Learns your taste': 'From your first cup it tracks strength, temperature and milk, and settles into your preference within about a week.',
  'Reads your calendar': 'A full morning and a slow one call for different cups. With your permission it checks your calendar and adjusts what it suggests.',
  'Reorders itself': 'It watches the bean hopper and reorders your blend before you run out — and pauses the moment you ask it to.',
  'Compostable pods': 'The optional pods break down in your compost, and spent grounds drop into a drawer you can empty straight onto the garden.',
  'Whisper-quiet grind': 'The grinder runs at about 58 dB, quiet enough to pour a cup without waking anyone still asleep.',
  'Steams milk on its own': 'An automatic wand textures milk to the right temperature for each drink — no jug to swirl by hand.',
};

const FAQ = {
  'Is it a hassle to set up?': "Not at all. Delivery includes a full setup, so it's pouring before we leave. If anything ever feels off, we'll talk you through it.",
  'Do I have to buy Fréscopa pods?': 'Never. The Atelier is happiest with whole beans, and it works beautifully with your own. Our pods are there if you want them, not because you have to.',
  'How long until it learns my taste?': 'Give it a week of mornings. It starts adjusting from the very first cup, and settles into your preferences before the first bag runs out.',
  'Will it wake the whole house?': 'The grind is whisper-quiet by design. Early risers can pour a cup without stirring anyone still asleep.',
  "What if it isn't for me?": "You have thirty mornings to fall for it. If it doesn't earn its place on your counter, send it back and we'll cover the return.",
  'Is it a chore to clean?': 'It rinses itself after every cup, and the parts that need washing are dishwasher-safe. A proper clean takes a minute, not a morning.',
};

export default function parse(element, { document }) {
  const t = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

  const titles = [...element.querySelectorAll('button')].map(t).filter(Boolean);
  // Pick the dataset whose keys best match the DOM buttons.
  const score = (data) => titles.filter((x) => data[x] !== undefined).length;
  const data = score(FAQ) >= score(CLAIMS) ? FAQ : CLAIMS;

  // Head default content (emitted before the block).
  const headNodes = [];
  const eyebrow = element.querySelector('p');
  const h2 = element.querySelector('h2');
  const lede = [...element.querySelectorAll('p')].find((p) => t(p).length > 40);
  const ctaA = element.querySelector('a[href]');
  if (eyebrow && t(eyebrow) && eyebrow !== lede) headNodes.push(el('p', t(eyebrow)));
  if (h2) headNodes.push(el('h2', t(h2)));
  if (lede) headNodes.push(el('p', t(lede)));
  if (ctaA && t(ctaA)) {
    const p = el('p');
    const a = el('a', t(ctaA).replace(/\s*→\s*$/, ''));
    a.setAttribute('href', ctaA.getAttribute('href') || '#');
    p.append(a);
    headNodes.push(p);
  }

  // One [title, content] row per item.
  const rows = titles.map((title) => {
    const titleCell = el('div');
    titleCell.append(el('p', title));
    const contentCell = el('div');
    contentCell.append(el('p', data[title] || ''));
    return [titleCell, contentCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells: rows });
  element.replaceWith(...headNodes, block);
}
