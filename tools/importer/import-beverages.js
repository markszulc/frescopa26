/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsEditorialParser from './parsers/columns-editorial.js';
import heroMediaParser from './parsers/hero-media.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-editorial': columnsEditorialParser,
  'hero-media': heroMediaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'beverages',
  description: 'Beverages category page with intro header, three alternating image/text feature sections (coffee, tea, juice), and a cafe CTA.',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/beverages.html',
  ],
  blocks: [
    { name: 'columns-editorial', instances: ['#dc-root section:nth-of-type(2)', '#dc-root section:nth-of-type(3)', '#dc-root section:nth-of-type(4)'] },
    { name: 'hero-media', instances: ['#dc-root section:nth-of-type(5)'] },
  ],
  sections: [
    { id: 'intro', name: 'Intro', selector: '#dc-root section:nth-of-type(1)', style: null, blocks: [], defaultContent: ['#dc-root section:nth-of-type(1) > div'] },
    { id: 'coffee', name: 'Coffee feature', selector: '#dc-root section:nth-of-type(2)', style: null, blocks: ['columns-editorial'], defaultContent: [] },
    { id: 'tea', name: 'Tea feature', selector: '#dc-root section:nth-of-type(3)', style: null, blocks: ['columns-editorial'], defaultContent: [] },
    { id: 'juice', name: 'Juice feature', selector: '#dc-root section:nth-of-type(4)', style: null, blocks: ['columns-editorial'], defaultContent: [] },
    { id: 'cafe-cta', name: 'Cafe CTA', selector: '#dc-root section:nth-of-type(5)', style: 'dark', blocks: ['hero-media'], defaultContent: [] },
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
