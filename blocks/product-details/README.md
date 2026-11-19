# Product Details Block

## Overview

The Product Details block provides comprehensive product detail page functionality using multiple @dropins/storefront-pdp containers. It handles product display, configuration, cart operations, wishlist integration, and SEO optimization with dynamic mode switching between add and update operations.

## Integration

### Block Configuration

All settings are optional. Product pages share one block, so these apply to every product.

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `eyebrow-attribute` | string | `'product_type'` | Product attribute shown as the small uppercase eyebrow above the title. Hidden when the product has no value. |
| `rating-attribute` | string | `'rating'` | Product attribute holding the average rating (0–5). The star row is hidden when the product has no value. |
| `review-count-attribute` | string | `'review_count'` | Product attribute holding the number of reviews, shown after the rating ("4.8 · 214 reviews"). |
| `finance-min-price` | number | `500` | The "or $X/mo for N months" line only shows for products at or above this price. |
| `finance-months` | number | `12` | Number of months used for the finance line (price ÷ months, rounded up to whole currency units). |
| `trust` | list | none | Reassurance lines shown under Add to cart, one per list item or paragraph. The icon (delivery, returns or guarantee) is picked from the wording. Nothing is shown unless authored. |

The eyebrow, rating and review-count attributes are only included in product data when they are set as **visible on the product page** (`visible_in_pdp`) in Commerce, so they will also appear in the "Details" list.

### Layout

- **Desktop:** gallery on the left (rounded main image with up to four square thumbnails beneath; scroll arrows appear only when there are more), buy panel on the right.
- **Mobile:** a single column with the swipeable gallery under the title.
- **Variations:** colour swatches render as round chips, image swatches as rounded tiles, text swatches as pills and other options as a pill-shaped dropdown. Selected values get the terracotta ring (colour/image) or a burgundy fill (text). Out-of-stock values are dimmed.
- The SKU stays in the markup for assistive technology but is visually hidden.

### URL Parameters

- `itemUid` - Item UID for cart update mode (when present, enables update mode instead of add mode)
- `optionsUIDs` - Product option UIDs for wishlist context (empty string treated as base product with no options)

<!-- ### Local Storage

No localStorage keys are used by this block. -->

### Events

#### Event Listeners

- `events.on('pdp/data', callback)` - Listens for product/variant data changes to track stock status (`inStock`) and gate the add to cart button when out of stock
- `events.on('pdp/valid', callback)` - Listens for product configuration validity changes to enable/disable add to cart button
- `events.on('pdp/values', callback)` - Listens for product option value changes to update wishlist context
- `events.on('wishlist/alert', callback)` - Listens for wishlist action alerts to show notifications
- `events.on('cart/data', callback)` - Listens for cart data changes to determine update mode
- `events.on('aem/lcp', callback)` - Listens for AEM LCP event to set JSON-LD and meta tags

<!-- #### Event Emitters

No events are emitted by this block. -->

## Behavior Patterns

### Page Context Detection

- **Add Mode**: When no itemUid in URL, operates in add-to-cart mode
- **Update Mode**: When itemUid in URL, operates in update-cart mode with different button text and behavior
- **Product Configuration**: Validates product options and enables/disables add to cart button accordingly
- **Stock Status**: Disables the add to cart button when the current product or refined variant is out of stock. Stock gating is layered on top of configuration validity, so the button is disabled if either signal indicates the product cannot be added.
- **Wishlist Context**: Updates wishlist context based on current product configuration

### User Interaction Flows

1. **Initialization**: Block renders product gallery, header, price, options, quantity, and action buttons
2. **Product Configuration**: Users can select product options with real-time validation
3. **Add to Cart**: Users can add products to cart or update existing cart items
4. **Wishlist Management**: Users can add/remove products from wishlist
5. **Image Gallery**: Users can view product images in desktop thumbnail or mobile carousel format
6. **SEO Optimization**: Sets JSON-LD structured data and meta tags for search engines

### Error Handling

- **Configuration Errors**: If product configuration is invalid, disables add to cart button
- **API Errors**: If cart operations fail, shows error alerts with dismiss functionality
- **Image Rendering Errors**: If product images fail to load, the image slots handle fallback behavior
- **JSON-LD Errors**: If structured data generation fails, falls back to basic meta tags
- **Fallback Behavior**: Always falls back to appropriate mode based on URL parameters and cart state
