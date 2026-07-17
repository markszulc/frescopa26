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

  // tools/importer/import-machines.js
  var import_machines_exports = {};
  __export(import_machines_exports, {
    default: () => import_machines_default
  });

  // tools/importer/parsers/machine-filter.js
  function parse(element, { document }) {
    const buttons = Array.from(element.querySelectorAll("button"));
    if (!buttons.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const toKey = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const rows = buttons.map((btn) => {
      const label = btn.textContent.trim();
      const key = /^all/i.test(label) ? "all" : toKey(label);
      const labelCell = document.createElement("div");
      labelCell.textContent = label;
      const keyCell = document.createElement("div");
      keyCell.textContent = key;
      return [labelCell, keyCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "machine-filter", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-machine.js
  function parse2(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    const articles = Array.from(element.querySelectorAll("article"));
    if (!articles.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textFrom = (el) => el ? el.textContent.trim() : "";
    const headNodes = [];
    const headHeading = element.querySelector("h2");
    if (headHeading) {
      const headContainer = headHeading.closest("div");
      const columns = headContainer && headContainer.parentElement ? [...headContainer.parentElement.children] : [headContainer];
      const label = headHeading.previousElementSibling;
      if (label && textFrom(label) && label.tagName !== "H2") {
        const p = document.createElement("p");
        p.textContent = textFrom(label);
        headNodes.push(p);
      }
      const h2 = document.createElement("h2");
      h2.textContent = textFrom(headHeading);
      headNodes.push(h2);
      columns.forEach((col) => {
        col.querySelectorAll("p").forEach((p) => {
          if (textFrom(p)) {
            const np = document.createElement("p");
            np.textContent = textFrom(p);
            headNodes.push(np);
          }
        });
      });
    }
    const rows = articles.map((article) => {
      const imageCell = document.createElement("div");
      const textCell = document.createElement("div");
      const img = article.querySelector("img");
      if (img) {
        const picture = document.createElement("picture");
        const clone = document.createElement("img");
        clone.setAttribute("src", img.getAttribute("src"));
        clone.setAttribute("alt", img.getAttribute("alt") || "");
        picture.append(clone);
        imageCell.append(picture);
      }
      const badge = article.querySelector('[class*="badge"]');
      if (badge && /new/i.test(textFrom(badge))) {
        const p = document.createElement("p");
        p.textContent = textFrom(badge);
        textCell.append(p);
      }
      const heading = article.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        const prev = heading.previousElementSibling;
        const eyebrowText = prev && prev.tagName !== "IMG" ? textFrom(prev) : "";
        if (eyebrowText) {
          const p = document.createElement("p");
          p.textContent = eyebrowText;
          textCell.append(p);
        }
        const h = document.createElement(heading.tagName.toLowerCase());
        h.textContent = textFrom(heading);
        textCell.append(h);
      }
      article.querySelectorAll("p").forEach((p) => {
        const t = textFrom(p);
        if (t) {
          const np = document.createElement("p");
          np.textContent = t;
          textCell.append(np);
        }
      });
      const ul = article.querySelector("ul");
      if (ul) {
        const list = document.createElement("ul");
        ul.querySelectorAll("li").forEach((li) => {
          const item = document.createElement("li");
          const spans = [...li.querySelectorAll("span")].reverse();
          const textSpan = spans.find((s) => textFrom(s) && textFrom(s) !== "\u2192");
          item.textContent = textSpan ? textFrom(textSpan) : textFrom(li).replace(/^→\s*/, "");
          list.append(item);
        });
        textCell.append(list);
      }
      const link = article.querySelector("a");
      const priceEl = [...article.querySelectorAll("span")].find((s) => /^[£$€]\s?\d/.test(textFrom(s)));
      const foot = document.createElement("p");
      if (priceEl) foot.append(document.createTextNode(textFrom(priceEl)));
      if (link) {
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href") || "#");
        a.textContent = textFrom(link);
        foot.append(a);
      }
      if (foot.textContent.trim()) textCell.append(foot);
      return [imageCell, textCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-machine", cells: rows });
    element.replaceWith(...headNodes, block);
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
      const metaCells = {};
      if (section.style) metaCells.style = section.style;
      if (section.family) metaCells.family = section.family;
      if (Object.keys(metaCells).length) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: metaCells
        });
        el.after(metaBlock);
      }
      if (i > 0) {
        el.before(doc.createElement("hr"));
      }
    }
  }

  // tools/importer/import-machines.js
  var parsers = {
    "machine-filter": parse,
    "cards-machine": parse2
  };
  var PAGE_TEMPLATE = {
    name: "machines",
    description: "Machines catalogue page with intro header + breadcrumb, a category filter bar, and four product-family sections (bean-to-cup, espresso, filter, cold brew) each with a flagship and/or companion machine cards.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/machines.html"
    ],
    blocks: [
      { name: "machine-filter", instances: ["#dc-root section:nth-of-type(2)"] },
      { name: "cards-machine", instances: ["#dc-root section:nth-of-type(3)", "#dc-root section:nth-of-type(4)", "#dc-root section:nth-of-type(5)", "#dc-root section:nth-of-type(6)"] }
    ],
    sections: [
      { id: "intro", name: "Intro", selector: "#dc-root section:nth-of-type(1)", style: "alt", blocks: [], defaultContent: ["#dc-root section:nth-of-type(1) > div"] },
      { id: "filter", name: "Filter bar", selector: "#dc-root section:nth-of-type(2)", style: "alt", blocks: ["machine-filter"], defaultContent: [] },
      { id: "bean-to-cup", name: "Bean-to-cup family", selector: "#dc-root section:nth-of-type(3)", style: null, family: "bean-to-cup", blocks: ["cards-machine"], defaultContent: [] },
      { id: "espresso", name: "Espresso family", selector: "#dc-root section:nth-of-type(4)", style: "alt", family: "espresso", blocks: ["cards-machine"], defaultContent: [] },
      { id: "filter-family", name: "Filter family", selector: "#dc-root section:nth-of-type(5)", style: null, family: "filter", blocks: ["cards-machine"], defaultContent: [] },
      { id: "cold-brew", name: "Cold brew family", selector: "#dc-root section:nth-of-type(6)", style: "alt", family: "cold-brew", blocks: ["cards-machine"], defaultContent: [] }
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
  var import_machines_default = {
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
  return __toCommonJS(import_machines_exports);
})();
