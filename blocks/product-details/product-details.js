import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';

import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Libs
import { readBlockConfig, toClassName } from '../../scripts/aem.js';
import {
  rootLink,
  setJsonLd,
  fetchPlaceholders,
  getProductLink,
} from '../../scripts/commerce.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';

/**
 * Checks if the page has prerendered product JSON-LD data
 * @returns {boolean} True if product JSON-LD exists and contains @type=Product
 */
function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

// Function to update the Add to Cart button text
function updateAddToCartButtonText(addToCartInstance, inCart, labels) {
  const buttonText = inCart
    ? labels.Global?.UpdateProductInCart
    : labels.Global?.AddProductToCart;
  if (addToCartInstance) {
    addToCartInstance.setProps((prev) => ({
      ...prev,
      children: buttonText,
    }));
  }
}

/**
 * Formats numeric attribute values for display (e.g., "10.000000" → "10").
 * Non-numeric values are returned as-is.
 */
function formatNumericAttributeValue(value) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return value;
  return new Intl.NumberFormat(document.documentElement.lang).format(Number(trimmed));
}

const TRUST_ICONS = {
  delivery: '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke-linejoin="round"></path><circle cx="7" cy="18" r="1.6"></circle><circle cx="17.5" cy="18" r="1.6"></circle>',
  guarantee: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" stroke-linejoin="round"></path><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>',
  returns: '<path d="M4 12a8 8 0 1 1 2.3 5.6" stroke-linecap="round"></path><path d="M4 6v5h5" stroke-linecap="round" stroke-linejoin="round"></path>',
};

const STAR_PATH = 'M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z';

/**
 * Picks a trust-badge icon from the badge text (delivery, returns or guarantee).
 */
function trustIcon(text) {
  const l = text.toLowerCase();
  let key = 'guarantee';
  if (/deliver|set it up|ship/.test(l)) key = 'delivery';
  else if (/return|send it back|trial|refund/.test(l)) key = 'returns';
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${TRUST_ICONS[key]}</svg>`;
}

/**
 * Reads the authored trust badges: the second cell of the "Trust" row, one badge
 * per list item or paragraph.
 */
function readTrustBadges(block) {
  const row = [...block.querySelectorAll(':scope > div')]
    .find((r) => toClassName(r.children[0]?.textContent) === 'trust');
  const cell = row?.children[1];
  if (!cell) return [];
  const items = cell.querySelectorAll('li, p');
  const texts = items.length ? [...items].map((el) => el.textContent) : [cell.textContent];
  return texts.map((t) => t.trim()).filter(Boolean);
}

function getAttributeValue(product, id) {
  if (!id) return '';
  const attr = product?.attributes?.find((a) => a.id === id || a.name === id);
  return attr?.value != null ? String(attr.value).trim() : '';
}

function formatMoney(amount, currency, fractionDigits = 2) {
  return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export default async function decorate(block) {
  const {
    'eyebrow-attribute': eyebrowAttribute = 'product_type',
    'rating-attribute': ratingAttribute = 'rating',
    'review-count-attribute': reviewCountAttribute = 'review_count',
    'finance-min-price': financeMinPrice = '500',
    'finance-months': financeMonths = '12',
  } = readBlockConfig(block);
  const trustBadges = readTrustBadges(block);

  const eventProduct = events.lastPayload('pdp/data') ?? null;
  // bug: the pdp sends an object with event data even if product is not found.
  const product = eventProduct?.sku ? eventProduct : null;

  const labels = await fetchPlaceholders();

  // Read itemUid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');

  // State to track if we are in update mode
  let isUpdateMode = false;

  // State to track if the current product/variant is out of stock
  let isOutOfStock = false;

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__alert"></div>
    <div class="product-details__wrapper">
      <div class="product-details__left-column">
        <div class="product-details__gallery"></div>
      </div>
      <div class="product-details__right-column">
        <p class="product-details__eyebrow" hidden></p>
        <div class="product-details__header"></div>
        <p class="product-details__rating" hidden></p>
        <div class="product-details__gallery"></div>
        <div class="product-details__short-description"></div>
        <div class="product-details__pricing">
          <div class="product-details__price"></div>
          <span class="product-details__finance" hidden></span>
        </div>
        <div class="product-details__gift-card-options"></div>
        <div class="product-details__configuration">
          <div class="product-details__options"></div>
          <div class="product-details__actions">
            <div class="product-details__quantity"></div>
            <div class="product-details__buttons">
              <div class="product-details__buttons__add-to-cart"></div>
              <div class="product-details__buttons__add-to-wishlist"></div>
            </div>
          </div>
          <div class="product-details__add-to-cart-status" role="status" aria-live="polite"></div>
        </div>
        <ul class="product-details__trust" hidden></ul>
        <div class="product-details__description"></div>
        <div class="product-details__attributes"></div>
      </div>
    </div>
  `);

  const $alert = fragment.querySelector('.product-details__alert');
  const $gallery = fragment.querySelector('.product-details__gallery');
  const $header = fragment.querySelector('.product-details__header');
  const $price = fragment.querySelector('.product-details__price');
  const $galleryMobile = fragment.querySelector('.product-details__right-column .product-details__gallery');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $options = fragment.querySelector('.product-details__options');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $giftCardOptions = fragment.querySelector('.product-details__gift-card-options');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $wishlistToggleBtn = fragment.querySelector('.product-details__buttons__add-to-wishlist');
  // Kept mounted at all times so the "Adding to Cart" status is reliably
  // announced instead of relying on the button's text/disabled state
  // changing, which isn't announced by screen readers on its own.
  const $addToCartStatus = fragment.querySelector('.product-details__add-to-cart-status');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');
  const $eyebrow = fragment.querySelector('.product-details__eyebrow');
  const $rating = fragment.querySelector('.product-details__rating');
  const $finance = fragment.querySelector('.product-details__finance');
  const $trust = fragment.querySelector('.product-details__trust');

  trustBadges.forEach((text) => {
    const li = document.createElement('li');
    li.innerHTML = trustIcon(text);
    li.append(document.createTextNode(text));
    $trust.append(li);
  });
  $trust.hidden = !trustBadges.length;

  // Eyebrow, rating and finance line follow the current product/variant data
  const renderMerchandising = (data) => {
    const eyebrow = getAttributeValue(data, eyebrowAttribute);
    $eyebrow.textContent = eyebrow;
    $eyebrow.hidden = !eyebrow;

    const rating = parseFloat(getAttributeValue(data, ratingAttribute));
    const reviews = parseInt(getAttributeValue(data, reviewCountAttribute), 10);
    $rating.replaceChildren();
    $rating.hidden = !(rating > 0);
    if (rating > 0) {
      const value = Math.min(rating, 5);
      const filled = Math.round(value);
      const stars = document.createElement('span');
      stars.className = 'product-details__stars';
      stars.setAttribute('aria-hidden', 'true');
      stars.innerHTML = Array.from({ length: 5 }, (_, i) => `<svg class="${i < filled ? 'is-filled' : ''}" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="${STAR_PATH}"/></svg>`).join('');
      const reviewsLabel = reviews > 0 ? ` · ${reviews} ${reviews === 1 ? 'review' : 'reviews'}` : '';
      const text = document.createElement('span');
      text.textContent = `${value.toFixed(1)}${reviewsLabel}`;
      $rating.setAttribute('aria-label', `Rated ${value.toFixed(1)} out of 5${reviews > 0 ? `, ${reviews} reviews` : ''}`);
      $rating.append(stars, text);
    }

    const final = data?.prices?.final;
    const amount = final?.amount ?? final?.minimumAmount;
    const months = parseInt(financeMonths, 10);
    const showFinance = amount >= parseFloat(financeMinPrice) && months > 0;
    $finance.hidden = !showFinance;
    $finance.textContent = showFinance
      ? `or ${formatMoney(Math.ceil(amount / months), final.currency, 0)}/mo for ${months} months`
      : '';
  };

  block.replaceChildren(fragment);

  const gallerySlots = {
    CarouselThumbnail: (ctx) => {
      if (ctx.mediaType === 'image') {
        tryRenderAemAssetsImage(ctx, {
          ...imageSlotConfig(ctx),
          wrapper: document.createElement('span'),
        });
      }
    },

    CarouselMainImage: (ctx) => {
      if (ctx.mediaType === 'image') {
        tryRenderAemAssetsImage(ctx, {
          ...imageSlotConfig(ctx),
        });
      }
    },
  };

  // Alert
  let inlineAlert = null;
  const routeToWishlist = rootLink('/wishlist');

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    wishlistToggleBtn,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      videos: true, // Display videos if available
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($galleryMobile),

    // Gallery (Desktop): main image with a row of thumbnails beneath
    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsRow',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      videos: true, // Display videos if available
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($gallery),

    // Header
    pdpRendered.render(ProductHeader, {})($header),

    // Price
    pdpRendered.render(ProductPrice, {})($price),

    // Short Description
    pdpRendered.render(ProductShortDescription, {})($shortDescription),

    // Configuration - Swatches
    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: (ctx) => {
          tryRenderAemAssetsImage(ctx, {
            ...imageSlotConfig(ctx),
            wrapper: document.createElement('span'),
          });
        },
      },
    })($options),

    // Configuration  Quantity
    pdpRendered.render(ProductQuantity, {})($quantity),

    // Configuration  Gift Card Options
    pdpRendered.render(ProductGiftCardOptions, {})($giftCardOptions),

    // Description
    pdpRendered.render(ProductDescription, {})($description),

    // Attributes
    pdpRendered.render(ProductAttributes, {
      formatValue: formatNumericAttributeValue,
    })($attributes),

    // Wishlist button - WishlistToggle Container
    wishlistRender.render(WishlistToggle, {
      product,
    })($wishlistToggleBtn),
  ]);

  // Configuration – Button - Add to Cart
  const addToCart = await UI.render(Button, {
    children: labels.Global?.AddProductToCart,
    onClick: async () => {
      const buttonActionText = isUpdateMode
        ? labels.Global?.UpdatingInCart
        : labels.Global?.AddingToCart;
      try {
        addToCart.setProps((prev) => ({
          ...prev,
          children: buttonActionText,
          disabled: true,
        }));
        $addToCartStatus.textContent = buttonActionText ?? 'Adding to Cart';

        // get the current selection values
        const values = pdpApi.getProductConfigurationValues();
        const valid = pdpApi.isProductConfigurationValid();

        // add or update the product in the cart
        if (valid) {
          if (isUpdateMode) {
            // --- Update existing item ---
            const { updateProductsFromCart } = await import(
              '@dropins/storefront-cart/api.js'
            );

            await updateProductsFromCart([{ ...values, uid: itemUidFromUrl }]);

            // --- START REDIRECT ON UPDATE ---
            const updatedSku = values?.sku;
            if (updatedSku) {
              const cartRedirectUrl = new URL(
                rootLink('/cart'),
                window.location.origin,
              );
              cartRedirectUrl.searchParams.set('itemUid', itemUidFromUrl);
              window.location.href = cartRedirectUrl.toString();
            } else {
              // Fallback if SKU is somehow missing (shouldn't happen in normal flow)
              console.warn(
                'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
              );
              window.location.href = rootLink('/cart');
            }
            return;
          }
          // --- Add new item ---
          const { addProductsToCart } = await import(
            '@dropins/storefront-cart/api.js'
          );
          await addProductsToCart([{ ...values }]);
        }

        // reset any previous alerts if successful
        inlineAlert?.remove();
      } catch (error) {
        // add alert message
        inlineAlert = await UI.render(InLineAlert, {
          heading: 'Error',
          description: error.message,
          icon: h(Icon, { source: 'Warning' }),
          'aria-live': 'assertive',
          role: 'alert',
          onDismiss: () => {
            inlineAlert.remove();
          },
        })($alert);

        // Scroll the alertWrapper into view
        $alert.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        // Reset button text using the helper function which respects the current mode
        updateAddToCartButtonText(addToCart, isUpdateMode, labels);
        // Re-enable button, unless the current variant is out of stock
        addToCart.setProps((prev) => ({
          ...prev,
          disabled: isOutOfStock,
        }));
        $addToCartStatus.textContent = '';
      }
    },
  })($addToCart);

  // Lifecycle Events
  events.on('pdp/data', (data) => {
    isOutOfStock = data?.inStock === false;
    addToCart.setProps((prev) => ({ ...prev, disabled: isOutOfStock }));
    renderMerchandising(data);
  }, { eager: true });

  events.on('pdp/valid', (valid) => {
    // update add to cart button disabled state based on product selection validity and stock status
    addToCart.setProps((prev) => ({ ...prev, disabled: isOutOfStock || !valid }));
  }, { eager: true });

  // Handle option changes
  events.on('pdp/values', () => {
    if (wishlistToggleBtn) {
      const configValues = pdpApi.getProductConfigurationValues();

      // Check URL parameter for empty optionsUIDs
      const urlOptionsUIDs = urlParams.get('optionsUIDs');

      // If URL has empty optionsUIDs parameter, treat as base product (no options)
      const optionUIDs = urlOptionsUIDs === '' ? undefined : (configValues?.optionsUIDs || undefined);

      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
        },
      }));
    }
  }, { eager: true });

  events.on('wishlist/alert', ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($alert);

    setTimeout(() => {
      $alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      $alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  });

  // --- Add new event listener for cart/data ---
  events.on(
    'cart/data',
    (cartData) => {
      let itemIsInCart = false;
      if (itemUidFromUrl && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUidFromUrl,
        );
      }
      // Set the update mode state
      isUpdateMode = itemIsInCart;

      // Update button text based on whether the item is in the cart
      updateAddToCartButtonText(addToCart, itemIsInCart, labels);
    },
    { eager: true },
  );

  // Set JSON-LD and Meta Tags
  events.on('aem/lcp', () => {
    const isPrerendered = isProductPrerendered();
    if (product && !isPrerendered) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  return Promise.resolve();
}

async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  // get variants
  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            inStock
            images(roles: ["image"]) {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants
      // A variant can come back without a resolved product (e.g. an
      // unavailable option combination); skip those so JSON-LD generation
      // doesn't throw on null property access.
      .filter((variant) => variant.product)
      .map((variant) => ({
        '@type': 'Offer',
        name: variant.product.name,
        image: variant.product.images?.[0]?.url,
        price: variant.product.price?.final?.amount?.value,
        priceCurrency: variant.product.price?.final?.amount?.currency,
        availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
        sku: variant.product.sku,
      })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product?.sku) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}

/**
 * Returns the configuration for an image slot.
 * @param ctx - The context of the slot.
 * @returns The configuration for the image slot.
 */
function imageSlotConfig(ctx) {
  const { data, defaultImageProps } = ctx;
  return {
    alias: data.sku,
    imageProps: defaultImageProps,

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  };
}
