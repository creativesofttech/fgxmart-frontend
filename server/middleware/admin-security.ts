import { createError, defineEventHandler, getHeader, getRequestURL, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.toLowerCase()
  if (!(path === '/api/admin' || path.startsWith('/api/admin/') || path === '/admin-access' || path === '/admin' || path.startsWith('/admin/'))) return

  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(event, 'Referrer-Policy', 'same-origin')

  if (!path.startsWith('/api/admin/')) return
  if (getHeader(event, 'sec-fetch-site') === 'cross-site') {
    throw createError({ statusCode: 403, message: 'Cross-site admin requests are not allowed.' })
  }

  if (!['GET', 'HEAD'].includes(event.method)) {
    // A cross-origin HTML form cannot supply this header. Do not enable CORS here.
    if (getHeader(event, 'x-fgx-admin') !== '1') {
      throw createError({ statusCode: 403, message: 'Invalid admin request.' })
    }
    const origin = getHeader(event, 'origin')
    if (origin && origin !== getRequestURL(event).origin) {
      throw createError({ statusCode: 403, message: 'Invalid admin request origin.' })
    }
  }
})
