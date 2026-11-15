<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    width="400px"
  >
    <div class="confirm-modal-content">
      <div class="warning-icon">
        <AlertTriangle class="icon" />
      </div>
      <p class="message">{{ message }}</p>
    </div>

    <template #footer>
      <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="$emit('update:modelValue', false)" :disabled="loading">
        Cancel
      </button>
      <button class="btn-danger tw:btn tw:btn-sm tw:btn-error tw:btn-outline" @click="$emit('confirm')" :disabled="loading">
        {{ loading ? 'Deleting...' : confirmText }}
      </button>
    </template>
  </Modal>
</template>
<script setup>
import Modal from './Modal.vue'
import { AlertTriangle } from 'lucide-vue-next'
defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to perform this action?'
  },
  confirmText: {
    type: String,
    default: 'Delete'
  },
  loading: Boolean
})
defineEmits(['update:modelValue', 'confirm'])
</script>
<style scoped>
.confirm-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
}

.warning-icon {
  width: 48px;
  height: 48px;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 9999px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}
.warning-icon .icon {
  width: 24px;
  height: 24px;
}

.message {
  color: var(--color-base-content);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.btn-secondary {
  transition: all 0.2s;
}
.btn-secondary:hover:not(:disabled) {
}

.btn-danger {
  transition: background-color 0.2s;
}
.btn-danger:hover:not(:disabled) {
}
.btn-danger:disabled {
}
</style>
