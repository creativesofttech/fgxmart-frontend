import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Exercise the built Nuxt server against an isolated API fixture. Laravel has its
// own authorization regression suite in tests/Feature/AdminAccessTest.php.
const legalDefaults = {
  'terms-and-conditions': {slug:'terms-and-conditions',title:'Terms & Conditions',content:'<h2>Using FGX MART</h2><p>Explore products and share your enquiry.</p>',updated_at:null},
  'privacy-policy': {slug:'privacy-policy',title:'Privacy Policy',content:'<h2>Your information</h2><p>Account details help us manage your enquiries.</p>',updated_at:null},
}
let legalFixtures = structuredClone(legalDefaults)
let legalSaveFailure = false
let faqFixtures = [], faqFailure = false
let companyInfoFixture = {company:null,bank:null}
let reviewFixtures = []
let reviewFailure = false
const reviewResponse = page => ({data:reviewFixtures.slice((page-1)*6,page*6),summary:{count:reviewFixtures.length,average:reviewFixtures.length ? Math.round(reviewFixtures.reduce((sum,review)=>sum+review.rating,0)/reviewFixtures.length*10)/10 : null,distribution:[5,4,3,2,1].map(rating=>({rating,count:reviewFixtures.filter(review=>Math.round(review.rating)===rating).length}))},meta:{current_page:page,last_page:Math.max(1,Math.ceil(reviewFixtures.length/6))}})
const requests = []
const tokens = new Set(['integration-admin', 'restricted-admin', 'legal-viewer-admin'])
const product = { id: 1, name: 'Test Product', slug: 'test-product', base_price: '10.00', discount_price: null, stock_quantity: 10, status: true, is_hot_deal: false, is_new_arrival: true, is_best_seller: false, cover_image_url: '/assets/images/home/cat-1.webp', countries: [], media: [], attribute_values: [] }
const publicProducts = [product,
  { ...product, id: 2, name: 'Second Product', slug: 'second-product', discount_price: '8.00', is_featured: true, is_new_arrival: false, is_hot_deal: true, cover_image_url: '/assets/images/home/cat-2.webp' },
  { ...product, id: 3, name: 'Third Product', slug: 'third-product', is_new_arrival: false, is_best_seller: true, cover_image_url: null, media: [{file_url: '/assets/images/home/cat-3.webp'}] },
  { ...product, id: 4, name: 'Fourth Product', slug: 'fourth-product', is_new_arrival: false, cover_image_url: null },
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
let zipcodeFixtures = []
const zipcodeCountries = [{ id: 1, name: 'India', code: 'IN' }, { id: 2, name: 'United States', code: 'US' }]
const countryFixtures = ['Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Japan', 'Nigeria', 'Pakistan', 'Russia', 'Saudi Arabia', 'South Africa', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States'].map((name, index) => ({ id: index + 1, name, status: name !== 'China' }))
let base, upstream, app, output = '', sessionCookie, browser
let zipcodeLookupFailure = false
const newTestContext = async (options = {}, savedLocation = true) => {
  const context = await browser.newContext(options)
  if (savedLocation) await context.addInitScript(() => {
    if (!localStorage.getItem('fgx-country')) localStorage.setItem('fgx-country', JSON.stringify({id:1,name:'Australia',zipcode:null}))
  })
  return context
}
const adminPaths = ['/admin', '/admin/dashboard', '/admin/analytics', '/admin/products', '/admin/products/create', '/admin/products/1/edit', '/admin/categories', '/admin/brands', '/admin/attributes', '/admin/countries', '/admin/zipcodes', '/admin/orders', '/admin/orders/FGX-TEST', '/admin/company-settings', '/admin/terms-and-conditions', '/admin/privacy-policy', '/admin/faqs', '/admin/pages', '/admin/pages/create', '/admin/pages/edit/1', '/admin/roles', '/admin/roles/create', '/admin/roles/1', '/admin/permissions']

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
      if (url.pathname.endsWith('/user')) return send(200, { data: { id: 1, name: 'Fixture Admin', email: 'admin@example.test', roles: token === 'integration-admin' ? ['super-admin'] : ['viewer'], permissions: token === 'restricted-admin' ? ['products.index'] : token === 'legal-viewer-admin' ? ['legal-pages.index'] : [] } })
      if (url.pathname.startsWith('/api/v1/admin/legal-pages/')) {
        if(token === 'restricted-admin' || (token === 'legal-viewer-admin' && req.method !== 'GET'))return send(403,{message:'Forbidden'})
        const slug=url.pathname.split('/').at(-1)
        if(!legalFixtures[slug])return send(404,{message:'Not found'})
        if(req.method === 'PUT') {
          if(legalSaveFailure)return send(422,{errors:{title:['Please enter a valid page title.']}})
          const body=JSON.parse(raw)
          legalFixtures[slug]={slug,title:body.title,content:body.content,updated_at:'2026-11-18T12:00:00Z'}
        }
        return send(200,{data:legalFixtures[slug],message:'Page saved successfully.'})
      }
      if (/\/zipcodes(?:\/\d+)?$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').at(-1))
        if (req.method === 'GET') return send(200, { data: zipcodeFixtures, countries: zipcodeCountries, configured_country_ids: zipcodeFixtures.map(row => row.country_id), current_page: 1, last_page: 1, total: zipcodeFixtures.length, from: zipcodeFixtures.length ? 1 : null, to: zipcodeFixtures.length || null })
        if (req.method === 'DELETE') { zipcodeFixtures = zipcodeFixtures.filter(row => row.id !== id); return send(200, { message: 'Deleted' }) }
        const body = JSON.parse(raw)
        if (body.zipcodes === 'invalid!') return send(422, { message: 'Validation failed', errors: { zipcodes: ['Use letters, digits, spaces and hyphens only.'] } })
        const row = { id: Number.isNaN(id) ? 1 : id, country_id: body.country_id, zipcodes: [...new Set(body.zipcodes.split(',').map(code => code.trim().toUpperCase()))].join(', '), country: zipcodeCountries.find(country => country.id === body.country_id) }
        zipcodeFixtures = [row]
        return send(req.method === 'POST' ? 201 : 200, { data: row, message: 'Saved' })
      }
      if (url.pathname.endsWith('/dashboard')) return dashboardFailure ? send(500, { message: 'Fixture failure' }) : send(200, { data: dashboardFixture(Number(url.searchParams.get('days') || 30), token === 'restricted-admin') })
      if (url.pathname.endsWith('/logout')) { tokens.delete(token); return send(200, { message: 'Logged out.' }) }
      if (url.searchParams.has('fail')) return send(500, { message: 'Private database trace', trace: 'SECRET' })
      if (url.pathname.endsWith('/products/generate-sku')) return send(200, { sku: 'TEST-SKU' })
      if (/\/products\/1$/.test(url.pathname)) return send(200, { data: product })
      if (req.method !== 'GET') return send(200, { status: 'success', data: { id: 1, ...product }, message: 'Saved' })
      if (url.pathname.endsWith('/company-settings')) return send(200, { data: null })
      if (url.pathname.endsWith('/products')) return send(200, { data: [product], total: 1, current_page: 1, last_page: 1 })
      if (url.pathname.endsWith('/categories')) return send(200, { data: categoryFixtures, total: 1, current_page: 1, last_page: 1 })
      if (url.pathname.endsWith('/brands')) return send(200, { data: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: index === 0 ? 'Tata Sampann' : `Brand ${index + 1}`, slug: `brand-${index + 1}`, status: true })), total: 12, current_page: 1, last_page: 1 })
      if (url.pathname.endsWith('/attributes')) return send(200, { data: [{ id: 1, name: 'Size', values: [{ id: 10, value: 'Small' }, { id: 11, value: 'Large' }] }] })
      return send(200, { status: 'success', data: [], total: 0, current_page: 1, last_page: 1 })
    }
    if (/^\/api\/v1\/countries\/\d+\/zipcodes$/.test(url.pathname)) {
      if (zipcodeLookupFailure) return send(500, {message:'Lookup failed'})
      const countryId = Number(url.pathname.split('/').at(-2))
      const country = countryFixtures.find(country => country.id === countryId && country.status)
      if (!country) return send(404, {message:'Not found'})
      const saved = zipcodeFixtures.find(row => row.country_id === countryId)?.zipcodes || ''
      return send(200, {data:saved.split(',').map(code=>code.trim()).filter(Boolean)})
    }
    if (url.pathname === '/api/v1/countries') return send(200, { data: url.searchParams.has('all') ? countryFixtures : countryFixtures.slice(0, 10), total: countryFixtures.length })
    if (url.pathname.startsWith('/api/v1/legal-pages/')) {
      const data=legalFixtures[url.pathname.split('/').at(-1)]
      return data ? send(200,{data}) : send(404,{message:'Not found'})
    }
    if (url.pathname === '/api/v1/faqs') return faqFailure ? send(500,{message:'Unavailable'}) : send(200,{data:faqFixtures})
    if (url.pathname.endsWith('/company-info')) return send(200, { status: 'success', data: companyInfoFixture })
    if (url.pathname.endsWith('/categories')) return send(200, { data: categoryFixtures.map(category => renamedCategory && category.id === 1 ? { ...category, name: 'Food & Pantry', short_description: 'A description edited in admin', image_url: '/assets/images/home/cat-4.webp' } : category) })
    if (url.pathname === '/api/v1/products/test-product') return send(200,{data:product})
    if (url.pathname === '/api/v1/products/1/review') return send(200,{data:reviewFixtures.find(review=>review.id===1)||null})
    if (url.pathname === '/api/v1/products/1/reviews') {
      if(req.method==='POST') {
        if(!req.headers.authorization)return send(401,{message:'Unauthenticated'})
        if(reviewFailure)return send(422,{errors:{review:['Please provide a more detailed review.']}})
        const body=JSON.parse(raw)
        const saved={id:1,name:'Fixture Customer',rating:body.rating,review:body.review,created_at:'2026-11-18T10:00:00Z',is_approved:true}
        reviewFixtures=[saved,...reviewFixtures.filter(review=>review.id!==1)]
        return send(200,{data:saved,message:'Thank you. Your review has been saved.'})
      }
      return send(200,reviewResponse(Number(url.searchParams.get('page')||1)))
    }
    if (url.pathname.endsWith('/products')) {
      let data = publicProductMode === 'empty' || (publicProductMode === 'fallback' && url.searchParams.has('is_featured')) ? [] : publicProducts
      for (const flag of ['is_hot_deal', 'is_new_arrival', 'is_best_seller']) if (url.searchParams.get(flag) === '1') data = data.filter(item => item[flag])
      const categoryIds = [...url.searchParams].filter(([key]) => key.startsWith('category_ids[')).map(([, value]) => Number(value))
      if (categoryIds.length) {
        const included = new Set(categoryIds.flatMap(id => [id, ...categoryFixtures.filter(category => category.parent_id === id).map(category => category.id)]))
        data = data.filter(item => included.has(item.category_id))
      }
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
  for (const path of ['/admin/orders', '/admin/products/create', '/admin/products/1/edit', '/admin/roles', '/admin/zipcodes', '/admin/terms-and-conditions', '/admin/privacy-policy']) {
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
  const context = await newTestContext()
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
  assert.equal(await page.locator('.sidebar .submenu').count(), 0)
  assert.equal(await page.locator('.sidebar .parent-item[aria-expanded="false"]').count(), 3)
  await page.locator('.sidebar').getByRole('button', { name: 'Product Settings', exact: true }).click()
  assert.equal(await page.locator('.sidebar .submenu').evaluate(menu => getComputedStyle(menu, '::before').display), 'none')
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
  await page.locator('#cat-parent').click()
  await page.getByRole('option', { name: 'Packed Food', exact: true }).click()
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
  await page.goto(`${base}/products`, { waitUntil: 'networkidle' })
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
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 } })
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
  await page.locator('.sidebar').getByRole('button', { name: 'Product Settings', exact: true }).click()
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
  const context = await newTestContext({ viewport: { width: 1440, height: 900 } })
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
  const context = await newTestContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/`)
  assert.equal(await page.locator('.category-card').count(), 4)
  const arrivals = page.getByRole('region', { name: 'New Arrivals', exact: true })
  assert.equal(await arrivals.locator('.collection-link').count(), 1)
  assert.equal(await arrivals.locator('.collection-link').first().getAttribute('href'), '/products/test-product')
  assert.equal(await arrivals.locator('img').evaluateAll(images => images.every(image => image.getAttribute('src') === '/assets/images/home/cat-1.webp')), true)
  const bestSellers = page.getByRole('region', { name: 'Best Sellers', exact: true })
  assert.equal(await bestSellers.locator('.collection-card').count(), 1)
  assert.equal(await bestSellers.locator('.collection-link').count(), 1)
  assert.equal(await bestSellers.locator('img').getAttribute('src'), '/assets/images/home/cat-3.webp')
  assert.equal(await page.locator('.brand-tile').count(), 9)
  assert.equal(await page.locator('.home-brands img').count(), 0)
  assert.equal(await page.getByRole('link', { name: 'Start shopping now', exact: true }).getAttribute('href'), '/products')
  assert.equal(await page.locator('footer').count(), 1)
  assert.equal(await page.locator('footer .footer-logo img').getAttribute('src'), '/images/logo/fgx-logo-light.png')
  assert.equal(await page.locator('footer a').evaluateAll(links => links.some(link => !link.getAttribute('href') || link.getAttribute('href') === '#')), false)
  assert.equal(await page.locator('.catalogue-card:not(.is-preview)').count(), 4)
  assert.equal(await page.locator('.category-card img').evaluateAll(images => images.every(image => image.getAttribute('src').endsWith('.webp'))), true)
  const firstCard = page.locator('.catalogue-card').first()
  assert.equal(await firstCard.locator('img').getAttribute('src'), '/assets/images/home/cat-1.webp')
  await firstCard.getByRole('button', { name: 'Add to cart', exact: true }).click()
  await firstCard.getByRole('button', { name: 'Added to cart' }).waitFor()
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
    const context = await newTestContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`${base}/`)
    assert.equal(await page.locator('.catalogue-card.is-preview').count(), 4)
    assert.equal(await page.locator('.catalogue-card .enquiry-button:disabled').count(), 4)
    assert.equal(await page.locator('.catalogue-card .wishlist-button').count(), 0)
    assert.equal(await page.locator('.product-collection .collection-card').count(), 0)
    assert.equal(await page.locator('.product-collection .collection-link').count(), 0)
    await page.screenshot({ path: 'test-artifacts/home-sections-empty.png', fullPage: true })
    await context.close()
  } finally { publicProductMode = 'normal' }
})

test('shopping navigation opens dedicated collection pages and explicit hot deals without focus borders', async () => {
  const context = await newTestContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${base}/`)
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true })
  assert.deepEqual(await nav.locator('a').allTextContents(), ['Home', 'Hot Deals', 'New Arrivals', 'Best Sellers'])
  assert.equal(await page.getByRole('link', { name: 'Browse catalogue', exact: true }).count(), 0)
  const home = nav.getByRole('link', { name: 'Home', exact: true })
  await home.focus()
  assert.equal(await home.evaluate(element => getComputedStyle(element).outlineStyle), 'none')
  assert.equal(await home.evaluate(element => getComputedStyle(element, '::after').height), '2px')
  for (const [label, path, productName, flag] of [['New Arrivals', '/new-arrivals', 'Test Product', 'is_new_arrival'], ['Best Sellers', '/best-sellers', 'Third Product', 'is_best_seller']]) {
    await nav.getByRole('link', { name: label, exact: true }).click()
    await page.waitForURL(url => url.pathname === path && !url.hash)
    await page.getByRole('heading', { name: label, level: 1, exact: true }).waitFor()
    await page.getByRole('heading', { name: productName, exact: true }).waitFor()
    assert.equal(await page.title(), `${label} - FGXMART`)
    assert.equal(await page.locator('.product-card').count(), 1)
    assert.equal(await nav.getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page')
    assert.equal(await nav.getByRole('link', { name: label, exact: true }).evaluate(element => getComputedStyle(element).outlineStyle), 'none')
    const sortResponse = page.waitForResponse(response => response.url().includes(`${flag}=1`) && response.url().includes('sort=price_asc'))
    await page.getByRole('combobox', { name: 'Sort products', exact: true }).click()
    await page.getByRole('option', { name: 'Price: Low to High', exact: true }).click()
    await sortResponse
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: productName, exact: true }).waitFor()
    assert.equal((await fetch(`${base}${path}`)).status, 200)
  }
  await nav.getByRole('link', { name: 'Hot Deals', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('deals') === '1')
  await page.getByRole('heading', { name: 'Hot Deals', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Second Product', exact: true }).waitFor()
  assert.ok(requests.some(request => request.url.includes('is_hot_deal=1')))
  assert.equal(await nav.getByRole('link', { name: 'Hot Deals', exact: true }).getAttribute('aria-current'), 'page')
  await context.close()
})

test('category cards follow admin data and child flyouts support touch and keyboard', async () => {
  renamedCategory = true
  const context = await newTestContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
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
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
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
  const context = await newTestContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
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
  const context = await newTestContext({ viewport: { width: 1440, height: 950 }, reducedMotion: 'no-preference' })
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
  const context = await newTestContext({ viewport: { width: 1600, height: 1100 }, reducedMotion: 'reduce' })
  const restrictedContext = await newTestContext()
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
    await page.getByRole('combobox', { name: 'Dashboard period', exact: true }).click()
    await page.getByRole('option', { name: 'Last 7 days', exact: true }).click()
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

test('shared admin dialogs keep focused fields and footer actions inside their padded card', { timeout: 120_000 }, async () => {
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${base}/admin-access`)
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  const cases = [
    ['brands', 'Create Brand'], ['categories', 'Create Category'], ['attributes', 'Create Attribute'],
    ['countries', 'Create Country'], ['permissions', 'Create Permission'], ['faqs', 'Add New FAQ'],
  ]
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 700 : 1000 })
    for (const [resource, title] of cases) {
      await page.goto(`${base}/admin/${resource}`, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: new RegExp(title) }).click()
      const dialog = page.getByRole('dialog', { name: title, exact: true })
      await dialog.waitFor()
      await dialog.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)))
      const field = dialog.locator('.modal-content input:not([type=checkbox]):not([type=file]):not([hidden]), .modal-content textarea').first()
      await field.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      const geometry = await field.evaluate(element => {
        const field = element.getBoundingClientRect(), body = element.closest('.modal-content').getBoundingClientRect()
        const style = getComputedStyle(element), ring = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset))
        return { left: field.left - body.left, right: body.right - field.right, ring, horizontalOverflow: element.closest('.modal-content').scrollWidth > element.closest('.modal-content').clientWidth }
      })
      assert.ok(geometry.left >= Math.max(6, geometry.ring), `${title}: focused left edge clipped at ${width}`)
      assert.ok(geometry.right >= Math.max(6, geometry.ring), `${title}: focused right edge clipped at ${width}`)
      assert.equal(geometry.horizontalOverflow, false, `${title}: form must fit horizontally`)
      const footer = dialog.locator('.modal-footer')
      if (await footer.count()) {
        assert.ok(await footer.evaluate(element => { const footer = element.getBoundingClientRect(), card = element.closest('.admin-modal-box').getBoundingClientRect(); return footer.bottom <= card.bottom + 1 && footer.top >= card.top }))
      }
      if (resource === 'brands') await page.screenshot({ path: `test-artifacts/brand-dialog-spacing-${width}.png`, fullPage: true })
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden' })
    }
  }
  await context.close()
})

test('custom dropdowns support search, keyboard selection, clear and dialog layering', { timeout: 120_000 }, async () => {
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/admin-access`)
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.goto(`${base}/admin/products/create`, { waitUntil: 'networkidle' })
  const brand = page.getByRole('combobox', { name: 'Select Brand', exact: true })
  await brand.click()
  await page.getByRole('combobox', { name: 'Search Select Brand', exact: true }).fill('Brand 7')
  await page.getByRole('option', { name: 'Brand 7', exact: true }).click()
  assert.equal(await brand.innerText(), 'Brand 7')
  await brand.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  assert.equal(await brand.innerText(), 'Brand 8')
  await brand.click()
  await page.getByRole('option', { name: 'Clear selection', exact: true }).click()
  assert.equal(await brand.innerText(), 'Select Brand')
  await brand.click()
  await page.getByRole('heading', { name: 'Create New Product', exact: true }).click()
  assert.equal(await page.getByRole('listbox').count(), 0)
  await brand.click()
  await page.getByRole('combobox', { name: 'Search Select Brand', exact: true }).fill('Tata')
  await page.getByRole('option', { name: 'Tata Sampann', exact: true }).waitFor()
  await page.screenshot({ path: 'test-artifacts/custom-brand-dropdown.png', fullPage: true })
  await page.keyboard.press('Escape')
  assert.equal(await brand.evaluate(element => document.activeElement === element), true)
  await page.getByRole('button', { name: 'Add Variation', exact: true }).click()
  const attribute = page.getByRole('combobox', { name: 'Attribute value', exact: true })
  await attribute.click()
  assert.equal(await page.locator('.select-group').textContent(), 'Size')
  await page.getByRole('option', { name: 'Large', exact: true }).click()
  assert.equal(await attribute.innerText(), 'Large')
  await page.goto(`${base}/admin/categories`)
  await page.getByRole('button', { name: 'Create Category' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Category', exact: true })
  const parent = dialog.getByRole('combobox', { name: 'Parent category', exact: true })
  await parent.click()
  assert.equal(await page.locator('.select-popover').evaluate(element => element.matches(':popover-open')), true)
  await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), true, 'Escape closes the dropdown before its containing dialog')
  await parent.click()
  await page.getByRole('option', { name: 'Packed Food', exact: true }).click()
  assert.equal(await parent.innerText(), 'Packed Food')
  await page.setViewportSize({ width: 390, height: 700 })
  await parent.click()
  assert.ok(await page.locator('.select-popover').evaluate(element => { const bounds = element.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight }))
  await page.getByRole('option', { name: 'Clothing', exact: true }).click()
  assert.equal(await parent.innerText(), 'Clothing')
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.goto(`${base}/products`, { waitUntil: 'networkidle' })
  const sort = page.getByRole('combobox', { name: 'Sort products', exact: true })
  await sort.click()
  await page.screenshot({ path: 'test-artifacts/custom-sort-dropdown.png', fullPage: true })
  await page.getByRole('option', { name: 'Price: Low to High', exact: true }).click()
  assert.equal(await sort.innerText(), 'Price: Low to High')
  assert.deepEqual(errors, [])
  await context.close()
})

test('Tiptap product descriptions keep tag and font changes local and save HTML on create and edit', { timeout: 120_000 }, async () => {
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/admin-access`, { waitUntil: 'networkidle' })
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.goto(`${base}/admin/products/create`, { waitUntil: 'networkidle' })
  const editor = page.getByRole('textbox', { name: 'Description', exact: true })
  await editor.fill('First heading')
  await editor.press('Enter'); await page.keyboard.insertText('Second heading')
  await editor.press('Enter'); await page.keyboard.insertText('Body copy')
  const select = async (label, option) => {
    await page.getByRole('combobox', { name: label, exact: true }).click()
    await page.getByRole('option', { name: option, exact: true }).click()
  }
  await editor.locator('p').nth(0).click()
  await select('Text block', 'H2 — Heading'); await select('Font size', '22px')
  await editor.locator('p').nth(0).click()
  await select('Text block', 'H3 — Heading'); await select('Font size', '18px')
  await editor.locator('p').click(); await select('Font size', '14px')
  assert.equal(await editor.locator('h2').getAttribute('style'), 'font-size: 22px;')
  assert.equal(await editor.locator('h3').getAttribute('style'), 'font-size: 18px;')
  assert.equal(await editor.locator('p').getAttribute('style'), 'font-size: 14px;')
  // A selection across all three tags must still update only its starting tag.
  await editor.evaluate(element => {
    const range = document.createRange(); range.setStart(element.firstElementChild.firstChild, 0); range.setEnd(element.lastElementChild.firstChild, 4)
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
    element.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('selectionchange'))
  })
  await select('Font size', '20px')
  assert.equal(await editor.locator('h2').getAttribute('style'), 'font-size: 20px;')
  assert.equal(await editor.locator('h3').getAttribute('style'), 'font-size: 18px;')
  assert.equal(await editor.locator('p').getAttribute('style'), 'font-size: 14px;')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  assert.equal(await editor.locator('h2').getAttribute('style'), 'font-size: 22px;')
  const savedHTML = await editor.innerHTML()
  await page.getByPlaceholder('Enter product name', { exact: true }).fill('Rich description product')
  await page.getByRole('button', { name: 'Save Product', exact: true }).click()
  await page.waitForURL('**/admin/products')
  assert.ok(requests.some(request => request.url === '/api/v1/admin/products' && request.body.includes(savedHTML)), 'Create submits formatted HTML')
  product.description = savedHTML
  try {
    await page.goto(`${base}/admin/products/1/edit`, { waitUntil: 'networkidle' })
    await editor.locator('h2').waitFor()
    assert.equal(await editor.locator('h3').getAttribute('style'), 'font-size: 18px;')
    await editor.locator('h3').click()
    assert.equal(await page.getByRole('combobox', { name: 'Font size', exact: true }).innerText(), '18px')
    await select('Text block', 'P — Paragraph')
    assert.equal(await editor.locator('h3').count(), 0)
    assert.equal(await editor.locator('p').first().getAttribute('style'), 'font-size: 18px;')
    await page.setViewportSize({ width: 390, height: 844 })
    assert.ok(await page.locator('.rich-toolbar').evaluate(element => element.getBoundingClientRect().right <= innerWidth))
    await page.screenshot({ path: 'test-artifacts/tiptap-product-mobile.png', fullPage: true })
    const updatedHTML = await editor.innerHTML()
    await page.getByRole('button', { name: 'Update Product', exact: true }).click()
    await page.waitForURL('**/admin/products')
    assert.ok(requests.some(request => request.url === '/api/v1/admin/products/1' && request.body.includes(updatedHTML)), 'Edit submits updated HTML')
  } finally { delete product.description; await context.close() }
  assert.deepEqual(errors, [])
})

test('product forms use dependent categories, preserve HSN codes and left-align dropdown options', { timeout: 120_000 }, async () => {
  const context = await newTestContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage(); const errors=[]; page.on('pageerror', error=>errors.push(error.message))
  await page.goto(`${base}/admin-access`, { waitUntil: 'networkidle' })
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Login to dashboard', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.goto(`${base}/admin/products/create`, { waitUntil: 'networkidle' })
  const main = page.getByRole('combobox', { name: 'Main Category', exact: true })
  const sub = page.getByRole('combobox', { name: 'Sub Category', exact: true })
  const chooseMain = async name => { await main.click(); await page.getByRole('option', { name, exact:true }).click() }
  assert.equal(await sub.isDisabled(), true)
  await main.click()
  assert.equal(await page.getByRole('option', { name:'Snacks', exact:true }).count(), 0)
  const option = page.getByRole('option', { name:'Packed Food', exact:true })
  assert.ok(await option.evaluate(element => {
    const label=element.querySelector('.option-copy').getBoundingClientRect(), row=element.getBoundingClientRect()
    return getComputedStyle(element).flexDirection === 'row' && label.left-row.left < 20 && label.left-row.left >= 0
  }))
  await page.screenshot({ path:'test-artifacts/product-main-category-options.png', fullPage:true })
  await option.click()
  assert.equal(await sub.isDisabled(), false)
  await sub.click(); await page.getByRole('option', { name:'Snacks', exact:true }).click()
  await chooseMain('Clothing')
  assert.equal(await sub.isDisabled(), true)
  assert.equal(await sub.innerText(), 'No subcategories available')
  await chooseMain('Packed Food'); await sub.click(); await page.getByRole('option', { name:'Snacks', exact:true }).click()
  await page.getByLabel('HSN Code (Optional)', { exact:true }).fill('001234')
  await page.getByLabel('Weight / Volume (for SKU)', { exact:true }).fill('1KG')
  await page.getByPlaceholder('Enter product name', { exact:true }).fill('Product with HSN')
  await page.getByRole('button', { name:'Save Product', exact:true }).click(); await page.waitForURL('**/admin/products')
  const field = (body, name) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]
  const created = requests.findLast(request => request.method==='POST' && request.url==='/api/v1/admin/products')
  assert.equal(field(created.body,'category_id'), '2')
  assert.equal(field(created.body,'main_category_id'), '1')
  assert.equal(field(created.body,'sub_category_id'), '2')
  assert.equal(field(created.body,'hsn_code'), '001234')
  assert.equal(field(created.body,'variation_code'), '1KG')
  Object.assign(product, {category_id:2, hsn_code:'001234'})
  try {
    await page.goto(`${base}/admin/products/1/edit`, { waitUntil:'networkidle' })
    assert.equal(await main.innerText(), 'Packed Food')
    assert.equal(await sub.innerText(), 'Snacks')
    assert.equal(await page.getByLabel('HSN Code (Optional)', { exact:true }).inputValue(), '001234')
    await chooseMain('Clothing')
    assert.equal(await sub.isDisabled(), true)
    await page.getByLabel('HSN Code (Optional)', { exact:true }).fill('')
    await page.getByRole('button', { name:'Update Product', exact:true }).click(); await page.waitForURL('**/admin/products')
    const updated=requests.findLast(request => request.url==='/api/v1/admin/products/1' && request.method==='POST')
    assert.equal(field(updated.body,'category_id'), '3')
    assert.equal(field(updated.body,'sub_category_id'), '')
    assert.equal(field(updated.body,'hsn_code'), '')
  } finally { delete product.category_id; delete product.hsn_code; await context.close() }
  assert.deepEqual(errors, [])
})

test('zipcode management appears below Countries and supports country selection, validation, edit and delete', { timeout: 120_000 }, async () => {
  const context = await newTestContext({ viewport: { width:1440, height:1000 }, reducedMotion:'reduce' })
  const page = await context.newPage(); const errors=[]; page.on('pageerror', error=>errors.push(error.message))
  await page.goto(`${base}/admin-access`, { waitUntil:'networkidle' })
  await page.getByLabel('Email address', { exact:true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact:true }).fill('fixture-password')
  await page.getByRole('button', { name:'Login to dashboard', exact:true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.getByRole('button', { name:'Core Settings', exact:true }).click()
  const coreLinks = await page.locator('.submenu a').allTextContents()
  assert.equal(coreLinks.indexOf('Zipcodes'), coreLinks.indexOf('Countries') + 1)
  await page.getByRole('link', { name:'Zipcodes', exact:true }).click()
  await page.getByRole('heading', { name:'Zipcodes', exact:true, level:1 }).waitFor()
  await page.getByRole('button', { name:'Add Zipcodes', exact:false }).click()
  const dialog=page.getByRole('dialog', { name:'Add Zipcodes', exact:true })
  await dialog.getByRole('combobox', { name:'Country', exact:true }).click()
  await page.getByRole('option', { name:'India (IN)', exact:true }).click()
  await dialog.getByLabel('Zipcodes', { exact:false }).fill('invalid!')
  await dialog.getByRole('button', { name:'Save Zipcodes', exact:true }).click()
  await dialog.getByText('Use letters, digits, spaces and hyphens only.', { exact: true }).waitFor()
  await dialog.getByLabel('Zipcodes', { exact:false }).fill('00123, 560001, 00123')
  await dialog.getByRole('button', { name:'Save Zipcodes', exact:true }).click()
  await dialog.waitFor({state:'hidden'})
  await page.getByText('00123, 560001', { exact:true }).waitFor()
  await page.getByRole('button', { name:'Edit zipcodes for India', exact:true }).click()
  const edit=page.getByRole('dialog', { name:'Edit Zipcodes', exact:true })
  assert.equal(await edit.getByLabel('Zipcodes', { exact:false }).inputValue(), '00123, 560001')
  await page.setViewportSize({width:390,height:844})
  await edit.getByRole('combobox', { name:'Country', exact:true }).click()
  assert.ok(await page.locator('.select-popover').evaluate(element => {const bounds=element.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth&&bounds.bottom<=innerHeight}))
  await page.keyboard.press('Escape')
  await edit.getByLabel('Zipcodes', { exact:false }).fill('00001, 00002')
  await page.screenshot({path:'test-artifacts/zipcodes-mobile.png',fullPage:true})
  await edit.getByRole('button', { name:'Save Zipcodes', exact:true }).click()
  await edit.waitFor({state:'hidden'})
  await page.getByText('00001, 00002', { exact:true }).waitFor()
  await page.getByRole('button', { name:'Delete zipcodes for India', exact:true }).click()
  await page.getByRole('dialog', { name:'Delete Zipcodes', exact:true }).getByRole('button', {name:'Delete',exact:true}).click()
  await page.getByRole('dialog', { name:'Delete Zipcodes', exact:true }).waitFor({state:'hidden'})
  assert.equal(zipcodeFixtures.length,0)
  assert.deepEqual(errors,[])
  await context.close()
})

test('homepage switches persist on create and edit and collections use real product images with fallbacks', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto(`${base}/admin-access`,{waitUntil:'networkidle'})
  await page.getByLabel('Email address',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password')
  await page.getByRole('button',{name:'Login to dashboard',exact:true}).click();await page.waitForURL('**/admin/dashboard')
  await page.goto(`${base}/admin/products/create`,{waitUntil:'networkidle'})
  for(const label of ['Hot Deal','New Arrival','Best Seller']) assert.equal(await page.getByRole('switch',{name:label,exact:true}).isChecked(),false)
  await page.getByRole('switch',{name:'Hot Deal',exact:true}).check();await page.getByRole('switch',{name:'New Arrival',exact:true}).check()
  await page.locator('.homepage-settings').scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/product-homepage-switches.png',fullPage:true})
  await page.getByPlaceholder('Enter product name',{exact:true}).fill('Homepage product')
  await page.getByRole('button',{name:'Save Product',exact:true}).click();await page.waitForURL('**/admin/products')
  const field=(body,name)=>body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]
  const created=requests.findLast(request=>request.method==='POST'&&request.url==='/api/v1/admin/products')
  assert.equal(field(created.body,'is_hot_deal'),'1');assert.equal(field(created.body,'is_new_arrival'),'1');assert.equal(field(created.body,'is_best_seller'),'0')
  const original={is_hot_deal:product.is_hot_deal,is_new_arrival:product.is_new_arrival,is_best_seller:product.is_best_seller,cover_image_url:product.cover_image_url,media:product.media}
  try {
    Object.assign(product,{is_hot_deal:true,is_new_arrival:false,is_best_seller:true})
    await page.goto(`${base}/admin/products/1/edit`,{waitUntil:'networkidle'})
    assert.equal(await page.getByRole('switch',{name:'Hot Deal',exact:true}).isChecked(),true)
    assert.equal(await page.getByRole('switch',{name:'New Arrival',exact:true}).isChecked(),false)
    assert.equal(await page.getByRole('switch',{name:'Best Seller',exact:true}).isChecked(),true)
    await page.getByRole('switch',{name:'Hot Deal',exact:true}).uncheck();await page.getByRole('switch',{name:'New Arrival',exact:true}).check();await page.getByRole('switch',{name:'Best Seller',exact:true}).uncheck()
    await page.getByRole('button',{name:'Update Product',exact:true}).click();await page.waitForURL('**/admin/products')
    const updated=requests.findLast(request=>request.method==='POST'&&request.url==='/api/v1/admin/products/1')
    assert.equal(field(updated.body,'is_hot_deal'),'0');assert.equal(field(updated.body,'is_new_arrival'),'1');assert.equal(field(updated.body,'is_best_seller'),'0')
    Object.assign(product,original)
    await page.goto(`${base}/`,{waitUntil:'networkidle'})
    for(const [title,name,image] of [['Hot Deals','Second Product','cat-2.webp'],['New Arrivals','Test Product','cat-1.webp'],['Best Sellers','Third Product','cat-3.webp']]) {
      const section=page.getByRole('region',{name:title,exact:true})
      assert.equal(await section.locator('.collection-link').count(),1)
      assert.equal(await section.getByRole('heading',{level:3}).innerText(),name)
      assert.ok((await section.locator('img').getAttribute('src')).endsWith(image))
    }
    product.cover_image_url='/assets/missing-cover.webp';product.media=[{file_url:'/assets/images/home/cat-4.webp'}]
    await page.reload({waitUntil:'networkidle'})
    const image=page.locator('.home-featured .catalogue-card img').first();await image.scrollIntoViewIfNeeded()
    await page.waitForFunction(()=>document.querySelector('.home-featured .catalogue-card img')?.getAttribute('src')==='/assets/images/home/cat-4.webp')
    product.media=[];await page.reload({waitUntil:'networkidle'});await image.scrollIntoViewIfNeeded()
    await page.waitForFunction(()=>document.querySelector('.home-featured .catalogue-card img')?.getAttribute('src')==='/assets/images/home/product-placeholder.webp')
  } finally {Object.assign(product,original);await context.close()}
  assert.deepEqual(errors,[])
})

test('category checkboxes expand child categories, combine filters and keep logos free of focus borders', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const previous=publicProducts.map(item=>item.category_id)
  publicProducts.forEach((item,index)=>item.category_id=[2,3,4,5][index])
  const count=async value=>page.waitForFunction(value=>document.querySelectorAll('.product-card').length===value,value)
  try {
    await page.goto(`${base}/products`,{waitUntil:'networkidle'})
    const logo=page.locator('.brand-link');await logo.focus()
    assert.equal(await logo.evaluate(element=>getComputedStyle(element).outlineStyle),'none')
    const footerLogo=page.locator('.footer-logo');await footerLogo.focus()
    assert.equal(await footerLogo.evaluate(element=>getComputedStyle(element).outlineStyle),'none')
    const filters=page.locator('.category-filters')
    assert.equal(await filters.getByRole('checkbox').count(),4)
    assert.equal(await filters.getByRole('checkbox',{name:'Snacks',exact:true}).count(),0)
    assert.equal(await filters.getByRole('button',{name:'Expand Clothing subcategories',exact:true}).count(),0)
    const parent=filters.getByRole('checkbox',{name:'Packed Food',exact:true})
    await parent.check();await count(1)
    await page.getByRole('heading',{name:'Test Product',exact:true}).waitFor()
    const expand=filters.getByRole('button',{name:'Expand Packed Food subcategories',exact:true})
    await expand.focus();await expand.press('Enter')
    const child=filters.getByRole('checkbox',{name:'Snacks',exact:true})
    assert.equal(await child.isChecked(),true)
    await child.uncheck();await count(4)
    await child.check();await count(1)
    assert.equal(await parent.evaluate(element=>element.indeterminate),true)
    await filters.getByRole('checkbox',{name:'Clothing',exact:true}).check();await count(2)
    assert.equal(await parent.isChecked(),false)
    await page.getByRole('heading',{name:'Second Product',exact:true}).waitFor()
    await page.setViewportSize({width:390,height:844})
    await filters.scrollIntoViewIfNeeded()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:'test-artifacts/category-checkboxes-mobile.png',fullPage:true})
    await filters.getByRole('button',{name:'Collapse Packed Food subcategories',exact:true}).click()
    assert.equal(await filters.getByRole('checkbox',{name:'Snacks',exact:true}).count(),0)
    await filters.getByRole('button',{name:'All Products',exact:true}).click();await count(4)
    await page.goto(`${base}/new-arrivals`,{waitUntil:'networkidle'})
    const response=page.waitForResponse(response=>response.url().includes('category_ids')&&response.url().includes('is_new_arrival=1'))
    await page.getByRole('checkbox',{name:'Packed Food',exact:true}).check();await response;await count(1)
    assert.equal(new URL(page.url()).pathname,'/new-arrivals')
  } finally {publicProducts.forEach((item,index)=>{if(previous[index]===undefined)delete item.category_id;else item.category_id=previous[index]});await context.close()}
  assert.deepEqual(errors,[])
})

test('quick view shows only the short summary and supports compact mobile layout, enquiry and options', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const original={summary:product.summary,description:product.description,attribute_values:product.attribute_values}
  try {
    Object.assign(product,{summary:'A short summary for a quick decision.',description:'<p>FULL DESCRIPTION MUST STAY ON THE DETAILS PAGE.</p>'.repeat(30)})
    await page.goto(`${base}/products`,{waitUntil:'networkidle'})
    const trigger=page.getByRole('button',{name:'Quick view Test Product',exact:true})
    await page.locator('.product-image-container').first().hover();await trigger.click()
    const dialog=page.getByRole('dialog',{name:'Quick view: Test Product',exact:true})
    await dialog.waitFor()
    assert.match(await dialog.innerText(),/A short summary for a quick decision/)
    assert.doesNotMatch(await dialog.innerText(),/FULL DESCRIPTION/)
    assert.doesNotMatch(await dialog.innerText(),/8 Reviews/)
    assert.equal(await dialog.locator('.quick-visual img').getAttribute('src'),'/assets/images/home/cat-1.webp')
    assert.ok(await dialog.locator('.quick-view-box').evaluate(element=>element.getBoundingClientRect().height<750))
    await dialog.getByRole('button',{name:'Increase quantity',exact:true}).click()
    await dialog.getByRole('button',{name:'Add to cart',exact:true}).click()
    await dialog.getByRole('status').getByText('2 items added to your cart.',{exact:true}).waitFor()
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('guest_cart'))[0].quantity),2)
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'})
    assert.equal(await trigger.evaluate(element=>document.activeElement===element),true)
    await page.setViewportSize({width:390,height:700})
    await trigger.focus();await trigger.press('Enter');await dialog.waitFor()
    assert.equal(await dialog.getByLabel('Quantity',{exact:true}).inputValue(),'1')
    assert.ok(await dialog.locator('.quick-view-box').evaluate(element=>{const bounds=element.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth&&bounds.top>=0&&bounds.bottom<=innerHeight}))
    assert.ok(await dialog.locator('.quick-actions').evaluate(element=>element.getBoundingClientRect().bottom<=innerHeight))
    await page.screenshot({path:'test-artifacts/quick-view-mobile.png',fullPage:true})
    await dialog.getByRole('link',{name:'View details',exact:false}).click();await page.waitForURL('**/products/test-product')
    product.attribute_values=[{id:10,value:'Small',attribute:{name:'Size'},pivot:{price_adjustment:2,stock:5,sku:'SIZE-S'}}]
    product.summary=''
    await page.goto(`${base}/products`,{waitUntil:'networkidle'})
    await page.locator('.product-image-container').first().hover();await page.getByRole('button',{name:'Quick view Test Product',exact:true}).click();await dialog.waitFor()
    assert.match(await dialog.innerText(),/Open product details for more information/)
    assert.doesNotMatch(await dialog.innerText(),/FULL DESCRIPTION/)
    assert.equal(await dialog.getByRole('button',{name:'Add to cart',exact:true}).isDisabled(),true)
    await dialog.getByRole('combobox',{name:'Choose an option',exact:true}).click()
    await page.getByRole('option',{name:'Size: Small Available',exact:true}).click()
    await dialog.getByText('$12.00',{exact:true}).waitFor()
    await dialog.getByRole('button',{name:'Add to cart',exact:true}).click()
    await dialog.getByRole('status').getByText('1 item added to your cart.',{exact:true}).waitFor()
    const items=await page.evaluate(()=>JSON.parse(localStorage.getItem('guest_cart')))
    assert.equal(items.find(item=>item.options?.variation_id===10).quantity,1)
    await page.keyboard.press('Escape')
  } finally {for(const [key,value] of Object.entries(original)){if(value===undefined)delete product[key];else product[key]=value}await context.close()}
  assert.deepEqual(errors,[])
})

test('Poppins is self-hosted and consistent across storefront, auth, admin, inputs and dropdowns', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const fontRequests=[];page.on('request',request=>{if(request.url().includes('poppins')&&request.url().includes('.woff2'))fontRequests.push(request.url())})
  const checkFonts=async () => {
    await page.evaluate(()=>document.fonts.ready)
    const wrong=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(element=>!['SCRIPT','STYLE','NOSCRIPT'].includes(element.tagName)&&!element.closest('svg')&&element.getClientRects().length&&Array.from(element.childNodes).some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim())).filter(element=>!getComputedStyle(element).fontFamily.includes('Poppins')).map(element=>`${element.tagName}.${element.className}: ${getComputedStyle(element).fontFamily}`).slice(0,12))
    assert.deepEqual(wrong,[])
    assert.ok(await page.evaluate(()=>Array.from(document.fonts).some(face=>face.family.includes('Poppins')&&face.status==='loaded')))
  }
  await page.goto(`${base}/`,{waitUntil:'networkidle'});await checkFonts()
  await page.goto(`${base}/products`,{waitUntil:'networkidle'});await checkFonts()
  await page.getByRole('combobox',{name:'Sort products',exact:true}).click()
  assert.ok((await page.locator('.select-popover').evaluate(element=>getComputedStyle(element).fontFamily)).includes('Poppins'))
  await page.keyboard.press('Escape')
  await page.goto(`${base}/login`,{waitUntil:'networkidle'});await checkFonts()
  assert.ok((await page.getByLabel('Email address',{exact:true}).evaluate(element=>getComputedStyle(element).fontFamily)).includes('Poppins'))
  await page.goto(`${base}/admin-access`,{waitUntil:'networkidle'});await checkFonts()
  await page.getByLabel('Email address',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password')
  await page.getByRole('button',{name:'Login to dashboard',exact:true}).click();await page.waitForURL('**/admin/dashboard');await checkFonts()
  await page.goto(`${base}/admin/products/create`,{waitUntil:'networkidle'});await checkFonts()
  assert.ok((await page.getByPlaceholder('Enter product name',{exact:true}).evaluate(element=>getComputedStyle(element).fontFamily)).includes('Poppins'))
  assert.ok(fontRequests.length>0)
  assert.ok(fontRequests.every(url=>url.startsWith(base)))
  await context.close()
})

test('checkout and header share every active country and the wider popup has no horizontal overflow', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  await context.addInitScript(product => {
    if (!localStorage.getItem('auth_token')) localStorage.setItem('guest_cart', JSON.stringify([{product_id:product.id,product,quantity:1,options:null}]))
  }, product)
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/api/v1/cart',route=>route.fulfill({json:[{id:1,product_id:1,product,quantity:1,options:null}]}))
  await page.goto(`${base}/login?redirect=/checkout`,{waitUntil:'networkidle'})
  await page.getByLabel('Email address',{exact:true}).fill('countries@example.test')
  await page.getByLabel('Password',{exact:true}).fill('customer-password')
  await page.getByRole('button',{name:'Login',exact:true}).click()
  await page.waitForURL('**/checkout');await page.getByRole('combobox',{name:'Country',exact:true}).waitFor()
  await page.getByRole('combobox',{name:'Country',exact:true}).click()
  await page.getByRole('option',{name:'United States',exact:true}).waitFor()
  const checkoutCountries=await page.locator('.select-option .option-copy > span').allTextContents()
  assert.deepEqual(checkoutCountries,countryFixtures.filter(country=>country.status).map(country=>country.name))
  await page.getByRole('option',{name:'United States',exact:true}).click()
  assert.equal(await page.getByRole('combobox',{name:'Country',exact:true}).innerText(),'United States')
  await page.locator('.location-trigger').click()
  const dialog=page.getByRole('dialog',{name:'Where are you shopping from?',exact:true})
  await dialog.getByRole('button',{name:'United States',exact:true}).waitFor()
  assert.deepEqual(await dialog.locator('.country-list button > span').allTextContents(),checkoutCountries)
  assert.equal(Math.round((await dialog.locator('.location-box').boundingBox()).width),600)
  assert.ok(await dialog.locator('.country-list').evaluate(element=>element.scrollWidth<=element.clientWidth))
  await page.screenshot({path:'test-artifacts/country-popup-desktop.png'})
  await page.getByRole('searchbox',{name:'Search countries',exact:true}).fill('United')
  assert.equal(await dialog.locator('.country-list button').count(),3)
  await page.getByRole('searchbox',{name:'Search countries',exact:true}).fill('')
  await page.setViewportSize({width:390,height:844})
  assert.ok(await dialog.locator('.location-box').evaluate(element=>{const bounds=element.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth&&element.scrollWidth<=element.clientWidth}))
  assert.ok(await dialog.locator('.country-list').evaluate(element=>element.scrollWidth<=element.clientWidth))
  await page.screenshot({path:'test-artifacts/country-popup-mobile.png'})
  await dialog.getByRole('button',{name:'United States',exact:true}).click();await dialog.waitFor({state:'hidden'})
  assert.deepEqual(errors,[]);await context.close()
})

test('first-time visitors choose country then configured zipcode, and saved choices are restored safely', {timeout:120_000}, async () => {
  const previous=zipcodeFixtures;zipcodeFixtures=[{id:1,country_id:2,zipcodes:'00123, A1A 1A1'}]
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'},false)
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('fgx-country')||'null'))
  try {
    await page.goto(`${base}/`,{waitUntil:'networkidle'})
    const countryDialog=page.getByRole('dialog',{name:'Where are you shopping from?',exact:true})
    await countryDialog.getByRole('button',{name:'Bangladesh',exact:true}).click()
    const zipDialog=page.getByRole('dialog',{name:'Choose your zipcode',exact:true})
    await zipDialog.getByRole('button',{name:'00123',exact:true}).waitFor()
    assert.equal(await stored(),null,'A country with configured zipcodes is not saved until a zipcode is selected')
    await zipDialog.getByRole('searchbox',{name:'Search zipcodes',exact:true}).fill('001')
    assert.equal(await zipDialog.locator('.zipcode-list button').count(),1)
    await zipDialog.getByRole('button',{name:'00123',exact:true}).click();await zipDialog.waitFor({state:'hidden'})
    assert.deepEqual(await stored(),{id:2,name:'Bangladesh',zipcode:'00123'})
    await page.reload({waitUntil:'networkidle'})
    assert.equal(await page.locator('dialog[open]').count(),0)
    assert.equal(await page.locator('.location-trigger strong').innerText(),'Bangladesh · 00123')
    await page.locator('.location-trigger').click()
    await countryDialog.getByRole('button',{name:'Australia',exact:true}).click();await countryDialog.waitFor({state:'hidden'})
    assert.deepEqual(await stored(),{id:1,name:'Australia',zipcode:null})
    await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('dialog[open]').count(),0)
    zipcodeFixtures.push({id:2,country_id:1,zipcodes:'00999'})
    await page.reload({waitUntil:'networkidle'})
    await zipDialog.getByRole('button',{name:'00999',exact:true}).click();await zipDialog.waitFor({state:'hidden'})
    zipcodeLookupFailure=true
    await page.locator('.location-trigger').click();await countryDialog.getByRole('button',{name:'Bangladesh',exact:true}).click()
    await zipDialog.getByRole('alert').waitFor()
    assert.equal((await stored()).id,1,'A failed lookup must not silently bypass zipcode selection')
    zipcodeLookupFailure=false
    await zipDialog.getByRole('button',{name:'Try again',exact:true}).click()
    await zipDialog.getByRole('button',{name:'A1A 1A1',exact:true}).waitFor()
    await page.setViewportSize({width:390,height:844})
    assert.ok(await zipDialog.locator('.location-box').evaluate(element=>{const bounds=element.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth&&element.scrollWidth<=element.clientWidth}))
    await page.screenshot({path:'test-artifacts/zipcode-selection-mobile.png'})
    await zipDialog.getByRole('button',{name:'A1A 1A1',exact:true}).click();await zipDialog.waitFor({state:'hidden'})
    assert.equal((await stored()).zipcode,'A1A 1A1')
    let release
    await page.route('**/countries/2/zipcodes',async route=>{await new Promise(resolve=>{release=resolve});await route.fulfill({json:{data:['00123']}})})
    await page.getByRole('button',{name:'Choose location',exact:true}).click()
    await countryDialog.getByRole('button',{name:'Bangladesh',exact:true}).click();await zipDialog.getByRole('status').waitFor()
    await zipDialog.getByRole('button',{name:'Change country',exact:true}).click()
    await countryDialog.getByRole('button',{name:'Australia',exact:true}).click();await zipDialog.getByRole('button',{name:'00999',exact:true}).click()
    release();await page.waitForLoadState('networkidle')
    assert.deepEqual(await stored(),{id:1,name:'Australia',zipcode:'00999'})
    assert.equal(await page.locator('dialog[open]').count(),0)
    assert.deepEqual(errors,[])
  } finally {zipcodeFixtures=previous;zipcodeLookupFailure=false;await context.close()}
})

test('customer location keeps browser selection without addresses and prefers the default saved address', {timeout:120_000}, async () => {
  for (const hasAddresses of [false,true]) {
    const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'},false)
    await context.addInitScript(() => {
      localStorage.setItem('auth_token','fixture-customer-token')
      localStorage.setItem('user',JSON.stringify({id:7,name:'Fixture Customer',email:'location@example.test'}))
      if(!localStorage.getItem('fgx-country')) localStorage.setItem('fgx-country',JSON.stringify({id:1,name:'Australia',zipcode:null}))
    })
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
    let addressRequests=0
    await page.route('**/api/v1/addresses',route=>{
      assert.equal(route.request().headers().authorization,'Bearer fixture-customer-token')
      addressRequests++
      return route.fulfill({json:{data:hasAddresses?[
        {id:1,is_default:false,country:{id:4,name:'Canada',status:true},zipcode:'A1A 1A1'},
        {id:2,is_default:true,country:{id:9,name:'India',status:true},zipcode:'00123'},
      ]:[]}})
    })
    try {
      await page.goto(`${base}/`,{waitUntil:'networkidle'})
      assert.ok(addressRequests>0,'Returning customer auth is hydrated before looking up addresses')
      assert.equal(await page.locator('dialog[open]').count(),0)
      assert.ok((await page.locator('.location-trigger strong').innerText()).startsWith(hasAddresses?'India':'Australia'))
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fgx-country'))),{id:1,name:'Australia',zipcode:null})
      if(!hasAddresses) {
        await page.locator('.location-trigger').click()
        await page.getByRole('dialog').getByRole('button',{name:'Canada',exact:true}).click()
        await page.getByRole('dialog').waitFor({state:'hidden'})
        assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fgx-country'))),{id:4,name:'Canada',zipcode:null})
      }
      await page.reload({waitUntil:'networkidle'})
      assert.equal(await page.locator('dialog[open]').count(),0)
      assert.ok((await page.locator('.location-trigger strong').innerText()).startsWith(hasAddresses?'India':'Canada'))
      assert.deepEqual(errors,[])
    } finally {await context.close()}
  }
})

test('homepage collection cart icons reveal on hover and keyboard focus and add from all three sections', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  try {
    await page.goto(`${base}/`,{waitUntil:'networkidle'})
    for (const name of ['Hot Deals','New Arrivals','Best Sellers']) {
      const section=page.getByRole('region',{name,exact:true})
      const card=section.locator('.collection-card').first()
      const button=card.locator('.collection-cart')
      await card.scrollIntoViewIfNeeded()
      await page.mouse.move(0,0)
      assert.equal(await button.evaluate(element=>getComputedStyle(element).opacity),'0')
      await card.hover()
      assert.equal(await button.evaluate(element=>getComputedStyle(element).opacity),'1')
      await page.mouse.move(0,0);await button.focus()
      assert.equal(await button.evaluate(element=>getComputedStyle(element).opacity),'1')
      await page.keyboard.press('Enter')
      await section.getByRole('status').getByText(/added to your cart/).waitFor()
      assert.equal(await button.evaluate(element=>element.classList.contains('is-added')),true)
    }
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('guest_cart')).reduce((sum,item)=>sum+item.quantity,0)),3)
    assert.ok(page.url().endsWith('/'),'Cart buttons do not navigate to product details')
    await page.getByRole('link',{name:'Cart, 3 items',exact:true}).waitFor()
    await page.screenshot({path:'test-artifacts/home-collection-cart-desktop.png'})
    assert.deepEqual(errors,[])
  } finally { await context.close() }
  const touchContext=await newTestContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
  const touchPage=await touchContext.newPage()
  try {
    await touchPage.goto(`${base}/`,{waitUntil:'networkidle'})
    const section=touchPage.getByRole('region',{name:'New Arrivals',exact:true})
    const button=section.locator('.collection-cart').first()
    await button.scrollIntoViewIfNeeded()
    assert.equal(await button.evaluate(element=>getComputedStyle(element).opacity),'1')
    await button.tap()
    await section.getByRole('status').getByText(/added to your cart/).waitFor()
    assert.ok(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await touchPage.screenshot({path:'test-artifacts/home-collection-cart-mobile.png'})
  } finally {await touchContext.close()}
})

test('collection cart handles signed-in updates and reports failed additions without success feedback', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  await context.addInitScript(()=>{
    localStorage.setItem('auth_token','fixture-customer-token')
    localStorage.setItem('user',JSON.stringify({id:7,name:'Fixture Customer'}))
  })
  const page=await context.newPage();let items=[];let fail=false
  await page.route('**/api/v1/cart',route=>{
    if(route.request().method()==='POST') {
      assert.equal(route.request().headers().authorization,'Bearer fixture-customer-token')
      if(fail)return route.fulfill({status:422,json:{message:'Unable to add product'}})
      const body=route.request().postDataJSON()
      assert.equal(body.quantity,1)
      items=[{id:1,product_id:body.product_id,product,quantity:1,options:null}]
      return route.fulfill({json:{data:items[0]}})
    }
    return route.fulfill({json:items})
  })
  try {
    await page.goto(`${base}/`,{waitUntil:'networkidle'})
    const arrivals=page.getByRole('region',{name:'New Arrivals',exact:true})
    await arrivals.locator('.collection-cart').focus();await page.keyboard.press('Enter')
    await arrivals.getByRole('status').getByText(/added to your cart/).waitFor()
    await page.getByRole('link',{name:'Cart, 1 items',exact:true}).waitFor()
    fail=true
    const deals=page.getByRole('region',{name:'Hot Deals',exact:true})
    await deals.locator('.collection-cart').focus();await page.keyboard.press('Enter')
    await deals.getByRole('status').getByText('Unable to add this product. Please try again.',{exact:true}).waitFor()
    assert.equal(await deals.locator('.collection-cart.is-added').count(),0)
    assert.equal(items.length,1)
  } finally {await context.close()}
})

test('product reviews show honest empty state, require sign in and save editable customer ratings', {timeout:120_000}, async () => {
  const previous=reviewFixtures;reviewFixtures=[]
  const context=await newTestContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  try {
    await page.goto(`${base}/products/test-product`,{waitUntil:'networkidle'})
    const section=page.getByRole('region',{name:'Customer reviews',exact:true})
    await section.getByText('Be the first to share your experience',{exact:true}).waitFor()
    assert.equal(await page.getByText('Jack Doe',{exact:true}).count(),0)
    assert.equal(await page.getByText('(23 Customer Reviews)',{exact:true}).count(),0)
    assert.equal(await section.locator('.customer-review').count(),0)
    await section.scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/product-reviews-empty.png'})
    assert.match(await section.getByRole('link',{name:'Sign in to write a review'}).getAttribute('href'),/redirect=.*customer-reviews/)
    await page.evaluate(()=>{
      localStorage.setItem('auth_token','fixture-customer-token')
      localStorage.setItem('user',JSON.stringify({id:7,name:'Fixture Customer'}))
    })
    await page.reload({waitUntil:'networkidle'})
    const writeReview=section.getByRole('button',{name:'Write a review',exact:true})
    await writeReview.click()
    const reviewDialog=page.getByRole('dialog',{name:'Your experience, in your words',exact:true})
    await reviewDialog.waitFor()
    await page.keyboard.press('Escape')
    await reviewDialog.waitFor({state:'hidden'})
    assert.equal(await writeReview.evaluate(element=>element===document.activeElement),true)
    await writeReview.click();await reviewDialog.waitFor()
    await page.mouse.click(8,8);await reviewDialog.waitFor({state:'hidden'})
    await writeReview.click();await reviewDialog.waitFor()
    await page.setViewportSize({width:390,height:844})
    assert.ok(await reviewDialog.locator('.review-form').evaluate(element=>{const rect=element.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight&&element.scrollWidth<=element.clientWidth}))
    await page.screenshot({path:'test-artifacts/product-review-popup-mobile.png'})
    await page.setViewportSize({width:1440,height:1100})
    await section.getByRole('radio',{name:'5 stars',exact:true}).check()
    await section.getByRole('textbox',{name:/Your review/}).fill('Good quality and easy to use. I would recommend it.')
    await page.screenshot({path:'test-artifacts/product-review-form.png'})
    await section.getByRole('button',{name:'Submit review',exact:true}).click()
    await section.getByRole('status').getByText('Thank you. Your review has been saved.',{exact:true}).waitFor()
    await section.getByText('5.0',{exact:true}).waitFor()
    assert.equal(await section.locator('.customer-review').count(),1)
    assert.equal(await section.locator('.review-score > strong').innerText(),'5.0')
    assert.match(await page.locator('.product-review-link').innerText(),/1 customer review/)
    await section.getByRole('button',{name:'Edit your review',exact:true}).click()
    assert.equal(await section.getByRole('radio',{name:'5 stars',exact:true}).isChecked(),true)
    await section.getByRole('radio',{name:'3 stars',exact:true}).check()
    await section.getByRole('textbox',{name:/Your review/}).fill('Updated after using it. Useful but could be improved.')
    reviewFailure=true
    await section.getByRole('button',{name:'Update review',exact:true}).click()
    await section.getByRole('alert').getByText('Please provide a more detailed review.',{exact:true}).waitFor()
    reviewFailure=false
    await section.getByRole('button',{name:'Update review',exact:true}).click()
    await section.getByRole('status').getByText('Thank you. Your review has been saved.',{exact:true}).waitFor()
    assert.equal(reviewFixtures.length,1)
    await section.getByText('3.0',{exact:true}).waitFor()
    assert.equal(await section.locator('.review-score > strong').innerText(),'3.0')
    await section.scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/product-reviews-desktop.png'})
    reviewFixtures=Array.from({length:7},(_,index)=>({id:index+1,name:`Customer ${index+1}`,rating:index===0?5:4,review:'Helpful feedback from a registered customer.',created_at:'2026-11-18T10:00:00Z'}))
    await page.reload({waitUntil:'networkidle'})
    assert.equal(await section.locator('.customer-review').count(),6)
    await section.getByRole('button',{name:'Next',exact:true}).click()
    await section.getByText('Page 2 of 2',{exact:true}).waitFor()
    await page.waitForFunction(()=>document.querySelectorAll('#customer-reviews .customer-review').length===1)
    assert.equal(await section.locator('.customer-review').count(),1)
    await page.setViewportSize({width:390,height:844})
    await section.scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/product-reviews-mobile.png',fullPage:true})
    assert.ok(await section.evaluate(element=>element.scrollWidth<=element.clientWidth),'Review content fits mobile width')
    assert.deepEqual(errors,[])
  } finally {reviewFixtures=previous;reviewFailure=false;await context.close()}
})

test('product breadcrumbs replace the title banner and follow category ancestry', {timeout:120_000}, async () => {
  const originalCategory=product.category, originalName=product.name
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  try {
    product.category={id:2,name:'Pulses',slug:'pulses',parent_id:1,parent:{id:1,name:'Packed Food',slug:'packed-food'}}
    await page.goto(`${base}/products/test-product`,{waitUntil:'networkidle'})
    const breadcrumb=page.getByRole('navigation',{name:'Product breadcrumb',exact:true})
    assert.deepEqual(await breadcrumb.locator('li').allTextContents(),['Home','Packed Food','Pulses','Test Product'])
    assert.equal(await breadcrumb.getByRole('link',{name:'Home',exact:true}).getAttribute('href'),'/')
    assert.equal(await breadcrumb.getByRole('link',{name:'Packed Food',exact:true}).getAttribute('href'),'/category/packed-food')
    assert.equal(await breadcrumb.getByRole('link',{name:'Pulses',exact:true}).getAttribute('href'),'/category/pulses')
    assert.equal(await breadcrumb.locator('[aria-current="page"]').innerText(),'Test Product')
    assert.equal(await page.getByRole('heading',{level:1}).count(),1)
    for (const width of [2560,1920,1440,1100,760,390]) {
      await page.setViewportSize({width,height:1000})
      const alignment=await page.evaluate(()=>{
        const header=document.querySelector('.main-header'), headerRect=header.getBoundingClientRect(), headerStyle=getComputedStyle(header)
        const breadcrumb=document.querySelector('.product-breadcrumb').getBoundingClientRect(), gallery=document.querySelector('.gallery-container').getBoundingClientRect(), reviews=document.querySelector('.reviews-section').getBoundingClientRect()
        return {left:headerRect.left+parseFloat(headerStyle.paddingLeft),right:headerRect.right-parseFloat(headerStyle.paddingRight),breadcrumbLeft:breadcrumb.left,breadcrumbRight:breadcrumb.right,galleryLeft:gallery.left,reviewsLeft:reviews.left,reviewsRight:reviews.right,pageWidth:document.querySelector('.product-detail-page').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth}
      })
      for(const left of [alignment.breadcrumbLeft,alignment.galleryLeft,alignment.reviewsLeft])assert.ok(Math.abs(left-alignment.left)<1,`Content aligns with header at ${width}px`)
      for(const right of [alignment.breadcrumbRight,alignment.reviewsRight])assert.ok(Math.abs(right-alignment.right)<1)
      assert.ok(alignment.pageWidth<=1920)
      assert.equal(alignment.overflow,false)
    }
    await page.setViewportSize({width:1440,height:1000})
    await page.screenshot({path:'test-artifacts/product-breadcrumb-desktop.png'})
    product.category={id:1,name:'Packed Food',slug:'packed-food',parent_id:null,parent:null}
    await page.reload({waitUntil:'networkidle'})
    assert.deepEqual(await breadcrumb.locator('li').allTextContents(),['Home','Packed Food','Test Product'])
    product.name='Toor Dal / Arhar Dal Unpolished | Rich in Taste | Chef Recommended | 500g / 1kg'
    await page.setViewportSize({width:390,height:844})
    await page.reload({waitUntil:'networkidle'})
    assert.equal(await breadcrumb.locator('[aria-current="page"]').innerText(),product.name)
    assert.ok(await breadcrumb.evaluate(element=>element.scrollWidth<=element.clientWidth))
    await page.screenshot({path:'test-artifacts/product-breadcrumb-mobile.png'})
    delete product.category
    await page.reload({waitUntil:'networkidle'})
    assert.deepEqual(await breadcrumb.getByRole('link').allTextContents(),['Home'])
    assert.deepEqual(errors,[])
  } finally {product.name=originalName;if(originalCategory===undefined)delete product.category;else product.category=originalCategory;await context.close()}
})

test('FAQ help centre searches backend answers and uses real support contacts on desktop and mobile', {timeout:120_000}, async () => {
  const originalFaqs=faqFixtures, originalCompany=companyInfoFixture
  faqFixtures=[
    {id:2,title:'Do I need an account?',description:'Sign in to continue to checkout and manage your account.',status:true,sort_order:20},
    {id:1,title:'How do I download my PDF?',description:'Open checkout and use Download Proforma Invoice. Attach your PDF manually in WhatsApp.',status:true,sort_order:10},
    {id:3,title:'How can I confirm delivery?',description:'Contact our team with your country and zipcode for delivery details.',status:true,sort_order:30},
    {id:4,title:'Hidden draft FAQ',description:'This draft must not appear in the questions.',status:false,sort_order:0},
  ]
  companyInfoFixture={company:{phone_number:'+91 90000 00000',contact_email:'help@example.test'},bank:null}
  const context=await newTestContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  try {
    await page.goto(`${base}/faqs`,{waitUntil:'networkidle'})
    assert.equal(await page.locator('.faq-item').count(),3)
    assert.equal(await page.locator('.faq-item h3').first().innerText(),'How do I download my PDF?')
    assert.equal(await page.getByText('Hidden draft FAQ',{exact:true}).count(),0)
    await page.locator('.faq-item summary').first().focus();await page.keyboard.press('Enter')
    await page.locator('.faq-item').first().locator('.faq-answer').waitFor({state:'visible'})
    assert.equal(await page.getByRole('link',{name:'Chat on WhatsApp',exact:false}).getAttribute('href'),'https://wa.me/919000000000')
    assert.equal(await page.getByRole('link',{name:'Email our team',exact:true}).getAttribute('href'),'mailto:help@example.test')
    await page.screenshot({path:'test-artifacts/faq-desktop.png',fullPage:true})
    await page.getByRole('searchbox',{name:'Search FAQs',exact:true}).fill('zipcode')
    assert.equal(await page.locator('.faq-item').count(),1)
    assert.equal(await page.locator('.faq-item h3').innerText(),'How can I confirm delivery?')
    await page.getByRole('button',{name:'My account',exact:true}).click()
    assert.equal(await page.locator('.faq-item h3').innerText(),'Do I need an account?')
    await page.getByRole('searchbox',{name:'Search FAQs',exact:true}).fill('missing answer')
    await page.getByRole('heading',{name:'No matching answers just yet',exact:true}).waitFor()
    await page.getByRole('button',{name:'Show all questions',exact:false}).click()
    assert.equal(await page.locator('.faq-item').count(),3)
    await page.setViewportSize({width:390,height:844})
    await page.locator('.faq-item summary').first().click()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:'test-artifacts/faq-mobile.png',fullPage:true})
    faqFixtures=[];companyInfoFixture={company:null,bank:null}
    await page.reload({waitUntil:'networkidle'})
    await page.getByRole('heading',{name:'Helpful answers are on the way',exact:true}).waitFor()
    assert.equal(await page.getByRole('link',{name:'Chat on WhatsApp',exact:false}).count(),0)
    faqFailure=true;await page.reload({waitUntil:'networkidle'})
    await page.getByRole('alert').getByText('We couldn\u2019t load your answers',{exact:true}).waitFor()
    faqFailure=false;faqFixtures=[{id:1,title:'Recovered question',description:'The answers have loaded again.',status:true}]
    await page.getByRole('button',{name:'Try again',exact:false}).click()
    await page.getByRole('heading',{name:'Recovered question',exact:true}).waitFor()
    assert.deepEqual(errors,[])
  } finally {faqFixtures=originalFaqs;companyInfoFixture=originalCompany;faqFailure=false;await context.close()}
})

test('account orders render with no quick view product and wishlist quick view still opens safely', {timeout:120_000}, async () => {
  const context=await newTestContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
  await context.addInitScript(()=>{
    localStorage.setItem('auth_token','fixture-customer-token')
    localStorage.setItem('user',JSON.stringify({id:7,name:'Fixture Customer',email:'customer@example.test'}))
  })
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/api/v1/wishlist',route=>route.fulfill({json:[{id:1,product_id:product.id,product}]}))
  try {
    await page.goto(`${base}/`,{waitUntil:'networkidle'})
    await page.getByRole('link',{name:'Track order',exact:true}).click()
    await page.waitForURL('**/my-account?tab=order')
    await page.getByRole('heading',{name:'No Orders Yet',exact:true}).waitFor()
    assert.equal(await page.locator('.quick-dialog[open]').count(),0)
    await page.locator('.sidebar-list').getByText('Wishlist',{exact:true}).click()
    await page.getByRole('heading',{name:'My Wishlist',exact:true}).waitFor()
    await page.locator('.product-image-container').first().hover()
    await page.getByRole('button',{name:'Quick view Test Product',exact:true}).click()
    const dialog=page.getByRole('dialog',{name:'Quick view: Test Product',exact:true})
    await dialog.waitFor()
    await dialog.getByRole('heading',{name:'Test Product',exact:true}).waitFor()
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'})
    await page.locator('.sidebar-list').getByText('Order',{exact:true}).click()
    await page.getByRole('heading',{name:'No Orders Yet',exact:true}).waitFor()
    assert.deepEqual(errors,[])
  } finally {await context.close()}
})

test('legal pages are editable through secured admin routes and published to footer pages', {timeout:120_000}, async () => {
  const original=structuredClone(legalFixtures)
  const context=await newTestContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'})
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
  try {
    await page.goto(`${base}/admin-access`,{waitUntil:'networkidle'})
    await page.getByLabel('Email address',{exact:true}).fill('admin@example.test')
    await page.getByLabel('Password',{exact:true}).fill('fixture-password')
    await page.getByRole('button',{name:'Login to dashboard',exact:true}).click();await page.waitForURL('**/admin/dashboard')
    await page.locator('.sidebar').getByRole('button',{name:'Core Settings',exact:true}).click()
    for(const label of ['Terms & Conditions','Privacy Policy'])await page.locator('.sidebar').getByRole('link',{name:label,exact:true}).waitFor()
    for(const slug of ['terms-and-conditions','privacy-policy']) {
      await page.goto(`${base}/admin/${slug}`,{waitUntil:'networkidle'})
      const title=slug==='privacy-policy'?'Our Privacy Policy':'Our Terms & Conditions'
      await page.getByLabel('Page title',{exact:false}).fill(title)
      const editor=page.getByRole('textbox',{name:'Page content',exact:true})
      await editor.fill('Updated policy content from the shared rich text editor.')
      await page.getByRole('combobox',{name:'Text block',exact:true}).click()
      await page.getByRole('option',{name:/H2/}).click()
      legalSaveFailure=true
      await page.getByRole('button',{name:'Save changes',exact:true}).click()
      await page.getByRole('alert').getByText('Please enter a valid page title.',{exact:true}).waitFor()
      legalSaveFailure=false
      await page.getByRole('button',{name:'Save changes',exact:true}).click()
      await page.getByRole('status').getByText('Page saved successfully.',{exact:true}).waitFor()
      assert.equal(legalFixtures[slug].title,title)
      assert.match(legalFixtures[slug].content,/<h2/)
      await page.reload({waitUntil:'networkidle'})
      assert.equal(await page.getByLabel('Page title',{exact:false}).inputValue(),title)
      assert.match(await page.getByRole('textbox',{name:'Page content',exact:true}).innerText(),/Updated policy content/)
      if(slug==='privacy-policy')await page.screenshot({path:'test-artifacts/admin-privacy-editor.png',fullPage:true})
      await page.goto(`${base}/${slug}`,{waitUntil:'networkidle'})
      await page.getByRole('heading',{name:title,exact:true,level:1}).waitFor()
      assert.match(await page.locator('.legal-content').innerText(),/Updated policy content/)
      assert.equal(await page.locator('footer').getByRole('link',{name:'Terms & Conditions',exact:true}).getAttribute('href'),'/terms-and-conditions')
      assert.equal(await page.locator('footer').getByRole('link',{name:'Privacy Policy',exact:true}).getAttribute('href'),'/privacy-policy')
    }
    await page.screenshot({path:'test-artifacts/storefront-privacy-page.png',fullPage:true})
    await page.setViewportSize({width:390,height:844})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:'test-artifacts/storefront-privacy-mobile.png',fullPage:true})
    const viewer=await fetch(`${base}/admin/privacy-policy`,{headers:{Cookie:'fgx_admin_session=legal-viewer-admin'}})
    assert.equal(viewer.status,200)
    const viewerHTML=await viewer.text();assert.doesNotMatch(viewerHTML,/Save changes|contenteditable="true"/)
    assert.equal((await fetch(`${base}/api/admin/legal-pages/privacy-policy`,{method:'PUT',headers:{Cookie:'fgx_admin_session=legal-viewer-admin','X-FGX-Admin':'1','Content-Type':'application/json'},body:JSON.stringify({title:'Forbidden',content:'<p>Forbidden.</p>'})})).status,403)
    assert.deepEqual(errors,[])
  } finally {legalFixtures=original;legalSaveFailure=false;await context.close()}
})
