# Storefront and admin deployment

`fgxmart-frontend` is the single Nuxt application for both the storefront and administration.

| URL | Purpose |
| --- | --- |
| `/` and existing catalog/account paths | Storefront |
| `/admin-access` | Admin sign-in |
| `/admin` | Redirect to the dashboard |
| `/admin/dashboard`, `/admin/products`, `/admin/orders`, etc. | Protected admin pages |
| `/api/admin/*` | Same-origin Nuxt server endpoints for admin authentication and API requests |

The Laravel API remains a separately running service. There is one frontend build/deployment, with no separate admin build or admin domain required.

## Runtime versions

The application uses Nuxt 4.6.4 and Laravel 13.42.0. Use Node.js 24.15.0 or newer within the 24.x LTS line (Node 22.22.3+ within 22.x is also supported), PHP 8.3+, and Composer 2. Local verification used Node 24.19.0 and PHP 8.4.8. Composer resolves packages against PHP 8.3 to keep the lock file compatible with the backend's minimum PHP version.

The Laravel 13 upgrade also updates Tinker to 3.x and the test suite to Pest 4 / PHPUnit 12. The application retains its session serialization behavior and configures an explicit cache object-unserialization restriction. Nuxt's Vue and Vue Router dependencies were aligned with Nuxt 4.6 to avoid loading duplicate framework versions.

## Configure the services

Copy `.env.example` to `.env` for local development. In production, configure environment variables through the hosting platform:

```dotenv
NUXT_PUBLIC_API_BASE=https://api.fgxmart.com/api/v1
NUXT_API_BASE=https://api.fgxmart.com/api/v1
```

`NUXT_PUBLIC_API_BASE` must be reachable by visitors' browsers and is also used to construct media URLs. `NUXT_API_BASE` is server-only and may instead point to an internal Laravel URL. Both values include `/api/v1` and omit `/admin` and the trailing slash. Keep Laravel `APP_URL` set to its public HTTPS origin so generated storage URLs work.

Set `FRONTEND_URL=https://fgxmart.com` in Laravel for order-email links. Configure Laravel CORS for the deployed storefront origin if changing domains. The existing `https://fgxmart.com` origin is already allowed. Admin requests travel through Nuxt and do not require browser CORS access to Laravel.

## Apply backend changes first

From `fgxmart-backend`:

```sh
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --class=PermissionSeeder --force
php artisan optimize:clear
php artisan config:cache
```

The migration adds an `admin_id` actor to order status logs. Existing log rows are retained; their old customer-ID field is not reinterpreted as an admin identity.

Existing administrator accounts remain. Super admins retain full access. Other admins must have the relevant `module.index`, `module.create`, `module.edit`, or `module.destroy` permission assigned to their role. Permission modules include brands, bank accounts, company settings, FAQs, pages, and media. Roles/permissions can be managed through a super-admin account after sign-in.

For the category/admin redesign, run `php artisan migrate --force` followed by `php artisan db:seed --class=CategorySeeder --force` in the backend deployment. The category migration adds `short_description` and a restricted self-referencing `parent_id`. The seeder creates the new main categories and moves the four legacy food categories beneath Packed Food while preserving products and uploads. Back up the database before deployment. The slider retirement migration drops its old table, removes its permissions and deletes its owned uploads; it cannot reconstruct retired content on rollback. Fresh installations no longer create slider tables or routes.

New admin tokens have the explicit `admin` ability and expire after eight hours. Legacy wildcard/non-expiring admin tokens no longer authorize protected routes; admins must sign in again. Customer tokens cannot authorize any admin route, and admin tokens cannot authorize customer routes.

For a fresh installation, set `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` of at least 12 characters before explicitly running `php artisan db:seed --force`. The seeder creates a super admin only when credentials are supplied and does not overwrite existing passwords. Remove provisioning secrets afterward. The previous seeder contained a fixed password; change it on any account that was created with that password before exposing administration publicly.

## Build and run Nuxt

From `fgxmart-frontend`:

```sh
npm ci
npm run build
node .output/server/index.mjs
```

Deploy the generated `.output` with the Node server entry point. The default port is 3000; set `NITRO_HOST` and `NITRO_PORT` if needed. Use a Node/Nitro-capable deployment, not static-only hosting or `nuxt generate`, because login, session validation, and the API proxy require server execution.

Serve production over HTTPS. The admin cookie is host-only, HttpOnly, Secure in production, SameSite=Strict, and valid for eight hours. Preserve the original Host header and `X-Forwarded-Proto: https` at a trusted reverse proxy. Do not cache `/admin`, `/admin/**`, `/admin-access`, or `/api/admin/**`; the application also sends `private, no-store` headers.

All admin mutations require a same-origin request with the `X-FGX-Admin` header. Nuxt validates the session on direct page loads and client navigation; Laravel independently enforces the token identity, scope, expiry, and resource permission for each operation. Logout revokes the Laravel token before clearing the cookie. Tokens never appear in frontend storage, API login responses, or Nuxt hydration state.

## Verification

Frontend integration and browser checks use an isolated API fixture, not real customer data:

```sh
npx playwright install chromium
npm run build
npm test
```

If Chromium is already installed outside Playwright's default directory, supply its executable with `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Browser screenshots are written to the ignored `test-artifacts` folder.

Run the real backend regressions against the configured in-memory test database:

```sh
composer install
php artisan test
```

These include rejection of customer bearer tokens on every registered protected admin route, scoped token expiry, permission denial, logout revocation, and admin status-log identity. Also verify a real admin login, product upload/edit, order status update, storefront checkout, and PDF download against staging before production rollout.
