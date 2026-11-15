<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Countries</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Create Country
      </button>
    </div>
    <div class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="countries"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchCountries"
      >
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
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="editCountry(row)" title="Edit">
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
      :title="isEdit ? 'Edit Country' : 'Create Country'"
      width="500px"
    >
      <form @submit.prevent="handleSave" class="country-form">
        <div class="form-group">
          <label for="country-name">Country Name <span class="required">*</span></label>
          <input
            id="country-name"
            v-model="formData.name"
            type="text"
            class="form-input tw:input"
            placeholder="e.g. United States"
            required
          >
        </div>
        <div class="form-group">
          <label for="country-code">Country Code <span class="required">*</span></label>
          <input
            id="country-code"
            v-model="formData.code"
            type="text"
            class="form-input tw:input"
            placeholder="e.g. US"
            maxlength="5"
            required
          >
        </div>
        <div class="form-group flex-center">
            <div class="switch-container">
              <span class="switch-label">Active Status</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status">
                <span class="slider round"></span>
              </label>
            </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="showModal = false" :disabled="saving">
          Cancel
        </button>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="handleSave" :disabled="saving || !formData.name || !formData.code">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </template>
    </Modal>
    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Country"
      :message="`Are you sure you want to delete country '${itemToDelete?.name}'?`"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted, reactive, watch } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import Modal from '~/components/admin/ui/Modal.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { Edit2, Trash2 } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const countries = ref([])
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
  code: '',
  status: true
})
// Auto uppercase code
watch(() => formData.code, (newVal) => {
  if (newVal) formData.code = newVal.toUpperCase()
})
const columns = [
  { key: 'name', label: 'Country Name', width: '40%' },
  { key: 'code', label: 'Code', width: '20%' },
  { key: 'status', label: 'Status', width: '15%', slot: 'status' },
  { key: 'created_at', label: 'Created At', width: '25%' }
]
const fetchCountries = async (page = 1) => {
  loading.value = true
  try {
    const data = await $adminApi(`/countries?page=${page}`)
    if (data) {
      countries.value = [...data.data] // Force reactivity with spread
      pagination.value = {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch countries:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  isEdit.value = false
  formData.name = ''
  formData.code = ''
  formData.status = true
  showModal.value = true
}
const editCountry = (row) => {
  isEdit.value = true
  currentId.value = row.id
  formData.name = row.name
  formData.code = row.code
  formData.status = !!row.status
  showModal.value = true
}
const handleSave = async () => {
  saving.value = true
  try {
    const payload = {
      name: formData.name,
      code: formData.code,
      status: formData.status
    }
    const { data, error: apiErr } = await useAdminApi(isEdit.value ? `/countries/${currentId.value}` : '/countries', {
      method: isEdit.value ? 'PUT' : 'POST',
      body: payload
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Validation error')
        return
    }

    success(isEdit.value ? 'Country updated successfully' : 'Country created successfully')
    showModal.value = false
    await fetchCountries(pagination.value?.current_page || 1)
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
    const { error: apiErr } = await useAdminApi(`/countries/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })
    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete country')
        return
    }
    success('Country deleted successfully')
    showDeleteModal.value = false
    await fetchCountries(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchCountries()
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
  margin-bottom: 1.25rem;
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

.form-input {
  width: 100%;
  transition: border-color 0.2s;
}
.form-input:focus {
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

.badge {
  text-transform: uppercase;
}
.badge.active {
}
.badge.inactive {
}

.btn-secondary {
}
.btn-secondary:hover {
}

.flex-center {
  display: flex;
  align-items: center;
}
</style>
