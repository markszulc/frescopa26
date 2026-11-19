import { isAemAssetsEnabled, tryGenerateAemAssetsOptimizedUrl } from '@dropins/tools/lib/aem/assets.js';
import { renderCard, renderCards } from '../cards-machine/cards-machine.js';
import { CS_FETCH_GRAPHQL, fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';

/**
 * Commerce-driven machine cards. Renders the same markup as cards-machine
 * (and reuses its CSS) with content from the Catalog Service.
 *
 * Authoring model (rows), one card per row:
 *   cell 1: SKU (required)
 *   cell 2: eyebrow (optional, overrides the category)
 *   cell 3: description (optional, overrides the short description)
 *   cell 4: CTA text (optional, overrides the Global.ViewProduct placeholder)
 *   cell 5: CTA link (optional, overrides the product page link)
 */

const IMAGE_WIDTH = 750;
// 4:3, matching the placeholder box, so skeleton and image cards are the same height.
const IMAGE_HEIGHT = 563;

const PRODUCTS_QUERY = `query CARDS_COMMERCE_PRODUCTS($skus: [String]) {
  products(skus: $skus) {
    __typename
    sku
    name
    urlKey
    shortDescription
    images { url label roles }
    categories { name level }
    ... on SimpleProductView {
      price { final { amount { value currency } } }
    }
    ... on ComplexProductView {
      priceRange {
        minimum { final { amount { value currency } } }
        maximum { final { amount { value currency } } }
      }
    }
  }
}`;

const warn = (message) => {
  // eslint-disable-next-line no-console
  console.warn(`cards-commerce: ${message}`);
};

/**
 * Validates a URL from Commerce or authored content.
 * @param {string} value The URL
 * @param {Object} [options]
 * @param {boolean} [options.httpsOnly] Only accept https (used for images)
 * @returns {URL|null} The parsed URL, or null if unsafe or invalid
 */
function safeUrl(value, { httpsOnly = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim().startsWith('//') ? `https:${value.trim()}` : value.trim();
  try {
    const url = new URL(raw, window.location.href);
    const allowed = httpsOnly ? ['https:'] : ['https:', 'http:'];
    return allowed.includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/** Same-origin links stay relative so they work across preview, live and localhost. */
function toHref(url) {
  return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

/** Strips HTML from Commerce rich text without executing or rendering it. */
function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.body.querySelectorAll('script, style, template, noscript').forEach((el) => el.remove());
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function formatPrice(amount) {
  if (!amount || typeof amount.value !== 'number' || !amount.currency) return '';
  const whole = Number.isInteger(amount.value);
  try {
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: 'currency',
      currency: amount.currency,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(amount.value);
  } catch {
    return '';
  }
}

function productPrice(product, labels) {
  if (product.price) return formatPrice(product.price.final?.amount);
  const min = product.priceRange?.minimum?.final?.amount;
  const max = product.priceRange?.maximum?.final?.amount;
  const minText = formatPrice(min);
  if (!minText) return '';
  if (max && max.value !== min.value) {
    return `${labels.Dropin?.PriceRange?.from?.label ?? 'From'} ${minText}`;
  }
  return minText;
}

function productEyebrow(product) {
  const categories = (product.categories || []).filter((c) => c?.name);
  if (!categories.length) return null;
  const deepest = categories.reduce((a, b) => ((b.level ?? 0) > (a.level ?? 0) ? b : a));
  return deepest.name;
}

function buildPicture(product, eager) {
  const images = (product.images || []).filter((i) => i?.url);
  const image = images.find((i) => i.roles?.includes('image')) || images[0];
  const url = image && safeUrl(image.url, { httpsOnly: true });
  if (!url) return null;

  const sized = (params) => {
    if (isAemAssetsEnabled()) {
      const optimized = safeUrl(
        tryGenerateAemAssetsOptimizedUrl(url.href, product.sku, { width: IMAGE_WIDTH, ...params }),
        { httpsOnly: true },
      );
      if (optimized) return optimized.href;
    }
    const sizedUrl = new URL(url.href);
    sizedUrl.searchParams.set('width', IMAGE_WIDTH);
    Object.entries(params).forEach(([k, v]) => sizedUrl.searchParams.set(k, v));
    return sizedUrl.href;
  };

  const picture = document.createElement('picture');
  const source = document.createElement('source');
  source.type = 'image/webp';
  source.srcset = sized({ auto: 'webp' });
  const img = document.createElement('img');
  img.src = sized({});
  img.alt = image.label?.trim() || product.name || '';
  img.width = IMAGE_WIDTH;
  img.height = IMAGE_HEIGHT;
  img.loading = eager ? 'eager' : 'lazy';
  picture.append(source, img);
  return picture;
}

function readRow(row) {
  const cells = [...row.children];
  const text = (i) => cells[i]?.textContent.trim() || '';
  const descCell = cells[2];
  const descParas = descCell ? [...descCell.querySelectorAll(':scope > p')] : [];
  const linkCell = cells[4];
  const link = linkCell?.querySelector('a')?.getAttribute('href') || text(4);
  return {
    sku: text(0),
    eyebrow: text(1),
    // Authored description is trusted content: keep its paragraphs, else use its text.
    descriptions: descParas.length ? descParas : [text(2)].filter(Boolean),
    ctaText: text(3),
    ctaLink: link,
  };
}

function skeletonCard() {
  const card = renderCard({
    picture: null,
    eyebrow: '\u00a0',
    title: '\u00a0',
    descriptions: ['\u00a0'],
    price: '\u00a0',
    cta: null,
  });
  card.classList.add('cards-commerce-skeleton');
  card.setAttribute('aria-hidden', 'true');
  return card;
}

function toCard(entry, product, labels, eager) {
  const { overrides } = entry;
  const ctaOverride = safeUrl(overrides.ctaLink);
  if (overrides.ctaLink && !ctaOverride) {
    warn(`ignoring unsafe or invalid CTA link "${overrides.ctaLink}" for SKU "${entry.sku}"`);
  }
  const ctaUrl = ctaOverride || safeUrl(getProductLink(product.urlKey, product.sku));
  const description = stripHtml(product.shortDescription);
  return {
    flagship: false,
    picture: buildPicture(product, eager),
    badge: '',
    eyebrow: overrides.eyebrow || productEyebrow(product),
    title: product.name,
    descriptions: overrides.descriptions.length
      ? overrides.descriptions
      : [description].filter(Boolean),
    features: null,
    price: productPrice(product, labels),
    cta: ctaUrl ? {
      href: toHref(ctaUrl),
      text: overrides.ctaText || labels.Global?.ViewProduct || 'View product →',
    } : null,
  };
}

export default async function decorate(block) {
  // Reuse the cards-machine styles and section behaviour unchanged.
  block.classList.add('cards-machine');

  const entries = [...block.children].map((row) => {
    const overrides = readRow(row);
    return { sku: overrides.sku, overrides };
  }).filter((entry) => {
    if (!entry.sku) warn('skipping a row with no SKU');
    return entry.sku;
  });

  const wrapper = block.parentElement;
  const hideBlock = () => {
    if (wrapper?.classList.contains('cards-commerce-wrapper')) wrapper.hidden = true;
    else block.hidden = true;
  };

  if (!entries.length) {
    block.textContent = '';
    hideBlock();
    return;
  }

  // Skeletons first, in the final grid, so columns don't move when data arrives.
  const skeletons = new Map();
  renderCards(block, entries, (entry) => {
    const el = skeletonCard();
    skeletons.set(entry, el);
    return el;
  });

  const eager = !!block.closest('main > .section:first-of-type');
  const skus = [...new Set(entries.map((e) => e.sku))];

  let products = [];
  try {
    const [{ data, errors }] = await Promise.all([
      CS_FETCH_GRAPHQL.fetchGraphQl(PRODUCTS_QUERY, { method: 'GET', variables: { skus } }),
      fetchPlaceholders('placeholders/global.json'),
    ]);
    if (errors?.length) warn(`Catalog Service returned errors: ${errors.map((e) => e.message).join('; ')}`);
    products = (data?.products || []).filter((p) => p?.sku && p?.name);
  } catch (error) {
    warn(`product request failed for SKUs ${skus.map((s) => `"${s}"`).join(', ')}: ${error.message}`);
  }

  const labels = await fetchPlaceholders();
  const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  let rendered = 0;
  entries.forEach((entry) => {
    const skeleton = skeletons.get(entry);
    const product = bySku.get(entry.sku.toLowerCase());
    if (!product) {
      warn(`SKU "${entry.sku}" was not found in the catalog; hiding its card`);
      skeleton.remove();
      return;
    }
    try {
      skeleton.replaceWith(renderCard(toCard(entry, product, labels, eager)));
      rendered += 1;
    } catch (error) {
      warn(`could not render SKU "${entry.sku}": ${error.message}`);
      skeleton.remove();
    }
  });

  const grid = block.querySelector('.cards-machine-grid');
  if (grid) grid.dataset.count = grid.children.length;
  if (!rendered) hideBlock();
}
