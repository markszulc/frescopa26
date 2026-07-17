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

  // tools/importer/import-myatelier.js
  var import_myatelier_exports = {};
  __export(import_myatelier_exports, {
    default: () => import_myatelier_default
  });

  // tools/importer/parsers/account-signin.js
  function parse(element, { document }) {
    const textFrom = (el) => el ? el.textContent.trim() : "";
    const nodes = [];
    const eyebrow = element.querySelector('[class*="eyebrow"]');
    if (eyebrow && textFrom(eyebrow)) {
      const p = document.createElement("p");
      p.textContent = textFrom(eyebrow);
      nodes.push(p);
    }
    const heading = element.querySelector("h1, h2");
    if (heading) {
      const h = document.createElement("h1");
      h.textContent = textFrom(heading);
      nodes.push(h);
    }
    const paras = [...element.querySelectorAll("p")].filter((p) => p !== eyebrow);
    const lede = paras[0];
    if (lede && textFrom(lede)) {
      const p = document.createElement("p");
      p.textContent = textFrom(lede);
      nodes.push(p);
    }
    const input = element.querySelector("input");
    const label = element.querySelector("label");
    const button = element.querySelector("button");
    const labelText = label ? textFrom(label).replace(textFrom(input), "").trim() || "Email" : "Email";
    const placeholder = input ? input.getAttribute("placeholder") || "you@example.com" : "you@example.com";
    const buttonText = button ? textFrom(button) : "Continue";
    const labelCell = document.createElement("div");
    labelCell.textContent = labelText;
    const phCell = document.createElement("div");
    phCell.textContent = placeholder;
    const btnCell = document.createElement("div");
    btnCell.textContent = buttonText;
    const emptyCell = document.createElement("div");
    const block = WebImporter.Blocks.createBlock(document, {
      name: "account-signin",
      cells: [[labelCell, phCell], [btnCell, emptyCell]]
    });
    nodes.push(block);
    const disclaimer = paras[paras.length - 1];
    if (disclaimer && disclaimer !== lede && textFrom(disclaimer)) {
      const p = document.createElement("p");
      p.textContent = textFrom(disclaimer);
      nodes.push(p);
    }
    element.replaceWith(...nodes);
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

  // tools/importer/import-myatelier.js
  var parsers = {
    "account-signin": parse
  };
  var PAGE_TEMPLATE = {
    name: "myatelier",
    description: "Account sign-in page: a single centered card with an eyebrow, heading, lede, email field + Continue button, and a demo disclaimer.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/myatelier.html"
    ],
    blocks: [
      { name: "account-signin", instances: ["#dc-root section:nth-of-type(1)"] }
    ],
    sections: [
      { id: "signin", name: "Sign in", selector: "#dc-root section:nth-of-type(1)", style: "alt", blocks: ["account-signin"], defaultContent: [] }
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
  var import_myatelier_default = {
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
  return __toCommonJS(import_myatelier_exports);
})();
