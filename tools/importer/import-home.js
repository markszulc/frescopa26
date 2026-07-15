/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMediaParser from './parsers/hero-media.js';
import columnsEditorialParser from './parsers/columns-editorial.js';
import tasteProfileParser from './parsers/taste-profile.js';
import moodCalendarParser from './parsers/mood-calendar.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsQuoteParser from './parsers/cards-quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-media': heroMediaParser,
  'columns-editorial': columnsEditorialParser,
  'taste-profile': tasteProfileParser,
  'mood-calendar': moodCalendarParser,
  'cards-product': cardsProductParser,
  'cards-quote': cardsQuoteParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Homepage with hero, editorial intro sections, interactive taste-profile and calendar features, product recommendation cards, sustainability, testimonials, cafe promo, and CTA.',
  urls: [
    'https://markszulc.github.io/frescopa-atelier/index.html',
  ],
  blocks: [
    { name: 'hero-media', instances: ['section.hero', 'section.cafe'] },
    { name: 'columns-editorial', instances: ['section.intro', 'section.sustain'] },
    { name: 'taste-profile', instances: ['section.learn'] },
    { name: 'mood-calendar', instances: ['section.mood'] },
    { name: 'cards-product', instances: ['section.feed .feed__grid'] },
    { name: 'cards-quote', instances: ['section.voices .voices__grid'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: 'section.hero', style: null, blocks: ['hero-media'], defaultContent: [] },
    { id: 'intro', name: 'Intro', selector: 'section.intro', style: 'intro', blocks: ['columns-editorial'], defaultContent: [] },
    { id: 'learn', name: 'Learn', selector: 'section.learn', style: 'learn', blocks: ['taste-profile'], defaultContent: [] },
    { id: 'mood', name: 'Mood', selector: 'section.mood', style: 'mood', blocks: ['mood-calendar'], defaultContent: [] },
    { id: 'feed', name: 'Feed', selector: 'section.feed', style: 'feed', blocks: ['cards-product'], defaultContent: ['section.feed .feed__head'] },
    { id: 'sustain', name: 'Sustain', selector: 'section.sustain', style: 'sustain', blocks: ['columns-editorial'], defaultContent: [] },
    { id: 'voices', name: 'Voices', selector: 'section.voices', style: 'voices', blocks: ['cards-quote'], defaultContent: ['section.voices .voices__lead'] },
    { id: 'cafe', name: 'Cafe', selector: 'section.cafe', style: null, blocks: ['hero-media'], defaultContent: [] },
    { id: 'cta', name: 'Cta', selector: 'section.cta', style: 'dark', blocks: [], defaultContent: ['section.cta .cta__promise', 'section.cta .cta__sub', 'section.cta .cta__actions'] },
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

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
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

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
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
