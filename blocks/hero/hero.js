/**
 * loads and decorates the hero block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Full-bleed hero is often reused as an image-less dark CTA band.
  // Flag the no-image variant so CSS can drop the media layer + scrim.
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // Tag the first paragraph as the eyebrow. querySelector returns the first
  // <p> in document order at any depth, so this survives DOM restructuring
  // (unlike a positional p:first-child selector). An eyebrow sits above the
  // heading; a first <p> after it (e.g. an h2-led CTA band) is body copy.
  const first = block.querySelector('p');
  const heading = block.querySelector('h1, h2, h3');
  // eslint-disable-next-line no-bitwise
  if (first && !(heading?.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)) {
    first.classList.add('eyebrow');
  }
}
