<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Edit Role: {{ role?.name }}</h1>
    </div>
    <div v-if="loading" class="loading">Loading role data...</div>
    <RoleForm v-else :initial-data="role" is-edit @save="handleUpdate" />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted } from 'vue'
import RoleForm from '~/components/admin/roles/RoleForm.vue'
const route = useRoute()
const router = useRouter()
const roleId = route.params.id
const role = ref(null)
const loading = ref(true)
const fetchRole = async () => {
    loading.value = true
    try {
        const { data } = await useAdminApi(`/roles/${roleId}`)

        if (data.value && data.value.data) {
            role.value = {
                name: data.value.data.name,
                permissions: data.value.data.permissions.map(p => p.id)
            }
        }
    } catch (err) {
        console.error('Failed to fetch role:', err)
        alert('Failed to load role')
        router.push('/admin/roles')
    } finally {
        loading.value = false
    }
}
const handleUpdate = async (formData) => {
    try {
        const { name, permissions } = formData

        await useAdminApi(`/roles/${roleId}`, {
            method: 'PUT',
            body: {
                name,
                permissions
            }
        })

        router.push('/admin/roles')
    } catch (err) {
        alert('Failed to update role')
        console.error(err)
    }
}
onMounted(() => {
    fetchRole()
})
</script>
<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
}
.page-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-base-content);
}

.loading {
  color: #80718d;
  text-align: center;
  padding: 2rem;
}
</style>
