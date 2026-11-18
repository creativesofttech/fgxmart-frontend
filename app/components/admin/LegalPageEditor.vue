<template>
  <div class="page-container legal-editor-page">
    <div class="page-header legal-editor-heading"><div><h1 class="title">{{ label }}</h1><p>Manage the title and content shown on your storefront.</p></div><NuxtLink :to="`/${slug}`" target="_blank" rel="noopener" class="tw:btn tw:btn-outline"><ExternalLink :size="16" aria-hidden="true" /> Preview page</NuxtLink></div>
    <div v-if="pending" class="tw:card legal-editor-card" role="status">Loading page content...</div>
    <div v-else-if="error" class="tw:alert tw:alert-error" role="alert"><span>We couldn’t load this page.</span><button type="button" class="tw:btn tw:btn-sm" @click="refresh">Try again</button></div>
    <form v-else class="tw:card legal-editor-card" @submit.prevent="save">
      <div class="legal-editor-note"><Info :size="18" aria-hidden="true" /><p>Keep this wording aligned with your company details and business practices. Saved changes appear on the storefront.</p></div>
      <label for="legal-page-title" class="legal-label">Page title <span aria-hidden="true">*</span></label>
      <input id="legal-page-title" v-model="form.title" class="tw:input tw:input-bordered" type="text" maxlength="255" required :readonly="!canEdit" :disabled="saving" />
      <div class="legal-content-label"><span id="legal-content-label" class="legal-label">Content <span aria-hidden="true">*</span></span><small>Use headings, paragraphs and lists to keep the page easy to read.</small></div>
      <fieldset v-if="canEdit" :disabled="saving" class="legal-editor-fieldset" aria-labelledby="legal-content-label"><RichTextEditor v-model="form.content" label="Page content" /></fieldset>
      <ProductRichDescription v-else :html="form.content" />
      <p v-if="message" :class="['legal-editor-message', { 'is-error': failed }]" :role="failed ? 'alert' : 'status'">{{ message }}</p>
      <div class="legal-editor-footer"><span>{{ canEdit ? 'Changes are published when you save.' : 'Your role has view-only access to this content.' }}</span><button v-if="canEdit" class="tw:btn tw:btn-primary" type="submit" :disabled="saving || !form.title.trim() || !hasContent"><span v-if="saving" class="tw:loading tw:loading-spinner tw:loading-xs" aria-hidden="true" /><Save v-else :size="17" aria-hidden="true" />{{ saving ? 'Saving...' : 'Save changes' }}</button></div>
    </form>
  </div>
</template>
<script setup>
import { ExternalLink, Info, Save } from 'lucide-vue-next'
import RichTextEditor from '~/components/admin/ui/RichTextEditor.vue'
import { $adminApi, useAdminApi } from '~/composables/useAdminApi'
import { sanitizeProductDescription } from '~/utils/productRichText'
const props = defineProps({ slug: { type: String, required: true }, label: { type: String, required: true } })
const { can } = useAdminAuth()
const canEdit = computed(() => can('legal-pages.edit'))
const form = reactive({ title: '', content: '' })
const saving = ref(false), message = ref(''), failed = ref(false)
const { data, pending, error, refresh } = await useAdminApi('/legal-pages/' + props.slug)
watch(data, response => { if (response?.data) Object.assign(form, { title: response.data.title, content: response.data.content }) }, { immediate: true })
const hasContent = computed(() => Boolean(sanitizeProductDescription(form.content).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()))
const save = async () => {
  if (saving.value || !canEdit.value) return
  saving.value = true; message.value = ''; failed.value = false
  try {
    const response = await $adminApi('/legal-pages/' + props.slug, { method: 'PUT', body: { title: form.title.trim(), content: form.content } })
    data.value = response
    message.value = response.message || 'Page saved successfully.'
  } catch (error) {
    failed.value = true
    message.value = Object.values(error.data?.data?.errors || error.data?.errors || {}).flat()[0] || 'Unable to save this page. Please try again.'
  } finally { saving.value = false }
}
</script>
<style scoped>
.legal-editor-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; margin-bottom: 25px; }.legal-editor-heading p { color: #8c799a; font-size: 13px; margin-top: 8px; }.legal-editor-heading .tw\:btn { display: inline-flex; align-items: center; gap: 8px; }
.legal-editor-card { padding: 28px; border: 1px solid #e8e0ef; background: var(--color-base-100); border-radius: 14px; }
.legal-editor-note { display: flex; align-items: flex-start; gap: 10px; background: #f7f3fc; border: 1px solid #eee6f6; padding: 14px 16px; border-radius: 9px; margin-bottom: 24px; color: #8b6b9f; }.legal-editor-note svg { flex-shrink: 0; margin-top: 1px; }.legal-editor-note p { font-size: 12px; line-height: 1.8; margin: 0; }
.legal-label { display: block; font-size: 13px; font-weight: 600; color: #715a80; margin-bottom: 10px; }.legal-label > span { color: #b67b91; }
.legal-editor-card > input { width: 100%; margin-bottom: 25px; min-height: 44px; padding: 10px 14px; border: 1px solid #e2d6ec; border-radius: 9px; background: white; color: #563c68; font-size: 14px; }
.legal-content-label { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }.legal-content-label small { font-size: 11px; color: #a18aae; }.legal-editor-fieldset { border: 0; padding: 0; min-width: 0; }.legal-editor-fieldset:disabled { opacity: .65; pointer-events: none; }
.legal-editor-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; border-top: 1px solid #ede5f4; margin-top: 24px; padding-top: 22px; }.legal-editor-footer > span { color: #a18aae; font-size: 11px; }.legal-editor-footer button { display: flex; align-items: center; gap: 8px; }
.legal-editor-message { margin: 18px 0 0; padding: 12px; border-radius: 8px; background: #edf6e8; color: #67804e; font-size: 12px; }.legal-editor-message.is-error { background: #fff0f3; color: #a36d83; }
@media(max-width:600px) { .legal-editor-card { padding: 18px; }.legal-editor-heading p { font-size: 12px; }.legal-editor-footer { align-items: stretch; }.legal-editor-footer button { width: 100%; } }
</style>
