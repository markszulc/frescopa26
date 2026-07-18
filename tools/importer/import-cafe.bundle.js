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

  // tools/importer/import-cafe.js
  var import_cafe_exports = {};
  __export(import_cafe_exports, {
    default: () => import_cafe_default
  });

  // tools/importer/parsers/hero-media.js
  function parse(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    let bgImage = element.querySelector(
      '.hero__media img, [class*="media"] img, :scope > img'
    );
    if (!bgImage) {
      bgImage = [...element.querySelectorAll("img")].find((img) => !/svg|icon|logo/i.test(img.getAttribute("src") || "")) || null;
    }
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

  // tools/importer/parsers/cards-reasons.js
  function parse2(element, { document }) {
    let cards = Array.from(element.children).filter(
      (c) => c.nodeType === 1 && c.querySelector("h1, h2, h3, h4, h5, h6")
    );
    if (cards.length < 1) {
      cards = Array.from(element.querySelectorAll("div")).filter(
        (d) => d.querySelector("h1, h2, h3, h4, h5, h6") && d.querySelector("img, picture, svg")
      );
    }
    const uniqueCards = [...new Set(cards)];
    if (uniqueCards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueCards.forEach((card) => {
      const image = card.querySelector("img, picture, svg");
      const bodyContent = [];
      const title = card.querySelector("h1, h2, h3, h4, h5, h6");
      const paras = Array.from(card.querySelectorAll("p"));
      if (title) bodyContent.push(title);
      paras.forEach((p) => bodyContent.push(p));
      cells.push([image || "", bodyContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-reasons", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-editorial.js
  function parse3(element, { document, url }) {
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

  // tools/importer/parsers/cards-event.js
  function parse4(element, { document }) {
    const cards = Array.from(element.querySelectorAll("article"));
    const uniqueCards = [...new Set(cards)];
    if (uniqueCards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueCards.forEach((card) => {
      const content = Array.from(card.children).filter((c) => c.nodeType === 1);
      if (content.length === 0) content.push(card);
      cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-event", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/stats-row.js
  function parse5(element, { document }) {
    let stats = Array.from(element.children).filter((c) => c.nodeType === 1);
    if (stats.length === 0) {
      stats = Array.from(element.querySelectorAll(":scope > div")).filter(
        (d) => d.children.length >= 2
      );
    }
    const uniqueStats = [...new Set(stats)];
    if (uniqueStats.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    uniqueStats.forEach((stat) => {
      const parts = Array.from(stat.children).filter((c) => c.nodeType === 1);
      const number = parts[0] || "";
      const label = parts[1] || "";
      cells.push([number, label]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "stats-row", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/store-locator.js
  function parse6(element, { document }) {
    const cells = [];
    const mapImage = element.querySelector(
      '#cafe-map img, image-slot img, [id*="map"] img, [class*="map"] img, [class*="map"] > picture'
    );
    if (mapImage) {
      cells.push([mapImage]);
    }
    const cards = [...new Set(Array.from(element.querySelectorAll("article")))];
    if (cards.length === 0 && !mapImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cards.forEach((card) => {
      const name = card.querySelector("h1, h2, h3, h4");
      const header = name ? name.parentElement : null;
      let city = null;
      if (header) {
        city = Array.from(header.children).find(
          (c) => c !== name && c.tagName !== "IMG" && c.textContent.trim()
        ) || null;
      }
      const address = card.querySelector("p");
      const contentWrap = header ? header.parentElement : card;
      const wrapDivs = contentWrap ? Array.from(contentWrap.children).filter((c) => c.tagName === "DIV") : [];
      const chips = wrapDivs.find(
        (d) => d.querySelector("span") && !d.querySelector("a") && !d.querySelector("h1, h2, h3, h4")
      ) || null;
      const actionsRow = wrapDivs.find((d) => d.querySelector("a"));
      let hours = null;
      let directions = null;
      if (actionsRow) {
        hours = Array.from(actionsRow.children).find(
          (c) => c.tagName === "SPAN" && c.textContent.trim()
        ) || null;
        directions = actionsRow.querySelector("a");
      } else {
        directions = card.querySelector("a");
      }
      cells.push([
        name || "",
        city || "",
        address || "",
        chips || "",
        hours || "",
        directions || ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "store-locator", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/booking-form.js
  function parse7(element, { document }) {
    const controlCount = (el) => el.querySelectorAll("select, input, textarea").length;
    const totalControls = controlCount(element);
    const introHeading = element.querySelector("h1, h2");
    const formCandidates = Array.from(element.querySelectorAll("div")).filter((d) => controlCount(d) === totalControls && (!introHeading || !d.contains(introHeading)));
    const formHost = formCandidates.sort(
      (a, b) => b.querySelectorAll("*").length - a.querySelectorAll("*").length
    ).pop() || formCandidates[0] || null;
    const heading = Array.from(element.querySelectorAll("h1, h2")).find(
      (h) => !formHost || !formHost.contains(h)
    );
    const cells = [];
    const copyContent = [];
    const copyHost = heading ? heading.parentElement : element;
    if (copyHost) {
      Array.from(copyHost.children).forEach((child) => {
        if (child.matches("span, h1, h2, h3, h4, p, ul, ol") && (!formHost || !formHost.contains(child)) && !child.querySelector("select, input, button[type]")) {
          copyContent.push(child);
        }
      });
    }
    const specParagraphs = [];
    const pushSpec = (text) => {
      if (!text) return;
      const p = document.createElement("p");
      p.textContent = text;
      specParagraphs.push(p);
    };
    const fieldRoot = formHost || element;
    const labels = Array.from(fieldRoot.querySelectorAll("label"));
    labels.forEach((label) => {
      const caption = label.querySelector(":scope > span");
      const labelText = caption ? caption.textContent.replace(/\s+/g, " ").trim() : "";
      const select = label.querySelector("select");
      const input = label.querySelector("input");
      if (select) {
        const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
        pushSpec(`${labelText} | select | ${options.join(", ")}`);
      } else if (input) {
        let type = "text";
        const lower = labelText.toLowerCase();
        if (lower.includes("email")) type = "email";
        else if (lower.includes("phone") || lower.includes("tel")) type = "tel";
        else if (lower.includes("date")) type = "date";
        pushSpec(`${labelText} | ${type}`);
      }
    });
    const toggleGroups = Array.from(fieldRoot.querySelectorAll("div")).filter((d) => {
      const btns = Array.from(d.children).filter((c) => c.tagName === "BUTTON");
      return btns.length >= 2 && btns.every((b) => !/submit|request/i.test(b.textContent));
    });
    toggleGroups.forEach((group) => {
      const parent = group.parentElement;
      let caption = "";
      if (parent) {
        const span = Array.from(parent.children).find(
          (c) => c.tagName === "SPAN" && c.textContent.trim()
        );
        if (span) caption = span.textContent.replace(/\s+/g, " ").trim();
      }
      const options = Array.from(group.children).filter((c) => c.tagName === "BUTTON").map((b) => b.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
      pushSpec(`${caption || "Options"} | toggle | ${options.join(", ")}`);
    });
    const submit = fieldRoot.querySelector(
      'button[type="submit"], button.fr-btn, [class*="btn"] button, button'
    );
    const submitBtn = Array.from(fieldRoot.querySelectorAll("button")).find(
      (b) => /request|book|submit|reserve/i.test(b.textContent)
    ) || submit;
    if (submitBtn) {
      pushSpec(`${submitBtn.textContent.replace(/\s+/g, " ").trim()} | submit`);
    }
    const notePara = Array.from(fieldRoot.querySelectorAll("p")).pop();
    if (notePara && notePara.textContent.trim()) {
      pushSpec(`note | ${notePara.textContent.replace(/\s+/g, " ").trim()}`);
    }
    if (copyContent.length === 0 && specParagraphs.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push([copyContent]);
    cells.push([specParagraphs]);
    const block = WebImporter.Blocks.createBlock(document, { name: "booking-form", cells });
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

  // tools/importer/import-cafe.js
  var parsers = {
    "hero-media": parse,
    "cards-reasons": parse2,
    "columns-editorial": parse3,
    "cards-event": parse4,
    "stats-row": parse5,
    "store-locator": parse6,
    "booking-form": parse7
  };
  var PAGE_TEMPLATE = {
    name: "cafe",
    description: "Cafe & showroom page with hero, reasons cards, three-room feature sections, weekly events cards, locations finder with stats and listings, tour booking form, and CTA.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/cafe.html"
    ],
    blocks: [
      { name: "hero-media", instances: ["#dc-root section:nth-of-type(1)", "#dc-root section:nth-of-type(7)"] },
      { name: "cards-reasons", instances: ["#dc-root section:nth-of-type(2) > div > div"] },
      { name: "columns-editorial", instances: ["#experience > div > div", "#locations article"] },
      { name: "cards-event", instances: ["#whatson > div > div:nth-of-type(2)"] },
      { name: "stats-row", instances: ["#locations > div > div:nth-of-type(1)"] },
      { name: "store-locator", instances: ["#locations > div > div:nth-of-type(2)"] },
      { name: "booking-form", instances: ["#tour"] }
    ],
    sections: [
      { id: "hero", name: "Hero", selector: "#dc-root section:nth-of-type(1)", style: null, blocks: ["hero-media"], defaultContent: [] },
      { id: "reasons", name: "Reasons", selector: "#dc-root section:nth-of-type(2)", style: null, blocks: ["cards-reasons"], defaultContent: ["#dc-root section:nth-of-type(2) > div > span", "#dc-root section:nth-of-type(2) > div > h2"] },
      { id: "experience", name: "Experience", selector: "#experience", style: "alt", blocks: ["columns-editorial"], defaultContent: ["#experience > div > span", "#experience > div > h2"] },
      { id: "whatson", name: "What's on", selector: "#whatson", style: null, blocks: ["cards-event"], defaultContent: ["#whatson > div > div:nth-of-type(1)"] },
      { id: "locations", name: "Locations", selector: "#locations", style: "alt", blocks: ["stats-row", "columns-editorial", "store-locator"], defaultContent: ["#locations > div > span", "#locations > div > h2", "#locations > div > p"] },
      { id: "tour", name: "Tour booking", selector: "#tour", style: null, blocks: ["booking-form"], defaultContent: [] },
      { id: "cta", name: "CTA", selector: "#dc-root section:nth-of-type(7)", style: "dark", blocks: ["hero-media"], defaultContent: [] }
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
  var import_cafe_default = {
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
  return __toCommonJS(import_cafe_exports);
})();
