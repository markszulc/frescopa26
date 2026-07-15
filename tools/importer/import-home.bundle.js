/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-media.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(
      '.hero__media img, [class*="media"] > img, :scope > img'
    );
    const eyebrow = element.querySelector('.eyebrow, [class*="eyebrow"]');
    const heading = element.querySelector('h1, h2, h3, .hero__title, [class*="title"]');
    const leads = Array.from(
      element.querySelectorAll('p.hero__lead, [class*="lead"]')
    );
    const ctaLinks = Array.from(
      element.querySelectorAll('.hero__actions a, [class*="actions"] a, a.btn, a.button')
    );
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (eyebrow) contentCell.push(eyebrow);
    if (heading) contentCell.push(heading);
    contentCell.push(...leads);
    contentCell.push(...ctaLinks);
    if (!heading && contentCell.length === 0 && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-editorial.js
  function parse2(element, { document }) {
    const namedGrid = element.querySelector(
      '.intro__grid, [class*="__grid"], [class*="grid"]'
    );
    let rowContainer = null;
    const elementChildren = (el) => Array.from(el.children).filter(
      (c) => c.nodeType === 1
    );
    if (namedGrid && elementChildren(namedGrid).length >= 2) {
      rowContainer = namedGrid;
    } else if (elementChildren(element).length >= 2 && elementChildren(element).every((c) => c.tagName === "DIV" || c.tagName === "FIGURE")) {
      rowContainer = element;
    } else {
      const gridDiv = Array.from(element.querySelectorAll("div")).find((d) => {
        const kids = elementChildren(d);
        return kids.length >= 2 && kids.every((k) => k.tagName === "DIV" || k.tagName === "FIGURE");
      });
      rowContainer = gridDiv || element;
    }
    let columns = elementChildren(rowContainer);
    if (columns.length < 2) {
      columns = [rowContainer];
    }
    const hasContent = columns.some(
      (col) => col.textContent.trim() || col.querySelector("img, picture")
    );
    if (!hasContent) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push(columns.map((col) => col));
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-editorial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/taste-profile.js
  function parse3(element, { document }) {
    const copySource = element.querySelector('.learn__copy, [class*="copy"]') || element;
    const copyContent = [];
    const eyebrow = copySource.querySelector('.eyebrow, [class*="eyebrow"]');
    const heading = copySource.querySelector('h1, h2, h3, [class*="title"]');
    const lede = copySource.querySelector('.lede, p.lede, [class*="lede"]');
    const points = copySource.querySelector('ul, .learn__points, [class*="points"]');
    if (eyebrow) copyContent.push(eyebrow);
    if (heading) copyContent.push(heading);
    if (lede) copyContent.push(lede);
    Array.from(copySource.querySelectorAll(":scope > p")).forEach((p) => {
      if (p !== lede && !copyContent.includes(p)) copyContent.push(p);
    });
    if (points) copyContent.push(points);
    const buttons = Array.from(
      element.querySelectorAll('.dna__controls button, [class*="controls"] button, [data-profile]')
    );
    const uniqueButtons = [...new Set(buttons)];
    const readout = element.querySelector('.dna__readout, [class*="readout"]');
    const readoutTitle = readout && readout.querySelector("h1, h2, h3, h4, [data-flavor-title]");
    const readoutNote = readout && readout.querySelector("p, [data-flavor-note]");
    const defaultProfile = (element.querySelector("[data-flavor-dna]") || {}).dataset ? element.querySelector("[data-flavor-dna]").dataset.default || "" : "";
    if (copyContent.length === 0 && uniqueButtons.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([copyContent]);
    uniqueButtons.forEach((btn) => {
      const label = (btn.textContent || "").trim();
      const isDefault = defaultProfile ? btn.dataset && btn.dataset.profile === defaultProfile : false;
      let title = label;
      let note = "";
      if (isDefault) {
        if (readoutTitle && readoutTitle.textContent.trim()) title = readoutTitle.textContent.trim();
        if (readoutNote && readoutNote.textContent.trim()) note = readoutNote.textContent.trim();
      }
      cells.push([label, title, note]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "taste-profile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/mood-calendar.js
  function parse4(element, { document }) {
    const copySource = element.querySelector('.mood__copy, [class*="copy"]') || element;
    const copyContent = [];
    const eyebrow = copySource.querySelector('.eyebrow, [class*="eyebrow"]');
    const heading = copySource.querySelector('h1, h2, h3, [class*="title"]');
    const lede = copySource.querySelector('.lede, p.lede, [class*="lede"]');
    const hint = copySource.querySelector('.mood__hint, [class*="hint"]');
    if (eyebrow) copyContent.push(eyebrow);
    if (heading) copyContent.push(heading);
    if (lede) copyContent.push(lede);
    if (hint) copyContent.push(hint);
    const dayButtons = Array.from(
      element.querySelectorAll('button.cal__day, .cal__day button, button[data-day], [class*="cal__day"]')
    ).filter((el) => el.tagName === "BUTTON");
    const uniqueDays = [...new Set(dayButtons)];
    if (copyContent.length === 0 && uniqueDays.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([copyContent]);
    uniqueDays.forEach((btn) => {
      const day = (btn.textContent || "").trim();
      const tag = btn.getAttribute("data-brew-tag") || "";
      const title = btn.getAttribute("data-brew-title") || "";
      const note = btn.getAttribute("data-brew-note") || "";
      cells.push([day, tag, title, note]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "mood-calendar", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function parse5(element, { document }) {
    const cards = Array.from(
      element.querySelectorAll(":scope > article, :scope > .card, article.card, .card")
    );
    const uniqueCards = [...new Set(cards)];
    if (uniqueCards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueCards.forEach((card) => {
      const image = card.querySelector('.card__media img, [class*="media"] img, img, picture');
      const bodyContent = [];
      const category = card.querySelector('.card__cat, [class*="cat"]');
      const title = card.querySelector('.card__title, h2, h3, h4, [class*="title"]');
      const notes = Array.from(card.querySelectorAll('.card__note, [class*="note"], p'));
      const price = card.querySelector('.card__price, [class*="price"]');
      const cta = card.querySelector(".card__foot a, a.link, a.button, .card__foot button, button.link");
      if (category) bodyContent.push(category);
      if (title) bodyContent.push(title);
      notes.forEach((n) => bodyContent.push(n));
      if (price) bodyContent.push(price);
      if (cta) bodyContent.push(cta);
      cells.push([image || "", bodyContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-quote.js
  function parse6(element, { document }) {
    const items = Array.from(
      element.querySelectorAll(":scope > blockquote, blockquote.voices__item, blockquote, .voices__item")
    );
    const uniqueItems = [...new Set(items)];
    if (uniqueItems.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueItems.forEach((item) => {
      const content = [];
      const quotes = Array.from(item.querySelectorAll("p"));
      const cite = item.querySelector('cite, [class*="cite"], footer');
      quotes.forEach((q) => content.push(q));
      if (cite) content.push(cite);
      if (content.length === 0) content.push(item);
      cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/frescopa-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      element.querySelectorAll("span.sc-interp").forEach((span) => {
        span.replaceWith(...span.childNodes);
      });
      element.querySelectorAll("div.sc-host-x").forEach((wrap) => {
        wrap.replaceWith(...wrap.childNodes);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header",
        "footer.footer",
        "header.fr-hdr",
        "footer.fr-ftr",
        "header",
        "footer",
        "nav"
      ]);
      element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
        img.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "form.signup",
        "form.fr-ftr__signup"
      ]);
    }
  }

  // tools/importer/transformers/frescopa-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument;
    const resolved = sections.map((section) => ({
      section,
      el: section.selector ? element.querySelector(section.selector) : null
    }));
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el) continue;
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        el.after(metaBlock);
      }
      if (i > 0) {
        el.before(doc.createElement("hr"));
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-media": parse,
    "columns-editorial": parse2,
    "taste-profile": parse3,
    "mood-calendar": parse4,
    "cards-product": parse5,
    "cards-quote": parse6
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Homepage with hero, editorial intro sections, interactive taste-profile and calendar features, product recommendation cards, sustainability, testimonials, cafe promo, and CTA.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/index.html"
    ],
    blocks: [
      { name: "hero-media", instances: ["section.hero", "section.cafe"] },
      { name: "columns-editorial", instances: ["section.intro", "section.sustain"] },
      { name: "taste-profile", instances: ["section.learn"] },
      { name: "mood-calendar", instances: ["section.mood"] },
      { name: "cards-product", instances: ["section.feed .feed__grid"] },
      { name: "cards-quote", instances: ["section.voices .voices__grid"] }
    ],
    sections: [
      { id: "hero", name: "Hero", selector: "section.hero", style: null, blocks: ["hero-media"], defaultContent: [] },
      { id: "intro", name: "Intro", selector: "section.intro", style: "intro", blocks: ["columns-editorial"], defaultContent: [] },
      { id: "learn", name: "Learn", selector: "section.learn", style: "learn", blocks: ["taste-profile"], defaultContent: [] },
      { id: "mood", name: "Mood", selector: "section.mood", style: "mood", blocks: ["mood-calendar"], defaultContent: [] },
      { id: "feed", name: "Feed", selector: "section.feed", style: "feed", blocks: ["cards-product"], defaultContent: ["section.feed .feed__head"] },
      { id: "sustain", name: "Sustain", selector: "section.sustain", style: "sustain", blocks: ["columns-editorial"], defaultContent: [] },
      { id: "voices", name: "Voices", selector: "section.voices", style: "voices", blocks: ["cards-quote"], defaultContent: ["section.voices .voices__lead"] },
      { id: "cafe", name: "Cafe", selector: "section.cafe", style: null, blocks: ["hero-media"], defaultContent: [] },
      { id: "cta", name: "Cta", selector: "section.cta", style: "dark", blocks: [], defaultContent: ["section.cta .cta__promise", "section.cta .cta__sub", "section.cta .cta__actions"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
