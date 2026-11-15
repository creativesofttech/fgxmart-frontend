<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Permissions Management</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Create Permission
      </button>
    </div>
    <div class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="permissions"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchPermissions"
      >
        <template #created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #updated_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="editPermission(row)" title="Edit">
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
      :title="isEdit ? 'Edit Permission' : 'Create Permission'"
    >
      <div class="form-group">
        <label for="perm-name">Permission Name <span class="required">*</span></label>
        <input
          id="perm-name"
          v-model="formData.name"
          type="text"
          class="form-input tw:input"
          placeholder="e.g. User Index"
          required
        >
        <p class="help-text">Slug will be automatically generated (e.g. user-index -> user.index)</p>
      </div>
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
      title="Delete Permission"
      :message="`Are you sure you want to delete permission '${itemToDelete?.name}'? This action cannot be undone.`"
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
import { Edit2, Trash2 } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
const permissions = ref([])
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
  name: ''
})
const columns = [
  { key: 'name', label: 'Permission Name', width: '30%' },
  { key: 'slug', label: 'Slug', width: '30%' },
  { key: 'created_at', label: 'Created At', width: '20%' },
  { key: 'updated_at', label: 'Updated At', width: '20%' }
]
const fetchPermissions = async (page = 1) => {
  loading.value = true
  try {
    const { data } = await useAdminApi(`/permissions?page=${page}`)

    if (data.value) {
      permissions.value = data.value.data
      pagination.value = {
        current_page: data.value.current_page,
        last_page: data.value.last_page,
        total: data.value.total,
        from: data.value.from,
        to: data.value.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch permissions:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  isEdit.value = false
  formData.name = ''
  showModal.value = true
}
const editPermission = (row) => {
  isEdit.value = true
  currentId.value = row.id
  formData.name = row.name
  showModal.value = true
}
const handleSave = async () => {
  saving.value = true
  try {
    const method = isEdit.value ? 'PUT' : 'POST'
    const url = isEdit.value ? `/permissions/${currentId.value}` : '/permissions'

    const { error } = await useAdminApi(url, {
      method,
      body: { name: formData.name }
    })

    if (error.value) throw error.value

    showModal.value = false
    fetchPermissions(pagination.value?.current_page || 1)
  } catch (err) {
    alert(err.message || 'Failed to save permission')
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
    const { error } = await useAdminApi(`/permissions/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (error.value) throw error.value

    showDeleteModal.value = false
    fetchPermissions(pagination.value?.current_page || 1)
  } catch (err) {
    alert(err.message || 'Failed to delete permission')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchPermissions()
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

.btn-secondary {
  transition: all 0.2s;
}
.btn-secondary:hover {
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
.form-group .help-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
