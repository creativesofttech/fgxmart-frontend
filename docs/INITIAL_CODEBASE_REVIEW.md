> Historical snapshot from the initial review on 14 November 2026, before the admin migration, framework upgrades, security fixes and UI redesign. Findings below describe that baseline and may already be resolved. See README.md, DEPLOYMENT.md and UI_GUIDE.md for the current implementation.

# FGXMART codebase review

Reviewed: 14 November 2026. This is a source review and build verification, not a live production audit. No application source was changed.

## Architecture and current behavior

The workspace contains three independent Git repositories:

| Application | Stack | Responsibility |
| --- | --- | --- |
| `fgxmart-frontend` | Nuxt 4, Vue 3, Pinia, Vuetify | Public catalog, search, product detail, guest cart/wishlist, login, addresses, checkout, account, PDF download |
| `fgxmart-admin` | Nuxt 4, Vue 3, Sass, Chart.js | Products, categories, brands, attributes, countries, orders, roles/permissions, company/bank settings, hero slides, FAQs, content pages |
| `fgxmart-backend` | Laravel 12, Sanctum, Intervention Image | JSON API, persistence, authentication, media conversion, order creation, email |

### Customer journey

1. Homepage loads categories, hero slides, and products from the API. Catalog and product pages expose prices, stock, images, and attribute values.
2. Guests select products into a Pinia cart persisted in `guest_cart` in localStorage. Logged-in customers use the API cart. Login merges guest selections into the server cart.
3. Checkout requires authentication and a saved delivery address. It displays bank transfer instructions and allows a pre-order proforma PDF download.
4. `POST /api/v1/orders` reads the customer's server cart, snapshots address and bank information, creates order/items inside a database transaction, clears the cart, and attempts an email.
5. The success page retrieves the saved order and generates a PDF with jsPDF and AutoTable. Email links can open this page using an order number and secret hash without login.
6. The checkout WhatsApp button opens `wa.me` using the company phone number. It supplies no product message, order reference, or attachment. Customers must manually attach a downloaded PDF.

This implements an order and wire-transfer workflow around a catalog. A lightweight select-products → download-selection → send-to-company flow is only partially represented. Currency is hardcoded as USD; tax and shipping are currently zero.

### Data model

- Catalog: products belong to categories and brands; product media, country assignments, and attribute-value pivots provide images, availability metadata, variation price adjustments, stock, and SKU fields.
- Customer: users have addresses, cart items, wishlist items, and orders. Cart options are JSON.
- Orders: order totals, shipping address and bank details are snapshots; order items snapshot name, price, quantity, and subtotal. Selected options and SKU are absent from order-item storage.
- Administration: admins and customers are separate models; roles use a polymorphic association. Order status logs, however, point to the customer `users` table.
- Content: company settings, bank accounts, pages with rich-text blocks, FAQs, and hero slides.

## Findings, in priority order

### Critical: customer tokens can access admin API operations

`fgxmart-backend/routes/api.php:32` protects all admin resource routes with only `auth:sanctum`. Customer and admin logins both create Sanctum tokens, with no admin-model check, ability restriction, policy, or permission check on those routes. An authenticated customer can therefore reach operations for products, all orders, bank details, company settings, roles, and content. `CheckRole` exists but is neither registered nor applied.

Fix first: enforce the authenticated principal type and then permissions on every admin operation. Add regression tests using a real customer bearer token against admin read and mutation endpoints.

### High: order prices use a nonexistent product field

`fgxmart-backend/app/Http/Controllers/Api/V1/OrderController.php:40` and `:65` use `discount_price ?? price`. The product model and migration define `base_price`, not `price`. Products without a discount can yield zero calculations and a null item price that violates the non-null order-item schema. The checkout PDF repeats the wrong fallback at `fgxmart-frontend/app/pages/checkout.vue:720`, while its total uses the cart's `base_price` calculation. PDF line amounts can disagree with its total.

Use one authoritative price calculation across cart, order creation, and PDF generation, including variation adjustments.

### High: checkout can reference another customer's address

Order creation validates that `address_id` exists globally, then loads it with an unscoped `findOrFail` (`OrderController.php:23` and `:34`). It never checks ownership. Scope the query through the authenticated user's addresses.

### High: address updates accept an unvalidated owner field

`fgxmart-backend/app/Http/Controllers/Api/V1/AddressController.php:81` writes `$request->all()`. `UserAddress` makes `user_id` fillable. The ownership check happens before this write, so a customer can transfer their address record to another user's ID through an extra request field. Creation also passes all request fields. Write only validated address fields and assign ownership exclusively on the server.

### High: variations are lost between selection and the order/PDF

Product detail sends a variation ID/name in cart options, but `cart.totalPrice` ignores those options. Order creation ignores options and snapshots no variation, SKU, or adjusted price. Order-item schema has no fields to preserve them. A company receiving the final PDF cannot reliably distinguish two sizes of the same product.

Resolve and validate the selected variation on the server, calculate its price there, and snapshot its identifying fields in the order and PDF.

### High: deployed catalog calls still target localhost

Direct `http://localhost:8000` requests appear in the product listing, homepage categories/products, navigation, location selector, and image helpers. These bypass the runtime API configuration. Email success URLs are hardcoded to `http://localhost:3002` in `fgxmart-backend/app/Mail/OrderPlacedMail.php:27`.

Centralize API, media, and storefront URLs in environment configuration. A runtime override alone will not repair the hardcoded calls.

### High: wishlist page contains an undefined expression

`fgxmart-frontend/app/pages/wishlist.vue:91` contains a standalone `凄` expression inside script setup. It is valid JavaScript syntax, so a production build can pass, but evaluating the page setup raises a ReferenceError. Remove it and exercise the route at runtime.

### High: admin status logging uses the wrong identity table

`OrderController::updateStatus` stores the authenticated admin ID in `order_status_logs.user_id`, whose foreign key and model relationship point to customer `users`. With no matching customer ID, the status update fails; with a matching ID, the log attributes the action to an unrelated customer.

Use an admin foreign key or a polymorphic actor relationship. Also validate order/payment statuses against their allowed values rather than accepting any string.

### High: rich text is stored and rendered without sanitization

Page blocks accept arbitrary HTML and the storefront renders it with `v-html` in `fgxmart-frontend/app/pages/[slug].vue`. There is no server-side HTML sanitizer. Combined with the customer-to-admin authorization gap, a customer could publish executable HTML. Apply a server-side HTML allowlist in addition to fixing authorization.

### Medium: quick-view Add To Cart does nothing

`fgxmart-frontend/app/components/product/QuickViewModal.vue:102` renders the button without a click handler or cart action. Wire it to the same selection behavior used by product detail, including quantity and variation.

### Medium: category pages request a filter the API ignores

`fgxmart-frontend/app/pages/category/[slug].vue` sends `?category=<slug>`. `ProductController::index` only accepts `category_id`. The result can contain products from unrelated categories, and the page exposes no pagination for the default first 12 results.

### Medium: sorting is secondary to creation date

`ProductController::index` always starts with `orderBy('created_at', 'desc')`; price/name sorts append another ordering. Thus price sort primarily remains newest-first. Replace the existing ordering when an explicit sort is requested.

### Medium: public visibility rules are incomplete

Public products and categories share admin listing implementations without filtering `status`. Product slug lookup likewise does not require active status. Public page listing returns all page content, including unpublished pages, although individual page lookup does check status. FAQ listing ignores status. Homepage featured products do not request or filter `is_featured`.

Separate public query scopes/response fields from admin queries. The country selector currently changes a local label only; it does not enforce the product-country assignments.

### Medium: authentication restoration and logout leave inconsistent state

- Authentication is restored in the root component's `onMounted`, but protected route middleware runs earlier, including during SSR. Refreshing checkout/account can redirect a previously logged-in customer to login.
- Checkout checks for an empty cart before root initialization and server cart fetching have necessarily finished.
- Login ignores the supplied `redirect` query and uses browser history instead.
- `syncCart` returns immediately for an empty guest cart, so login does not fetch an existing server cart in that case.
- Logout removes local credentials but does not revoke the backend token or reset cart, wishlist, and address state. Another session on the same page can inherit stale customer data/selections.

Initialize auth/cart through an explicit readiness lifecycle, handle expired tokens, reset customer stores on logout, and call the backend logout endpoint.

### Medium: guest variation controls identify only the product

Guest cart rows can hold different options for the same product, but quantity update finds by product ID and removal deletes every row for that product. Use a stable cart-line key including options. Wishlist persistence stores only IDs, while guest reload cannot fetch item details through the authenticated wishlist endpoint.

### Medium: PDF generation needs layout and data safeguards

- Pre-order PDFs invent a random reference that does not represent a saved order.
- Bank details use fixed positions around Y=240–275 while the table length varies. Long orders can overlap bank details or push totals beyond page bounds.
- Address wrapping is partial; the success PDF does not wrap customer address lines.
- Missing company address values can reach `doc.text` as null/undefined.
- Automatic download uses a timer started before company-info fetching finishes, allowing fallback company details on slow requests.
- Checkout and success pages duplicate PDF logic and produce different details.

Consolidate the generator, wait for required data, reserve footer space/add pages, and test long carts and long addresses. Decide whether a pre-order document should be a selection/enquiry rather than an invoice with a fabricated order reference.

### Medium: order creation is not protected against duplicate submissions

Cart data is loaded outside the transaction, no cart lock/idempotency key is used, and clearing deletes all customer cart rows rather than just the captured rows. Concurrent submissions can create duplicate orders; a concurrent add-to-cart can be deleted without being ordered. Email also runs synchronously inside the transaction. Introduce idempotency/locking and dispatch mail after commit.

Stock and product active status are not checked during cart addition or order creation, and stock is not decremented. Decide whether stock is informational for this catalog or enforced inventory.

### Medium: some admin edits do not persist the advertised change

- Selecting an existing gallery image as cover sends no corresponding cover change.
- Clearing all countries or variations sends no array fields, so backend conditional sync does not clear the existing associations.
- Product creation does not submit `variation_code`; variation override `price` is not submitted by the product forms.
- Product update changes the slug even when the name is unchanged, breaking existing product links.
- Image-removal controls for company/category/brand/hero images generally clear previews without sending a persisted deletion instruction.

### Lower priority: placeholders, reporting, and operations

- Reviews and rating distributions are hardcoded; review submission simulates success without storing a review.
- Analytics line-chart values and trend percentages are hardcoded. Empty order status counts are replaced with invented nonzero values. Revenue totals include unpaid/cancelled orders.
- Admin routes have no central frontend auth middleware or centralized 401 handling. Backend authorization must remain authoritative.
- Admin login has no route throttle; token expiry is disabled and frontend logout does not revoke tokens.
- Orders load all records/items without pagination, which will grow expensive.
- Attribute value update looks up the provided value ID globally rather than through its owning attribute.
- README files are framework starter documentation; there are no project-specific deployment or environment instructions.

## Verification

| Check | Result |
| --- | --- |
| Frontend clean dependency install | Passed with `npm.cmd ci --no-audit --no-fund` |
| Admin clean dependency install | Passed with the same command |
| Frontend production build | Passed with `npm.cmd run build` |
| Admin production build | Passed with `npm.cmd run build` |
| Laravel dependency installation/test execution | Blocked: organization Device Guard policy prevents `C:\webserver\php\php.exe` from running |
| Live database, API, mail, browser checkout, generated PDF visual QA | Not verified; no running backend/database was available for this review |

Frontend build emits a CSS syntax warning for an unexpected `.4`, a large-chunk warning, and outdated Browserslist data. Builds do not establish that runtime journeys work, as illustrated by the wishlist expression and inert quick-view button.

Existing backend tests cover registration, login/throttling, basic cart addition/sync, and framework examples. There is no coverage for admin isolation, address ownership, order pricing/variations, PDF output, or the WhatsApp handoff. Neither Nuxt app defines a test or lint script.

Dependency folders, generated Nuxt/build output, and ignored `build-review.log` files were created to verify builds. All three repositories remained free of tracked changes after verification.

## Recommended implementation sequence

1. Close admin authorization and address ownership/mass-assignment gaps; add focused regression coverage.
2. Define the intended enquiry/order lifecycle, then unify variation identity and authoritative pricing through selection, saved order, and PDF.
3. Replace hardcoded URLs and repair wishlist, quick-view, category filtering, and authentication/cart initialization.
4. Consolidate PDF generation and complete the WhatsApp handoff with clear manual attachment instructions or an explicitly supported share flow.
5. Repair admin persistence/status logging, public visibility rules, and placeholder reporting; verify the complete customer journey against a test database.
