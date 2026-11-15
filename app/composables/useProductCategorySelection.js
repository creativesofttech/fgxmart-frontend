export const useProductCategorySelection = (formData, categories) => {
  const mainCategoryId = ref(null)
  const subCategoryId = ref(null)
  const mainCategories = computed(() => categories.value.filter(category => !category.parent_id))
  const subCategories = computed(() => mainCategoryId.value == null ? [] : categories.value.filter(category => String(category.parent_id) === String(mainCategoryId.value)))
  watch(mainCategoryId, value => { subCategoryId.value = null; formData.category_id = value }, { flush: 'sync' })
  watch(subCategoryId, value => { formData.category_id = value || mainCategoryId.value }, { flush: 'sync' })
  const initializeCategory = categoryId => {
    const category = categories.value.find(item => String(item.id) === String(categoryId))
    mainCategoryId.value = category?.parent_id || category?.id || null
    subCategoryId.value = category?.parent_id ? category.id : null
    formData.category_id = category?.id || null
  }
  return { mainCategoryId, subCategoryId, mainCategories, subCategories, initializeCategory }
}
