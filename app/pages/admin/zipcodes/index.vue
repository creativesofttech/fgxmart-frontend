<template>
  <div class="page-container">
    <div class="page-header"><div><h1 class="title">Zipcodes</h1><p class="page-description">Manage a comma-separated zipcode list for each country.</p></div><button v-if="can('zipcodes.create')" class="tw:btn tw:btn-primary tw:btn-sm" :disabled="loading || !availableCountries.length" @click="openForm()">+ Add Zipcodes</button></div>
    <div v-if="loadError" class="tw:alert tw:alert-error" role="alert">{{ loadError }}<button class="tw:btn tw:btn-sm" @click="fetchZipcodes()">Retry</button></div>
    <div class="tw:card content-card">
      <DataTable :columns="columns" :data="rows" :loading="loading" :pagination="pagination" :actions="can('zipcodes.edit') || can('zipcodes.destroy')" @page-change="fetchZipcodes">
        <template #country="{ row }"><strong>{{ row.country?.name }}</strong><span class="country-code">{{ row.country?.code }}</span></template>
        <template #zipcodes="{ value }"><div class="zipcode-preview">{{ value }}</div><small class="muted">{{ value.split(',').length }} zipcodes</small></template>
        <template #actions="{ row }"><div class="actions"><button v-if="can('zipcodes.edit')" class="tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" :aria-label="`Edit zipcodes for ${row.country?.name}`" @click="openForm(row)"><Pencil :size="17" /></button><button v-if="can('zipcodes.destroy')" class="tw:btn tw:btn-sm tw:btn-ghost tw:btn-square delete-button" :aria-label="`Delete zipcodes for ${row.country?.name}`" @click="itemToDelete = row; showDelete = true"><Trash2 :size="17" /></button></div></template>
      </DataTable>
    </div>
    <Modal v-model="showForm" :title="currentId ? 'Edit Zipcodes' : 'Add Zipcodes'" width="600px" :close-disabled="saving">
      <form id="zipcode-form" class="zipcode-form" @submit.prevent="save">
        <AppSelect v-model="form.country_id" :options="countryOptions" label="Country" placeholder="Select Country" required :allow-empty="false" :disabled="saving" :error="fieldErrors.country_id?.[0]" />
        <label for="zipcode-values">Zipcodes <span class="required">*</span></label>
        <textarea id="zipcode-values" v-model="form.zipcodes" class="tw:textarea" rows="6" maxlength="50000" placeholder="e.g. 00123, 560001, SW1A 1AA" required :disabled="saving" :aria-invalid="Boolean(fieldErrors.zipcodes)" aria-describedby="zipcode-help zipcode-error" />
        <small id="zipcode-help" class="muted">Separate zipcodes with commas. Letters, numbers, spaces and hyphens are supported. Duplicate entries are removed when saved.</small>
        <p v-if="fieldErrors.zipcodes" id="zipcode-error" class="field-error" role="alert">{{ fieldErrors.zipcodes[0] }}</p>
        <p v-if="saveError" class="field-error" role="alert">{{ saveError }}</p>
      </form>
      <template #footer><button class="tw:btn tw:btn-sm tw:btn-outline" :disabled="saving" @click="showForm = false">Cancel</button><button form="zipcode-form" type="submit" class="tw:btn tw:btn-primary tw:btn-sm" :disabled="saving">{{ saving ? 'Saving...' : 'Save Zipcodes' }}</button></template>
    </Modal>
    <ConfirmModal v-model="showDelete" title="Delete Zipcodes" :message="`Delete all saved zipcodes for ${itemToDelete?.country?.name}? The country will remain available.`" :loading="deleting" @confirm="remove" />
  </div>
</template>
<script setup>
import { Pencil, Trash2 } from 'lucide-vue-next'
import DataTable from '~/components/admin/ui/DataTable.vue'
import Modal from '~/components/admin/ui/Modal.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
definePageMeta({ layout: 'admin' })
const { can } = useAdminAuth()
const { success, error: toastError } = useAdminToast()
const rows = ref([]), countries = ref([]), configuredIds = ref([]), pagination = ref(null)
const loading = ref(true), loadError = ref(''), saving = ref(false), deleting = ref(false)
const showForm = ref(false), showDelete = ref(false), currentId = ref(null), editingCountryId = ref(null), itemToDelete = ref(null)
const fieldErrors = ref({}), saveError = ref('')
const form = reactive({ country_id: null, zipcodes: '' })
const columns = [{ key: 'country', label: 'Country', slot: 'country', width: '25%' }, { key: 'zipcodes', label: 'Zipcodes', slot: 'zipcodes' }]
const availableCountries = computed(() => countries.value.filter(country => !configuredIds.value.includes(country.id)))
const countryOptions = computed(() => countries.value.map(country => ({ ...country, name: `${country.name} (${country.code})`, disabled: configuredIds.value.includes(country.id) && country.id !== editingCountryId.value })))
const fetchZipcodes = async (page = 1) => {
  loading.value = true; loadError.value = ''
  try {
    const response = await $adminApi(`/zipcodes?page=${page}`)
    rows.value = response.data; countries.value = response.countries; configuredIds.value = response.configured_country_ids
    pagination.value = { current_page: response.current_page, last_page: response.last_page, total: response.total, from: response.from, to: response.to }
  } catch { loadError.value = 'Unable to load zipcodes. Please try again.' }
  finally { loading.value = false }
}
const openForm = row => {
  currentId.value = row?.id || null
  editingCountryId.value = row?.country_id || null
  Object.assign(form, { country_id: row?.country_id || null, zipcodes: row?.zipcodes || '' })
  fieldErrors.value = {}; saveError.value = ''; showForm.value = true
}
const save = async () => {
  if (saving.value) return
  saving.value = true; fieldErrors.value = {}; saveError.value = ''
  try {
    await $adminApi(currentId.value ? `/zipcodes/${currentId.value}` : '/zipcodes', { method: currentId.value ? 'PUT' : 'POST', body: { country_id: form.country_id, zipcodes: form.zipcodes } })
    showForm.value = false; success('Zipcodes saved successfully')
    await fetchZipcodes(currentId.value ? pagination.value?.current_page || 1 : 1)
  } catch (error) {
    const details = error.data?.data || error.data
    fieldErrors.value = details?.errors || {}
    if (!Object.keys(fieldErrors.value).length) saveError.value = details?.message || 'Unable to save zipcodes. Please try again.'
  } finally { saving.value = false }
}
const remove = async () => {
  if (deleting.value || !itemToDelete.value) return
  deleting.value = true
  try {
    await $adminApi(`/zipcodes/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDelete.value = false; success('Zipcodes deleted successfully')
    await fetchZipcodes(rows.value.length === 1 ? Math.max(1, (pagination.value?.current_page || 1) - 1) : pagination.value?.current_page || 1)
  } catch { toastError('Unable to delete zipcodes. Please try again.') }
  finally { deleting.value = false }
}
onMounted(() => fetchZipcodes())
</script>
<style scoped>
.page-description { color: #8b7b9a; font-size: 13px; margin-top: 8px; }
.zipcode-form { display: flex; flex-direction: column; gap: 10px; }
.zipcode-form > label { font-size: 13px; font-weight: 600; color: #746181; margin-top: 8px; }
.zipcode-form textarea { width: 100%; resize: vertical; min-height: 150px; }
.required, .field-error { color: #b34b68; }
.field-error { font-size: 12px; margin: 0; }
.muted { color: #8b7b9a; font-size: 11px; line-height: 1.6; }
.country-code { display: inline-block; margin-left: 9px; padding: 3px 7px; background: #f1ebf8; color: #72518f; border-radius: 6px; font-size: 10px; }
.zipcode-preview { max-width: 720px; overflow-wrap: anywhere; line-height: 1.7; max-height: 110px; overflow-y: auto; }
.actions { display: flex; gap: 5px; }
.delete-button { color: #b34b68; }
</style>
