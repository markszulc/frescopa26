// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import {
  generateAemAssetsOptimizedUrl,
  isAemAssetsEnabled,
  isAemAssetsUrl,
  tryRenderAemAssetsImage,
} from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { CS_FETCH_GRAPHQL, fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';
import { getSearchStateFromUrl, applySearchStateToUrl } from './search-url.js';

// Initializers
import '../../scripts/initializers/search.js';

const isTrue = (value) => /^(true|yes|on|1)$/i.test(String(value ?? '').trim());

/**
 * Resolves an authored category to the full Catalog Service path the
 * categoryPath filter needs, plus its display name. Accepts a full path
 * ("frescopa/coffee-pods"), a URL key ("coffee-pods") or a category name
 * ("Coffee Pods"). Unknown values are used as a path, which shows the empty
 * state rather than the whole catalog.
 * @param {string} value The authored category
 * @param {boolean} [warnIfMissing] Log a console warning when not found
 * @returns {Promise<{path: string, name: string}>} The category
 */
async function resolveCategory(value, warnIfMissing = true) {
  const wanted = value.trim().replace(/^\/+|\/+$/g, '');
  try {
    const { data } = await CS_FETCH_GRAPHQL.fetchGraphQl(
      'query PLP_CATEGORIES { categories { name urlKey urlPath } }',
      { method: 'GET' },
    );
    const categories = (data?.categories || []).filter((c) => c?.urlPath);
    const lower = wanted.toLowerCase();
    const match = categories.find((c) => c.urlPath.toLowerCase() === lower)
      || categories.find((c) => c.urlKey?.toLowerCase() === lower)
      || categories.find((c) => c.name?.trim().toLowerCase() === lower);
    if (match) return { path: match.urlPath, name: match.name?.trim() || '' };
    if (warnIfMissing) console.warn(`product-list-page: category "${wanted}" was not found in the catalog`);
  } catch (error) {
    console.warn(`product-list-page: could not look up category "${wanted}"`, error);
  }
  return { path: wanted, name: '' };
}

/** Strips HTML from Commerce rich text without executing or rendering it. */
function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.body.querySelectorAll('script, style, template, noscript').forEach((el) => el.remove());
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/** "$10", "$2,199", "$3.99": whole amounts drop the cents, as on the coffee cards. */
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

/**
 * The drop-in's search query doesn't fetch short descriptions, and it drops
 * product options. Fetch both for the visible products in one batched
 * Catalog Service request: product slots render together, so requests made
 * in the same tick share one call.
 */
const DETAILS_QUERY = `query PLP_PRODUCT_DETAILS($skus: [String]) {
  products(skus: $skus) {
    sku
    shortDescription
    ... on ComplexProductView {
      options { title values { title } }
    }
  }
}`;
const detailsCache = new Map();
let detailsQueue = [];
function getProductDetails(sku) {
  if (!detailsCache.has(sku)) {
    detailsCache.set(sku, new Promise((resolve) => {
      detailsQueue.push({ sku, resolve });
      if (detailsQueue.length === 1) {
        setTimeout(async () => {
          const batch = detailsQueue;
          detailsQueue = [];
          const bySku = new Map();
          try {
            const { data } = await CS_FETCH_GRAPHQL.fetchGraphQl(DETAILS_QUERY, {
              method: 'GET',
              variables: { skus: batch.map((b) => b.sku) },
            });
            (data?.products || []).forEach((p) => p?.sku && bySku.set(p.sku.toLowerCase(), p));
          } catch (error) {
            console.warn('product-list-page: could not load product details', error);
          }
          batch.forEach((b) => b.resolve(bySku.get(b.sku.toLowerCase()) || null));
        }, 0);
      }
    }));
  }
  return detailsCache.get(sku);
}

/** Option values a shopper can choose between, e.g. ["Cream", "Charcoal"]. */
function optionValues(details) {
  return (details?.options || [])
    .flatMap((option) => (option?.values || []).map((v) => v?.title?.trim()))
    .filter(Boolean);
}

/**
 * Frescopa catalogue, based on the Commerce boilerplate's product-list-page.
 * Changes from the boilerplate: Frescopa card styling (see the CSS), a named
 * placeholder when a product has no image, a text "Add to cart" action with a
 * live status (no wishlist toggle), and the search phrase is set as text.
 *
 * Block rows (all optional):
 *   Category          | coffee-pods (URL key, name, or full path)
 *   urlPath           | frescopa/coffee-pods (boilerplate row, still supported)
 *   pageSize          | 9
 *   Hide Result Count | true
 *   Hide Sort         | true
 *   Hide Pagination   | true (shows the first pageSize products only)
 * With no category the block is a search page that reads ?q= from the URL.
 */
export default async function decorate(block) {
  const labels = await fetchPlaceholders();

  const config = readBlockConfig(block);
  const pageSize = parseInt(config.pagesize, 10) || 9;
  const hideResultCount = isTrue(config['hide-result-count']);
  const hideSort = isTrue(config['hide-sort']);
  const hidePagination = isTrue(config['hide-pagination']);
  block.classList.toggle('product-list-page--hide-count', hideResultCount);
  block.classList.toggle('product-list-page--hide-sort', hideSort);
  block.classList.toggle('product-list-page--hide-pagination', hidePagination);

  // "Category" wins over the boilerplate's "urlPath" row. Both are looked up
  // so the cards can show the category name (products don't carry one).
  let categoryPath = '';
  let categoryName = '';
  if (config.category || config.urlpath) {
    const category = await resolveCategory(config.category || config.urlpath, !!config.category);
    categoryPath = category.path;
    categoryName = category.name;
  }

  // Card titles sit one level below the nearest heading above the block.
  // querySelectorAll returns document order, so stop at the block itself
  const headingsAbove = [];
  [...document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main .product-list-page')]
    .some((el) => {
      if (el === block) return true;
      if (/^H[1-5]$/.test(el.tagName)) headingsAbove.push(el);
      return false;
    });
  const parentLevel = Number(headingsAbove.at(-1)?.tagName.slice(1)) || 1;
  const cardHeading = `h${Math.min(parentLevel + 1, 6)}`;

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__result-info" role="status" aria-live="polite"></div>
      <div class="search__view-facets"></div>
      <div class="search__facets"></div>
      <div class="search__product-sort"></div>
      <div class="search__product-list"></div>
      <div class="search__pagination"></div>
    </div>
  `);

  const $resultInfo = fragment.querySelector('.search__result-info');
  const $viewFacets = fragment.querySelector('.search__view-facets');
  const $facets = fragment.querySelector('.search__facets');
  const $productSort = fragment.querySelector('.search__product-sort');
  const $productList = fragment.querySelector('.search__product-list');
  const $pagination = fragment.querySelector('.search__pagination');

  block.innerHTML = '';
  block.appendChild(fragment);

  // Add url path back to the block for enrichment, incase enrichment block is
  // executed after the plp block and block config is not available
  if (categoryPath) {
    block.dataset.urlpath = categoryPath;
  }

  const searchState = getSearchStateFromUrl(new URL(window.location.href));
  // Without pagination there is no way to move between pages, so always show
  // the first one (ignores a ?page= left in the URL).
  if (hidePagination) searchState.currentPage = 1;

  // Default visibility filter for all of our requests
  const visibilityFilter = { attribute: 'visibility', in: ['Search', 'Catalog, Search'] };
  const userFilters = searchState.filter.filter((f) => f.attribute !== 'visibility');

  // Normalize URL (e.g. pipe-separated filter values)
  const normalizedUrl = new URL(window.location.href);
  applySearchStateToUrl(normalizedUrl, searchState);
  window.history.replaceState({}, '', normalizedUrl.toString());

  // Request search based on the page type on block load
  if (categoryPath) {
    // If it's a category page...
    await search({
      phrase: '', // search all products in the category
      currentPage: searchState.currentPage,
      pageSize,
      sort: searchState?.sort?.length ? searchState.sort : [{ attribute: 'position', direction: 'DESC' }],
      filter: [
        { attribute: 'categoryPath', eq: categoryPath }, // Add category filter
        // Always add visibility filter to the request
        visibilityFilter,
        ...userFilters,
      ],
    }).catch(() => {
      console.error('Error searching for products');
    });
  } else {
    // Search page: dropin uses only the request (no URL parsing).
    await search({
      phrase: searchState.phrase,
      currentPage: searchState.currentPage,
      pageSize,
      sort: searchState.sort,
      // Always add visibility filter to the request
      filter: [visibilityFilter, ...userFilters],
    }).catch((e) => {
      console.error('Error searching for products', e);
    });
  }

  const requiresPdpConfiguration = (product) => product.typename === 'ComplexProductView'
    || product.attributes?.some((attr) => attr.name === 'ac_giftcard');

  const addToCartText = labels.Global?.AddProductToCart || 'Add to cart';
  const addingText = labels.Global?.AddingToCart || 'Adding…';
  const chooseOptionsText = labels.Global?.SelectProductOptions || 'Choose options';
  const viewProductText = labels.Global?.ViewProduct || 'View product';

  /**
   * "Add to cart" for simple products. Products that can't be added from the
   * card link to the PDP: "Choose options" when there is more than one option
   * value to choose from, otherwise "View product".
   */
  const getAddToCartAction = (product) => {
    const productName = product.name || product.sku;
    if (requiresPdpConfiguration(product)) {
      const link = document.createElement('a');
      link.className = 'plp-card-action';
      link.href = getProductLink(product.urlKey, product.sku);
      const setLabel = (text) => {
        link.textContent = text;
        link.setAttribute('aria-label', `${text}: ${productName}`);
      };
      setLabel(chooseOptionsText);
      getProductDetails(product.sku).then((details) => {
        if (optionValues(details).length <= 1) setLabel(viewProductText);
      });
      return link;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'plp-card-action';
    button.textContent = addToCartText;
    button.setAttribute('aria-label', `${addToCartText}: ${productName}`);
    button.disabled = !product.inStock;
    const status = document.createElement('span');
    status.className = 'plp-card-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = addingText;
      status.textContent = '';
      try {
        await cartApi.addProductsToCart([{ sku: product.sku, quantity: 1 }]);
        status.textContent = labels.Global?.AddedToCart || `Added ${productName} to your cart`;
      } catch (error) {
        console.error('Add to cart failed', error);
        status.textContent = labels.Global?.AddToCartError || 'Sorry, that didn\u2019t work. Please try again.';
      } finally {
        button.textContent = addToCartText;
        button.disabled = !product.inStock;
      }
    });
    const wrap = document.createElement('div');
    wrap.className = 'plp-card-action-wrap';
    wrap.append(button, status);
    return wrap;
  };

  await Promise.all([
    // Sort By (not rendered at all when hidden)
    hideSort ? null : provider.render(SortBy, {})($productSort),

    // Pagination (not rendered at all when hidden)
    hidePagination ? null : provider.render(Pagination, {
      onPageChange: () => {
        // scroll to the top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    })($pagination),

    // Facets
    provider.render(Facets, {})($facets),
    // Product List
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const { product, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.className = 'plp-card-media';
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);
          anchorWrapper.setAttribute('aria-label', product.name || product.sku);
          // the title link already leads here; skip this duplicate when tabbing
          anchorWrapper.tabIndex = -1;
          anchorWrapper.setAttribute('aria-hidden', 'true');

          if (!product.images?.some((image) => image?.url)) {
            // No image in Commerce: a named placeholder, as on the coffee page.
            anchorWrapper.classList.add('plp-card-media--placeholder');
            const label = document.createElement('span');
            label.className = 'plp-card-placeholder-label';
            label.textContent = product.name || product.sku;
            anchorWrapper.append(label);
            ctx.replaceWith(anchorWrapper);
            return;
          }

          const image = product.images.find((i) => i?.roles?.includes('image'))
            || product.images.find((i) => i?.url);
          const assetUrl = (() => {
            try {
              // Commerce returns protocol-relative URLs (//host/...); use https.
              const raw = image.url.startsWith('//') ? `https:${image.url}` : image.url;
              const url = new URL(raw, window.location.href);
              return url.protocol === 'https:' && isAemAssetsUrl(url.href) ? url.href : null;
            } catch {
              return null;
            }
          })();
          // AEM Assets delivery URLs only accept resize parameters in the
          // /as/<name>.<ext> form. The drop-in builds that only when
          // commerce-assets-enabled is set, so build it here otherwise.
          if (assetUrl && !isAemAssetsEnabled()) {
            const sized = (width) => generateAemAssetsOptimizedUrl(
              assetUrl,
              product.sku,
              { width },
            );
            const img = document.createElement('img');
            img.src = sized(400);
            img.srcset = `${sized(400)} 400w, ${sized(800)} 800w`;
            img.sizes = '(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw';
            img.alt = image.label?.trim() || product.name || '';
            img.width = 400;
            img.height = 400;
            img.loading = 'lazy';
            anchorWrapper.append(img);
            ctx.replaceWith(anchorWrapper);
            return;
          }

          tryRenderAemAssetsImage(ctx, {
            alias: product.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },
        ProductName: (ctx) => {
          const { product } = ctx;
          const info = document.createElement('div');
          info.className = 'plp-card-info';

          if (categoryName) {
            const category = document.createElement('span');
            category.className = 'plp-card-category';
            category.textContent = categoryName;
            info.append(category);
          }

          const title = document.createElement(cardHeading);
          title.className = 'plp-card-title';
          const link = document.createElement('a');
          link.href = getProductLink(product.urlKey, product.sku);
          link.textContent = product.name || product.sku;
          title.append(link);
          info.append(title);

          const desc = document.createElement('p');
          desc.className = 'plp-card-desc';
          desc.hidden = true;
          const formats = document.createElement('ul');
          formats.className = 'plp-card-formats';
          formats.hidden = true;
          info.append(desc, formats);

          getProductDetails(product.sku).then((details) => {
            const text = stripHtml(details?.shortDescription || product.shortDescription);
            if (text) {
              desc.textContent = text;
              desc.hidden = false;
            }
            const values = optionValues(details);
            if (values.length > 1) {
              values.forEach((value) => {
                const li = document.createElement('li');
                li.textContent = value;
                formats.append(li);
              });
              formats.hidden = false;
            }
          });
          ctx.replaceWith(info);
        },
        ProductPrice: (ctx) => {
          const { product } = ctx;
          const price = document.createElement('span');
          price.className = 'plp-card-price';
          const complex = product.typename === 'ComplexProductView';
          const amount = complex
            ? product.priceRange?.minimum?.final?.amount
            : product.price?.final?.amount;
          price.textContent = formatPrice(amount);
          if (complex && price.textContent) {
            const max = product.priceRange?.maximum?.final?.amount?.value;
            const fromText = labels.Dropin?.PriceRange?.from?.label || 'from';
            // "from" when the price can change with the shopper's choices
            const addFrom = () => { price.textContent = `${fromText} ${formatPrice(amount)}`; };
            if (typeof max === 'number' && max > amount.value) addFrom();
            else {
              getProductDetails(product.sku).then((details) => {
                if (optionValues(details).length > 1) addFrom();
              });
            }
          }
          ctx.replaceWith(price);
        },
        ProductActions: (ctx) => {
          const actionsWrapper = document.createElement('div');
          actionsWrapper.className = 'product-discovery-product-actions';
          actionsWrapper.append(getAddToCartAction(ctx.product));
          ctx.replaceWith(actionsWrapper);
        },
      },
    })($productList),
  ]);

  // "Filters" toggle for small screens, styled as a Frescopa pill.
  const filtersButton = document.createElement('button');
  filtersButton.type = 'button';
  filtersButton.className = 'plp-filters-button';
  filtersButton.textContent = labels.Global?.Filters || 'Filters';
  filtersButton.setAttribute('aria-expanded', 'false');
  filtersButton.setAttribute('aria-controls', 'plp-facets');
  $facets.id = 'plp-facets';
  filtersButton.addEventListener('click', () => {
    const open = $facets.classList.toggle('search__facets--visible');
    filtersButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $viewFacets.append(filtersButton);

  // Listen for search results (event is fired before the block is rendered; eager: true)
  events.on('search/result', (payload) => {
    const totalCount = payload.result?.totalCount || 0;

    block.classList.toggle('product-list-page--empty', totalCount === 0);
    // one page of results: no pagination to show
    const perPage = payload.request?.pageSize || pageSize;
    block.classList.toggle('product-list-page--single-page', totalCount <= perPage);

    // Results Info. The phrase comes from the URL, so it is set as text.
    $resultInfo.textContent = '';
    const count = document.createElement('span');
    count.className = 'plp-result-count';
    count.textContent = `${totalCount} ${totalCount === 1 ? 'product' : 'products'}`;
    $resultInfo.append(count);
    if (payload.request?.phrase) {
      const phrase = document.createElement('strong');
      phrase.textContent = `\u201c${payload.request.phrase}\u201d`;
      $resultInfo.append(' for ', phrase);
    }

    // Update the filters button with the number of filters the shopper chose
    const chosen = (payload.request?.filter || [])
      .filter((f) => !['visibility', 'categoryPath'].includes(f.attribute)).length;
    if (chosen > 0) {
      filtersButton.dataset.count = chosen;
    } else {
      delete filtersButton.dataset.count;
    }
    // Hide the filters UI when the catalog returns no facets
    block.classList.toggle('product-list-page--no-facets', !payload.result?.facets?.length);
  }, { eager: true });

  // Listen for search results (event is fired after the block is rendered; eager: false)
  // URL is owned by this project; update it when search state changes.
  events.on('search/result', (payload) => {
    const url = new URL(window.location.href);
    applySearchStateToUrl(url, payload.request);
    window.history.pushState({}, '', url.toString());
  }, { eager: false });
}
