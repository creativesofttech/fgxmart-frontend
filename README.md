# FGXMART storefront and administration

One Nuxt application serves the catalog and admin panel. The Laravel API lives in `../fgxmart-backend`.

- Storefront: `/`
- Admin sign-in: `/admin-access`
- Admin panel: `/admin/dashboard` and `/admin/*`

## Local development

Copy `.env.example` to `.env`, configure the Laravel API URL, then run:

```sh
npm ci
npm run dev
```

Start Laravel separately. Use an administrator account for admin access; customer credentials cannot access administration.

## Production

```sh
npm ci
npm run build
node .output/server/index.mjs
```

This application requires a Node/Nitro server and HTTPS in production. Static-only deployment does not support admin sessions or the API proxy.

Read [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables, backend migration and permission seeding, account provisioning, session security, and validation commands.

## Tests

```sh
npx playwright install chromium
npm run build
npm test
```

Tests start the production Nuxt build and an isolated API fixture, then check route protection, session cookies, request forwarding, permission denial, and browser login/navigation/save/logout. Run Laravel's separate test suite to verify real backend authorization.
