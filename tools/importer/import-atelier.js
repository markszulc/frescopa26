/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import productHeroParser from './parsers/product-hero.js';
import productJumpnavParser from './parsers/product-jumpnav.js';
import stepsTabsParser from './parsers/steps-tabs.js';
import mediaVideoParser from './parsers/media-video.js';
import accordionParser from './parsers/accordion.js';
import specTableParser from './parsers/spec-table.js';
import atelierTasteProfileParser from './parsers/atelier-taste-profile.js';
import reviewsParser from './parsers/reviews.js';
import bundleCardsParser from './parsers/bundle-cards.js';
import atelierPairsParser from './parsers/atelier-pairs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'product-hero': productHeroParser,
  'product-jumpnav': productJumpnavParser,
  'steps-tabs': stepsTabsParser,
  'media-video': mediaVideoParser,
  accordion: accordionParser,
  'spec-table': specTableParser,
  'taste-profile': atelierTasteProfileParser,
  reviews: reviewsParser,
  'bundle-cards': bundleCardsParser,
  'cards-product': atelierPairsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'atelier',
  description: 'The Atelier product detail page (PDP).',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/atelier.html',
  ],
  blocks: [
    { name: 'product-hero', instances: ['#dc-root section:nth-of-type(1)'] },
    { name: 'product-jumpnav', instances: ['#dc-root section:nth-of-type(2)'] },
    { name: 'steps-tabs', instances: ['#dc-root section:nth-of-type(3)'] },
    { name: 'media-video', instances: ['#dc-root section:nth-of-type(4)'] },
    { name: 'accordion', instances: ['#dc-root section:nth-of-type(5)', '#dc-root section:nth-of-type(9)'] },
    { name: 'spec-table', instances: ['#dc-root section:nth-of-type(6)'] },
    { name: 'taste-profile', instances: ['#dc-root section:nth-of-type(7)'] },
    { name: 'reviews', instances: ['#dc-root section:nth-of-type(8)'] },
    { name: 'bundle-cards', instances: ['#dc-root section:nth-of-type(10)'] },
    { name: 'cards-product', instances: ['#dc-root section:nth-of-type(11)'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: '#dc-root section:nth-of-type(1)', style: null, blocks: ['product-hero'], defaultContent: [] },
    { id: 'jumpnav', name: 'Jump nav', selector: '#dc-root section:nth-of-type(2)', style: 'alt', blocks: ['product-jumpnav'], defaultContent: [] },
    { id: 'how', name: 'How it works', selector: '#dc-root section:nth-of-type(3)', style: null, blocks: ['steps-tabs'], defaultContent: [] },
    { id: 'video', name: 'Video', selector: '#dc-root section:nth-of-type(4)', style: 'alt', blocks: ['media-video'], defaultContent: [] },
    { id: 'claims', name: 'Claims', selector: '#dc-root section:nth-of-type(5)', style: null, blocks: ['accordion'], defaultContent: [] },
    { id: 'specs', name: 'Specifications', selector: '#dc-root section:nth-of-type(6)', style: 'alt', blocks: ['spec-table'], defaultContent: [] },
    { id: 'dna', name: 'Flavour DNA', selector: '#dc-root section:nth-of-type(7)', style: null, blocks: ['taste-profile'], defaultContent: [] },
    { id: 'reviews', name: 'Reviews', selector: '#dc-root section:nth-of-type(8)', style: 'alt', blocks: ['reviews'], defaultContent: [] },
    { id: 'faq', name: 'FAQ', selector: '#dc-root section:nth-of-type(9)', style: null, blocks: ['accordion'], defaultContent: [] },
    { id: 'bundles', name: 'Bundles', selector: '#dc-root section:nth-of-type(10)', style: 'alt', blocks: ['bundle-cards'], defaultContent: [] },
    { id: 'pairs', name: 'Pairs well', selector: '#dc-root section:nth-of-type(11)', style: null, blocks: ['cards-product'], defaultContent: [] },
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
