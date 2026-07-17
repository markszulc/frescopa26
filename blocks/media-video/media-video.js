import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Video teaser block: a poster image with a play button and duration badge.
 *
 * Authoring model (rows):
 *   Row 1: head — eyebrow (p), heading (h2). Single cell.
 *   Row 2: poster image (picture) + optional duration text ("2:14").
 *   Row 3 (optional): a footnote paragraph.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const t = (el) => (el ? el.textContent.trim() : '');

  const headRow = rows.shift();
  const head = document.createElement('div');
  head.className = 'media-video-head';
  while (headRow.firstElementChild) head.append(headRow.firstElementChild);

  const posterRow = rows.shift();
  const stage = document.createElement('div');
  stage.className = 'media-video-stage';
  if (posterRow) {
    const picture = posterRow.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
      stage.append(posterRow.querySelector('picture'));
    }
    const durationText = [...posterRow.querySelectorAll('p, span')]
      .map((el) => t(el)).find((txt) => /^\d+:\d+$/.test(txt));
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'media-video-play';
    play.setAttribute('aria-label', 'Play the film');
    play.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    stage.append(play);
    if (durationText) {
      const dur = document.createElement('span');
      dur.className = 'media-video-duration';
      dur.textContent = durationText;
      stage.append(dur);
    }
  }

  const footRow = rows.shift();
  block.textContent = '';
  block.append(head, stage);
  if (footRow && t(footRow)) {
    const foot = document.createElement('p');
    foot.className = 'media-video-note';
    foot.textContent = t(footRow.querySelector('p') || footRow);
    block.append(foot);
  }
}
