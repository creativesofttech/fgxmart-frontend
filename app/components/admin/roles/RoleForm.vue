<template>
  <div class="role-form">
    <div class="form-group name-group">
      <label for="role-name">Name <span class="required">*</span></label>
      <input
        id="role-name"
        v-model="formData.name"
        type="text"
        class="form-input tw:input"
        placeholder="Role Name"
        required
      >
    </div>
    <div class="permissions-section">
      <h3 class="section-title">Permissions</h3>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="loading" class="loading">Loading permissions...</div>

      <div v-else class="permissions-grid">
        <div
          v-for="(group, module) in groupedPermissions"
          :key="module"
          class="permission-row"
        >
          <div class="module-name">{{ module }} :</div>
          <div class="permission-actions">
            <!-- All Checkbox -->
            <label class="checkbox-wrapper">
              <input class="tw:checkbox tw:checkbox-primary"
                type="checkbox"
                :checked="isAllSelected(module)"
                @change="toggleAll(module)"
              >
              <span class="label-text">All</span>
            </label>
            <!-- Individual Actions -->
            <label
              v-for="action in ['index', 'create', 'edit', 'destroy']"
              :key="action"
              class="checkbox-wrapper"
              :class="{ 'disabled': !group[action] }"
            >
              <template v-if="group[action]">
                <input class="tw:checkbox tw:checkbox-primary"
                  type="checkbox"
                  :value="group[action].id"
                  v-model="formData.permissions"
                >
                <span class="label-text">{{ capitalize(action) }}</span>
              </template>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="saveRole" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({ name: '', permissions: [] })
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['save'])
const formData = ref({
  name: props.initialData.name || '',
  permissions: [...(props.initialData.permissions || [])]
})
const allPermissions = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
// Group permissions by module
const groupedPermissions = computed(() => {
  const groups = {}

  if (!allPermissions.value || allPermissions.value.length === 0) return groups;
  allPermissions.value.forEach(perm => {
    // Expected slug format: module.action (e.g. roles.index)
    // Or name format: Module Action (e.g. Roles View)
    // Let's rely on slug
    const parts = perm.slug.split('.')
    if (parts.length >= 2) {
      const module = capitalize(parts[0].replace(/-/g, ' '))
      const action = parts[1]

      if (!groups[module]) {
        groups[module] = {}
      }

      groups[module][action] = perm
    }
  })

  return groups
})
const fetchPermissions = async () => {
  loading.value = true
  error.value = null
  try {
    const { data, error: fetchError } = await useAdminApi('/permissions?all=true')

    if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch permissions')
    }
    if (data.value && data.value.data) {
      allPermissions.value = data.value.data
      console.log('Fetched permissions:', allPermissions.value)
    } else {
        console.warn('No data returned from permissions API', data.value)
    }
  } catch (err) {
    console.error('Failed to fetch permissions:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}
const isAllSelected = (module) => {
  const group = groupedPermissions.value[module]
  if (!group) return false

  // Get all permission IDs for this module
  const ids = Object.values(group).map(p => p.id)

  // Check if every ID is in formData.permissions
  return ids.every(id => formData.value.permissions.includes(id))
}
const toggleAll = (module) => {
  const group = groupedPermissions.value[module]
  if (!group) return

  const ids = Object.values(group).map(p => p.id)
  const allSelected = isAllSelected(module)

  if (allSelected) {
    // Deselect all
    formData.value.permissions = formData.value.permissions.filter(id => !ids.includes(id))
  } else {
    // Select all (add missing ones)
    ids.forEach(id => {
      if (!formData.value.permissions.includes(id)) {
        formData.value.permissions.push(id)
      }
    })
  }
}
const saveRole = () => {
  if (!formData.value.name) {
    alert('Please enter a role name')
    return
  }

  saving.value = true
  emit('save', formData.value)
}
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
// Watch for initialData changes (e.g. when fetching for edit)
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    formData.value.name = newVal.name // Not working if name is empty initially?
    // Better logic: only update if meaningful? Or simple:
    formData.value = {
        name: newVal.name,
        permissions: newVal.permissions?.map(p => p.id) || [] // Assuming initialData passes array of objects or IDs. If objects, map to ID.
    }

     // If initialData.permissions are objects, map them
    if (newVal.permissions && newVal.permissions.length > 0 && typeof newVal.permissions[0] === 'object') {
        formData.value.permissions = newVal.permissions.map(p => p.id)
    } else if (newVal.permissions) {
        formData.value.permissions = [...newVal.permissions]
    }
  }
}, { deep: true })

onMounted(() => {
  fetchPermissions()
})
</script>
<style scoped>
.role-form {
  background-color: var(--color-base-100);
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
  color: var(--color-base-content);
}

.form-group {
  margin-bottom: 2rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #80718d;
}
.form-group label .required {
  color: #ef4444;
}
.form-group .form-input {
  width: 100%;
}
.form-group .form-input:focus {
}

.permissions-section .section-title {
  font-size: 1rem;
  color: #80718d;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgb(71 37 128 / 10%);
  padding-bottom: 0.5rem;
}

.permissions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .permissions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.permission-row {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background-color: var(--color-base-200);
  border-radius: 0.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
  gap: 1rem;
}
@media (min-width: 640px) {
  .permission-row {
    flex-direction: row;
    align-items: center;
  }
}

.module-name {
  width: 120px;
  font-weight: 600;
  color: var(--color-base-content);
  font-size: 0.95rem;
  flex-shrink: 0;
}

.permission-actions {
  display: flex;
  flex: 1;
  gap: 1.25rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.checkbox-wrapper.disabled {
  opacity: 0.3;
  pointer-events: none;
}
.checkbox-wrapper input[type=checkbox] {
  width: 18px;
  accent-color: var(--color-primary);
}
.checkbox-wrapper .label-text {
  color: #756780;
  font-size: 0.9rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  transition: background-color 0.2s;
}
.btn-primary:hover {
}
.btn-primary:disabled {
}

.loading {
  color: #80718d;
  font-style: italic;
}
</style>
