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

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
  });

  // tools/importer/parsers/article-body.js
  function parse(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    const article = element.matches("article") ? element : element.querySelector("article");
    if (!article) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const t = (el2) => el2 ? el2.textContent.trim() : "";
    const nodes = [];
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const cloneImg = (img) => {
      const picture = document.createElement("picture");
      const clone = document.createElement("img");
      clone.setAttribute("src", img.getAttribute("src"));
      clone.setAttribute("alt", img.getAttribute("alt") || "");
      picture.append(clone);
      return picture;
    };
    const bylineBlock = (scope, { bio }) => {
      const img = scope.querySelector("img");
      const imageCell = document.createElement("div");
      if (img) imageCell.append(cloneImg(img));
      const bodyCell = document.createElement("div");
      const heading = scope.querySelector("h1, h2, h3, h4");
      const spans = [...scope.querySelectorAll("span, p")].filter((s) => t(s) && s.children.length === 0);
      const name = heading ? t(heading) : spans[0] ? t(spans[0]) : "";
      if (bio) {
        const label = [...scope.querySelectorAll("span, p")].find((s) => /about the author/i.test(t(s)));
        if (label) bodyCell.append(el("p", t(label)));
      }
      bodyCell.append(el(heading ? "h3" : "p", name));
      const rest = spans.filter((s) => t(s) !== name && !/about the author/i.test(t(s)));
      const metaEl = rest.sort((a, b) => t(b).length - t(a).length)[0];
      if (metaEl) bodyCell.append(el("p", t(metaEl)));
      return WebImporter.Blocks.createBlock(document, {
        name: bio ? "article-byline (bio)" : "article-byline",
        cells: [[imageCell, bodyCell]]
      });
    };
    const header = article.querySelector("header") || article;
    const crumbNav = header.querySelector("nav");
    if (crumbNav) {
      const p = el("p");
      p.textContent = [...crumbNav.querySelectorAll("a, span")].map((n) => t(n)).filter(Boolean).join(" / ");
      nodes.push(p);
    }
    const h1 = header.querySelector("h1");
    if (h1) nodes.push(el("h1", t(h1)));
    const lede = header.querySelector("h1") ? header.querySelector("h1").parentElement.querySelector("p") : header.querySelector("p");
    if (lede) nodes.push(el("p", t(lede)));
    const metaLine = [...header.querySelectorAll("span, p")].find((s) => /·/.test(t(s)) && /read/i.test(t(s)) && s.children.length === 0);
    const bylineScope = metaLine ? metaLine.closest("div").parentElement : null;
    if (bylineScope) nodes.push(bylineBlock(bylineScope, { bio: false }));
    const heroFigure = [...article.children].map((c) => c.querySelector && c.querySelector("figure")).find(Boolean) || article.querySelector("figure");
    if (heroFigure) {
      const img = heroFigure.querySelector("img");
      if (img) nodes.push(cloneImg(img));
      const cap = heroFigure.querySelector("figcaption") || heroFigure.querySelector("span");
      if (cap && t(cap)) {
        const em = el("p");
        em.append(el("em", t(cap)));
        nodes.push(em);
      }
    }
    const prose = [...article.children].find((c) => c.querySelector && c.querySelector("h2") && !c.querySelector("article"));
    if (prose) {
      [...prose.children].forEach((node) => {
        const tag = node.tagName;
        if (/^H[1-6]$/.test(tag)) {
          nodes.push(el("h2", t(node)));
        } else if (tag === "P") {
          if (node.querySelector("a")) {
            const p = el("p");
            p.innerHTML = node.innerHTML;
            nodes.push(p);
          } else {
            nodes.push(el("p", t(node)));
          }
        } else if (tag === "BLOCKQUOTE") {
          const bq = el("blockquote", t(node).replace(/^["']|["']$/g, ""));
          nodes.push(bq);
        } else if (tag === "FIGURE") {
          const img = node.querySelector("img");
          if (img) nodes.push(cloneImg(img));
          const cap = node.querySelector("figcaption") || node.querySelector("span");
          if (cap && t(cap)) {
            const em = el("p");
            em.append(el("em", t(cap)));
            nodes.push(em);
          }
        } else if (tag === "ASIDE") {
          const label = [...node.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()) || node.querySelector("span, strong");
          const aside = document.createElement("div");
          aside.className = "article-keypoints";
          if (label && t(label)) aside.append(el("p", t(label)));
          const list = node.querySelector("ol, ul");
          if (list) {
            const ul = el("ul");
            list.querySelectorAll("li").forEach((li) => {
              const item = el("li");
              item.innerHTML = li.innerHTML;
              ul.append(item);
            });
            aside.append(ul);
          }
          nodes.push(aside);
        } else if (tag === "DIV") {
          if (/^share/i.test(t(node))) {
            const labels = [...node.querySelectorAll("a")].map((a) => a.getAttribute("aria-label") || t(a)).filter(Boolean);
            const labelCell = el("div", "Share");
            const linksCell = el("div", labels.join(", ") || "Share on X, Share by email, Copy link");
            nodes.push(WebImporter.Blocks.createBlock(document, {
              name: "article-share",
              cells: [[labelCell, linksCell]]
            }));
          } else if (/about the author/i.test(t(node))) {
            nodes.push(bylineBlock(node, { bio: true }));
          }
        }
      });
    }
    const related = [...article.children].find((c) => c.tagName === "SECTION" && c.querySelector("a"));
    if (related) {
      const label = [...related.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()) || related.querySelector("span");
      const h2 = related.querySelector("h2");
      if (label && t(label)) nodes.push(el("p", t(label)));
      if (h2) nodes.push(el("h2", t(h2)));
      const cardRows = [];
      related.querySelectorAll(":scope a, a").forEach((a) => {
        if (!a.querySelector("h3")) return;
        const imageCell = document.createElement("div");
        const img = a.querySelector("img");
        if (img) imageCell.append(cloneImg(img));
        const bodyCell = document.createElement("div");
        const cat = [...a.querySelectorAll("span")].find((s) => t(s) && s.children.length === 0 && t(s) !== t(a.querySelector("h3")));
        if (cat) bodyCell.append(el("p", t(cat)));
        const h3 = a.querySelector("h3");
        const h = el("h3");
        const ha = el("a", t(h3));
        ha.setAttribute("href", a.getAttribute("href") || "#");
        h.append(ha);
        bodyCell.append(h);
        cardRows.push([imageCell, bodyCell]);
      });
      if (cardRows.length) {
        nodes.push(WebImporter.Blocks.createBlock(document, { name: "cards-article", cells: cardRows }));
      }
      const backLink = [...related.querySelectorAll("a")].find((a) => !a.querySelector("h3") && /back/i.test(t(a)));
      if (backLink) {
        const p = el("p");
        const a = el("a", t(backLink));
        a.setAttribute("href", backLink.getAttribute("href") || "#");
        p.append(a);
        nodes.push(p);
      }
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

  // tools/importer/import-article.js
  var parsers = {
    "article-body": parse
  };
  var PAGE_TEMPLATE = {
    name: "article",
    description: "Journal article: breadcrumb, title, lede, author byline, hero figure, long-form prose with headings/figures/blockquote/key-points aside, share row, author bio, and related-reading cards.",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/article.html"
    ],
    blocks: [
      { name: "article-body", instances: ["#dc-root article"] }
    ],
    sections: [
      { id: "article", name: "Article", selector: "#dc-root article", style: null, blocks: ["article-body"], defaultContent: [] }
    ]
  };
  var transformers = [transform];
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
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_article_default = {
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
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_article_exports);
})();
