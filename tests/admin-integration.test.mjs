import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Exercise the built Nuxt server against an isolated API fixture. Laravel has its
// own authorization regression suite in tests/Feature/AdminAccessTest.php.
const requests = []
const tokens = new Set(['integration-admin', 'restricted-admin'])
const product = { id: 1, name: 'Test Product', slug: 'test-product', base_price: '10.00', discount_price: null, stock_quantity: 10, status: true, countries: [], media: [], attribute_values: [] }
const publicProducts = [product,
  { ...product, id: 2, name: 'Second Product', slug: 'second-product', discount_price: '8.00', is_featured: true },
  { ...product, id: 3, name: 'Third Product', slug: 'third-product' },
  { ...product, id: 4, name: 'Fourth Product', slug: 'fourth-product' },
]
const categoryFixtures = [
  { id: 1, name: 'Packed Food', slug: 'packed-food', short_description: 'Pantry favourites', image_url: '/assets/images/home/cat-1.webp', parent_id: null, sorting_order: 10, status: true, children: [{ id: 2, name: 'Snacks', slug: 'snacks', parent_id: 1, status: true }] },
  { id: 2, name: 'Snacks', slug: 'snacks', short_description: 'Everyday bites', parent_id: 1, parent: { id: 1, name: 'Packed Food' }, sorting_order: 20, status: true, children: [] },
  { id: 3, name: 'Clothing', slug: 'clothing', short_description: 'Everyday style', image_url: '/assets/images/home/cat-2.webp', parent_id: null, sorting_order: 20, status: true, children: [] },
  { id: 4, name: 'Electronics', slug: 'electronics', short_description: 'Connected living', image_url: '/assets/images/home/cat-3.webp', parent_id: null, sorting_order: 30, status: true, children: [] },
  { id: 5, name: 'Kitchen Utensils', slug: 'kitchen-utensils', short_description: 'Cook something good', image_url: '/assets/images/home/cat-4.webp', parent_id: null, sorting_order: 40, status: true, children: [] },
]
let renamedCategory = false
let emptyDashboard = false
let dashboardFailure = false
const dashboardFixture = (days = 30, restricted = false) => {
  const date = new Date(); const end = date.toISOString().slice(0, 10)
  const total = emptyDashboard ? 0 : days === 7 ? 3 : 12
  const revenue = emptyDashboard ? 0 : days === 7 ? 150 : 1200
  const metric = value => ({ value, previous: value / 2, change_percent: value ? 100 : 0, comparison: 'previous_period' })
  const series = Array.from({ length: days }, (_, index) => { const day = new Date(date); day.setUTCDate(day.getUTCDate() - days + 1 + index); return { date: day.toISOString().slice(0, 10), revenue: index === days - 1 ? revenue : 0, orders: index === days - 1 ? total : 0 } })
  return {
    period: { days, start: series[0].date, end, currency: 'USD', timezone: 'UTC' },
    permissions: { orders: !restricted, products: true, customers: !restricted },
    metrics: restricted ? { products: metric(4) } : { orders: metric(total), products: { ...metric(4), comparison: 'period_start' }, customers: { ...metric(3), comparison: 'period_start' }, revenue: metric(revenue) },
    sales: restricted ? null : { series, paid_orders: total, average_order_value: total ? revenue / total : 0 },
    statuses: restricted ? null : [{ status: 'delivered', count: total }, ...['processing', 'confirmed', 'shipped', 'pending', 'cancelled'].map(status => ({ status, count: 0 }))],
    recent_orders: restricted ? null : emptyDashboard ? [] : [{ id: 1, order_number: 'FGX-TEST', customer: 'Fixture Customer', amount: 100, status: 'delivered', date: end }],
    top_products: restricted ? null : emptyDashboard ? [] : [{ id: 1, name: 'Test Product', image: null, quantity: 8, revenue: 100 }],
  }
}
let publicProductMode = 'normal'
let base, upstream, app, output = '', sessionCookie, browser
const adminPaths = ['/admin', '/admin/dashboard', '/admin/analytics', '/admin/products', '/admin/products/create', '/admin/products/1/edit', '/admin/categories', '/admin/brands', '/admin/attributes', '/admin/countries', '/admin/orders', '/admin/orders/FGX-TEST', '/admin/company-settings', '/admin/faqs', '/admin/pages', '/admin/pages/create', '/admin/pages/edit/1', '/admin/roles', '/admin/roles/create', '/admin/roles/1', '/admin/permissions']

before(async () => {
  upstream = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString()
    requests.push({ method: req.method, url: req.url, headers: req.headers, body: raw })
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    const url = new URL(req.url, 'http://fixture')
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)) }
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }
    if (['/api/v1/login', '/api/v1/register'].includes(url.pathname)) {
      const body = JSON.parse(raw)
      if (url.pathname.endsWith('/login') && body.password !== 'customer-password') return send(422, { errors: { email: ['The provided credentials are incorrect.'] } })
      return send(200, { access_token: 'fixture-customer-token', user: { id: 7, name: body.name || 'Fixture Customer', email: body.email } })
    }
    if (['/api/v1/cart/sync', '/api/v1/wishlist/sync'].includes(url.pathname)) return send(200, { message: 'Synced' })
    if (['/api/v1/cart', '/api/v1/wishlist'].includes(url.pathname)) return send(200, [])
    if (url.pathname === '/api/v1/admin/secure-admin-fgx') {
      const body = JSON.parse(raw)
      if (body.password !== 'fixture-password') return send(422, { message: 'Invalid credentials.' })
      tokens.add('integration-admin')
      return send(200, { data: { token: 'integration-admin', admin: { name: 'Fixture Admin' } } })
    }
    if (url.pathname.startsWith('/api/v1/admin/')) {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!tokens.has(token)) return send(401, { message: 'Unauthenticated.' })
      if (url.pathname.endsWith('/user')) return send(200, { data: { id: 1, name: 'Fixture Admin', email: 'admin@example.test', roles: token === 'restricted-admin' ? ['viewer'] : ['super-admin'], permissions: token === 'restricted-admin' ? ['products.index'] : [] } })
      if (url.pathname.endsWith('/dashboard')) return dashboardFailure ? send(500, { message: 'Fixture failure' }) : send(200, { data: dashboardFixture(Number(url.searchParams.get('days') || 30), token === 'restricted-admin') })
      if (url.pathname.endsWith('/logout')) { tokens.delete(token); return send(200, { message: 'Logged out.' }) }
      if (url.searchParams.has('fail')) return send(500, { message: 'Private database trace', trace: 'SECRET' })
      if (url.pathname.endsWith('/products/generate-sku')) return send(200, { sku: 'TEST-SKU' })
      if (/\/products\/1$/.test(url.pathname)) return send(200, { data: product })
      if (req.method !== 'GET') return send(200, { status: 'success', data: { id: 1, ...product }, message: 'Saved' })
      if (url.pathname.endsWith('/company-settings')) return send(200, { data: null })
      if (url.pathname.endsWith('/products')) return send(200, { data: [product], total: 1, current_page: 1, last_page: 1 })
      if (url.pathname.endsWith('/categories')) return send(200, { data: categoryFixtures, total: 1, current_page: 1, last_page: 1 })
      return send(200, { status: 'success', data: [], total: 0, current_page: 1, last_page: 1 })
    }
    if (url.pathname.endsWith('/company-info')) return send(200, { status: 'success', data: { company: null, bank: null } })
    if (url.pathname.endsWith('/categories')) return send(200, { data: categoryFixtures.map(category => renamedCategory && category.id === 1 ? { ...category, name: 'Food & Pantry', short_description: 'A description edited in admin', image_url: '/assets/images/home/cat-4.webp' } : category) })
    if (url.pathname.endsWith('/products')) {
      let data = publicProductMode === 'empty' || (publicProductMode === 'fallback' && url.searchParams.has('is_featured')) ? [] : publicProducts
      if (url.searchParams.get('on_sale') === '1') data = data.filter(item => item.discount_price !== null && Number(item.discount_price) < Number(item.base_price))
      return send(200, { data, total: data.length, last_page: 1 })
    }
    return send(200, { status: 'success', data: [] })
  })
  upstream.listen(0, '127.0.0.1')
  await once(upstream, 'listening')
  const api = `http://127.0.0.1:${upstream.address().port}/api/v1`
  const reservation = createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  base = `http://localhost:${port}`
  app = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: process.cwd(), windowsHide: true,
    env: { ...process.env, NODE_ENV: 'production', NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port), NUXT_API_BASE: api, NUXT_PUBLIC_API_BASE: api },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.on('data', data => { output += data })
  app.stderr.on('data', data => { output += data })
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await fetch(`${base}/api/admin/session`); return } catch {}
    if (app.exitCode !== null) throw new Error(output)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Nuxt did not start: ${output}`)
})

after(async () => {
  await browser?.close()
  app?.kill()
  upstream?.closeAllConnections()
  await new Promise(resolve => upstream ? upstream.close(resolve) : resolve())
})

test('every admin page redirects a guest to the single login URL, including nested routes', async () => {
  for (const path of [...adminPaths, '/ADMIN/products', '/Admin/Orders']) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' })
    assert.equal(response.status, 302, path)
    assert.match(response.headers.get('location'), /^\/admin-access\?redirect=/, path)
    assert.match(response.headers.get('cache-control'), /no-store/)
  }
})

test('login is isolated from the storefront and has no-index/cache headers', async () => {
  const response = await fetch(`${base}/admin-access`)
  const html = await response.text()
  assert.equal(response.status, 200)
  assert.match(html, /Admin Access/)
  assert.doesNotMatch(html, /middle-header|sticky-wrapper|<footer/)
  assert.match(response.headers.get('x-robots-tag'), /noindex/)
})

test('admin API rejects customer bearer headers and requires its own cookie', async () => {
  const response = await fetch(`${base}/api/admin/products`, { headers: { Authorization: 'Bearer customer-token' } })
  assert.equal(response.status, 401)
})

test('mutations reject missing CSRF header and foreign origins before reaching the API', async () => {
  const count = requests.length
  for (const headers of [{}, { 'X-FGX-Admin': '1', Origin: 'https://other.example' }, { 'X-FGX-Admin': '1', 'Sec-Fetch-Site': 'cross-site' }]) {
    const response = await fetch(`${base}/api/admin/login`, { method: 'POST', headers })
    assert.equal(response.status, 403)
  }
  assert.equal(requests.length, count)
})

test('login sets a secure HttpOnly session and never returns the backend token', async () => {
  const response = await fetch(`${base}/api/admin/login`, {
    method: 'POST', headers: { 'X-FGX-Admin': '1', 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ email: 'admin@example.test', password: 'fixture-password' }),
  })
  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /Secure/i)
  assert.match(cookie, /SameSite=Strict/i)
  sessionCookie = cookie.split(';')[0]
  assert.doesNotMatch(await response.text(), /integration-admin|token/)
})

test('validated admin session survives SSR and all migrated page routes resolve', async () => {
  for (const path of adminPaths) {
    const response = await fetch(`${base}${path}`, { headers: { Cookie: sessionCookie }, redirect: 'manual' })
    assert.equal(response.status, path === '/admin' ? 302 : 200, path)
    const html = await response.text()
    assert.doesNotMatch(html, /integration-admin/, path)
    if (path !== '/admin') assert.match(html, /admin-shell/, path)
  }
})

test('limited administrators cannot render pages beyond their permissions', async () => {
  const cookie = 'fgx_admin_session=restricted-admin'
  assert.equal((await fetch(`${base}/admin/products`, { headers: { Cookie: cookie } })).status, 200)
  for (const path of ['/admin/orders', '/admin/products/create', '/admin/products/1/edit', '/admin/roles']) {
    assert.equal((await fetch(`${base}${path}`, { headers: { Cookie: cookie } })).status, 403, path)
  }
})

test('proxy preserves multipart uploads, query strings and method overrides', async () => {
  const form = new FormData()
  form.set('_method', 'PUT')
  form.set('name', 'Updated Product')
  form.set('cover_image', new Blob(['fixture-image'], { type: 'image/png' }), 'cover.png')
  const response = await fetch(`${base}/api/admin/products/1?test=1`, {
    method: 'POST', headers: { Cookie: sessionCookie, 'X-FGX-Admin': '1' }, body: form,
  })
  assert.equal(response.status, 200)
  const request = requests.at(-1)
  assert.equal(request.url, '/api/v1/admin/products/1?test=1')
  assert.match(request.headers['content-type'], /multipart\/form-data; boundary=/)
  assert.match(request.body, /Updated Product/)
  assert.match(request.body, /fixture-image/)
  assert.match(request.body, /name="_method"/)
  assert.equal(request.headers.authorization, 'Bearer integration-admin')
  assert.equal(request.headers.cookie, undefined)
})

test('proxy hides backend debug errors and rejects unknown resources', async () => {
  const response = await fetch(`${base}/api/admin/products?fail=1`, { headers: { Cookie: sessionCookie } })
  assert.equal(response.status, 500)
  assert.doesNotMatch(await response.text(), /SECRET|database trace|integration-admin/)
  assert.equal((await fetch(`${base}/api/admin/register`, { headers: { Cookie: sessionCookie } })).status, 404)
})

test('browser login, admin navigation, category save, storefront isolation and logout work', { timeout: 120_000 }, async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) })
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/admin/products`)
  await page.waitForURL(url => url.pathname === '/admin-access' && url.searchParams.has('redirect'))
  await page.getByLabel('Email address').fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByLabel('Remember email', { exact: true }).check()
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/products')
  await page.getByText('Test Product', { exact: true }).waitFor()
  assert.equal(await page.locator('footer').count(), 0)
  assert.doesNotMatch(await page.evaluate(() => document.cookie), /fgx_admin_session/)
  assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), null)
  assert.equal(await page.evaluate(() => localStorage.getItem('fgx_admin_remembered_email')), 'admin@example.test')
  await page.locator('.sidebar').getByRole('link', { name: 'Categories', exact: true }).click()
  assert.equal(await page.locator('.sidebar-header .tw\\:badge').count(), 0)
  assert.equal(await page.locator('.sidebar-header').evaluate(element => element.getBoundingClientRect().height), await page.locator('.main-content > header').evaluate(element => element.getBoundingClientRect().height))
  await page.locator('.category-pill-child').waitFor()
  assert.equal(await page.locator('.category-pill-parent').first().textContent().then(text => text.trim()), 'Main category')
  assert.match(await page.locator('.category-pill-caption').innerText(), /Subcategory of Packed Food/)
  await page.getByRole('button', { name: 'Open admin profile menu', exact: true }).click()
  await page.getByRole('button', { name: 'Local Profile', exact: true }).click()
  const profileDialog = page.getByRole('dialog', { name: 'Local Profile', exact: true })
  await profileDialog.waitFor()
  assert.match(await profileDialog.innerText(), /Fixture Admin/)
  assert.match(await profileDialog.innerText(), /admin@example.test/)
  await profileDialog.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Create Category' }).click()
  await page.getByLabel('Category Name').fill('Fixture Category')
  await page.getByLabel('Code', { exact: true }).fill('FIX')
  await page.locator('#cat-description').fill('Fixture subcategory description')
  await page.locator('#cat-parent').selectOption('1')
  const categoryDialog = page.getByRole('dialog', { name: 'Create Category', exact: true })
  await categoryDialog.locator('input[type="file"]').setInputFiles('public/assets/images/home/cat-1.webp')
  await categoryDialog.getByRole('button', { name: 'Save', exact: true }).click()
  await categoryDialog.waitFor({ state: 'hidden' })
  assert.ok(requests.some(r => r.method === 'POST' && r.url === '/api/v1/admin/categories' && r.body.includes('Fixture Category')))
  assert.ok(requests.some(r => r.url === '/api/v1/admin/categories' && r.body.includes('Fixture subcategory description') && r.body.includes('parent_id') && r.body.includes('cat-1.webp')))
  assert.equal(await page.locator('.admin-shell').getAttribute('data-theme'), 'fgx')
  assert.ok(await page.getByRole('button', { name: 'Toggle navigation' }).locator('svg').evaluate(icon => icon.getBoundingClientRect().width >= 16), 'Navigation icon must remain readable')
  assert.notEqual(await page.getByRole('button', { name: 'Create Category' }).evaluate(button => getComputedStyle(button).backgroundColor), 'rgba(0, 0, 0, 0)')
  assert.equal(await page.locator('.sidebar').getByText('Hero Slider', { exact: true }).count(), 0)
  assert.equal((await fetch(`${base}/api/admin/hero-slides`, { headers: { Cookie: sessionCookie } })).status, 404)
  await mkdir('test-artifacts', { recursive: true })
  await page.screenshot({ path: 'test-artifacts/admin-categories.png', fullPage: true })
  await page.goto(`${base}/products`)
  await page.locator('.sticky-wrapper').waitFor()
  assert.equal(await page.locator('.admin-shell').count(), 0)
  await page.goto(`${base}/wishlist`)
  await page.locator('.sticky-wrapper').waitFor()
  await page.goto(`${base}/admin/dashboard`)
  await page.getByRole('heading', { name: /Welcome back,/i }).waitFor()
  await page.getByRole('button', { name: 'Open admin profile menu', exact: true }).click()
  await page.getByRole('button', { name: 'Logout' }).click()
  await page.waitForURL('**/admin-access')
  assert.equal((await context.cookies()).filter(c => c.name === 'fgx_admin_session').length, 0)
  assert.equal(tokens.has('integration-admin'), false)
  assert.deepEqual(errors, [])
  await context.close()
})

test('daisyUI admin screens render and category dialogs remain usable on mobile', { timeout: 120_000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`))
  await page.goto(`${base}/admin-access`)
  await page.getByLabel('Email address').fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  for (const path of adminPaths.filter(path => path !== '/admin' && path !== '/admin/orders/FGX-TEST')) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('.admin-shell[data-theme="fgx"]').count(), 1, path)
    assert.equal(await page.locator('footer').count(), 0, path)
  }
  await page.goto(`${base}/admin/categories`)
  await page.getByRole('button', { name: 'Create Category' }).click()
  await page.getByRole('dialog', { name: 'Create Category', exact: true }).waitFor()
  await page.getByRole('dialog', { name: 'Create Category', exact: true }).evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)))
  await page.screenshot({ path: 'test-artifacts/admin-category-dialog-desktop.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.locator('.sidebar-header').evaluate(element => element.getBoundingClientRect().height), await page.locator('.main-content > header').evaluate(element => element.getBoundingClientRect().height))
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Admin shell must fit mobile')
  await page.getByRole('button', { name: 'Open admin profile menu', exact: true }).click()
  await page.getByRole('button', { name: 'Local Profile', exact: true }).waitFor()
  assert.ok(await page.locator('.profile-dropdown').evaluate(element => element.getBoundingClientRect().right <= innerWidth), 'Profile dropdown must fit mobile')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.profile-menu').getAttribute('open'), null)
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await page.locator('.sidebar').getByRole('link', { name: 'Brands', exact: true }).click()
  await page.waitForURL('**/admin/brands')
  assert.equal(await page.locator('.sidebar').evaluate(element => element.classList.contains('collapsed')), true)
  await page.goto(`${base}/admin/categories`)
  await page.getByRole('button', { name: 'Create Category' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Category', exact: true })
  await dialog.waitFor()
  await dialog.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)))
  assert.ok(await dialog.locator('.admin-modal-box').evaluate(element => element.getBoundingClientRect().width <= innerWidth))
  await page.screenshot({ path: 'test-artifacts/admin-category-dialog-mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  await context.close()
})

test('homepage serves the supplied assets and renders its content without JavaScript', async () => {
  const response = await fetch(`${base}/`)
  const html = await response.text()
  assert.equal(response.status, 200)
  assert.match(html, /Your everyday/)
  assert.match(html, /\/assets\/images\/home\/hero-banner.webp/)
  assert.match(html, /\/images\/logo\/fgx-logo-dark.png/)
  assert.match(html, /<footer\b/)
  assert.match(html, /Start shopping now/)
  assert.doesNotMatch(html, /class="[^"]*\bhero-panel\b/)
  for (const asset of ['/assets/images/home/hero-banner.webp', '/images/logo/fgx-logo-dark.png', '/images/logo/fgx-logo-light.png', '/assets/images/home/cta-shopping-cart.webp']) {
    const image = await fetch(`${base}${asset}`)
    assert.equal(image.status, 200, asset)
    assert.match(image.headers.get('content-type'), /image\//)
  }
})

test('new storefront UI supports desktop, mobile, search, location dialog and reduced motion', { timeout: 120_000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/`)
  await page.getByRole('heading', { level: 1, name: /Your everyday/ }).waitFor()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero-note')).opacity === '1')
  assert.equal(await page.locator('.storefront-header').count(), 1)
  assert.equal(await page.locator('footer').count(), 1)
  assert.equal(await page.locator('.hero-cta').evaluate(el => getComputedStyle(el).display), 'inline-flex')
  await page.screenshot({ path: 'test-artifacts/home-desktop.png', fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Desktop should not overflow')
  await page.getByText('All categories', { exact: true }).click()
  await page.locator('.category-menu').getByRole('link', { name: 'All products' }).waitFor()
  assert.deepEqual((await page.locator('.category-menu .all-products-row > a, .category-row-main > a').allTextContents()).map(text => text.trim()), ['All products', 'Packed Food', 'Clothing', 'Electronics', 'Kitchen Utensils'])
  assert.equal(await page.locator('.category-flyout').isVisible(), false)
  await page.locator('.category-row-main').getByRole('link', { name: 'Packed Food', exact: true }).hover()
  assert.equal(await page.locator('.category-menu').getByRole('link', { name: 'Snacks', exact: true }).getAttribute('href'), '/category/snacks')
  assert.ok(await page.locator('.category-flyout').evaluate(element => element.getBoundingClientRect().left >= element.closest('.category-menu').getBoundingClientRect().right - 1), 'Desktop children should open beside the main menu')
  assert.deepEqual(await page.locator('.category-row-main > a').evaluateAll(links => links.map(link => link.getAttribute('href'))), await page.locator('.category-card').evaluateAll(links => links.map(link => link.getAttribute('href'))))
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.category-dropdown').getAttribute('open'), null)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-artifacts/home-mobile.png', fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile should not overflow')
  await page.getByRole('button', { name: 'Choose location', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('heading', { name: 'Where are you shopping from?' }).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('dialog').getAttribute('open'), null)
  await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('Test Product')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('search') === 'Test Product')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}/`)
  await page.locator('.hero-cta').waitFor()
  assert.equal(await page.locator('.hero-note').evaluate(el => getComputedStyle(el).opacity), '1')
  assert.deepEqual(errors, [])
  await context.close()
})

test('category and featured cards use WebP assets and connect to wishlist and enquiry selection', { timeout: 120_000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/`)
  assert.equal(await page.locator('.category-card').count(), 4)
  const arrivals = page.getByRole('region', { name: 'New Arrivals', exact: true })
  assert.equal(await arrivals.locator('.collection-link').count(), 4)
  assert.equal(await arrivals.locator('.collection-link').first().getAttribute('href'), '/products/test-product')
  assert.equal(await arrivals.locator('img').evaluateAll(images => images.every(image => image.getAttribute('src') === '/assets/images/home/product-placeholder.webp')), true)
  const bestSellers = page.getByRole('region', { name: 'Best Sellers', exact: true })
  assert.equal(await bestSellers.locator('.collection-card').count(), 6)
  assert.equal(await bestSellers.locator('.collection-link').count(), 0)
  assert.match(await bestSellers.innerText(), /selection is coming soon/)
  assert.equal(await page.locator('.brand-tile').count(), 9)
  assert.equal(await page.locator('.home-brands img').count(), 0)
  assert.equal(await page.getByRole('link', { name: 'Start shopping now', exact: true }).getAttribute('href'), '/products')
  assert.equal(await page.locator('footer').count(), 1)
  assert.equal(await page.locator('footer .footer-logo img').getAttribute('src'), '/images/logo/fgx-logo-light.png')
  assert.equal(await page.locator('footer a').evaluateAll(links => links.some(link => !link.getAttribute('href') || link.getAttribute('href') === '#')), false)
  assert.equal(await page.locator('.catalogue-card:not(.is-preview)').count(), 4)
  assert.equal(await page.locator('.category-card img').evaluateAll(images => images.every(image => image.getAttribute('src').endsWith('.webp'))), true)
  const firstCard = page.locator('.catalogue-card').first()
  assert.match(await firstCard.locator('img').getAttribute('src'), /product-placeholder\.webp$/)
  await firstCard.getByRole('button', { name: 'Add to Enquiry', exact: true }).click()
  await firstCard.getByRole('button', { name: 'Added to enquiry' }).waitFor()
  const savedCart = await page.evaluate(() => JSON.parse(localStorage.getItem('guest_cart')))
  assert.equal(savedCart[0].product_id, product.id)
  assert.equal(savedCart[0].quantity, 1)
  await page.getByRole('link', { name: 'Cart, 1 items' }).waitFor()
  const wishlistButton = firstCard.getByRole('button', { name: 'Save Test Product to wishlist' })
  await wishlistButton.click()
  assert.equal(await firstCard.getByRole('button', { name: 'Remove Test Product from wishlist' }).getAttribute('aria-pressed'), 'true')
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('guest_wishlist'))), [product.id])
  assert.match(await page.locator('.catalogue-card').nth(1).innerText(), /20% OFF/)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-artifacts/home-sections-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-artifacts/home-sections-mobile.png', fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'New sections must not cause horizontal scrolling')
  assert.deepEqual(errors, [])
  await context.close()
})

test('featured products fall back to latest items, and empty catalogues have non-purchasable previews', async () => {
  try {
    publicProductMode = 'fallback'
    const start = requests.length
    const response = await fetch(`${base}/`)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /Second Product/)
    const calls = requests.slice(start).filter(request => request.url.startsWith('/api/v1/products'))
    assert.ok(calls.some(request => request.url.includes('is_featured=1')))
    assert.ok(calls.some(request => !request.url.includes('is_featured')))
    publicProductMode = 'empty'
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`${base}/`)
    assert.equal(await page.locator('.catalogue-card.is-preview').count(), 4)
    assert.equal(await page.locator('.catalogue-card .enquiry-button:disabled').count(), 4)
    assert.equal(await page.locator('.catalogue-card .wishlist-button').count(), 0)
    assert.equal(await page.locator('.product-collection .collection-card').count(), 12)
    assert.equal(await page.locator('.product-collection .collection-link').count(), 0)
    await page.screenshot({ path: 'test-artifacts/home-sections-empty.png', fullPage: true })
    await context.close()
  } finally { publicProductMode = 'normal' }
})

test('shopping navigation replaces category shortcuts and opens sections and genuine hot deals', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${base}/`)
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true })
  assert.deepEqual(await nav.locator('a').allTextContents(), ['Home', 'Hot Deals', 'New Arrivals', 'Best Sellers'])
  assert.equal(await page.getByRole('link', { name: 'Browse catalogue', exact: true }).count(), 0)
  for (const [label, hash] of [['New Arrivals', '#new-arrivals-title'], ['Best Sellers', '#best-sellers-title']]) {
    await nav.getByRole('link', { name: label, exact: true }).click()
    await page.waitForURL(url => url.hash === hash)
    assert.equal(await nav.getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page')
    assert.equal(await page.locator(hash).count(), 1)
  }
  await nav.getByRole('link', { name: 'Hot Deals', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('deals') === '1')
  await page.getByRole('heading', { name: 'Hot Deals', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Second Product', exact: true }).waitFor()
  assert.ok(requests.some(request => request.url.includes('on_sale=1')))
  assert.equal(await nav.getByRole('link', { name: 'Hot Deals', exact: true }).getAttribute('aria-current'), 'page')
  await context.close()
})

test('category cards follow admin data and child flyouts support touch and keyboard', async () => {
  renamedCategory = true
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  try {
    const page = await context.newPage()
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    const firstCard = page.locator('.category-card').first()
    assert.equal(await firstCard.locator('h2').innerText(), 'Food & Pantry')
    assert.equal(await firstCard.locator('p').innerText(), 'A description edited in admin')
    assert.equal(await firstCard.locator('img').getAttribute('src'), '/assets/images/home/cat-4.webp')
    await page.getByRole('button', { name: 'All categories', exact: true }).click()
    const toggle = page.getByRole('button', { name: 'Show Food & Pantry subcategories', exact: true })
    await toggle.click()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
    const child = page.locator('.category-flyout').getByRole('link', { name: 'Snacks', exact: true })
    assert.equal(await child.isVisible(), true)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: 'test-artifacts/category-flyout-mobile.png' })
    await toggle.focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await child.evaluate(element => element === document.activeElement), true)
    await page.keyboard.press('ArrowLeft')
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.category-dropdown').getAttribute('open'), null)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'All categories', exact: true }).click()
    assert.equal(await page.locator('.category-row-main > a').first().innerText(), 'Food & Pantry')
    await page.locator('.category-row-main > a').first().hover()
    await child.waitFor()
    await child.hover()
    assert.equal(await child.isVisible(), true)
    assert.ok(await page.locator('.categories-trigger').evaluate(element => element.getBoundingClientRect().width <= 170))
    await page.screenshot({ path: 'test-artifacts/category-flyout-desktop.png' })
  } finally { renamedCategory = false; await context.close() }
})

test('customer login design handles errors, password visibility, selection sync and safe redirects', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('guest_cart', JSON.stringify([{ product_id: 1, quantity: 2 }]))
      localStorage.setItem('guest_wishlist', JSON.stringify([1]))
    }
  })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/login?redirect=%2Fproducts%3Fsearch%3DTest`)
  assert.equal(await page.locator('.storefront-header, footer, .admin-shell').count(), 0)
  assert.equal(await page.locator('.auth-art img').getAttribute('src'), '/assets/images/auth/login-cart.webp')
  await page.getByLabel('Email address', { exact: true }).fill('customer@example.test')
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'The provided credentials are incorrect.' }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), null)
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click()
  await page.getByRole('dialog', { name: 'Need help signing in?', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByLabel('Password', { exact: true }).fill('customer-password')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('search') === 'Test')
  assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), 'fixture-customer-token')
  assert.ok(requests.some(request => request.url === '/api/v1/cart/sync' && request.headers.authorization === 'Bearer fixture-customer-token' && JSON.parse(request.body).items[0].quantity === 2))
  assert.ok(requests.some(request => request.url === '/api/v1/wishlist/sync' && request.headers.authorization === 'Bearer fixture-customer-token'))
  assert.deepEqual(errors, [])
  await context.close()
})

test('customer registration uses matching passwords and fits mobile screens', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${base}/login?redirect=https://example.test/`)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.getByLabel('Full name', { exact: true }).fill('New Customer')
  await page.getByLabel('Email address', { exact: true }).fill('new@example.test')
  await page.getByLabel('Password', { exact: true }).fill('customer-password')
  await page.getByLabel('Confirm password', { exact: true }).fill('different-password')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Your passwords do not match.' }).waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: 'test-artifacts/customer-register-mobile.png', fullPage: true })
  await page.getByLabel('Confirm password', { exact: true }).fill('customer-password')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).name), 'New Customer')
  assert.ok(requests.some(request => request.method === 'POST' && request.url === '/api/v1/register' && JSON.parse(request.body).password_confirmation === 'customer-password'))
  await context.close()
})

test('admin access artwork, floating cards, reduced motion and password help work', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/admin-access`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.feature-float').count(), 4)
  assert.equal(await page.locator('.access-art').getAttribute('src'), '/assets/images/auth/admin-desk.webp')
  assert.equal(await page.locator('.access-art').evaluate(image => image.complete && image.naturalWidth > 0), true)
  const initial = await page.locator('.feature-float').evaluateAll(cards => cards.map(card => card.style.transform))
  await page.waitForFunction(initial => [...document.querySelectorAll('.feature-float')].some((card, index) => card.style.transform !== initial[index]), initial)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => [...document.querySelectorAll('.feature-float')].every(card => !card.style.transform || card.style.transform === 'none'))
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Invalid credentials.' }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), null)
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click()
  await page.getByRole('dialog', { name: 'Need access help?', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  }
  assert.deepEqual(errors, [])
  await context.close()
})

test('dashboard uses live aggregate data, date ranges, empty states and resource permissions', { timeout: 120_000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, reducedMotion: 'reduce' })
  const restrictedContext = await browser.newContext()
  try {
    const page = await context.newPage()
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin-access`)
    await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
    await page.getByLabel('Password', { exact: true }).fill('fixture-password')
    await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
    await page.waitForURL('**/admin/dashboard')
    await page.locator('.sales-chart canvas').waitFor()
    assert.equal(await page.locator('[data-metric="orders"] .metric-value').innerText(), '12')
    assert.equal(await page.locator('[data-metric="revenue"] .metric-value').innerText(), '$1,200.00')
    assert.equal(await page.locator('.metric-card').count(), 4)
    await page.getByRole('link', { name: '#FGX-TEST', exact: true }).waitFor()
    assert.match(await page.locator('.top-products').innerText(), /8 sold/)
    await page.screenshot({ path: 'test-artifacts/dashboard-desktop.png', fullPage: true })
    await page.getByLabel('Dashboard period', { exact: true }).selectOption('7')
    await page.waitForFunction(() => document.querySelector('[data-metric="orders"] .metric-value')?.textContent === '3')
    assert.equal(await page.locator('[data-metric="revenue"] .metric-value').innerText(), '$150.00')
    assert.ok(requests.some(request => request.url === '/api/v1/admin/dashboard?days=7'))
    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      if (width <= 760) await page.waitForFunction(() => document.querySelector('.sidebar')?.classList.contains('collapsed'))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Dashboard overflow at ${width}`)
      if (width === 390) await page.screenshot({ path: 'test-artifacts/dashboard-mobile.png', fullPage: true })
    }
    emptyDashboard = true
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('[data-metric="orders"] .metric-value').innerText(), '0')
    await page.getByText('No orders in this period.', { exact: true }).waitFor()
    await page.getByText('No paid product sales in this period.', { exact: true }).waitFor()
    assert.equal(await page.locator('.empty-ring').count(), 1)
    dashboardFailure = true
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('alert').filter({ hasText: 'We couldn’t load the dashboard.' }).waitFor()
    dashboardFailure = false
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await page.getByText('No orders in this period.', { exact: true }).waitFor()
    assert.deepEqual(errors, [])
    await restrictedContext.addCookies([{ name: 'fgx_admin_session', value: 'restricted-admin', url: base }])
    const restrictedPage = await restrictedContext.newPage()
    await restrictedPage.goto(`${base}/admin/dashboard`, { waitUntil: 'networkidle' })
    assert.equal(await restrictedPage.locator('.metric-card').count(), 1)
    assert.equal(await restrictedPage.locator('[data-metric="products"]').count(), 1)
    assert.equal(await restrictedPage.locator('.charts-grid, .tables-grid').count(), 0)
  } finally { emptyDashboard = false; dashboardFailure = false; await context.close(); await restrictedContext.close() }
})
