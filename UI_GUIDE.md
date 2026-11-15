# FGXMART UI foundation

New UI uses daisyUI 5 with Tailwind CSS 4, Motion for Vue (`motion-v`), and Anime.js 4. All admin screens use the shared daisyUI foundation; legacy storefront product/account screens still use Vuetify during the staged redesign.

## Components and styling

- daisyUI and Tailwind both use the `tw:` namespace, for example `tw:btn tw:btn-primary` and `tw:flex tw:gap-4`. This avoids collisions with the existing admin and Vuetify classes.
- Use `data-theme="fgx"` on new UI containers. The storefront layout already provides it. The purple/green brand palette, semantic colors and radii live in `app/assets/css/ui.css`.
- Tailwind Preflight and daisyUI's page-level color/scroll overrides are disabled to preserve existing pages. Set sizing, spacing, borders and typography explicitly in new components.
- Use Lucide Vue icons with accessible labels on icon-only controls.
- The shared storefront header belongs to `app/components/layout/StorefrontHeader.vue` and is mounted once by `app/layouts/default.vue`. Do not add a page-specific copy of it.
- Its primary menu contains Home, Hot Deals, New Arrivals and Best Sellers, plus configured header CMS links. Hot Deals opens `/products?deals=1` and requests `on_sale=1` (active products priced below their base price). New Arrivals and Best Sellers link to the matching homepage sections. Categories remain available in the All Categories dropdown and their shared category page; the old category shortcuts and Browse catalogue link were removed with their unused styling.

## Animation

Use Motion for component interactions, transitions, and layout animations:

```vue
<script setup>
import { motion } from 'motion-v'
</script>

<template>
  <motion.div :while-hover="{ y: -3 }" :while-press="{ scale: 0.98 }">
    <NuxtLink class="tw:btn tw:btn-primary" to="/products">Explore products</NuxtLink>
  </motion.div>
</template>
```

The Nuxt module auto-imports Motion components and composables. Import the lowercase `motion` namespace explicitly. The storefront's `MotionConfig` respects the visitor's reduced-motion setting.

Use Anime.js for scoped entrance sequences or timelines. Create the scope inside `onMounted`, check `prefers-reduced-motion`, and call `scope.revert()` on unmount. `HomeHero.vue` implements this pattern. Keep content visible in SSR HTML and avoid having Motion and Anime.js animate the same CSS property on the same element.

## Assets and current homepage scope

- Home images: `public/assets/images/home/`, referenced as `/assets/images/home/...`.
- Logos: `public/images/logo/`, referenced as `/images/logo/...`.
- The supplied `hero-banner.webp` and `fgx-logo-dark.png` were copied into these directories; Downloads originals are preserved.
- The homepage contains the shared top bar/header, full-width `HomeHero.vue`, `HomeCategories.vue`, `HomeFeaturedProducts.vue`, promotional cards, compact collections, brand tiles, and the closing CTA. The original category/product components and old hero images were removed. The redesigned footer is shared by every storefront route.
- Category artwork is stored as `cat-1.webp` through `cat-4.webp`. Product cards use `product-placeholder.webp` during this design phase. Rebuild these optimized images with `npm run images:home -- "path/to/source-images"`; the converter preserves transparency, does not enlarge originals, and leaves source PNGs unchanged.
- `useStorefrontCategories()` loads the first four active main categories, sorted by admin sorting order and ID. The header and homepage cards use their actual names, slugs, short descriptions and uploaded images; there are no hardcoded category aliases or search destinations. Missing/broken card images use the generic placeholder. Fresh category seeds copy the supplied artwork into backend storage; rerunning the seeder preserves uploaded or removed images.
- `StorefrontCategories.vue` owns the narrower All Categories button and its vertical list. Hovering a main category opens its active children beside it on desktop. Arrow buttons provide click/touch access; mobile expands children inline. Escape/outside click closes the menu, and Right/Left arrow keys enter/leave a child list. Child image thumbnails are shown when uploaded.
- Featured products come from the API's `is_featured=1` filter, with recent active products as a fallback. If the catalog is empty, four clearly marked, non-purchasable "Coming soon" cards retain the intended layout. Product prices, discounts, wishlist state, and enquiry actions use real catalog data once products exist.

- `HomePromoCards.vue` follows Featured Products with two responsive promotional cards. Its transparent `card-1.webp` and `card-2.webp` artwork comes only from the supplied PNGs, converted at up to 1200px wide by the same image script. Both calls to action open the catalogue.

- `HomeProductCollection.vue` provides compact six-column New Arrivals and Best Sellers rows, adapting to three and two columns on smaller screens. All product artwork uses `product-placeholder.webp`. New Arrivals loads the newest active catalogue items; Best Sellers remains explicitly marked as a coming-soon design preview until a ranking is available. Empty New Arrivals also displays previews. Only real products link to product details.
- `HomeBrands.vue` shows the mockup's brand names as text-only design tiles. These previews do not apply catalogue filters yet.

- `HomeShoppingCta.vue` is the full-width final homepage CTA. `cta-shopping-cart.webp` is a generated transparent illustration; its prompt and conversion settings are recorded in `public/assets/images/home/cta-shopping-cart.source.md`.
- `Footer.vue` is shared across storefront routes, including the homepage, and uses the supplied `public/images/logo/fgx-logo-light.png`. It displays real categories, available footer CMS pages and configured company contacts. Policy pages appear when configured in the CMS; social links are omitted because no destinations are configured. Admin pages retain their separate layout.

The homepage hero uses the supplied local image. Hero Slider Management has been retired from the admin, API, permissions and database.

## Customer authentication

`app/pages/login.vue` is a standalone, responsive daisyUI/Motion screen using the existing logo and `public/assets/images/auth/login-cart.webp`. It provides email login and registration, password visibility, native validation, API errors, and guest enquiry/wishlist synchronization. Redirects accept only local storefront destinations and fall back to Home. The previous overlapping Vuetify forms and their CSS were removed.

Password help opens a dialog with configured company contact details and the help centre. There are no Google OAuth or password-email endpoints in the current backend, so the screen does not present these as functioning sign-in/reset flows. Artwork cleanup and the full built-in editing prompt are documented beside the asset in `login-cart.source.md`.

## Admin UI and categories

### Dashboard

`/admin/dashboard` follows the four-metric, sales/status charts and two-list layout. Its read-only `/api/admin/dashboard?days=7|30|90` BFF endpoint forwards to Laravel's protected dashboard aggregate endpoint. Aggregates are calculated in the database rather than from paginated product results or a full browser-side order download.

- Orders and revenue compare the selected creation-date period with the immediately preceding period. Revenue and paid AOV include only currently paid, non-cancelled orders. Revenue uses order totals; top-product revenue uses item subtotals. Refunded and unpaid orders do not contribute to either sales ranking or revenue. A missing previous baseline is labelled New instead of an invented percentage.
- Product and customer cards show total existing records through the current time, compared with the inventory/customer count at the start of the period. Customers means registered customer accounts, excluding admins.
- Daily points include zero-activity dates. Dates are grouped in the backend's configured timezone (currently UTC); the UI labels that timezone and uses the app's existing USD currency convention. The status chart uses the six supported order statuses. No returned status is fabricated.
- Each dataset is permission-filtered on the server: `orders.index` for order/revenue/chart/recent-order data, `products.index` for inventory and product details, and `users.index` for registered-customer totals. Top products require both order and product visibility. Dashboard access itself grants none of these permissions.
- Range changes, empty states and failed-request retries are supported. Charts have accessible descriptions and a daily data table for assistive technology. Empty periods display real zeroes and empty lists.

No schema migration is needed for this dashboard update; deploy both frontend and backend code together.

### Shared admin UI

- `/admin-access` uses the supplied transparent desk artwork at `public/assets/images/auth/admin-desk.webp` (1400 × 911, 139,272 bytes). It was converted directly from `FGX Dashboard Desk Setup.png` with Sharp at quality 83, alpha quality 100, effort 6 and smart subsampling; the Downloads original is preserved.
- Four informational feature cards float on staggered Anime.js loops, with separate Motion hover scaling. Their scoped animation is reverted on unmount and disabled when reduced motion is requested, including preference changes during a session. The login form retains the secure admin BFF and HttpOnly session. Remember email stores only the opted-in email, not credentials or a longer session. Password help directs the administrator to their account manager; it does not pretend to send password-reset emails.

- The admin layout and login use `data-theme="fgx"`, with responsive navigation and shared daisyUI tables, buttons, inputs, selects, badges, alerts and dialogs. Native dialogs trap focus, support Escape/backdrop dismissal and restore focus. Mutating category/order dialogs cannot dismiss while saving.
- The sidebar displays the logo without an Admin badge and shares `--admin-header-height` with the main header (76px desktop, 68px mobile). The header profile dropdown shows the current account and offers Local Profile (read-only signed-in account details) and Logout. Main-category pills are purple; subcategory pills are teal with a branch icon and parent caption. Status pills use soft green for Active and muted rose for Inactive, with indicator dots.
- `admin.scss` supplies layout foundations and a small unlayered control bridge: Vuetify's global reset otherwise overrides daisyUI's layered native-control styles. Component colors and sizes still come from daisyUI variables. Do not reintroduce per-page button/input color systems.
- Category management supports main categories and one level of subcategories. Each has `short_description` (255 characters), sorting order, status, code and an independently uploaded image. Raster uploads are validated up to 5 MB; removal also deletes the old stored image and thumbnail.
- The server prevents self-parenting, grandchildren, turning a populated main category into a child, and deleting categories that own products or children. Selecting a main category includes its active children's products. Public category lists hide inactive categories and children of inactive parents.
- `CategorySeeder` creates the four new roots idempotently and reparents existing Spices, Dry Fruits, Pulses and Masalas under Packed Food without changing their product assignments. It preserves administrator edits on reruns.
