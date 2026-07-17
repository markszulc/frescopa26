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

  // tools/importer/import-coffee.js
  var import_coffee_exports = {};
  __export(import_coffee_exports, {
    default: () => import_coffee_default
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

  // tools/importer/parsers/cards-coffee.js
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
      const label = headHeading.previousElementSibling;
      if (label && textFrom(label) && label.tagName !== "H2") {
        const p = document.createElement("p");
        p.textContent = textFrom(label);
        headNodes.push(p);
      }
      const h2 = document.createElement("h2");
      h2.textContent = textFrom(headHeading);
      headNodes.push(h2);
      const headContainer = headHeading.closest("div");
      const scope = headContainer && headContainer.parentElement ? headContainer.parentElement : headContainer;
      if (scope) {
        scope.querySelectorAll("p").forEach((p) => {
          if (textFrom(p)) {
            const np = document.createElement("p");
            np.textContent = textFrom(p);
            headNodes.push(np);
          }
        });
      }
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
      if (badge && textFrom(badge)) {
        const p = document.createElement("p");
        p.textContent = textFrom(badge);
        textCell.append(p);
      }
      const heading = article.querySelector("h3, h2, h4");
      if (heading) {
        const category = heading.previousElementSibling;
        if (category && textFrom(category) && !/^h[1-6]$/i.test(category.tagName)) {
          const p = document.createElement("p");
          p.textContent = textFrom(category);
          textCell.append(p);
        }
        const h = document.createElement("h3");
        const hLink = heading.querySelector("a");
        if (hLink) {
          const a = document.createElement("a");
          a.setAttribute("href", hLink.getAttribute("href") || "#");
          a.textContent = textFrom(heading);
          h.append(a);
        } else {
          h.textContent = textFrom(heading);
        }
        textCell.append(h);
      }
      const desc = article.querySelector("p");
      if (desc && textFrom(desc)) {
        const np = document.createElement("p");
        np.textContent = textFrom(desc);
        textCell.append(np);
      }
      const formatWords = /^(ground|whole bean|raw bean|pods|regular|decaf)$/i;
      const chipSpans = [...article.querySelectorAll("span")].filter((s) => s.children.length === 0 && formatWords.test(textFrom(s)));
      if (chipSpans.length) {
        const ul = document.createElement("ul");
        const seen = /* @__PURE__ */ new Set();
        chipSpans.forEach((s) => {
          const t = textFrom(s);
          if (seen.has(t.toLowerCase())) return;
          seen.add(t.toLowerCase());
          const li = document.createElement("li");
          li.textContent = t;
          ul.append(li);
        });
        textCell.append(ul);
      }
      const priceAmount = [...article.querySelectorAll("span")].find((s) => s.children.length === 0 && /^[£$€]\s?\d/.test(textFrom(s)));
      if (priceAmount) {
        const fromLabel = [...article.querySelectorAll("span")].find((s) => s.children.length === 0 && /^from$/i.test(textFrom(s)));
        const p = document.createElement("p");
        p.textContent = `${fromLabel ? `${textFrom(fromLabel)} ` : ""}${textFrom(priceAmount)}`;
        textCell.append(p);
      }
      const ctaLink = article.querySelector('a[class*="link"]') || [...article.querySelectorAll("a")].pop();
      if (ctaLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", ctaLink.getAttribute("href") || "#");
        a.textContent = textFrom(ctaLink) || "Choose options";
        p.append(a);
        textCell.append(p);
      }
      return [imageCell, textCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-coffee", cells: rows });
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

  // tools/importer/import-coffee.js
  var parsers = {
    "machine-filter": parse,
    "cards-coffee": parse2
  };
  var PAGE_TEMPLATE = {
    name: "coffee",
    description: "Coffee shop catalogue page with intro header + breadcrumb, a category filter bar, and three product-family sections (blends & roasts, single origin, instant) each with a grid of product cards.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/coffee.html"
    ],
    blocks: [
      { name: "machine-filter", instances: ["#dc-root section:nth-of-type(2)"] },
      { name: "cards-coffee", instances: ["#dc-root section:nth-of-type(3)", "#dc-root section:nth-of-type(4)", "#dc-root section:nth-of-type(5)"] }
    ],
    sections: [
      { id: "intro", name: "Intro", selector: "#dc-root section:nth-of-type(1)", style: "alt", blocks: [], defaultContent: ["#dc-root section:nth-of-type(1) > div"] },
      { id: "filter", name: "Filter bar", selector: "#dc-root section:nth-of-type(2)", style: "alt", blocks: ["machine-filter"], defaultContent: [] },
      { id: "blends", name: "Blends & roasts", selector: "#dc-root section:nth-of-type(3)", style: null, family: "blends-roasts", blocks: ["cards-coffee"], defaultContent: [] },
      { id: "single-origin", name: "Single origin", selector: "#dc-root section:nth-of-type(4)", style: "alt", family: "single-origin", blocks: ["cards-coffee"], defaultContent: [] },
      { id: "instant", name: "Instant", selector: "#dc-root section:nth-of-type(5)", style: null, family: "instant", blocks: ["cards-coffee"], defaultContent: [] }
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
  var import_coffee_default = {
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
  return __toCommonJS(import_coffee_exports);
})();
