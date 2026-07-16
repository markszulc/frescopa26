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

  // tools/importer/import-beverages.js
  var import_beverages_exports = {};
  __export(import_beverages_exports, {
    default: () => import_beverages_default
  });

  // tools/importer/parsers/columns-editorial.js
  function parse(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
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

  // tools/importer/parsers/hero-media.js
  function parse2(element, { document }) {
    const bgImage = element.querySelector(
      '.hero__media img, [class*="media"] > img, :scope > img'
    );
    const heading = element.querySelector('h1, h2, h3, .hero__title, [class*="title"]');
    let eyebrow = element.querySelector('.eyebrow, [class*="eyebrow"]');
    if (!eyebrow && heading) {
      const prev = heading.previousElementSibling;
      if (prev && prev.tagName === "SPAN" && prev.textContent.trim()) eyebrow = prev;
    }
    let leads = Array.from(element.querySelectorAll('p.hero__lead, [class*="lead"]'));
    if (leads.length === 0) {
      leads = Array.from(element.querySelectorAll("p")).filter((p) => p !== eyebrow);
    }
    const ctaLinks = Array.from(
      element.querySelectorAll(
        '.hero__actions a, [class*="actions"] a, a.btn, a.button, a.fr-btn, [class*="btn"] a'
      )
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
      element.querySelectorAll('a[href="#main"], a.skip-link, a.skip-to-content').forEach((a) => {
        const text = a.textContent.trim().toLowerCase();
        if (a.getAttribute("href") === "#main" || text === "skip to content") {
          (a.closest("p") || a).remove();
        }
      });
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

  // tools/importer/import-beverages.js
  var parsers = {
    "columns-editorial": parse,
    "hero-media": parse2
  };
  var PAGE_TEMPLATE = {
    name: "beverages",
    description: "Beverages category page with intro header, three alternating image/text feature sections (coffee, tea, juice), and a cafe CTA.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/beverages.html"
    ],
    blocks: [
      { name: "columns-editorial", instances: ["#dc-root section:nth-of-type(2)", "#dc-root section:nth-of-type(3)", "#dc-root section:nth-of-type(4)"] },
      { name: "hero-media", instances: ["#dc-root section:nth-of-type(5)"] }
    ],
    sections: [
      { id: "intro", name: "Intro", selector: "#dc-root section:nth-of-type(1)", style: "alt", blocks: [], defaultContent: ["#dc-root section:nth-of-type(1) > div"] },
      { id: "coffee", name: "Coffee feature", selector: "#dc-root section:nth-of-type(2)", style: null, blocks: ["columns-editorial"], defaultContent: [] },
      { id: "tea", name: "Tea feature", selector: "#dc-root section:nth-of-type(3)", style: "alt", blocks: ["columns-editorial"], defaultContent: [] },
      { id: "juice", name: "Juice feature", selector: "#dc-root section:nth-of-type(4)", style: null, blocks: ["columns-editorial"], defaultContent: [] },
      { id: "cafe-cta", name: "Cafe CTA", selector: "#dc-root section:nth-of-type(5)", style: "dark", blocks: ["hero-media"], defaultContent: [] }
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
  var import_beverages_default = {
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
  return __toCommonJS(import_beverages_exports);
})();
