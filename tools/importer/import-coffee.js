/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import machineFilterParser from './parsers/machine-filter.js';
import cardsCoffeeParser from './parsers/cards-coffee.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'machine-filter': machineFilterParser,
  'cards-coffee': cardsCoffeeParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'coffee',
  description: 'Coffee shop catalogue page with intro header + breadcrumb, a category filter bar, and three product-family sections (blends & roasts, single origin, instant) each with a grid of product cards.',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/coffee.html',
  ],
  blocks: [
    { name: 'machine-filter', instances: ['#dc-root section:nth-of-type(2)'] },
    { name: 'cards-coffee', instances: ['#dc-root section:nth-of-type(3)', '#dc-root section:nth-of-type(4)', '#dc-root section:nth-of-type(5)'] },
  ],
  sections: [
    { id: 'intro', name: 'Intro', selector: '#dc-root section:nth-of-type(1)', style: 'alt', blocks: [], defaultContent: ['#dc-root section:nth-of-type(1) > div'] },
    { id: 'filter', name: 'Filter bar', selector: '#dc-root section:nth-of-type(2)', style: 'alt', blocks: ['machine-filter'], defaultContent: [] },
    { id: 'blends', name: 'Blends & roasts', selector: '#dc-root section:nth-of-type(3)', style: null, family: 'blends-roasts', blocks: ['cards-coffee'], defaultContent: [] },
    { id: 'single-origin', name: 'Single origin', selector: '#dc-root section:nth-of-type(4)', style: 'alt', family: 'single-origin', blocks: ['cards-coffee'], defaultContent: [] },
    { id: 'instant', name: 'Instant', selector: '#dc-root section:nth-of-type(5)', style: null, family: 'instant', blocks: ['cards-coffee'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
