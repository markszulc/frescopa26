/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import machineFilterParser from './parsers/machine-filter.js';
import cardsMachineParser from './parsers/cards-machine.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'machine-filter': machineFilterParser,
  'cards-machine': cardsMachineParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'machines',
  description: 'Machines catalogue page with intro header + breadcrumb, a category filter bar, and four product-family sections (bean-to-cup, espresso, filter, cold brew) each with a flagship and/or companion machine cards.',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/machines.html',
  ],
  blocks: [
    { name: 'machine-filter', instances: ['#dc-root section:nth-of-type(2)'] },
    { name: 'cards-machine', instances: ['#dc-root section:nth-of-type(3)', '#dc-root section:nth-of-type(4)', '#dc-root section:nth-of-type(5)', '#dc-root section:nth-of-type(6)'] },
  ],
  sections: [
    { id: 'intro', name: 'Intro', selector: '#dc-root section:nth-of-type(1)', style: 'alt', blocks: [], defaultContent: ['#dc-root section:nth-of-type(1) > div'] },
    { id: 'filter', name: 'Filter bar', selector: '#dc-root section:nth-of-type(2)', style: 'alt', blocks: ['machine-filter'], defaultContent: [] },
    { id: 'bean-to-cup', name: 'Bean-to-cup family', selector: '#dc-root section:nth-of-type(3)', style: null, family: 'bean-to-cup', blocks: ['cards-machine'], defaultContent: [] },
    { id: 'espresso', name: 'Espresso family', selector: '#dc-root section:nth-of-type(4)', style: 'alt', family: 'espresso', blocks: ['cards-machine'], defaultContent: [] },
    { id: 'filter-family', name: 'Filter family', selector: '#dc-root section:nth-of-type(5)', style: null, family: 'filter', blocks: ['cards-machine'], defaultContent: [] },
    { id: 'cold-brew', name: 'Cold brew family', selector: '#dc-root section:nth-of-type(6)', style: 'alt', family: 'cold-brew', blocks: ['cards-machine'], defaultContent: [] },
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
