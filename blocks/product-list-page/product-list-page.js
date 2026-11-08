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
 * categoryPath filter needs. Accepts a full path ("frescopa/coffee-pods"), a
 * URL key ("coffee-pods") or a category name ("Coffee Pods"). Unknown values
 * are used as a path, which shows the empty state rather than the whole catalog.
 * @param {string} value The authored category
 * @returns {Promise<string>} The category path
 */
async function resolveCategoryPath(value) {
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
    if (match) return match.urlPath;
    console.warn(`product-list-page: category "${wanted}" was not found in the catalog`);
  } catch (error) {
    console.warn(`product-list-page: could not look up category "${wanted}"`, error);
  }
  return wanted;
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

  // "Category" wins over the boilerplate's "urlPath" row
  const categoryPath = config.category
    ? await resolveCategoryPath(config.category)
    : config.urlpath;

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

  /**
   * "Add to cart →" for simple products, "Choose options →" (a link to the
   * PDP) for products that need configuring first.
   */
  const getAddToCartAction = (product) => {
    const productName = product.name || product.sku;
    if (requiresPdpConfiguration(product)) {
      const link = document.createElement('a');
      link.className = 'plp-card-action';
      link.href = getProductLink(product.urlKey, product.sku);
      link.textContent = labels.Global?.SelectProductOptions || 'Choose options';
      link.setAttribute('aria-label', `${link.textContent}: ${productName}`);
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
            img.height = 300;
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
