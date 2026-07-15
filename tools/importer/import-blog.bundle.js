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

  // tools/importer/import-blog.js
  var import_blog_exports = {};
  __export(import_blog_exports, {
    default: () => import_blog_default
  });

  // tools/importer/parsers/cards-featured.js
  function parse(element, { document }) {
    const card = element.querySelector(":scope > div, .card, article") || element;
    const image = card.querySelector("img, picture");
    const bodyContent = [];
    const badge = card.querySelector('.fr-badge, [class*="badge"]');
    const category = card.querySelector("h2, h3").previousElementSibling && /span/i.test((card.querySelector("h2, h3").previousElementSibling || {}).tagName || "") ? card.querySelector("h2, h3").previousElementSibling : null;
    const title = card.querySelector('h1, h2, h3, [class*="title"]');
    const paras = Array.from(card.querySelectorAll("p"));
    const metaSpans = Array.from(card.querySelectorAll("span")).filter(
      (s) => /min read|·|\d{4}/i.test(s.textContent) && !s.querySelector("span")
    );
    const cta = card.querySelector('a.fr-link, a[class*="link"], a.button');
    if (badge) bodyContent.push(badge);
    if (category) bodyContent.push(category);
    if (title) bodyContent.push(title);
    paras.forEach((p) => bodyContent.push(p));
    if (metaSpans[0]) bodyContent.push(metaSpans[0]);
    if (cta) bodyContent.push(cta);
    if (!image && bodyContent.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", bodyContent]];
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse2(element, { document }) {
    let cards = Array.from(element.querySelectorAll(":scope > a, a"));
    cards = cards.filter((a) => a.querySelector("h1, h2, h3, h4, h5, h6"));
    const uniqueCards = [...new Set(cards)];
    if (uniqueCards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueCards.forEach((card) => {
      const image = card.querySelector("img, picture");
      const bodyContent = [];
      const title = card.querySelector("h1, h2, h3, h4, h5, h6");
      const directSpans = Array.from(card.querySelectorAll("span")).filter(
        (s) => !s.querySelector("span") === false || s.children.length
      );
      const infoSpans = Array.from(card.children).filter((c) => c.tagName === "SPAN");
      const paras = Array.from(card.querySelectorAll("p"));
      const category = infoSpans.find(
        (s) => title && s.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
      );
      const meta = infoSpans.find(
        (s) => title && s.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_PRECEDING
      );
      if (category) bodyContent.push(category);
      if (title) bodyContent.push(title);
      paras.forEach((p) => bodyContent.push(p));
      if (meta) bodyContent.push(meta);
      cells.push([image || "", bodyContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
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

  // tools/importer/import-blog.js
  var parsers = {
    "cards-featured": parse,
    "cards-article": parse2
  };
  var PAGE_TEMPLATE = {
    name: "blog",
    description: "Journal/blog index with intro header, featured post, category filter, and a grid of article cards.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/blog.html"
    ],
    blocks: [
      { name: "cards-featured", instances: ["#dc-root section:nth-of-type(2)"] },
      { name: "cards-article", instances: ["#dc-root section:nth-of-type(3) > div > div:nth-of-type(2)"] }
    ],
    sections: [
      { id: "intro", name: "Intro", selector: "#dc-root section:nth-of-type(1)", style: "intro", blocks: [], defaultContent: ["#dc-root section:nth-of-type(1) > div"] },
      { id: "featured", name: "Featured post", selector: "#dc-root section:nth-of-type(2)", style: null, blocks: ["cards-featured"], defaultContent: [] },
      { id: "grid", name: "Article grid", selector: "#dc-root section:nth-of-type(3)", style: null, blocks: ["cards-article"], defaultContent: [] }
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
  var import_blog_default = {
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
  return __toCommonJS(import_blog_exports);
})();
