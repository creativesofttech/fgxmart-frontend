<template>
  <div class="tw:toast tw:toast-top tw:toast-end toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="tw:alert toast"
        :class="{ 'tw:alert-success': toast.type === 'success', 'tw:alert-error': toast.type === 'error', 'tw:alert-info': toast.type === 'info' }"
      >
        <div class="toast-icon">
          <CheckCircle v-if="toast.type === 'success'" />
          <AlertCircle v-else-if="toast.type === 'error'" />
          <Info v-else />
        </div>
        <div class="toast-content">
          {{ toast.message }}
        </div>
        <button class="toast-close tw:btn tw:btn-sm tw:btn-ghost" @click="removeToast(toast.id)">
          <X />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
<script setup>
import { useAdminToast } from '~/composables/useAdminToast'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next'
const { toasts, removeToast } = useAdminToast()
</script>
<style scoped>
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 450px;
  background-color: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}
.toast.success {
  border-left: 4px solid #22c55e;
}
.toast.success .toast-icon {
  color: #22c55e;
}
.toast.error {
  border-left: 4px solid #ef4444;
}
.toast.error .toast-icon {
  color: #ef4444;
}
.toast.info {
  border-left: 4px solid var(--color-primary);
}
.toast.info .toast-icon {
  color: var(--color-primary);
}
.toast .toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
}
.toast .toast-content {
  flex: 1;
  color: var(--color-base-content);
  font-size: 0.875rem;
  font-weight: 500;
}
.toast .toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  transition: all 0.2s;
}
.toast .toast-close:hover {
  background-color: rgb(71 37 128 / 10%);
  color: var(--color-base-content);
}
.toast .toast-close svg {
  width: 16px;
  height: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
