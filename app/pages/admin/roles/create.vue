<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Create Role</h1>
    </div>
    <RoleForm @save="handleSave" />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import RoleForm from '~/components/admin/roles/RoleForm.vue'
import { useAdminToast } from '~/composables/useAdminToast'
const router = useRouter()
const { success, error: toastError } = useAdminToast()
const handleSave = async (formData) => {
  try {
    const { permissions, name } = formData

    const { error: apiErr } = await useAdminApi('/roles', {
      method: 'POST',
      body: {
        name,
        permissions
      }
    })

    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to create role')
        return
    }
    success('Role created successfully')
    router.push('/admin/roles')
  } catch (err) {
    toastError('An unexpected error occurred')
    console.error(err)
  }
}
</script>
<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  margin-bottom: 0;
}
.page-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-base-content);
}
</style>
