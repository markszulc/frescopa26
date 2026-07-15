/**
 * loads and decorates the hero-media block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Full-bleed hero is often reused as an image-less dark CTA band.
  // Flag the no-image variant so CSS can drop the media layer + scrim.
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
