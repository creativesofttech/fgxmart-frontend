<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Product Attributes</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Create Attribute
      </button>
    </div>
    <div class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="attributes"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchAttributes"
      >
        <template #status="{ value }">
          <span class="tw:badge badge" :class="value ? 'active' : 'inactive'">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #values="{ value }">
          <div class="values-list">
            <span v-for="val in value" :key="val.id" class="value-tag">
              {{ val.value }}
            </span>
            <span v-if="!value || value.length === 0" class="no-values">No values</span>
          </div>
        </template>
        <template #created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="editAttribute(row)" title="Edit">
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
      :title="isEdit ? 'Edit Attribute' : 'Create Attribute'"
      width="600px"
    >
      <form @submit.prevent="handleSave" class="attribute-form">
        <div class="form-group">
          <label for="attr-name">Attribute Name <span class="required">*</span></label>
          <input
            id="attr-name"
            v-model="formData.name"
            type="text"
            class="form-input tw:input"
            placeholder="e.g. Weight"
            required
          >
        </div>
        <div class="row">
          <div class="form-group col">
            <label for="attr-order">Sorting Order</label>
            <input
              id="attr-order"
              v-model="formData.sorting_order"
              type="number"
              class="form-input tw:input"
              placeholder="0"
            >
          </div>
          <div class="form-group col flex-center">
            <div class="switch-container">
              <span class="switch-label">Active Status</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status">
                <span class="slider round"></span>
              </label>
            </div>
          </div>
        </div>
        <div class="values-section">
          <div class="section-header">
            <span class="section-title">Attribute Values</span>
            <button type="button" class="btn-add-value tw:btn tw:btn-sm tw:btn-ghost" @click="addValue">
              <Plus class="icon" /> Add Value
            </button>
          </div>

          <div class="values-grid">
            <div v-for="(val, index) in formData.values" :key="index" class="value-row">
              <input
                v-model="val.value"
                type="text"
                class="form-input tw:input"
                placeholder="Value (e.g. 500g)"
                required
              >
              <input
                v-model="val.sorting_order"
                type="number"
                class="form-input small tw:input"
                placeholder="Order"
              >
              <button type="button" class="btn-remove-value tw:btn tw:btn-sm tw:btn-ghost" @click="removeValue(index)">
                <X class="icon" />
              </button>
            </div>
            <div v-if="formData.values.length === 0" class="empty-values">
              No values added. Click "Add Value" to start.
            </div>
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
      title="Delete Attribute"
      :message="`Are you sure you want to delete attribute '${itemToDelete?.name}'? All its values will also be deleted.`"
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
import { Edit2, Trash2, Plus, X } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const attributes = ref([])
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
  sorting_order: 0,
  status: true,
  values: []
})
const columns = [
  { key: 'name', label: 'Attribute Name', width: '25%' },
  { key: 'values', label: 'Values', width: '35%', slot: 'values' },
  { key: 'sorting_order', label: 'Order', width: '10%' },
  { key: 'status', label: 'Status', width: '10%', slot: 'status' },
  { key: 'created_at', label: 'Created At', width: '20%' }
]
const fetchAttributes = async (page = 1) => {
  loading.value = true
  try {
    const data = await $adminApi(`/attributes?page=${page}`)
    if (data) {
      attributes.value = [...data.data] // Force reactivity refresh
      pagination.value = {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch attributes:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  isEdit.value = false
  formData.name = ''
  formData.sorting_order = 0
  formData.status = true
  formData.values = []
  showModal.value = true
}
const editAttribute = (row) => {
  isEdit.value = true
  currentId.value = row.id
  formData.name = row.name
  formData.sorting_order = row.sorting_order
  formData.status = !!row.status
  formData.values = row.values ? row.values.map(v => ({
    id: v.id,
    value: v.value,
    sorting_order: v.sorting_order
  })) : []
  showModal.value = true
}
const addValue = () => {
  formData.values.push({
    value: '',
    sorting_order: (formData.values.length + 1) * 10
  })
}
const removeValue = (index) => {
  formData.values.splice(index, 1)
}
const handleSave = async () => {
  saving.value = true
  try {
    const payload = {
      name: formData.name,
      sorting_order: formData.sorting_order,
      status: formData.status,
      values: formData.values
    }
    const { error: apiErr } = await useAdminApi(isEdit.value ? `/attributes/${currentId.value}` : '/attributes', {
      method: isEdit.value ? 'PUT' : 'POST',
      body: payload
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Validation error')
        return
    }

    success(isEdit.value ? 'Attribute updated successfully' : 'Attribute created successfully')
    showModal.value = false
    await fetchAttributes(pagination.value?.current_page || 1)
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
    const { error: apiErr } = await useAdminApi(`/attributes/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })
    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete attribute')
        return
    }
    success('Attribute deleted successfully')
    showDeleteModal.value = false
    await fetchAttributes(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchAttributes()
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

.values-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.values-list .value-tag {
  background-color: rgb(71 37 128 / 10%);
  color: #80718d;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  border: 1px solid rgb(71 37 128 / 10%);
}
.values-list .no-values {
  color: #64748b;
  font-size: 0.75rem;
  font-style: italic;
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
.form-input.small {
  width: 80px;
}

.values-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgb(71 37 128 / 10%);
}
.values-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.values-section .section-header .section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-base-content);
}
.values-section .section-header .btn-add-value {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}
.values-section .section-header .btn-add-value:hover {
}
.values-section .section-header .btn-add-value .icon {
  width: 14px;
}
.values-section .values-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.values-section .values-grid .value-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.values-section .values-grid .btn-remove-value {
}
.values-section .values-grid .btn-remove-value:hover {
}
.values-section .values-grid .btn-remove-value .icon {
  width: 18px;
}
.values-section .values-grid .empty-values {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-size: 0.875rem;
  background-color: var(--color-base-200);
  border-radius: 0.5rem;
  border: 1px dashed rgb(71 37 128 / 10%);
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

.row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.col {
  flex: 1;
}

.flex-center {
  display: flex;
  align-items: center;
}

.btn-secondary {
}
.btn-secondary:hover {
}
</style>
