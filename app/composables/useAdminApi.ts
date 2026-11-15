export const useAdminApi = (request: string, opts?: any) => {
  const nuxtApp = useNuxtApp()
  const admin = useState('admin-user')
  return useFetch(request, {
    ...opts,
    baseURL: '/api/admin',
    headers: { ...opts?.headers, 'X-FGX-Admin': '1' },
    onResponseError: async ({ response }) => {
      if (response.status === 401) {
        admin.value = null
        await nuxtApp.runWithContext(() => navigateTo('/admin-access'))
      }
    },
  })
}

export const $adminApi = async (request: string, opts?: any) => {
  // Capture Nuxt context before awaiting; event handlers also call this helper.
  const nuxtApp = useNuxtApp()
  const admin = useState('admin-user')
  const requestFetch = useRequestFetch()
  try {
    return await requestFetch<any>(request, {
      ...opts,
      baseURL: '/api/admin',
      headers: { ...opts?.headers, 'X-FGX-Admin': '1' },
    })
  } catch (error: any) {
    if (error.response?.status === 401) {
      admin.value = null
      await nuxtApp.runWithContext(() => navigateTo('/admin-access'))
    }
    throw error
  }
}
