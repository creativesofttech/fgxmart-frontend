<template>
  <div class="page-management">
    <div class="page-container">
      <div class="page-header">
        <h1 class="title">Website Pages</h1>
        <NuxtLink to="/admin/pages/create" class="btn-primary tw:btn tw:btn-sm tw:btn-primary">
          <Plus :size="16" aria-hidden="true" /> Create New Page
        </NuxtLink>
      </div>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="tw:card stat-card">
          <div class="stat-icon blue">
            <FileText class="icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Total Pages</p>
            <p class="stat-value">{{ pages.length }}</p>
          </div>
        </div>
        <div class="tw:card stat-card">
          <div class="stat-icon green">
            <CheckCircle class="icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Active Pages</p>
            <p class="stat-value">{{ pages.filter(p => p.status).length }}</p>
          </div>
        </div>
      </div>
      <div class="tw:card content-card">
        <DataTable
          :columns="columns"
          :data="pages"
          :loading="loading"
          :actions="true"
        >
          <template #status="{ value }">
            <span class="tw:badge badge" :class="value ? 'active' : 'inactive'">
              {{ value ? 'Active' : 'Inactive' }}
            </span>
          </template>
          <template #position="{ value }">
            <span class="position-badge">{{ value.toUpperCase() }}</span>
          </template>
          <template #slug="{ value }">
             <code class="slug-text">/{{ value }}</code>
          </template>
          <template #actions="{ row }">
            <div class="actions">
              <NuxtLink :to="`/admin/pages/edit/${row.id}`" class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost" title="Edit">
                <Edit2 class="icon" />
              </NuxtLink>
              <button class="btn-icon delete tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="confirmDelete(row)" title="Delete">
                <Trash2 class="icon" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>
      <!-- Confirm Delete Modal -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Delete Page"
        :message="`Are you sure you want to delete '${itemToDelete?.title}'? This action cannot be undone.`"
        :loading="deleting"
        @confirm="handleDelete"
      />
    </div>
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { FileText, CheckCircle, Edit2, Trash2, Plus } from 'lucide-vue-next'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const pages = ref([])
const loading = ref(true)
const columns = [
  { key: 'title', label: 'Page Title', width: '25%' },
  { key: 'slug', label: 'Slug', width: '20%', slot: 'slug' },
  { key: 'position', label: 'Position', width: '15%', slot: 'position' },
  { key: 'status', label: 'Status', width: '15%', slot: 'status' }
]
const fetchPages = async () => {
  loading.value = true
  try {
    const data = await $adminApi('/pages')
    if (data && data.data) {
      pages.value = data.data
    }
  } catch (err) {
    console.error('Failed to fetch pages:', err)
  } finally {
    loading.value = false
  }
}
// Delete State
const showDeleteModal = ref(false)
const deleting = ref(false)
const itemToDelete = ref(null)
const confirmDelete = (row) => {
  itemToDelete.value = row
  showDeleteModal.value = true
}
const handleDelete = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    const { error: apiErr } = await useAdminApi(`/pages/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete page')
        return
    }

    success('Page deleted successfully')
    showDeleteModal.value = false
    await fetchPages()
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchPages()
})
</script>
<style scoped>
.page-header { flex-wrap: wrap; gap: 16px; }
.page-header > .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; height: 40px; padding: 0 16px; line-height: 1; font-weight: 600; }
.page-header > .btn-primary svg { flex-shrink: 0; }
@media(max-width:600px) { .page-container .stats-grid { grid-template-columns: 1fr; } }
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
  text-decoration: none;
  display: inline-flex;
  transition: background-color 0.2s;
}
.btn-primary:hover:not(:disabled) {
}

.btn-secondary {
}
.btn-secondary:hover:not(:disabled) {
}

.btn-sm {
}

.badge {
  text-transform: uppercase;
}
.badge.active {
}
.badge.inactive {
}

.position-badge {
  background-color: rgb(71 37 128 / 10%);
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.slug-text {
  color: var(--color-primary);
  font-size: 0.85rem;
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

/* Tabs */
.form-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid rgb(71 37 128 / 10%);
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  color: #80718d;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.tab-btn:hover {
  color: var(--color-base-content);
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* Form layout */
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

.col-1 {
  flex: 1;
}

.col-2 {
  flex: 2;
}

.flex-center {
  display: flex;
  align-items: center;
}

/* Switch */
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

/* Builder */
.block-item {
  transition: transform 0.2s;
}
.block-item:hover {
  transform: translateY(-2px);
}
</style>
