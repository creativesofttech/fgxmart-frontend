<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">FAQs Management</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Add New FAQ
      </button>
    </div>
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="tw:card stat-card">
        <div class="stat-icon blue">
          <HelpCircle class="icon" />
        </div>
        <div class="stat-info">
          <p class="stat-label">Total FAQs</p>
          <p class="stat-value">{{ faqs.length }}</p>
        </div>
      </div>
      <div class="tw:card stat-card">
        <div class="stat-icon green">
          <CheckCircle class="icon" />
        </div>
        <div class="stat-info">
          <p class="stat-label">Active FAQs</p>
          <p class="stat-value">{{ faqs.filter(f => f.status).length }}</p>
        </div>
      </div>
    </div>
    <div class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="faqs"
        :loading="loading"
        :actions="true"
      >
        <template #status="{ value }">
          <span class="tw:badge badge" :class="value ? 'active' : 'inactive'">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #sort_order="{ value }">
          <span class="order-badge">{{ value }}</span>
        </template>
        <template #description="{ value }">
          <p class="description-text truncate">{{ value }}</p>
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="openEditModal(row)" title="Edit">
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
      :title="isEdit ? 'Edit FAQ' : 'Add New FAQ'"
    >
      <form @submit.prevent="saveFaq" class="faq-form">
        <div class="form-group">
          <label for="faq-title">FAQ Title <span class="required">*</span></label>
          <input
            id="faq-title"
            v-model="formData.title"
            type="text"
            class="form-input tw:input"
            placeholder="Ex: What is the delivery time?"
            required
          >
        </div>

        <div class="form-group">
          <label for="faq-desc">Description <span class="required">*</span></label>
          <textarea
            id="faq-desc"
            v-model="formData.description"
            rows="4"
            class="form-input tw:textarea"
            placeholder="Detailed answer here..."
            required
          ></textarea>
        </div>
        <div class="row">
          <div class="form-group col">
            <label for="faq-order">Sort Order</label>
            <input
              id="faq-order"
              v-model.number="formData.sort_order"
              type="number"
              class="form-input tw:input"
            >
          </div>

          <div class="form-group col flex-center">
            <div class="switch-container">
              <span class="switch-label">Active Status</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status" :id="'faq-status-' + currentId">
                <span class="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="showModal = false" :disabled="saving">
          Cancel
        </button>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="saveFaq" :disabled="saving || !formData.title || !formData.description">
          {{ saving ? 'Saving...' : (isEdit ? 'Update FAQ' : 'Save FAQ') }}
        </button>
      </template>
    </Modal>
    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete FAQ"
      :message="`Are you sure you want to delete FAQ '${itemToDelete?.title}'? This action cannot be undone.`"
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
import { HelpCircle, CheckCircle, Edit2, Trash2, Plus } from 'lucide-vue-next'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const faqs = ref([])
const loading = ref(true)
// Modal State
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const deleting = ref(false)
const currentId = ref(null)
const itemToDelete = ref(null)
const formData = reactive({
  title: '',
  description: '',
  sort_order: 0,
  status: true
})
const columns = [
  { key: 'sort_order', label: 'Order', width: '80px', slot: 'sort_order' },
  { key: 'title', label: 'FAQ Title', width: '30%' },
  { key: 'description', label: 'Description', width: '40%', slot: 'description' },
  { key: 'status', label: 'Status', width: '100px', slot: 'status' }
]
const fetchFaqs = async () => {
  loading.value = true
  try {
    const data = await $adminApi('/faqs')
    if (data && data.data) {
      faqs.value = data.data
    }
  } catch (err) {
    console.error('Failed to fetch FAQs:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  isEdit.value = false
  formData.title = ''
  formData.description = ''
  formData.sort_order = faqs.value.length + 1
  formData.status = true
  showModal.value = true
}
const openEditModal = (row) => {
  isEdit.value = true
  currentId.value = row.id
  formData.title = row.title
  formData.description = row.description
  formData.sort_order = row.sort_order
  formData.status = !!row.status
  showModal.value = true
}
const saveFaq = async () => {
  saving.value = true
  try {
    const url = isEdit.value ? `/faqs/${currentId.value}` : '/faqs'
    const method = isEdit.value ? 'PUT' : 'POST'

    const { error: apiErr } = await useAdminApi(url, {
      method,
      body: { ...formData }
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Validation error')
        return
    }

    success(isEdit.value ? 'FAQ updated successfully' : 'FAQ created successfully')
    showModal.value = false
    await fetchFaqs()
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
    const { error: apiErr } = await useAdminApi(`/faqs/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete FAQ')
        return
    }

    success('FAQ deleted successfully')
    showDeleteModal.value = false
    await fetchFaqs()
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchFaqs()
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.stat-card .stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card .stat-icon.blue {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}
.stat-card .stat-icon.green {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.stat-card .stat-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
}
.stat-card .stat-label {
  font-size: 0.875rem;
  color: #80718d;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.stat-card .stat-value {
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

.btn-secondary {
}
.btn-secondary:hover:not(:disabled) {
}

.badge {
  text-transform: uppercase;
}
.badge.active {
}
.badge.inactive {
}

.order-badge {
  background-color: rgb(71 37 128 / 10%);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.description-text {
  max-width: 400px;
  font-size: 0.85rem;
  color: #80718d;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  transition: all 0.2s;
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

.row {
  display: flex;
  gap: 1rem;
}

.col {
  flex: 1;
}

.flex-center {
  display: flex;
  align-items: center;
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
