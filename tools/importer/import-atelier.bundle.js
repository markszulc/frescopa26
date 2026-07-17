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

  // tools/importer/import-atelier.js
  var import_atelier_exports = {};
  __export(import_atelier_exports, {
    default: () => import_atelier_default
  });

  // tools/importer/parsers/product-hero.js
  function parse(element, { document, url }) {
    var _a;
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const pic = (img) => {
      const p = document.createElement("picture");
      const c = document.createElement("img");
      c.setAttribute("src", img.getAttribute("src"));
      c.setAttribute("alt", img.getAttribute("alt") || "");
      p.append(c);
      return p;
    };
    const galleryCell = document.createElement("div");
    const mainImg = element.querySelector("img");
    if (mainImg) galleryCell.append(pic(mainImg));
    const thumbImgs = [...element.querySelectorAll("button img")];
    thumbImgs.forEach((img) => {
      var _a2;
      const label = ((_a2 = img.closest("button")) == null ? void 0 : _a2.getAttribute("aria-label")) || img.getAttribute("alt") || "";
      const clone = img.cloneNode(true);
      clone.setAttribute("alt", label);
      const p = document.createElement("picture");
      p.append(clone);
      galleryCell.append(p);
    });
    const buyCell = document.createElement("div");
    const scope = ((_a = element.querySelector("h1")) == null ? void 0 : _a.closest("div")) || element;
    const eyebrow = scope.querySelector("span");
    const h1 = scope.querySelector("h1");
    const ratingA = scope.querySelector('a[href*="review"], a[href="#reviews"]');
    const lede = [...scope.querySelectorAll("p")].find((p) => t(p).length > 40);
    const priceEl = [...scope.querySelectorAll("*")].find((e) => e.children.length === 0 && /^[$£€][\d,]+$/.test(t(e)));
    const financeEl = [...scope.querySelectorAll("*")].find((e) => e.children.length === 0 && /\/mo|month/i.test(t(e)));
    const finishLabelEl = [...scope.querySelectorAll("*")].find((e) => e.children.length === 0 && /^finish/i.test(t(e)));
    const finishes = [...scope.querySelectorAll("button[aria-label]")].map((b) => b.getAttribute("aria-label")).filter((l) => l && /^(cream|charcoal|terracotta)$/i.test(l));
    const ledeText = lede ? t(lede) : "";
    const trust = [...scope.querySelectorAll("*")].filter((e) => e.children.length === 0 && t(e).length < 70 && t(e) !== ledeText && /delivery|guarantee|mornings|return/i.test(t(e))).map(t).filter((x, i, a) => a.indexOf(x) === i);
    if (eyebrow) buyCell.append(el("p", t(eyebrow)));
    if (h1) buyCell.append(el("h1", t(h1)));
    if (ratingA) buyCell.append(el("p", t(ratingA)));
    if (lede) buyCell.append(el("p", t(lede)));
    if (priceEl) buyCell.append(el("p", t(priceEl)));
    if (financeEl) buyCell.append(el("p", t(financeEl)));
    buyCell.append(el("p", finishLabelEl ? t(finishLabelEl) : "Finish \u2014 Cream"));
    if (finishes.length) {
      const ul = el("ul");
      finishes.forEach((f) => ul.append(el("li", f)));
      buyCell.append(ul);
    }
    if (trust.length) {
      const ul = el("ul");
      trust.forEach((tx) => ul.append(el("li", tx)));
      buyCell.append(ul);
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "product-hero",
      cells: [[galleryCell, buyCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/product-jumpnav.js
  function parse2(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const introCell = document.createElement("div");
    const hint = [...element.querySelectorAll("span, p")].find((s) => /deciding/i.test(t(s)));
    const label = [...element.querySelectorAll("span, p")].find((s) => /jump to/i.test(t(s)));
    if (hint) introCell.append(el("p", t(hint)));
    if (label) introCell.append(el("p", t(label)));
    const linksCell = document.createElement("div");
    const list = el("ul");
    [...element.querySelectorAll("a")].forEach((a) => {
      const li = el("li");
      const link = el("a", t(a));
      link.setAttribute("href", a.getAttribute("href") || "#");
      li.append(link);
      list.append(li);
    });
    linksCell.append(list);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "product-jumpnav",
      cells: [[introCell, linksCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/steps-tabs.js
  var STEP_DETAILS = [
    {
      title: "It tastes every cup",
      body: "A ring of sensors watches every extraction \u2014 the grind size, how fast the water flows, the strength in the cup, and the temperature at the group head. The same signals a barista feels by hand, read hundreds of times a second.",
      img: "assets/images/espresso-pour.jpg",
      alt: "Sensors reading every pour."
    },
    {
      title: "It builds your flavour DNA",
      body: "Those readings roll up into a flavour DNA for each person in the house \u2014 how strong, how hot, how much milk, which drink, and when. Every cup you pour nudges the picture a little closer to right.",
      img: "assets/images/hero-machine.jpg",
      alt: "The Atelier building your flavour DNA."
    },
    {
      title: "It reads the morning",
      body: "Before you've asked, it weighs the time of day, what's on your calendar, the weather outside, and who's already awake. A rushed Tuesday and a slow Sunday call for different cups, and it knows the difference.",
      img: "assets/images/cafe-interior.jpg",
      alt: "Reading the shape of the morning."
    },
    {
      title: "It acts on its own",
      body: "Then it acts. It warms up before your alarm, sets the pour to match the morning, and quietly reorders beans before you run low. Less like using a machine, and more like being looked after.",
      img: "assets/images/sustainability.jpg",
      alt: "Acting on its own, right down to the grounds."
    }
  ];
  function parse3(element, { document, url }) {
    const abs = (src) => {
      try {
        return url ? new URL(src, url).href : src;
      } catch (e) {
        return src;
      }
    };
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const pic = (src, alt) => {
      const p = document.createElement("picture");
      const c = document.createElement("img");
      c.setAttribute("src", abs(src));
      c.setAttribute("alt", alt || "");
      p.append(c);
      return p;
    };
    const headNodes = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    const lede = [...element.querySelectorAll("p")].find((p) => t(p).length > 40);
    if (eyebrow && t(eyebrow) && eyebrow !== lede) headNodes.push(el("p", t(eyebrow)));
    if (h2) headNodes.push(el("h2", t(h2)));
    if (lede) headNodes.push(el("p", t(lede)));
    const tabButtons = [...element.querySelectorAll("button")];
    const rows = STEP_DETAILS.map((step, i) => {
      const btn = tabButtons[i];
      const teaser = btn ? t(btn.querySelector("p")) : "";
      const titleCell = document.createElement("div");
      titleCell.append(el("h3", step.title));
      if (teaser) titleCell.append(el("p", teaser));
      const detailCell = document.createElement("div");
      detailCell.append(el("p", step.body));
      const imageCell = document.createElement("div");
      imageCell.append(pic(step.img, step.alt));
      return [titleCell, detailCell, imageCell];
    });
    const footText = [...element.querySelectorAll("p")].map(t).filter((x) => x.length > 40 && x !== t(lede)).pop();
    const block = WebImporter.Blocks.createBlock(document, {
      name: "steps-tabs",
      cells: [[headNodes], ...rows]
    });
    const after = footText ? [el("p", footText)] : [];
    element.replaceWith(block, ...after);
  }

  // tools/importer/parsers/media-video.js
  function parse4(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img2) => {
        try {
          img2.setAttribute("src", new URL(img2.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const headCell = document.createElement("div");
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    const footText = [...element.querySelectorAll("p")].map(t).find((x) => x.length > 40);
    if (eyebrow && t(eyebrow) && t(eyebrow) !== footText) headCell.append(el("p", t(eyebrow)));
    if (h2) headCell.append(el("h2", t(h2)));
    const posterCell = document.createElement("div");
    const img = element.querySelector("img");
    if (img) {
      const p = document.createElement("picture");
      const c = document.createElement("img");
      c.setAttribute("src", img.getAttribute("src"));
      c.setAttribute("alt", img.getAttribute("alt") || "");
      p.append(c);
      posterCell.append(p);
    }
    const duration = [...element.querySelectorAll("*")].map(t).find((x) => /^\d+:\d+$/.test(x));
    if (duration) posterCell.append(el("p", duration));
    const cells = [[headCell], [posterCell]];
    if (footText) cells.push([el("p", footText)]);
    const block = WebImporter.Blocks.createBlock(document, { name: "media-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  var CLAIMS = {
    "Learns your taste": "From your first cup it tracks strength, temperature and milk, and settles into your preference within about a week.",
    "Reads your calendar": "A full morning and a slow one call for different cups. With your permission it checks your calendar and adjusts what it suggests.",
    "Reorders itself": "It watches the bean hopper and reorders your blend before you run out \u2014 and pauses the moment you ask it to.",
    "Compostable pods": "The optional pods break down in your compost, and spent grounds drop into a drawer you can empty straight onto the garden.",
    "Whisper-quiet grind": "The grinder runs at about 58 dB, quiet enough to pour a cup without waking anyone still asleep.",
    "Steams milk on its own": "An automatic wand textures milk to the right temperature for each drink \u2014 no jug to swirl by hand."
  };
  var FAQ = {
    "Is it a hassle to set up?": "Not at all. Delivery includes a full setup, so it's pouring before we leave. If anything ever feels off, we'll talk you through it.",
    "Do I have to buy Fr\xE9scopa pods?": "Never. The Atelier is happiest with whole beans, and it works beautifully with your own. Our pods are there if you want them, not because you have to.",
    "How long until it learns my taste?": "Give it a week of mornings. It starts adjusting from the very first cup, and settles into your preferences before the first bag runs out.",
    "Will it wake the whole house?": "The grind is whisper-quiet by design. Early risers can pour a cup without stirring anyone still asleep.",
    "What if it isn't for me?": "You have thirty mornings to fall for it. If it doesn't earn its place on your counter, send it back and we'll cover the return.",
    "Is it a chore to clean?": "It rinses itself after every cup, and the parts that need washing are dishwasher-safe. A proper clean takes a minute, not a morning."
  };
  function parse5(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const titles = [...element.querySelectorAll("button")].map(t).filter(Boolean);
    const score = (data2) => titles.filter((x) => data2[x] !== void 0).length;
    const data = score(FAQ) >= score(CLAIMS) ? FAQ : CLAIMS;
    const headNodes = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    const lede = [...element.querySelectorAll("p")].find((p) => t(p).length > 40);
    const ctaA = element.querySelector("a[href]");
    if (eyebrow && t(eyebrow) && eyebrow !== lede) headNodes.push(el("p", t(eyebrow)));
    if (h2) headNodes.push(el("h2", t(h2)));
    if (lede) headNodes.push(el("p", t(lede)));
    if (ctaA && t(ctaA)) {
      const p = el("p");
      const a = el("a", t(ctaA).replace(/\s*→\s*$/, ""));
      a.setAttribute("href", ctaA.getAttribute("href") || "#");
      p.append(a);
      headNodes.push(p);
    }
    const rows = titles.map((title) => {
      const titleCell = el("div");
      titleCell.append(el("p", title));
      const contentCell = el("div");
      contentCell.append(el("p", data[title] || ""));
      return [titleCell, contentCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells: rows });
    element.replaceWith(...headNodes, block);
  }

  // tools/importer/parsers/spec-table.js
  function parse6(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const headNodes = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    if (eyebrow && t(eyebrow)) headNodes.push(el("p", t(eyebrow)));
    if (h2) headNodes.push(el("h2", t(h2)));
    const rows = [];
    [...element.querySelectorAll("h3")].forEach((h3) => {
      const title = t(h3);
      const wrap = h3.parentElement;
      const titleCell = el("div");
      titleCell.append(el("h3", title));
      const listCell = el("div");
      const ul = el("ul");
      if (/in the box/i.test(title)) {
        let items = [...wrap.querySelectorAll("li")];
        if (!items.length) {
          const container = [...wrap.children].find((c) => c !== h3 && c.children.length > 1) || wrap;
          items = [...container.children].filter((c) => c !== h3);
        }
        items.forEach((node) => {
          const text = t(node).replace(/^[—–-]\s*/, "").trim();
          if (text && !/^[—–-]$/.test(text)) ul.append(el("li", text));
        });
      } else {
        const specRows = [...wrap.children].filter((c) => c !== h3);
        specRows.forEach((r) => {
          const cells = [...r.children];
          let label;
          let value;
          if (cells.length >= 2) {
            label = t(cells[0]);
            value = t(cells[1]);
          } else {
            const parts = t(r).split(/\s+[—–-]\s+/);
            label = parts[0];
            value = parts.slice(1).join(" \u2014 ");
          }
          if (label) ul.append(el("li", value ? `${label} \u2014 ${value}` : label));
        });
      }
      listCell.append(ul);
      rows.push([titleCell, listCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "spec-table", cells: rows });
    element.replaceWith(...headNodes, block);
  }

  // tools/importer/parsers/atelier-taste-profile.js
  function parse7(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const copy = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    const lede = [...element.querySelectorAll("p")].find((p) => t(p).length > 40);
    if (eyebrow && t(eyebrow) && eyebrow !== lede) copy.push(el("p", t(eyebrow)));
    if (h2) copy.push(el("h2", t(h2)));
    if (lede) copy.push(el("p", t(lede)));
    const cells = [[copy]];
    const buttons = [...element.querySelectorAll('[role="group"] button, button')].filter((b) => t(b) && t(b).length < 24);
    const readoutTitle = t(element.querySelector("h4"));
    const readoutNote = [...element.querySelectorAll("p")].map(t).filter((x) => x.length > 30 && x !== t(lede)).pop() || "";
    buttons.forEach((btn) => {
      const label = t(btn);
      const isActive = btn.getAttribute("aria-pressed") === "true";
      if (isActive) cells.push([label, readoutTitle || label, readoutNote]);
      else cells.push([label]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "taste-profile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/reviews.js
  function parse8(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const headCell = document.createElement("div");
    const h2 = element.querySelector("h2");
    const agg = [...element.querySelectorAll("*")].find((e) => e.children.length === 0 && /^\d(\.\d)?$/.test(t(e)));
    const eyebrow = h2 ? h2.previousElementSibling : element.querySelector("p");
    const aggNote = [...element.querySelectorAll("p")].find((p) => /verified|from \d/i.test(t(p)) && p !== eyebrow);
    if (eyebrow && t(eyebrow) && eyebrow !== aggNote && eyebrow.tagName !== "H2") headCell.append(el("p", t(eyebrow)));
    if (h2) headCell.append(el("h2", t(h2)));
    if (agg) headCell.append(el("p", t(agg)));
    if (aggNote) headCell.append(el("p", t(aggNote)));
    const rows = [[headCell]];
    [...element.querySelectorAll("figure")].forEach((fig) => {
      const quote = t(fig.querySelector("blockquote"));
      const attr = t(fig.querySelector("figcaption") || [...fig.children].pop());
      const ratingCell = el("div", "5");
      const quoteCell = el("div");
      quoteCell.append(el("blockquote", quote));
      if (attr && attr !== quote) quoteCell.append(el("p", attr));
      rows.push([ratingCell, quoteCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "reviews", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/parsers/bundle-cards.js
  function parse9(element, { document }) {
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const headNodes = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    if (eyebrow && t(eyebrow)) headNodes.push(el("p", t(eyebrow)));
    if (h2) headNodes.push(el("h2", t(h2)));
    const cards = [...element.querySelectorAll("*")].filter((e) => e.querySelector(":scope > h3"));
    const rows = cards.map((card) => {
      const cell = document.createElement("div");
      const badge = [...card.querySelectorAll("*")].filter((e) => e.children.length === 0).map(t).find((x) => /most loved|popular|best/i.test(x));
      if (badge) cell.append(el("p", badge));
      const h3 = card.querySelector("h3");
      if (h3) cell.append(el("h3", t(h3)));
      const desc = card.querySelector("p");
      if (desc && t(desc)) cell.append(el("p", t(desc)));
      const priceEls = [...card.querySelectorAll("*")].filter((e) => e.children.length === 0 && /^([$£€][\d,]+|save\b.*)/i.test(t(e))).map(t);
      if (priceEls.length) cell.append(el("p", priceEls.join(" ")));
      const link = card.querySelector("a, button");
      const cta = el("a", link ? t(link).replace(/\s*→\s*$/, "") || "Add to cart" : "Add to cart");
      cta.setAttribute("href", link && link.getAttribute("href") ? link.getAttribute("href") : "#");
      cell.append(cta);
      return [cell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "bundle-cards", cells: rows });
    element.replaceWith(...headNodes, block);
  }

  // tools/importer/parsers/atelier-pairs.js
  function parse10(element, { document, url }) {
    if (url) {
      element.querySelectorAll("img[src]").forEach((img) => {
        try {
          img.setAttribute("src", new URL(img.getAttribute("src"), url).href);
        } catch (e) {
        }
      });
    }
    const t = (el2) => el2 ? el2.textContent.trim().replace(/\s+/g, " ") : "";
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const headNodes = [];
    const eyebrow = element.querySelector("p");
    const h2 = element.querySelector("h2");
    if (eyebrow && t(eyebrow)) headNodes.push(el("p", t(eyebrow)));
    if (h2) headNodes.push(el("h2", t(h2)));
    const rows = [...element.querySelectorAll("article")].map((art) => {
      const imageCell = document.createElement("div");
      const img = art.querySelector("img");
      if (img) {
        const picture = document.createElement("picture");
        const clone = document.createElement("img");
        clone.setAttribute("src", img.getAttribute("src"));
        clone.setAttribute("alt", img.getAttribute("alt") || "");
        picture.append(clone);
        imageCell.append(picture);
      }
      const bodyCell = document.createElement("div");
      const cat = [...art.querySelectorAll("span, div")].find((e) => e.children.length === 0 && /^(coffee|tea|juice)$/i.test(t(e)));
      if (cat) bodyCell.append(el("p", t(cat)));
      const h3 = art.querySelector("h3");
      if (h3) bodyCell.append(el("h3", t(h3)));
      const desc = art.querySelector("p");
      if (desc && t(desc)) bodyCell.append(el("p", t(desc)));
      const price = [...art.querySelectorAll("span, div")].find((e) => e.children.length === 0 && /^[$£€]\d/.test(t(e)));
      bodyCell.append(el("p", `${price ? t(price) : ""}Add to cart \u2192`));
      return [imageCell, bodyCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells: rows });
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

  // tools/importer/import-atelier.js
  var parsers = {
    "product-hero": parse,
    "product-jumpnav": parse2,
    "steps-tabs": parse3,
    "media-video": parse4,
    accordion: parse5,
    "spec-table": parse6,
    "taste-profile": parse7,
    reviews: parse8,
    "bundle-cards": parse9,
    "cards-product": parse10
  };
  var PAGE_TEMPLATE = {
    name: "atelier",
    description: "The Atelier product detail page (PDP).",
    urls: [
      "https://markszulc.github.io/frescopa-atelier/atelier.html"
    ],
    blocks: [
      { name: "product-hero", instances: ["#dc-root section:nth-of-type(1)"] },
      { name: "product-jumpnav", instances: ["#dc-root section:nth-of-type(2)"] },
      { name: "steps-tabs", instances: ["#dc-root section:nth-of-type(3)"] },
      { name: "media-video", instances: ["#dc-root section:nth-of-type(4)"] },
      { name: "accordion", instances: ["#dc-root section:nth-of-type(5)", "#dc-root section:nth-of-type(9)"] },
      { name: "spec-table", instances: ["#dc-root section:nth-of-type(6)"] },
      { name: "taste-profile", instances: ["#dc-root section:nth-of-type(7)"] },
      { name: "reviews", instances: ["#dc-root section:nth-of-type(8)"] },
      { name: "bundle-cards", instances: ["#dc-root section:nth-of-type(10)"] },
      { name: "cards-product", instances: ["#dc-root section:nth-of-type(11)"] }
    ],
    sections: [
      { id: "hero", name: "Hero", selector: "#dc-root section:nth-of-type(1)", style: null, blocks: ["product-hero"], defaultContent: [] },
      { id: "jumpnav", name: "Jump nav", selector: "#dc-root section:nth-of-type(2)", style: "alt", blocks: ["product-jumpnav"], defaultContent: [] },
      { id: "how", name: "How it works", selector: "#dc-root section:nth-of-type(3)", style: null, blocks: ["steps-tabs"], defaultContent: [] },
      { id: "video", name: "Video", selector: "#dc-root section:nth-of-type(4)", style: "alt", blocks: ["media-video"], defaultContent: [] },
      { id: "claims", name: "Claims", selector: "#dc-root section:nth-of-type(5)", style: null, blocks: ["accordion"], defaultContent: [] },
      { id: "specs", name: "Specifications", selector: "#dc-root section:nth-of-type(6)", style: "alt", blocks: ["spec-table"], defaultContent: [] },
      { id: "dna", name: "Flavour DNA", selector: "#dc-root section:nth-of-type(7)", style: null, blocks: ["taste-profile"], defaultContent: [] },
      { id: "reviews", name: "Reviews", selector: "#dc-root section:nth-of-type(8)", style: "alt", blocks: ["reviews"], defaultContent: [] },
      { id: "faq", name: "FAQ", selector: "#dc-root section:nth-of-type(9)", style: null, blocks: ["accordion"], defaultContent: [] },
      { id: "bundles", name: "Bundles", selector: "#dc-root section:nth-of-type(10)", style: "alt", blocks: ["bundle-cards"], defaultContent: [] },
      { id: "pairs", name: "Pairs well", selector: "#dc-root section:nth-of-type(11)", style: null, blocks: ["cards-product"], defaultContent: [] }
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
  var import_atelier_default = {
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
  return __toCommonJS(import_atelier_exports);
})();
