<template>
  <div class="page-container">
    <div class="page-header">
      <h1 id="brand-management-title" class="title">Brands Management</h1>
      <div class="brand-header-actions">
      <button v-if="canRearrange" class="tw:btn tw:btn-sm tw:btn-outline" :disabled="orderSaving" @click="openRearrange"><ArrowUpDown :size="16" aria-hidden="true" /> Rearrange</button>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" :disabled="orderSaving" @click="openCreateModal">
        + Create Brand
      </button>
      </div>
    </div>
    <div v-if="canRearrange" class="tw:tabs brand-tabs" role="tablist" aria-label="Brand views" @keydown.right.prevent="changeTab" @keydown.left.prevent="changeTab">
      <button id="brand-list-tab" role="tab" class="tw:tab" :class="{'tw:tab-active': activeTab === 'list'}" :aria-selected="activeTab === 'list'" :tabindex="activeTab === 'list' ? 0 : -1" aria-controls="brand-list-panel" :disabled="orderSaving" @click="activeTab = 'list'">Brand list</button>
      <button id="brand-order-tab" role="tab" class="tw:tab" :class="{'tw:tab-active': activeTab === 'order'}" :aria-selected="activeTab === 'order'" :tabindex="activeTab === 'order' ? 0 : -1" aria-controls="brand-order-panel" :disabled="orderSaving" @click="openRearrange">Rearrange</button>
    </div>
    <div v-show="activeTab === 'list'" id="brand-list-panel" role="tabpanel" :aria-labelledby="canRearrange ? 'brand-list-tab' : 'brand-management-title'" class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="brands"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchBrands"
      >
        <template #image_url="{ value }">
          <div class="brand-image-cell">
            <img v-if="value" :src="value" alt="Brand" class="table-img">
            <div v-else class="no-img">No Image</div>
          </div>
        </template>
        <template #status="{ value }">
          <span class="tw:badge badge" :class="value ? 'active' : 'inactive'">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="editBrand(row)" title="Edit">
              <Edit2 class="icon" />
            </button>
            <button class="btn-icon delete tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="confirmDelete(row)" title="Delete">
              <Trash2 class="icon" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>
    <section v-if="canRearrange && activeTab === 'order'" id="brand-order-panel" role="tabpanel" aria-labelledby="brand-order-tab" class="tw:card brand-order-panel" :aria-busy="orderLoading || orderSaving">
      <div class="brand-order-heading"><div><h2>Arrange your brands</h2><p>Drag logos into order, or use the arrow buttons. Save to update the storefront.</p></div><span>{{ orderedBrands.length }} brands</span></div>
      <div v-if="orderLoading" class="brand-order-empty" role="status"><span class="tw:loading tw:loading-spinner" aria-hidden="true" /> Loading brands...</div>
      <div v-else-if="orderLoadError" class="brand-order-empty" role="alert"><p>{{ orderLoadError }}</p><button class="tw:btn tw:btn-sm tw:btn-outline" @click="openRearrange">Try again</button></div>
      <p v-else-if="!orderedBrands.length" class="brand-order-empty">Create a brand to start arranging your list.</p>
      <ol v-else class="brand-order-grid" aria-label="Brand display order">
        <li v-for="(brand, index) in orderedBrands" :key="brand.id" class="brand-order-item" :class="{'is-dragging': draggingId === brand.id}" :draggable="!orderSaving" :data-brand-id="brand.id" @dragstart="startDrag($event, brand.id)" @dragover.prevent @drop.prevent="dropBrand(brand.id)" @dragend="draggingId = null">
          <GripVertical class="brand-grip" :size="16" aria-hidden="true" />
          <div class="brand-order-logo"><img v-if="brand.image_url && !brokenOrderImages.has(brand.id)" :src="brand.image_url" alt="" draggable="false" @error="brokenOrderImages.add(brand.id)" /><Tag v-else :size="30" aria-hidden="true" /></div>
          <h3>{{ brand.name }}</h3>
          <div class="brand-order-controls"><button type="button" class="tw:btn tw:btn-ghost tw:btn-xs tw:btn-square" :aria-label="`Move ${brand.name} earlier`" :disabled="orderSaving || index === 0" @click="moveBrand(index, index - 1)"><ArrowLeft :size="16" aria-hidden="true" /></button><button type="button" class="tw:btn tw:btn-ghost tw:btn-xs tw:btn-square" :aria-label="`Move ${brand.name} later`" :disabled="orderSaving || index === orderedBrands.length - 1" @click="moveBrand(index, index + 1)"><ArrowRight :size="16" aria-hidden="true" /></button></div>
        </li>
      </ol>
      <p v-if="orderMessage" class="brand-order-message" :class="{'is-error': orderFailed}" :role="orderFailed ? 'alert' : 'status'">{{ orderMessage }}</p>
      <div class="brand-order-footer"><span>{{ orderDirty ? 'You have unsaved changes.' : 'Your saved order appears on the storefront.' }}</span><div><button class="tw:btn tw:btn-sm tw:btn-outline" :disabled="orderSaving || orderLoading" @click="cancelRearrange">Cancel</button><button class="tw:btn tw:btn-sm tw:btn-primary" :disabled="orderSaving || orderLoading || !!orderLoadError || !orderDirty" @click="saveOrder"><span v-if="orderSaving" class="tw:loading tw:loading-spinner tw:loading-xs" aria-hidden="true" /><Save v-else :size="16" aria-hidden="true" />{{ orderSaving ? 'Saving...' : 'Save order' }}</button></div></div>
    </section>
    <!-- Edit/Create Modal -->
    <Modal
      v-model="showModal"
      :title="isEdit ? 'Edit Brand' : 'Create Brand'"
    >
      <form @submit.prevent="handleSave" class="brand-form">
        <div class="form-group">
          <label for="brand-name">Brand Name <span class="required">*</span></label>
          <input
            id="brand-name"
            v-model="formData.name"
            type="text"
            class="form-input tw:input"
            placeholder="e.g. Nike"
            required
          >
        </div>
        <div class="form-group">
          <div class="switch-container">
            <span class="switch-label">Active Status</span>
            <label class="switch">
              <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status">
              <span class="slider round"></span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Brand Logo</label>
          <div class="image-upload-wrapper">
            <div class="image-preview" v-if="imagePreview || currentImageUrl">
              <img :src="imagePreview || currentImageUrl" alt="Preview">
              <button type="button" class="remove-img tw:btn tw:btn-sm tw:btn-ghost" @click="removeImage">
                <X class="icon" />
              </button>
            </div>
            <label v-else class="upload-placeholder" for="image-upload">
              <Upload class="icon" />
              <span>Click to upload logo</span>
              <input class="tw:file-input"
                id="image-upload"
                type="file"
                accept="image/*"
                hidden
                @change="onFileChange"
              >
            </label>
            <input class="tw:file-input"
              v-if="imagePreview || currentImageUrl"
              id="image-upload-change"
              type="file"
              accept="image/*"
              hidden
              @change="onFileChange"
            >
            <label v-if="imagePreview || currentImageUrl" for="image-upload-change" class="change-link">
                Change Logo
            </label>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="showModal = false" :disabled="saving">
          Cancel
        </button>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="handleSave" :disabled="saving || !formData.name">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </template>
    </Modal>
    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Brand"
      :message="`Are you sure you want to delete brand '${itemToDelete?.name}'? This action cannot be undone.`"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted, reactive, computed, nextTick } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import Modal from '~/components/admin/ui/Modal.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { Edit2, Trash2, Upload, X, ArrowUpDown, ArrowLeft, ArrowRight, GripVertical, Tag, Save } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const { can } = useAdminAuth()
const canRearrange = computed(() => can('brands.index') && can('brands.edit'))
const activeTab = ref('list'), orderedBrands = ref([]), savedOrder = ref([])
const orderLoading = ref(false), orderSaving = ref(false), orderLoadError = ref('')
const orderMessage = ref(''), orderFailed = ref(false), draggingId = ref(null)
const brokenOrderImages = reactive(new Set())
const orderDirty = computed(() => orderedBrands.value.map(brand => brand.id).join(',') !== savedOrder.value.join(','))
const openRearrange = async () => {
  if (!canRearrange.value || orderSaving.value || orderLoading.value) return
  if (activeTab.value === 'order' && !orderLoadError.value) return
  activeTab.value = 'order'; orderLoading.value = true; orderLoadError.value = ''; orderMessage.value = ''; orderedBrands.value = []; savedOrder.value = []
  try {
    const response = await $adminApi('/brands?all=1')
    orderedBrands.value = response.data
    savedOrder.value = response.data.map(brand => brand.id)
    brokenOrderImages.clear()
  } catch (err) { orderLoadError.value = 'Unable to load the brand order. Please try again.' }
  finally { orderLoading.value = false }
}
const changeTab = async () => {
  if (orderSaving.value) return
  if (activeTab.value === 'list') await openRearrange()
  else activeTab.value = 'list'
  await nextTick()
  document.getElementById(activeTab.value === 'list' ? 'brand-list-tab' : 'brand-order-tab')?.focus()
}
const moveBrand = (from, to) => {
  if (orderSaving.value || from < 0 || to < 0 || to >= orderedBrands.value.length || from === to) return
  const [brand] = orderedBrands.value.splice(from, 1)
  orderedBrands.value.splice(to, 0, brand)
  orderFailed.value = false; orderMessage.value = `${brand.name} moved to position ${to + 1}. Save to apply this order.`
}
const startDrag = (event, id) => {
  if (orderSaving.value || event.target.closest('button')) { event.preventDefault(); return }
  draggingId.value = id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(id))
}
const dropBrand = id => {
  if (draggingId.value === null) return
  moveBrand(orderedBrands.value.findIndex(brand => brand.id === draggingId.value), orderedBrands.value.findIndex(brand => brand.id === id))
  draggingId.value = null
}
const cancelRearrange = () => { activeTab.value = 'list'; orderedBrands.value = []; savedOrder.value = []; orderMessage.value = '' }
const saveOrder = async () => {
  if (!canRearrange.value || orderSaving.value || !orderDirty.value || orderLoading.value || orderLoadError.value) return
  orderSaving.value = true; orderFailed.value = false; orderMessage.value = ''
  try {
    await $adminApi('/brands/reorder', { method: 'PUT', body: { brand_ids: orderedBrands.value.map(brand => brand.id) } })
    savedOrder.value = orderedBrands.value.map(brand => brand.id)
    clearNuxtData('storefront-home-brands')
    orderMessage.value = 'Brand order saved. Your storefront now uses this order.'
    await fetchBrands(1)
  } catch (err) {
    orderFailed.value = true; orderMessage.value = err.data?.message || 'Unable to save the order. Please try again.'
    if (err.statusCode === 409 || err.response?.status === 409) orderLoadError.value = orderMessage.value
  } finally { orderSaving.value = false }
}
const brands = ref([])
const loading = ref(true)
const pagination = ref(null)
// Modal State
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const deleting = ref(false)
const currentId = ref(null)
const itemToDelete = ref(null)
const formData = reactive({
  name: '',
  status: true
})
const imageFile = ref(null)
const imagePreview = ref(null)
const currentImageUrl = ref(null)
const columns = [
  { key: 'image_url', label: 'Logo', width: '15%', slot: 'image_url' },
  { key: 'name', label: 'Brand Name', width: '35%' },
  { key: 'slug', label: 'Slug', width: '20%' },
  { key: 'status', label: 'Status', width: '15%', slot: 'status' },
  { key: 'created_at', label: 'Created At', width: '15%' }
]
const fetchBrands = async (page = 1) => {
  loading.value = true
  try {
    const data = await $adminApi(`/brands?page=${page}`)
    if (data) {
      brands.value = [...data.data]
      pagination.value = {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch brands:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  isEdit.value = false
  formData.name = ''
  formData.status = true
  imageFile.value = null
  imagePreview.value = null
  currentImageUrl.value = null
  showModal.value = true
}
const editBrand = (row) => {
  isEdit.value = true
  currentId.value = row.id
  formData.name = row.name
  formData.status = !!row.status
  currentImageUrl.value = row.image_url
  imageFile.value = null
  imagePreview.value = null
  showModal.value = true
}
const onFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}
const removeImage = () => {
    imageFile.value = null
    imagePreview.value = null
    currentImageUrl.value = null
}
const handleSave = async () => {
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('name', formData.name)
    fd.append('status', formData.status ? '1' : '0')
    if (imageFile.value) {
      fd.append('image', imageFile.value)
    }

    if (isEdit.value) {
        fd.append('_method', 'PUT')
    }
    const { error: apiErr } = await useAdminApi(isEdit.value ? `/brands/${currentId.value}` : '/brands', {
      method: 'POST',
      body: fd
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Validation error')
        return
    }

    success(isEdit.value ? 'Brand updated successfully' : 'Brand created successfully')
    showModal.value = false
    await fetchBrands(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    saving.value = false
  }
}
const confirmDelete = (row) => {
  itemToDelete.value = row
  showDeleteModal.value = true
}
const handleDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    const { error: apiErr } = await useAdminApi(`/brands/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete brand')
        return
    }

    success('Brand deleted successfully')
    showDeleteModal.value = false
    await fetchBrands(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchBrands()
})
</script>
<style scoped>
.brand-header-actions { display: flex; align-items: center; gap: 12px; }
.brand-tabs { display: flex; align-self: flex-start; padding: 5px; gap: 6px; background: #ebe5f4; border-radius: 11px; }
.brand-tabs .tw\:tab { height: 40px; padding: 0 20px; border-radius: 7px; font-size: 13px; color: #78648a; }
.brand-tabs .tw\:tab-active { background: white; color: #472580; font-weight: 600; box-shadow: 0 2px 5px rgb(56 30 86 / 6%); }
.brand-order-panel { padding: 26px; border: 1px solid #e8e0f0; border-radius: 12px; background: white; }
.brand-order-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
.brand-order-heading h2 { font-size: 18px; font-weight: 650; color: #302044; margin: 0 0 6px; }
.brand-order-heading p, .brand-order-heading > span, .brand-order-footer > span { font-size: 12px; color: #8a789a; margin: 0; line-height: 1.7; }
.brand-order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; list-style: none; padding: 0; margin: 0; }
.brand-order-item { position: relative; display: flex; flex-direction: column; align-items: center; padding: 24px 14px 10px; border: 1px solid #e8e1f0; border-radius: 11px; background: #fff; cursor: grab; min-width: 0; }
.brand-order-item:hover { border-color: #b7a3d4; background: #fcfaff; }
.brand-order-item.is-dragging { opacity: .45; border-style: dashed; }
.brand-grip { position: absolute; top: 9px; left: 9px; color: #b1a3c0; }
.brand-order-logo { display: flex; align-items: center; justify-content: center; width: 100%; height: 70px; color: #b1a3c0; }
.brand-order-logo img { width: 100%; max-width: 130px; height: 60px; object-fit: contain; }
.brand-order-item h3 { font-size: 13px; font-weight: 600; color: #483256; text-align: center; overflow-wrap: anywhere; margin: 12px 0 8px; }
.brand-order-controls { display: flex; justify-content: center; gap: 10px; margin-top: auto; }
.brand-order-controls button { color: #765694; }
.brand-order-controls button:focus-visible, .brand-tabs button:focus-visible { outline: 2px solid #8e6cb7; outline-offset: 2px; }
.brand-order-empty { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; padding: 48px 15px; color: #8a789a; font-size: 13px; }
.brand-order-message { background: #f0f7eb; color: #587740; border-radius: 8px; padding: 12px 14px; font-size: 12px; margin: 20px 0 0; }
.brand-order-message.is-error { background: #fff0f3; color: #a35d75; }
.brand-order-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; border-top: 1px solid #eee7f5; margin-top: 25px; padding-top: 22px; }
.brand-order-footer > div { display: flex; gap: 10px; }
@media(max-width:600px) { .page-header { flex-wrap: wrap; gap: 16px; }.brand-order-panel { padding: 18px; }.brand-order-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.brand-header-actions { gap: 8px; }.brand-order-footer > div { width: 100%; }.brand-order-footer button { flex: 1; } }
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-base-content);
  margin: 0;
}

.content-card {
  background-color: var(--color-base-100);
  border-radius: 0.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
  overflow: hidden;
}

.btn-primary {
  transition: background-color 0.2s;
}
.btn-primary:hover:not(:disabled) {
}
.btn-primary:disabled {
}

.brand-image-cell .table-img {
  width: 40px;
  object-fit: cover;
}
.brand-image-cell .no-img {
  font-size: 0.75rem;
  color: #64748b;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  transition: background-color 0.2s;
}
.btn-icon:hover {
}
.btn-icon.edit:hover {
}
.btn-icon.delete:hover {
}
.btn-icon .icon {
  width: 16px;
}

.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #80718d;
  font-size: 0.875rem;
}
.form-group label .required {
  color: #ef4444;
}
.form-group .form-input {
  width: 100%;
}
.form-group .form-input:focus {
}

.image-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.image-upload-wrapper .upload-placeholder {
  width: 100%;
  height: 150px;
  border: 2px dashed rgb(71 37 128 / 10%);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: #80718d;
  cursor: pointer;
  transition: all 0.2s;
}
.image-upload-wrapper .upload-placeholder:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.05);
}
.image-upload-wrapper .upload-placeholder .icon {
  width: 32px;
  height: 32px;
}
.image-upload-wrapper .image-preview {
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgb(71 37 128 / 10%);
}
.image-upload-wrapper .image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-upload-wrapper .image-preview .remove-img {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  color: var(--color-base-content);
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
}
.image-upload-wrapper .image-preview .remove-img:hover {
  background-color: #ef4444;
}
.image-upload-wrapper .image-preview .remove-img .icon {
  width: 16px;
  height: 16px;
}
.image-upload-wrapper .change-link {
  color: var(--color-primary);
  font-size: 0.875rem;
  cursor: pointer;
}
.image-upload-wrapper .change-link:hover {
  text-decoration: underline;
}

.badge {
  text-transform: uppercase;
}
.badge.active {
}
.badge.inactive {
}

.btn-secondary {
  transition: all 0.2s;
}
.btn-secondary:hover {
}

.switch-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.switch-label {
  font-size: 0.875rem;
  color: #80718d;
  font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input {
  width: 0;
}
.switch input:checked + .slider {
}
.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-base-200);
  border: 1px solid rgb(71 37 128 / 10%);
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
}
.slider.round {
  border-radius: 24px;
}
.slider.round:before {
  border-radius: 50%;
}
</style>
