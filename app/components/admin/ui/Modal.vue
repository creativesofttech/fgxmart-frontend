<template>
  <dialog ref="dialog" class="tw:modal" aria-modal="true" :aria-label="title" @cancel="onCancel" @click="onBackdrop">
    <div class="tw:modal-box admin-modal-box" :style="{ maxWidth: width }">
      <div class="modal-header"><h3>{{ title }}</h3><button type="button" class="tw:btn tw:btn-ghost tw:btn-sm tw:btn-circle" aria-label="Close dialog" :disabled="closeDisabled" @click="close"><X :size="19" /></button></div>
      <div class="modal-content"><slot /></div>
      <div v-if="$slots.footer" class="tw:modal-action"><slot name="footer" /></div>
    </div>
  </dialog>
</template>
<script setup>
import { X } from 'lucide-vue-next'
const props = defineProps({ modelValue: Boolean, title: { type: String, default: '' }, width: { type: String, default: '500px' }, closeDisabled: Boolean })
const emit = defineEmits(['update:modelValue'])
const dialog = ref(null)
let previousFocus
const close = () => { if (!props.closeDisabled) emit('update:modelValue', false) }
const onCancel = event => { event.preventDefault(); close() }
const onBackdrop = event => { if (event.target === dialog.value) close() }
watchEffect(() => {
  if (!dialog.value) return
  if (props.modelValue && !dialog.value.open) { previousFocus = document.activeElement; dialog.value.showModal() }
  else if (!props.modelValue && dialog.value.open) { dialog.value.close(); previousFocus?.focus?.() }
})
</script>
<style scoped>

.admin-modal-box { padding: 24px; width: min(92vw, 100%); max-height: 88vh; color: var(--color-base-content); background: var(--color-base-100); }
.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 20px; }
.modal-header h3 { font-size: 20px; font-weight: 700; margin: 0; }
.modal-content { overflow-y: auto; }

</style>
