import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Interactive "how it works" step tabs.
 *
 * Authoring model (rows):
 *   Row 1: head — eyebrow (p), heading (h2), lede (p). Single cell.
 *   Row 2+: one step per row, 3 cells:
 *     - cell 1: step title (h3 or first line) + short teaser (p)
 *     - cell 2: the detail body paragraph shown when the step is active
 *     - cell 3: the step image (picture)
 *
 * Renders the head, a row of numbered tab buttons, and a detail panel that swaps
 * copy + image when a tab is selected.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const headRow = rows.shift();
  const head = document.createElement('div');
  head.className = 'steps-tabs-head';
  while (headRow.firstElementChild) head.append(headRow.firstElementChild);
  const eyebrow = head.querySelector('p');
  if (eyebrow && eyebrow.previousElementSibling === null) eyebrow.classList.add('steps-tabs-eyebrow');

  const t = (el) => (el ? el.textContent.trim() : '');

  const steps = rows.map((row) => {
    const cells = [...row.children];
    const titleCell = cells[0];
    const detailCell = cells[1];
    const imageCell = cells[2];
    const heading = titleCell ? titleCell.querySelector('h1,h2,h3,h4,h5,h6') : null;
    const paras = titleCell ? [...titleCell.querySelectorAll('p')] : [];
    let title;
    if (heading) title = t(heading);
    else title = paras[0] ? t(paras[0]) : t(titleCell);
    let teaser;
    if (heading) teaser = paras[0] ? t(paras[0]) : '';
    else teaser = paras[1] ? t(paras[1]) : '';
    const detail = detailCell ? t(detailCell.querySelector('p') || detailCell) : '';
    let picture = imageCell ? imageCell.querySelector('picture') : null;
    if (picture) {
      const img = picture.querySelector('img');
      if (img) picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
      picture = imageCell.querySelector('picture');
    }
    return {
      title, teaser, detail, picture,
    };
  });

  const tabs = document.createElement('div');
  tabs.className = 'steps-tabs-tabs';
  const panel = document.createElement('div');
  panel.className = 'steps-tabs-panel';
  const copy = document.createElement('div');
  copy.className = 'steps-tabs-copy';
  const stepLabel = document.createElement('span');
  stepLabel.className = 'steps-tabs-step';
  const detailTitle = document.createElement('h3');
  const detailBody = document.createElement('p');
  copy.append(stepLabel, detailTitle, detailBody);
  const media = document.createElement('div');
  media.className = 'steps-tabs-media';
  panel.append(copy, media);

  const setActive = (i) => {
    const step = steps[i];
    stepLabel.textContent = `Step ${i + 1} of ${steps.length}`;
    detailTitle.textContent = step.title;
    detailBody.textContent = step.detail;
    media.textContent = '';
    if (step.picture) media.append(step.picture.cloneNode(true));
    [...tabs.children].forEach((b, j) => {
      b.classList.toggle('is-active', j === i);
      b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
    });
  };

  steps.forEach((step, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'steps-tabs-tab';
    btn.setAttribute('aria-pressed', 'false');
    const num = document.createElement('span');
    num.className = 'steps-tabs-num';
    num.textContent = String(i + 1);
    const th = document.createElement('h4');
    th.textContent = step.title;
    const tp = document.createElement('p');
    tp.textContent = step.teaser;
    btn.append(num, th, tp);
    btn.addEventListener('click', () => setActive(i));
    tabs.append(btn);
  });

  block.textContent = '';
  block.append(head, tabs, panel);
  if (steps.length) setActive(0);
}
