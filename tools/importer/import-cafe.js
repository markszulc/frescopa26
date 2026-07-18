/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMediaParser from './parsers/hero-media.js';
import cardsReasonsParser from './parsers/cards-reasons.js';
import columnsEditorialParser from './parsers/columns-editorial.js';
import cardsEventParser from './parsers/cards-event.js';
import statsRowParser from './parsers/stats-row.js';
import storeLocatorParser from './parsers/store-locator.js';
import bookingFormParser from './parsers/booking-form.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-media': heroMediaParser,
  'cards-reasons': cardsReasonsParser,
  'columns-editorial': columnsEditorialParser,
  'cards-event': cardsEventParser,
  'stats-row': statsRowParser,
  'store-locator': storeLocatorParser,
  'booking-form': bookingFormParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'cafe',
  description: 'Cafe & showroom page with hero, reasons cards, three-room feature sections, weekly events cards, locations finder with stats and listings, tour booking form, and CTA.',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/cafe.html',
  ],
  blocks: [
    { name: 'hero-media', instances: ['#dc-root section:nth-of-type(1)', '#dc-root section:nth-of-type(7)'] },
    { name: 'cards-reasons', instances: ['#dc-root section:nth-of-type(2) > div > div'] },
    { name: 'columns-editorial', instances: ['#experience > div > div', '#locations > div > article'] },
    { name: 'cards-event', instances: ['#whatson > div > div:nth-of-type(2)'] },
    { name: 'stats-row', instances: ['#locations > div > div:nth-of-type(1)'] },
    { name: 'store-locator', instances: ['#locations > div > div:nth-of-type(2)'] },
    { name: 'booking-form', instances: ['#tour'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: '#dc-root section:nth-of-type(1)', style: null, blocks: ['hero-media'], defaultContent: [] },
    { id: 'reasons', name: 'Reasons', selector: '#dc-root section:nth-of-type(2)', style: null, blocks: ['cards-reasons'], defaultContent: ['#dc-root section:nth-of-type(2) > div > span', '#dc-root section:nth-of-type(2) > div > h2'] },
    { id: 'experience', name: 'Experience', selector: '#experience', style: 'alt', blocks: ['columns-editorial'], defaultContent: ['#experience > div > span', '#experience > div > h2'] },
    { id: 'whatson', name: "What's on", selector: '#whatson', style: null, blocks: ['cards-event'], defaultContent: ['#whatson > div > div:nth-of-type(1)'] },
    { id: 'locations', name: 'Locations', selector: '#locations', style: 'alt', blocks: ['stats-row', 'columns-editorial', 'store-locator'], defaultContent: ['#locations > div > span', '#locations > div > h2', '#locations > div > p'] },
    { id: 'tour', name: 'Tour booking', selector: '#tour', style: null, blocks: ['booking-form'], defaultContent: [] },
    { id: 'cta', name: 'CTA', selector: '#dc-root section:nth-of-type(7)', style: 'dark', blocks: ['hero-media'], defaultContent: [] },
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
