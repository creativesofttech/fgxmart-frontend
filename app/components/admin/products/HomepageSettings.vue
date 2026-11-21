<template>
  <div class="tw:card content-card homepage-settings">
    <div class="card-header"><h2 class="card-title">Homepage Collections</h2></div>
    <div class="card-body collection-settings">
      <p>Choose where this product appears on the homepage.</p>
      <label v-for="setting in settings" :key="setting.key" class="collection-setting"><span>{{ setting.label }}</span><input type="checkbox" role="switch" class="tw:toggle tw:toggle-primary" :checked="modelValue[setting.key]" :aria-label="setting.label" @change="$emit('update:modelValue', { ...modelValue, [setting.key]: $event.target.checked })" /></label>
      <small>Only active products appear in storefront collections.</small>
    </div>
  </div>
</template>
<script setup>
defineProps({ modelValue: { type: Object, required: true } })
defineEmits(['update:modelValue'])
const settings = [{ key: 'is_featured', label: 'Featured' }, { key: 'is_hot_deal', label: 'Hot Deal' }, { key: 'is_new_arrival', label: 'New Arrival' }, { key: 'is_best_seller', label: 'Best Seller' }]
</script>
<style scoped>
.homepage-settings { margin-top: 24px; }
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-base-300); }
.card-title { margin: 0; font-size: 17px; font-weight: 650; }
.card-body { padding: 24px; }
.collection-settings { display: flex; flex-direction: column; gap: 20px; }
.collection-settings p { margin: 0; color: #8b7b9a; font-size: 12px; line-height: 1.6; }
.collection-setting { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #68547e; font-size: 13px; cursor: pointer; }
.collection-setting input { appearance: none; flex-shrink: 0; display: inline-grid; width: 42px; height: 24px; padding: 3px; border: 1px solid #d6c9e5; border-radius: 999px; background: #e5deed; cursor: pointer; transition: background .15s; }
.collection-setting input::before { content: ''; grid-area: 1 / 1; justify-self: start; width: 16px; height: 16px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px #39204e25; transform: translateX(0); translate: 0; transition: transform .15s; }
.collection-setting input:checked { background: var(--color-primary); border-color: var(--color-primary); }
.collection-setting input:checked::before { transform: translateX(18px); translate: 0; }
.collection-setting input:focus-visible { outline: 2px solid #8b5bc0; outline-offset: 3px; }
@media(prefers-reduced-motion:reduce) { .collection-setting input, .collection-setting input::before { transition: none; } }
.collection-settings small { color: #9c8ca9; font-size: 11px; line-height: 1.6; }
</style>
