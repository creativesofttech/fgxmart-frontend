// All active main categories, ordered and managed in admin.
export const useStorefrontCategories = async () => {
  const config = useRuntimeConfig()
  const { data: response } = await useFetch(`${config.public.apiBase}/categories`, {
    query: { all: 1 }, key: 'storefront-header-categories', default: () => ({ data: [] }),
  })
  const tones = ['groceries', 'food', 'clothing', 'electronics', 'kitchen']
  return computed(() => (response.value?.data || [])
    .filter(category => !category.parent_id && category.status !== false)
    .sort((a, b) => Number(a.sorting_order || 0) - Number(b.sorting_order || 0) || Number(a.id) - Number(b.id))
    .map((category, index) => ({
      key: category.id,
      name: category.name,
      description: category.short_description || '',
      imageUrl: category.image_url || '/assets/images/home/product-placeholder.webp',
      tone: tones[index % tones.length],
      to: `/category/${category.slug}`,
      children: (category.children || []).filter(child => child.status !== false && Number(child.parent_id) === Number(category.id)),
    })))
}
