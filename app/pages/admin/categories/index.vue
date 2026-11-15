<template>
  <div class="page-container">
    <div class="page-header"><div><h1 class="title">Categories Management</h1><p class="page-description">Organise main categories and subcategories, with descriptions and images for each.</p></div><button class="tw:btn tw:btn-primary" @click="openCreateModal">+ Create Category</button></div>
    <div v-if="loadError" class="tw:alert tw:alert-error" role="alert">{{ loadError }}<button class="tw:btn tw:btn-sm" @click="fetchCategories()">Retry</button></div>
    <div class="tw:card content-card">
      <DataTable :columns="columns" :data="categories" :loading="loading" :pagination="pagination" :actions="true" @page-change="fetchCategories">
        <template #image_url="{ row, value }"><img v-if="value" :src="value" :alt="row.name" class="category-thumbnail" /><span v-else class="muted">No image</span></template>
        <template #name="{ row }"><strong>{{ row.name }}</strong><p class="category-description">{{ row.short_description || 'No description' }}</p></template>
        <template #parent="{ row }">
          <span class="tw:badge category-pill" :class="row.parent_id ? 'category-pill-child' : 'category-pill-parent'">
            <CornerDownRight v-if="row.parent_id" :size="13" aria-hidden="true" /><Layers3 v-else :size="13" aria-hidden="true" />
            {{ row.parent_id ? row.parent?.name || 'Subcategory' : 'Main category' }}
          </span>
          <span v-if="row.parent_id" class="category-pill-caption">Subcategory of {{ row.parent?.name || 'a main category' }}</span>
        </template>
        <template #status="{ value }"><span class="tw:badge category-status-pill" :class="value ? 'status-active' : 'status-inactive'"><span class="status-dot" aria-hidden="true" />{{ value ? 'Active' : 'Inactive' }}</span></template>
        <template #actions="{ row }"><div class="actions"><button class="tw:btn tw:btn-ghost tw:btn-sm tw:btn-square" :aria-label="`Edit ${row.name}`" @click="editCategory(row)"><Edit2 :size="17" /></button><button class="tw:btn tw:btn-ghost tw:btn-sm tw:btn-square" :aria-label="`Delete ${row.name}`" @click="confirmDelete(row)"><Trash2 :size="17" /></button></div></template>
      </DataTable>
    </div>
    <Modal v-model="showModal" :title="isEdit ? 'Edit Category' : 'Create Category'" width="650px" :close-disabled="saving">
      <form id="category-form" class="category-form" @submit.prevent="handleSave">
        <div v-if="saveError" class="tw:alert tw:alert-error" role="alert">{{ saveError }}</div>
        <div class="category-form-grid">
          <label><span>Category Name <span class="required">*</span></span><input id="cat-name" v-model="formData.name" class="tw:input" maxlength="255" required placeholder="e.g. Packed Food" /></label>
          <label>Code<input id="cat-code" v-model="formData.code" class="tw:input" maxlength="10" placeholder="e.g. FOOD" /></label>
        </div>
        <label>Parent category<select id="cat-parent" v-model="formData.parent_id" class="tw:select"><option :value="null">None — main category</option><option v-for="parent in parentOptions" :key="parent.id" :value="parent.id">{{ parent.name }}</option></select><span class="muted">Choose a main category to create a subcategory. Two levels are supported.</span></label>
        <label>Short description<textarea id="cat-description" v-model="formData.short_description" class="tw:textarea" maxlength="255" rows="3" placeholder="A short introduction for this category" /><span class="muted">{{ formData.short_description.length }}/255 characters</span></label>
        <div class="category-form-grid"><label>Sorting Order<input id="cat-order" v-model.number="formData.sorting_order" type="number" min="0" class="tw:input" required /></label><label class="category-status"><input v-model="formData.status" type="checkbox" class="tw:checkbox tw:checkbox-primary" /> Active Status</label></div>
        <label>Category image<input type="file" class="tw:file-input" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" @change="onFileChange" /><span class="muted">PNG, JPEG, WebP, AVIF or GIF, up to 5 MB. Available for main categories and subcategories.</span></label>
        <div v-if="imagePreview || currentImageUrl" class="category-preview"><img :src="imagePreview || currentImageUrl" alt="Category image preview" /><button type="button" class="tw:btn tw:btn-outline tw:btn-sm" @click="removeImage">Remove image</button></div>
      </form>
      <template #footer><button class="tw:btn tw:btn-ghost" :disabled="saving" @click="showModal = false">Cancel</button><button class="tw:btn tw:btn-primary" form="category-form" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button></template>
    </Modal>
    <ConfirmModal v-model="showDeleteModal" title="Delete Category" :message="`Delete '${itemToDelete?.name}'? Categories with products or subcategories must be reassigned first.`" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>
<script setup>
definePageMeta({ layout: 'admin' })
import DataTable from '~/components/admin/ui/DataTable.vue'
import Modal from '~/components/admin/ui/Modal.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { CornerDownRight, Edit2, Layers3, Trash2 } from 'lucide-vue-next'
const { success, error: toastError } = useAdminToast()
const categories = ref([]), allCategories = ref([]), loading = ref(true), pagination = ref(null), loadError = ref('')
const showModal = ref(false), showDeleteModal = ref(false), isEdit = ref(false), saving = ref(false), deleting = ref(false)
const currentId = ref(null), itemToDelete = ref(null), saveError = ref('')
const defaults = () => ({ name: '', code: '', short_description: '', parent_id: null, sorting_order: 0, status: true })
const formData = reactive(defaults())
const imageFile = ref(null), imagePreview = ref(null), currentImageUrl = ref(null), imageRemoved = ref(false)
const parentOptions = computed(() => allCategories.value.filter(item => !item.parent_id && item.id !== currentId.value && !(isEdit.value && categories.value.find(category => category.id === currentId.value)?.children?.length)))
const columns = [{ key: 'image_url', label: 'Image' }, { key: 'name', label: 'Name & description' }, { key: 'parent', label: 'Parent' }, { key: 'code', label: 'Code' }, { key: 'sorting_order', label: 'Order' }, { key: 'status', label: 'Status' }]
const errorMessage = err => Object.values(err.data?.errors || {}).flat().join(' ') || err.data?.message || 'Unable to save changes. Please try again.'
const fetchCategories = async (page = 1) => {
  loading.value = true; loadError.value = ''
  try {
    const [response, all] = await Promise.all([$adminApi(`/categories?page=${page}`), $adminApi('/categories?all=1')])
    categories.value = response.data || []; allCategories.value = all.data || []
    pagination.value = { current_page: response.current_page, last_page: response.last_page, total: response.total, from: response.from, to: response.to }
  } catch { loadError.value = 'Unable to load categories.' } finally { loading.value = false }
}
const clearPreview = () => { if (imagePreview.value) URL.revokeObjectURL(imagePreview.value); imagePreview.value = null }
const resetImage = () => { clearPreview(); imageFile.value = null; currentImageUrl.value = null; imageRemoved.value = false }
const openCreateModal = () => { isEdit.value = false; currentId.value = null; Object.assign(formData, defaults()); resetImage(); saveError.value = ''; showModal.value = true }
const editCategory = row => { isEdit.value = true; currentId.value = row.id; Object.assign(formData, defaults(), { name: row.name, code: row.code || '', short_description: row.short_description || '', parent_id: row.parent_id || null, sorting_order: row.sorting_order, status: !!row.status }); resetImage(); currentImageUrl.value = row.image_url; saveError.value = ''; showModal.value = true }
const onFileChange = event => {
  const file = event.target.files[0]; if (!file) return
  if (file.size > 5 * 1024 * 1024) { saveError.value = 'The image must be 5 MB or smaller.'; event.target.value = ''; return }
  clearPreview(); imageFile.value = file; imagePreview.value = URL.createObjectURL(file); imageRemoved.value = false; saveError.value = ''
}
const removeImage = () => { clearPreview(); imageFile.value = null; currentImageUrl.value = null; imageRemoved.value = true }
const handleSave = async () => {
  if (saving.value) return
  saving.value = true; saveError.value = ''
  try {
    const body = new FormData()
    for (const key of ['name', 'code', 'short_description', 'sorting_order']) body.append(key, String(formData[key]))
    body.append('parent_id', formData.parent_id || ''); body.append('status', formData.status ? '1' : '0')
    if (imageFile.value) body.append('image', imageFile.value)
    body.append('remove_image', imageRemoved.value ? '1' : '0')
    if (isEdit.value) body.append('_method', 'PUT')
    await $adminApi(isEdit.value ? `/categories/${currentId.value}` : '/categories', { method: 'POST', body })
    success(isEdit.value ? 'Category updated successfully' : 'Category created successfully'); showModal.value = false; resetImage()
    await fetchCategories(pagination.value?.current_page || 1)
  } catch (err) { saveError.value = errorMessage(err) } finally { saving.value = false }
}
const confirmDelete = row => { itemToDelete.value = row; showDeleteModal.value = true }
const handleDelete = async () => {
  if (deleting.value || !itemToDelete.value) return
  deleting.value = true
  try { await $adminApi(`/categories/${itemToDelete.value.id}`, { method: 'DELETE' }); success('Category deleted successfully'); showDeleteModal.value = false; await fetchCategories() }
  catch (err) { toastError(errorMessage(err)) } finally { deleting.value = false }
}
onMounted(fetchCategories)
onUnmounted(clearPreview)
</script>
<style scoped>

.page-description { font-size: 13px; color: #82778d; margin-top: 7px; }
.category-thumbnail { width: 48px; height: 48px; border-radius: 8px; object-fit: contain; }
.category-description { max-width: 280px; font-size: 12px; margin-top: 5px; color: #82778d; }
.category-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 99px; padding: 5px 10px; font-size: 11px; font-weight: 650; line-height: 1.4; white-space: nowrap; }
.category-pill-parent { color: #694196; background: #f0e8fa; border: 1px solid #e4d5f4; }
.category-pill-child { color: #247c78; background: #e7f5f2; border: 1px solid #cae7e0; }
.category-pill-caption { display: block; margin-top: 6px; font-size: 10px; color: #8c7f98; }
.category-status-pill { display: inline-flex; align-items: center; gap: 7px; border-radius: 99px; padding: 5px 11px; font-size: 11px; font-weight: 650; line-height: 1.4; }
.status-active { color: #287443; background: #eaf6ed; border: 1px solid #d1e9d8; }
.status-inactive { color: #8c6471; background: #f7f0f3; border: 1px solid #ebdce2; }
.status-dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 3px rgb(40 116 67 / 7%); }
.status-inactive .status-dot { box-shadow: 0 0 0 3px rgb(140 100 113 / 7%); }
.actions { display: flex; gap: 5px; }
.category-form { display: flex; flex-direction: column; gap: 20px; }
.category-form label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-weight: 600; }
.category-form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.category-form .category-status { flex-direction: row; align-items: center; padding-top: 23px; }
.category-form :is(input:not([type=checkbox]), select, textarea) { width: 100%; }
.muted { font-size: 11px; font-weight: 400; color: #82778d; }
.required { color: #c53c4b; }
.category-preview { display: flex; align-items: center; gap: 20px; }
.category-preview img { width: 120px; height: 100px; object-fit: contain; border: 1px solid #e9e4f0; border-radius: 10px; }
@media(max-width: 600px) { .category-form-grid { grid-template-columns: 1fr; } .category-form .category-status { padding-top: 0; } }

</style>
