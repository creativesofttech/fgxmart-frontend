# FGXMART UI foundation

New UI uses daisyUI 5 with Tailwind CSS 4, Motion for Vue (`motion-v`), and Anime.js 4. All admin screens use the shared daisyUI foundation; legacy storefront product/account screens still use Vuetify during the staged redesign.

## Components and styling

Poppins is self-hosted through `@fontsource/poppins` (Latin normal and italic weights), loaded globally in Nuxt. All UI uses `--app-font-family` from `app/assets/css/theme.css`, including storefront/admin layouts, form controls, popovers and Vuetify typography. Avoid component-specific font families; use this variable or inherit. Chart.js defaults explicitly use Poppins because canvas text does not inherit CSS fonts. Icon fonts retain their own glyph family.

Storefront containers share `--storefront-container-width: 1920px` in `app/assets/css/theme.css`. Header, hero content, homepage sections, product listings, CTA, footer and legacy `.custom-container` pages use this maximum; responsive side padding is preserved.

- daisyUI and Tailwind both use the `tw:` namespace, for example `tw:btn tw:btn-primary` and `tw:flex tw:gap-4`. This avoids collisions with the existing admin and Vuetify classes.
- Use `data-theme="fgx"` on new UI containers. The storefront layout already provides it. The purple/green brand palette, semantic colors and radii live in `app/assets/css/ui.css`.
- Tailwind Preflight and daisyUI's page-level color/scroll overrides are disabled to preserve existing pages. Set sizing, spacing, borders and typography explicitly in new components.
- Main navigation uses an underline for the active route and keyboard focus; do not add a rectangular focus border around menu links or storefront logo links.
- Use Lucide Vue icons with accessible labels on icon-only controls.
- The shared storefront header belongs to `app/components/layout/StorefrontHeader.vue` and is mounted once by `app/layouts/default.vue`. Do not add a page-specific copy of it.
- Its primary menu contains Home, Hot Deals, New Arrivals and Best Sellers, plus configured header CMS links. Hot Deals opens `/products?deals=1` and requests `is_hot_deal=1` (active products explicitly marked Hot Deal). New Arrivals and Best Sellers open `/new-arrivals` and `/best-sellers`, including footer and homepage View all links. Categories remain available in the All Categories dropdown and their shared category page; the old category shortcuts and Browse catalogue link were removed with their unused styling.

## Dropdown controls

Product create/edit descriptions use `AdminUiRichTextEditor` (Tiptap 3), bound to HTML with `v-model`. The toolbar offers P/H2/H3 and 14px, 16px through 22px, plus bold, italic, lists and undo/redo. Block type and size update only the selection-start paragraph/heading, even with a selection spanning several tags; size is serialized on that tag, never as a global editor style. Other blocks keep their formatting. The toolbar reflects the cursor's current block. `ProductRichDescription` renders the supported formatting on product details through a strict HTML/style sanitizer shared by server and client.

Use the auto-imported `AppSelect` for every single-value select in admin and customer screens, including future forms. Native `select`, Vuetify selectors and the retired `CustomSelect` are prohibited by `tests/ui-select-standard.test.mjs`.

```vue
<AppSelect v-model="form.brand_id" :options="brands" label="Brand" placeholder="Select Brand" />
```

Options accept primitives or objects (`id` and `name` by default); use `value-key` and `label-key` for other shapes. Object options also support `group`, `description` and `disabled`. Selection emits the original value type. Lists longer than seven options include search; set `:searchable="false"` for compact fixed lists. Optional fields include Clear selection; use `:allow-empty="false"` for mandatory choices without a clear action.

Supply a visible `label`, or `aria-label` when the form already labels the control. Use `required` for native form validation and `error` for server errors. Legacy Vuetify forms must also call the exposed `validate()` method because their validation registry does not include custom controls.

The shared component owns keyboard navigation, focus restoration, search, empty results, grouping and disabled states. Its anchored Popover API menu uses the browser's top layer while remaining inside its parent dialog, keeping options visible above cards and scroll containers. Keep dropdown styling and behavior in this component instead of adding page-specific menus.

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
- Category artwork is stored as `cat-1.webp` through `cat-4.webp`. Product cards use uploaded cover/gallery images through `ProductImage`; `product-placeholder.webp` is only the final missing/broken-image fallback. Rebuild these optimized images with `npm run images:home -- "path/to/source-images"`; the converter preserves transparency, does not enlarge originals, and leaves source PNGs unchanged.
- `useStorefrontCategories()` loads the first four active main categories, sorted by admin sorting order and ID. The header and homepage cards use their actual names, slugs, short descriptions and uploaded images; there are no hardcoded category aliases or search destinations. Missing/broken card images use the generic placeholder. Fresh category seeds copy the supplied artwork into backend storage; rerunning the seeder preserves uploaded or removed images.
- `StorefrontCategories.vue` owns the narrower All Categories button and its vertical list. Hovering a main category opens its active children beside it on desktop. Arrow buttons provide click/touch access; mobile expands children inline. Escape/outside click closes the menu, and Right/Left arrow keys enter/leave a child list. Child image thumbnails are shown when uploaded.
- Featured products come from the API's `is_featured=1` filter, with recent active products as a fallback. If the catalog is empty, four clearly marked, non-purchasable "Coming soon" cards retain the intended layout. Product prices, discounts, wishlist state, and enquiry actions use real catalog data once products exist.

- `HomePromoCards.vue` follows Featured Products with two responsive promotional cards. Its transparent `card-1.webp` and `card-2.webp` artwork comes only from the supplied PNGs, converted at up to 1200px wide by the same image script. Both calls to action open the catalogue.

- `HomeProductCollection.vue` provides compact six-column Hot Deals, New Arrivals and Best Sellers rows, adapting to three and two columns on smaller screens. It requests `is_hot_deal=1`, `is_new_arrival=1` or `is_best_seller=1`; empty selections show an empty-state message rather than unrelated products or mock previews. View all links open dedicated collection pages. `ProductListing` shares the catalogue, category filters, sorting, pagination and quick view across those pages and `/products`; clearing filters on a dedicated page preserves its collection. Legacy `/products?collection=...` URLs remain supported. Product images prioritize the uploaded cover, then gallery images, then the generic fallback. Featured Products uses the same live image component.
- `HomeBrands.vue` displays uploaded brand logos from the public brands API without cards, borders or shadows. A subtle spinner appears while logos load, followed by a fade-in; reduced-motion preferences disable the animation.

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

- Product create/edit forms include `AdminProductsHomepageSettings` below Availability, with independent Hot Deal, New Arrival and Best Seller switches. The additive `2026_11_15_000005_add_product_homepage_flags` migration adds three boolean fields, defaulting to false for existing products. Admins choose each collection explicitly. Featured remains separate. Public collection filters always exclude inactive products. The older `on_sale` API discount filter remains available to existing clients, while storefront Hot Deals follows the new flag.

- Core Settings includes `/admin/zipcodes` immediately below Countries. Each country has at most one editable comma-separated zipcode list, stored in the `zipcodes` table with a cascading country foreign key. Codes remain strings (leading zeroes preserved), are trimmed, uppercased and deduplicated; letters, digits, spaces and hyphens are accepted, with up to 1,000 entries of 20 characters each. The additive `2026_11_15_000004_create_zipcodes_table` migration installs the table and `zipcodes.index/create/edit/destroy` permissions; the permission seeder includes these for fresh installs. Restricted roles must be granted the relevant permissions. Country dropdown choices come from the protected zipcode index response so postal managers do not need unrelated country-management permissions. This screen manages lists only; checkout delivery enforcement is not changed.

- Product create/edit forms display SKU beside optional HSN Code, Main Category beside dependent Sub Category, and Brand beside Weight / Volume. Changing the main category clears the child selection; the child control is disabled when no children exist. Edit forms reconstruct both selections from the saved category. API writes include `main_category_id` and `sub_category_id` and validate the parent/child relationship. The existing `products.category_id` continues to store the child when selected, otherwise the main category, preserving catalogue filters and legacy assignments. The additive `2026_11_15_000003_add_hsn_code_to_products` migration adds nullable `hsn_code` (string, up to 20 characters; leading zeroes preserved). Deploy the backend migration with this change.

- `/admin-access` uses the supplied transparent desk artwork at `public/assets/images/auth/admin-desk.webp` (1400 × 911, 139,272 bytes). It was converted directly from `FGX Dashboard Desk Setup.png` with Sharp at quality 83, alpha quality 100, effort 6 and smart subsampling; the Downloads original is preserved.
- Four informational feature cards float on staggered Anime.js loops, with separate Motion hover scaling. Their scoped animation is reverted on unmount and disabled when reduced motion is requested, including preference changes during a session. The login form retains the secure admin BFF and HttpOnly session. Remember email stores only the opted-in email, not credentials or a longer session. Password help directs the administrator to their account manager; it does not pretend to send password-reset emails.

- The admin layout and login use `data-theme="fgx"`, with responsive navigation and shared daisyUI tables, buttons, inputs, selects, badges, alerts and dialogs. Native dialogs trap focus, support Escape/backdrop dismissal and restore focus. Mutating category/order dialogs cannot dismiss while saving.
- Shared admin dialogs use padded header, scrolling body and fixed footer regions. Body padding sits inside the scroll viewport so field focus rings have room on all sides; keep this spacing in `Modal.vue` instead of adding per-form overflow workarounds.
- Sidebar parent groups start collapsed and expand only on user request. Nested links keep their indentation without the daisyUI vertical guide line.
- The sidebar displays the logo without an Admin badge and shares `--admin-header-height` with the main header (76px desktop, 68px mobile). The header profile dropdown shows the current account and offers Local Profile (read-only signed-in account details) and Logout. Main-category pills are purple; subcategory pills are teal with a branch icon and parent caption. Status pills use soft green for Active and muted rose for Inactive, with indicator dots.
- `admin.scss` supplies layout foundations and a small unlayered control bridge: Vuetify's global reset otherwise overrides daisyUI's layered native-control styles. Component colors and sizes still come from daisyUI variables. Do not reintroduce per-page button/input color systems.
- Category management supports main categories and one level of subcategories. Each has `short_description` (255 characters), sorting order, status, code and an independently uploaded image. Raster uploads are validated up to 5 MB; removal also deletes the old stored image and thumbnail.
- The server prevents self-parenting, grandchildren, turning a populated main category into a child, and deleting categories that own products or children. Selecting a main category includes its active children's products. Public category lists hide inactive categories and children of inactive parents.
- `CategorySeeder` creates the four new roots idempotently and reparents existing Spices, Dry Fruits, Pulses and Masalas under Packed Food without changing their product assignments. It preserves administrator edits on reruns.

Product listing sidebars use `ProductCategoryFilters` with main-category checkboxes and collapsed child groups. Only parents with active children have expansion carets. Selecting a parent includes its active children; deselecting a child narrows that family to its remaining children. Multiple families can be selected together. The product API accepts a validated `category_ids[]` array (up to 50 IDs), expands selected parents and combines categories with OR, while collection flags and other filters still apply with AND. Public filters exclude inactive categories and children of inactive parents; the legacy `category_id` parameter remains supported.

Quick view uses a responsive native dialog styled with the shared daisyUI foundation. It displays only the plain-text product `summary` (never the full description), an uploaded product image, genuine prices and SKU metadata, option selection, quantity and enquiry actions. Missing summaries point to View details. There are no fabricated ratings/review counts. Header and footer actions remain visible while the body scrolls; Escape/backdrop dismissal restores focus to the opening button. Product-card quick-view buttons are labelled and reachable by keyboard.

Header location selection and checkout share `fetchActiveCountries` from `app/utils/countries.js`. Both request `/countries?all=1` and exclude inactive entries, so checkout never uses just the first page. The location dialog is 600px wide on desktop, with a bounded two-column country grid and a single column on small screens; country names wrap without horizontal scrolling.

The storefront automatically opens the location dialog when no country is saved. Country selection checks the read-only public `/countries/{country}/zipcodes` endpoint. Configured zipcodes trigger a searchable second step; countries without zipcodes complete immediately. Completed `{id, name, zipcode}` choices persist in `fgx-country` and appear in the header. Saved country/zipcode choices are revalidated on layout mount, prompting again if removed or inactive. Failed zipcode lookups offer retry/change-country rather than treating a failure as an empty list. Request versions prevent stale responses from overwriting a newer selection. Admin routes and standalone auth screens do not prompt for location.

Guests and signed-in customers without a usable saved address retain their completed location in browser local storage. Signed-in customers with saved addresses use their default address country and zipcode (first usable address as fallback), without overwriting the browser preference or prompting for location. Address lookup runs after auth hydration and again on login/logout; stale responses cannot override a newer choice. Browser location selection never edits saved delivery addresses.

Homepage Featured and quick-view actions use Add to cart wording. Hot Deals, New Arrivals and Best Sellers show animated cart buttons on hover or keyboard focus, always visible on touch devices. They add through the shared cart store with loading/success/error feedback; products requiring options open quick view first, and out-of-stock products cannot be added. Reduced-motion preferences disable the reveal and hover animations.

ProductReviews replaces all sample reviews on product detail pages. Public GET /products/{id}/reviews returns approved reviews from existing customers, a genuine average, star distribution and six-item pagination; public records expose names only, without email or customer IDs. Authenticated customer GET /products/{id}/review retrieves their own review and POST /products/{id}/reviews creates or edits one review per product. Whole-star ratings 1�5 and comments of 10�2000 characters are validated; ownership, approval and purchase status cannot be supplied by clients. Existing hidden reviews remain hidden when edited. The existing product_reviews table is reused; no migration is needed. An empty state invites feedback without fabricated scores. Product listing stars use approved review aggregates instead of fixed ratings.

Write/Edit review opens a centered native dialog rather than an inline card. The dialog traps focus, restores focus to its trigger, supports Escape/backdrop dismissal, and prevents dismissal while saving. Validation errors remain inside the popup; successful saves close it and refresh the review section.

Product detail pages use a compact breadcrumb instead of a duplicate title banner: Home with a house icon, main category, optional child category, and the current product title. Category ancestors link to their catalogue pages; the title is marked as the current page and wraps on small screens. The public product detail response eagerly includes category.parent.

Product detail content uses the shared 1920px maximum with header-matching horizontal padding: 40px desktop, 24px at 1100px and below, and 16px at 760px and below. Direct Vuetify containers fill this wrapper without their own breakpoint width or horizontal gutters, keeping breadcrumb, gallery and reviews aligned with the header.

The FAQ help centre uses server-rendered backend answers with active-status filtering, sorting, keyword search across questions and answers, and quick-topic search chips. Native details/summary accordions support keyboard use. Empty, no-match and retry states are distinct. Support links use configured company phone/email only; missing contact details fall back to the catalogue. Its container matches storefront header spacing.

Core Settings contains dedicated Terms & Conditions and Privacy Policy editors, using AdminLegalPageEditor and the shared Tiptap component. Both map to legal-pages.index/edit permissions through page middleware, sidebar visibility, the HttpOnly admin proxy and backend authorization. Public static routes take precedence over generic CMS pages and use sanitized rich text. Footer policy links are always present and deduplicated against CMS entries. Bundled backend resources/content/legal JSON files supply starter content; admin saves create persistent storage/app/private/legal-pages overrides. See backend docs-legal-pages.md for format, backups and direct editing.

Shop By Brands reads active admin-managed brands from public /brands?all=1 and displays their uploaded logos with contained sizing and brand-name alt text. Missing or broken logos are omitted instead of rendering empty/title tiles. The loop waits for logo images, including cached SSR images, to be ready before starting. Desktop shows nine columns, medium screens five and small screens three. More than nine brands use two identical flex tracks, each including one trailing tile gap, and translate by exactly half the total track width for a continuous loop. Hover and the Pause/Resume control stop motion. Reduced-motion preferences render every brand in a static grid and hide the decorative clone. Lists of nine or fewer remain static; empty and failed loads have dedicated states.
