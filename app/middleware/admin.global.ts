export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.toLowerCase()
  // Vue routes are case-insensitive; use matched records as well as the URL.
  const isAdmin = to.matched.some(record => record.path === '/admin' || record.path.startsWith('/admin/')) || path === '/admin' || path.startsWith('/admin/')
  if (!isAdmin && path !== '/admin-access') return

  const auth = useAdminAuth()
  const signedIn = await auth.refresh()
  if (!signedIn && isAdmin) {
    return navigateTo({ path: '/admin-access', query: { redirect: to.fullPath } })
  }
  if (signedIn && path === '/admin-access') return navigateTo('/admin/dashboard')
  if (signedIn && isAdmin) {
    const segments = path.split('/').filter(Boolean)
    const module = segments[1]
    const resource = module === 'analytics' ? 'orders' : ['terms-and-conditions', 'privacy-policy'].includes(module) ? 'legal-pages' : module
    if (resource && resource !== 'dashboard') {
      const action = segments.includes('create') ? 'create' :
        (segments.includes('edit') || (resource === 'roles' && segments[2])) ? 'edit' : 'index'
      if (!auth.can(`${resource}.${action}`)) {
        throw createError({ statusCode: 403, statusMessage: 'You do not have permission to view this admin page.' })
      }
    }
  }
})
