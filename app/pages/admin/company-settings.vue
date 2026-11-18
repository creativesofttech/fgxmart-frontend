<template>
  <div class="page-container">
    <div class="page-header d-flex tw:justify-between align-center tw:mb-6">
      <h1 class="title">Company Details</h1>
    </div>
    <div class="settings-grid">
      <!-- Left Column: Settings Form -->
      <div class="form-column">
        <div class="tw:card content-card tw:mb-6">
          <div class="tw:tabs company-tabs" role="tablist" aria-label="Company settings">
            <button v-for="(tab, index) in settingsTabs" :id="`company-tab-${tab.id}`" :key="tab.id" class="tw:tab company-tab" :class="{ 'tw:tab-active': activeTab === tab.id }" type="button" role="tab" :aria-selected="activeTab === tab.id" :aria-controls="`company-panel-${tab.id}`" :tabindex="activeTab === tab.id ? 0 : -1" @click="activeTab = tab.id" @keydown="onTabKeydown($event, index)">
              <component :is="tab.icon" :size="17" aria-hidden="true" /><span>{{ tab.label }}</span>
            </button>
          </div>
          <div class="tab-content">
            <!-- Company Details Tab (Merged) -->
            <div v-show="activeTab === 'details'" id="company-panel-details" role="tabpanel" aria-labelledby="company-tab-details" tabindex="0" class="form-grid">
              <div class="section-title full-width tw:mb-2 tw:mt-2">General Information</div>
              <div class="form-group full-width">
                <label>Company Name <span class="required">*</span></label>
                <input v-model="formData.name" type="text" class="form-input tw:input" placeholder="e.g. FGX Global Trading LLC">
              </div>
              <div class="form-group full-width">
                <label>Intro Line</label>
                <input v-model="formData.intro" type="text" class="form-input tw:input" placeholder="Short catchphrase or slogan">
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea v-model="formData.description" class="form-input tw:textarea" rows="4" placeholder="Detailed company description"></textarea>
              </div>
              <div class="form-group full-width">
                <label>Company Logo</label>
                <div class="logo-upload">
                  <div class="image-preview" v-if="logoPreview || formData.logo_path">
                    <img :src="logoPreview || getImageUrl(formData.logo_path)" alt="Logo">
                    <button class="remove-img tw:btn tw:btn-sm tw:btn-ghost" @click="clearLogo"><X class="icon" /></button>
                  </div>
                  <div v-else class="upload-placeholder" @click="$refs.logoInput.click()">
                    <Upload class="icon" />
                    <span>Upload Logo</span>
                  </div>
                  <input type="file" ref="logoInput" class="hidden tw:file-input" accept="image/*" @change="handleLogoUpload">
                </div>
              </div>
              <div class="section-title full-width tw:mb-2 tw:mt-6">Address & Contact Details</div>
              <div class="form-group full-width">
                <label>Address Line 1 <span class="required">*</span></label>
                <input v-model="formData.address_line_1" type="text" class="form-input tw:input">
              </div>
              <div class="form-group full-width">
                <label>Address Line 2</label>
                <input v-model="formData.address_line_2" type="text" class="form-input tw:input">
              </div>
              <div class="form-group">
                <label>City <span class="required">*</span></label>
                <input v-model="formData.city" type="text" class="form-input tw:input">
              </div>
              <div class="form-group">
                <label>State <span class="required">*</span></label>
                <input v-model="formData.state" type="text" class="form-input tw:input">
              </div>
              <div class="form-group">
                <label>Zipcode <span class="required">*</span></label>
                <input v-model="formData.zipcode" type="text" class="form-input tw:input">
              </div>
              <div class="form-group">
                <label>Country Code (ISO) <span class="required">*</span></label>
                <input v-model="formData.country_code" type="text" class="form-input tw:input" placeholder="e.g. IN">
              </div>
              <div class="form-group">
                <label>Contact Email <span class="required">*</span></label>
                <input v-model="formData.contact_email" type="email" class="form-input tw:input">
              </div>
              <div class="form-group">
                <label>Phone Number <span class="required">*</span></label>
                <input v-model="formData.phone_number" type="text" class="form-input tw:input">
              </div>

              <div class="full-width d-flex tw:justify-end tw:mt-4">
                <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="saveSettings" :disabled="saving">
                  <Save v-if="!saving" class="icon" />
                  <Loader2 v-else class="icon animate-spin" />
                  {{ saving ? 'Saving...' : 'Save Company Details' }}
                </button>
              </div>
            </div>
            <!-- Bank Accounts Tab -->
            <div v-show="activeTab === 'bank'" id="company-panel-bank" role="tabpanel" aria-labelledby="company-tab-bank" tabindex="0">
              <div class="d-flex tw:justify-between align-center tw:mb-4">
                <h3 class="tw:text-lg tw:font-semibold">Bank Accounts</h3>
                <button class="btn-secondary btn-sm tw:btn tw:btn-sm tw:btn-outline" @click="openBankModal()">
                  <Plus class="icon-sm" /> Add Account
                </button>
              </div>

              <div class="bank-list">
                <div v-for="bank in bankAccounts" :key="bank.id" class="bank-card">
                  <div class="bank-info">
                    <div class="bank-header">
                      <span class="bank-name">{{ bank.bank_name }}</span>
                      <span v-if="bank.is_primary" class="primary-badge">Primary</span>
                    </div>
                    <div class="account-line"><strong>Acc Name:</strong> {{ bank.account_name }}</div>
                    <div class="account-line"><strong>Acc No:</strong> {{ bank.account_number }}</div>
                    <div class="account-line" v-if="bank.swift_iban"><strong>SWIFT/IBAN:</strong> {{ bank.swift_iban }}</div>
                  </div>
                  <div class="bank-actions">
                    <button class="btn-icon tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="openBankModal(bank)"><Edit2 class="icon-sm" /></button>
                    <button class="btn-icon delete tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="deleteBank(bank.id)"><Trash2 class="icon-sm" /></button>
                  </div>
                </div>
                <div v-if="bankAccounts.length === 0" class="no-data">No bank accounts added yet.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Bank Account Modal -->
    <Modal v-model="showBankModal" :title="editingBank ? 'Edit Bank Account' : 'Add Bank Account'" width="500px">
      <div class="form-grid tw:pt-4">
        <div class="form-group full-width">
          <label>Bank Name <span class="required">*</span></label>
          <input v-model="bankForm.bank_name" type="text" class="form-input tw:input" placeholder="e.g. HDFC Bank">
        </div>
        <div class="form-group full-width">
          <label>Account Name <span class="required">*</span></label>
          <input v-model="bankForm.account_name" type="text" class="form-input tw:input" placeholder="Full name on account">
        </div>
        <div class="form-group full-width">
          <label>Account Number <span class="required">*</span></label>
          <input v-model="bankForm.account_number" type="text" class="form-input tw:input">
        </div>
        <div class="form-group full-width">
          <label>SWIFT / IBAN Number</label>
          <input v-model="bankForm.swift_iban" type="text" class="form-input tw:input">
        </div>
        <div class="form-group full-width">
           <div class="switch-container d-flex align-center tw:flex-row tw:gap-2">
            <label class="switch">
              <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="bankForm.is_primary">
              <span class="slider round"></span>
            </label>
            <span class="switch-label">Set as Primary Account</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex tw:justify-end tw:gap-2 pa-4 border-t">
          <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="showBankModal = false">Cancel</button>
          <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="saveBank" :disabled="bankSaving">
            {{ bankSaving ? 'Saving...' : 'Save Account' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted } from 'vue'
import Modal from '~/components/admin/ui/Modal.vue'
import { $adminApi } from '~/composables/useAdminApi'
import { useAdminToast } from '~/composables/useAdminToast'
import {
  Save,
  Upload,
  X,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Building,
  Landmark
} from 'lucide-vue-next'
const config = useRuntimeConfig()
const toast = useAdminToast()
const activeTab = ref('details')
const settingsTabs = [{ id: 'details', label: 'Company Details', icon: Building }, { id: 'bank', label: 'Bank Accounts', icon: Landmark }]
const onTabKeydown = (event, index) => {
  let next
  if (event.key === 'ArrowRight') next = (index + 1) % settingsTabs.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + settingsTabs.length) % settingsTabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = settingsTabs.length - 1
  else return
  event.preventDefault()
  activeTab.value = settingsTabs[next].id
  event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus()
}
const loading = ref(false)
const saving = ref(false)
const bankAccounts = ref([])
const logoPreview = ref(null)
const logoFile = ref(null)
const formData = ref({
  name: '',
  intro: '',
  description: '',
  logo_path: null,
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zipcode: '',
  country_code: 'IN',
  contact_email: '',
  phone_number: '',
})
// Bank Account Logic
const showBankModal = ref(false)
const bankSaving = ref(false)
const editingBank = ref(null)
const bankForm = ref({
  bank_name: '',
  account_name: '',
  account_number: '',
  swift_iban: '',
  is_primary: false,
})
const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await $adminApi('/company-settings')
    if (res.data) {
      formData.value = { ...res.data }
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err)
  } finally {
    loading.value = false
  }
}
const fetchBanks = async () => {
  try {
    const res = await $adminApi('/bank-accounts')
    bankAccounts.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch banks:', err)
  }
}
const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }
}
const clearLogo = () => {
  logoFile.value = null
  logoPreview.value = null
  formData.value.logo_path = null
}
const saveSettings = async () => {
  saving.value = true
  try {
    const fd = new FormData()
    Object.keys(formData.value).forEach(key => {
      if (formData.value[key] !== null) {
        fd.append(key, formData.value[key])
      }
    })
    if (logoFile.value) {
      fd.append('logo', logoFile.value)
    }
    await $adminApi('/company-settings', {
      method: 'POST',
      body: fd
    })
    toast.success('Company settings updated successfully!')
    logoFile.value = null
    logoPreview.value = null
    fetchSettings()
  } catch (err) {
    console.error('Failed to save settings:', err)
    toast.error('Error saving settings. Please check fields.')
  } finally {
    saving.value = false
  }
}
const openBankModal = (bank = null) => {
  if (bank) {
    editingBank.value = bank
    bankForm.value = { ...bank }
  } else {
    editingBank.value = null
    bankForm.value = { bank_name: '', account_name: '', account_number: '', swift_iban: '', is_primary: false }
  }
  showBankModal.value = true
}
const saveBank = async () => {
  bankSaving.value = true
  try {
    const endpoint = editingBank.value
      ? `/bank-accounts/${editingBank.value.id}`
      : '/bank-accounts'

    await $adminApi(endpoint, {
      method: editingBank.value ? 'PUT' : 'POST',
      body: bankForm.value
    })

    toast.success(editingBank.value ? 'Bank account updated' : 'Bank account added')
    showBankModal.value = false
    fetchBanks()
  } catch (err) {
    console.error('Failed to save bank:', err)
    toast.error('Failed to save bank account')
  } finally {
    bankSaving.value = false
  }
}
const deleteBank = async (id) => {
  if (!confirm('Are you sure you want to delete this account?')) return
  try {
    await $adminApi(`/bank-accounts/${id}`, {
      method: 'DELETE'
    })
    toast.success('Bank account deleted')
    fetchBanks()
  } catch (err) {
    console.error('Failed to delete bank:', err)
    toast.error('Failed to delete bank account')
  }
}
const getImageUrl = (path) => {
  if (!path) return null
  // Replace the entire API path to get the base URL
  const baseUrl = config.public.apiBase.replace(/\/api\/v1\/?$/, '')
  return `${baseUrl}/storage/${path}`
}
onMounted(() => {
  fetchSettings()
  fetchBanks()
})
</script>
<style scoped>
.page-container {
  width: 100%;
}

.page-header {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-base-content);
  margin: 0;
}

.d-flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.align-center {
  align-items: center;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.ms-auto {
  margin-left: auto;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-card {
  background: var(--color-base-100);
  border-radius: 0.75rem;
  border: 1px solid rgb(71 37 128 / 10%);
  overflow: hidden;
}

.company-tabs { display: flex; align-items: center; flex-wrap: nowrap; gap: 8px; padding: 16px 24px; border-bottom: 1px solid var(--color-base-300); background: var(--color-base-100); }
.company-tabs .company-tab { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; min-height: 42px; height: auto; padding: 11px 16px; border: 1px solid transparent; border-radius: 8px; background: var(--color-base-200); color: var(--color-base-content); font-size: 12px; font-weight: 600; line-height: 1.4; text-align: center; cursor: pointer; transition: background .15s ease, color .15s ease; }
.company-tab svg { flex-shrink: 0; }
.company-tabs .company-tab:hover { background: color-mix(in srgb, var(--color-primary) 12%, var(--color-base-100)); color: var(--color-primary); }
.company-tabs .company-tab[aria-selected="true"] { background: var(--color-primary); color: var(--color-primary-content); border-color: var(--color-primary); box-shadow: 0 3px 8px rgb(71 37 128 / 12%); }
.company-tabs .company-tab:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
@media(max-width:600px) { .company-tabs { padding: 14px 16px; gap: 6px; }.company-tabs .company-tab { flex: 1; padding: 10px; font-size: 11px; gap: 6px; } }
@media(prefers-reduced-motion:reduce) { .company-tabs .company-tab { transition: none; } }

.tab-content {
  padding: 1.5rem;
}

.section-title {
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
.form-grid .full-width {
  grid-column: span 2;
}

.form-group {
  margin-bottom: 0.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #80718d;
  font-size: 0.875rem;
}
.form-group label .required {
  color: #ef4444;
}
.form-group .form-input {
  width: 100%;
  transition: border-color 0.2s;
}
.form-group .form-input:focus {
}
.form-group textarea.form-input {
  resize: vertical;
}

.logo-upload {
  display: flex;
  gap: 1rem;
}
.logo-upload .upload-placeholder {
  width: 150px;
  height: 100px;
  border: 2px dashed rgb(71 37 128 / 10%);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #80718d;
  cursor: pointer;
}
.logo-upload .upload-placeholder:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.logo-upload .upload-placeholder .icon {
  margin-bottom: 0.5rem;
}
.logo-upload .image-preview {
  position: relative;
  width: 150px;
  height: 100px;
  background: var(--color-base-200);
  border-radius: 0.5rem;
  overflow: hidden;
}
.logo-upload .image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.logo-upload .image-preview .remove-img {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: var(--color-base-content);
  padding: 0.2rem;
  border-radius: 0.25rem;
  cursor: pointer;
}
.logo-upload .image-preview .remove-img:hover {
  background: #ef4444;
}

.bank-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bank-card {
  background: var(--color-base-200);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.2s;
}
.bank-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.3);
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.bank-header .bank-name {
  font-weight: 700;
  color: var(--color-base-content);
  font-size: 1.1rem;
}

.primary-badge {
  font-size: 0.65rem;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.account-line {
  font-size: 0.875rem;
  color: #80718d;
  margin-bottom: 0.25rem;
}
.account-line strong {
  color: #756780;
}

.bank-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
}
.btn-icon:hover {
}
.btn-icon.delete:hover {
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.primary-badge {
  background: #22c55e;
  color: var(--color-base-content);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
}

.hidden {
  display: none;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-primary:disabled {
}

.btn-secondary {
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
.switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-base-200);
  border: 1px solid rgb(71 37 128 / 10%);
  transition: 0.4s;
}
.switch .slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 3px;
  background: white;
  transition: 0.4s;
}
.switch .slider.round {
  border-radius: 24px;
}
.switch .slider.round:before {
  border-radius: 50%;
}

.switch-label {
  color: #80718d;
  font-size: 0.875rem;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
