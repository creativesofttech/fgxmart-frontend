type AdminUser = { id: number; name: string; email: string; roles: string[]; permissions: string[] }

export const useAdminAuth = () => {
  const user = useState<AdminUser | null>('admin-user', () => null)
  const requestFetch = useRequestFetch()

  const refresh = async () => {
    try {
      const response = await requestFetch<{ data: AdminUser }>('/api/admin/session')
      user.value = response.data
      return true
    } catch (error: any) {
      user.value = null
      if ([401, 403].includes(error.response?.status)) return false
      throw error
    }
  }

  const can = (permission: string) => !!user.value && (user.value.roles.includes('super-admin') || user.value.permissions.includes(permission))

  return { user, refresh, can }
}
