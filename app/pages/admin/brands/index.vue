<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Brands Management</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Create Brand
      </button>
    </div>
    <div class="tw:card content-card">
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
import { ref, onMounted, reactive } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import Modal from '~/components/admin/ui/Modal.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { Edit2, Trash2, Upload, X } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
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
