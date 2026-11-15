type AdminToast = { id: number; message: string; type: string }

export const useAdminToast = () => {
  const toasts = useState<AdminToast[]>('admin-toasts', () => [])
  const removeToast = (id: number) => { toasts.value = toasts.value.filter(t => t.id !== id) }
  const addToast = (message: string, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    if (import.meta.client && duration > 0) setTimeout(() => removeToast(id), duration)
  }
  return {
    toasts, addToast, removeToast,
    success: (message: string) => addToast(message),
    error: (message: string) => addToast(message, 'error', 5000),
    info: (message: string) => addToast(message, 'info'),
  }
}
