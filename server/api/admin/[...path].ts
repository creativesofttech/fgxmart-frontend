import { createError, defineEventHandler, getHeader, getQuery, getRouterParam, readRawBody } from 'h3'
import { adminBackendRequest, adminSessionToken } from '../../utils/admin-session'

const resources = new Set(['dashboard', 'roles', 'permissions', 'categories', 'brands', 'attributes', 'countries', 'zipcodes', 'products', 'bank-accounts', 'company-settings', 'orders', 'faqs', 'pages', 'media', 'legal-pages'])

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(path) || !resources.has(path.split('/')[0]!)) {
    throw createError({ statusCode: 404, message: 'Unknown admin resource.' })
  }
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
    throw createError({ statusCode: 405, message: 'Method not allowed.' })
  }
  adminSessionToken(event)

  return adminBackendRequest(event, path, {
    method: event.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    query: getQuery(event),
    // Preserve multipart boundaries and Laravel's FormData _method override.
    body: event.method === 'GET' ? undefined : await readRawBody(event, false),
    contentType: getHeader(event, 'content-type'),
  })
})
