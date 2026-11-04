import { runExperimentation, runExperimentationLazy } from '../../scripts/experiment-loader.js';
import {
  decorateSections, decorateBlocks, loadSections, loadCSS,
} from '../../scripts/aem.js';

// Focused local proof: original site blocks and styles, without Commerce services or editor UI.
export default async function renderPreview(main) {
  await runExperimentation(document);
  main.querySelectorAll('.section-metadata').forEach((meta) => meta.remove());
  decorateSections(main);
  decorateBlocks(main);
  document.body.classList.add('appear');
  await loadCSS('/styles/styles.css');
  await loadSections(main);
  await runExperimentationLazy(document);
}

if (window.location.pathname.startsWith('/drafts/experimentation-runtime/')) {
  await renderPreview(document.querySelector('main'));
}
