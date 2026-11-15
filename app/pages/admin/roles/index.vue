<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Roles Management</h1>
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="openCreateModal">
        + Create Role
      </button>
    </div>
    <div class="tw:card content-card">
      <DataTable
        :columns="columns"
        :data="roles"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchRoles"
      >
        <template #permissions="{ value }">
          <div class="tags">
            <span v-for="perm in value.slice(0, 3)" :key="perm.id" class="tag">
              {{ perm.name }}
            </span>
            <span v-if="value.length > 3" class="tag-more">
              +{{ value.length - 3 }} more
            </span>
          </div>
        </template>
        <template #created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="editRole(row)" title="Edit">
              <Edit2 class="icon" />
            </button>
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
      title="Delete Role"
      :message="`Are you sure you want to delete role '${itemToDelete?.name}'? This action cannot be undone.`"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { Edit2, Trash2 } from 'lucide-vue-next'
import { formatDate } from '~/utils/admin-format'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const roles = ref([])
const loading = ref(true)
const pagination = ref(null)
// Modal State
const showDeleteModal = ref(false)
const deleting = ref(false)
const itemToDelete = ref(null)
const columns = [
  { key: 'name', label: 'Role Name', width: '20%' },
  { key: 'slug', label: 'Slug', width: '20%' },
  { key: 'permissions', label: 'Permissions', width: '40%' },
  { key: 'created_at', label: 'Created At', width: '20%' }
]
const fetchRoles = async (page = 1) => {
  loading.value = true
  try {
    const data = await $adminApi(`/roles?page=${page}`)

    if (data) {
      roles.value = [...data.data]
      pagination.value = {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch roles:', err)
  } finally {
    loading.value = false
  }
}
const openCreateModal = () => {
  navigateTo('/admin/roles/create')
}
const editRole = (role) => {
  navigateTo(`/admin/roles/${role.id}`)
}
const confirmDelete = (row) => {
  itemToDelete.value = row
  showDeleteModal.value = true
}
const handleDelete = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    const { error: apiErr } = await useAdminApi(`/roles/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete role')
        return
    }

    success('Role deleted successfully')
    showDeleteModal.value = false
    await fetchRoles(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchRoles()
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
.btn-primary:hover {
}

.tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tag {
  background-color: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.tag-more {
  color: #80718d;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
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
</style>
