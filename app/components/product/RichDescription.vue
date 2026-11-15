<template><div class="product-rich-description" v-html="safeHTML" /></template>
<script setup>
import { sanitizeProductDescription } from '~/utils/productRichText'
const props = defineProps({ html: { type: String, default: '' }, fallback: { type: String, default: 'No description available.' } })
const safeHTML = computed(() => sanitizeProductDescription(props.html || props.fallback))
</script>
<style scoped>
.product-rich-description { line-height: 1.65; overflow-wrap: anywhere; }
.product-rich-description :deep(p) { margin: 0 0 12px; font-size: 16px; }
.product-rich-description :deep(h2) { margin: 18px 0 12px; font-size: 22px; line-height: 1.35; font-weight: 700; }
.product-rich-description :deep(h3) { margin: 16px 0 10px; font-size: 20px; line-height: 1.4; font-weight: 650; }
.product-rich-description :deep(ul), .product-rich-description :deep(ol) { margin: 12px 0; padding-left: 25px; }
.product-rich-description :deep(ul) { list-style-type: disc; }
.product-rich-description :deep(ol) { list-style-type: decimal; }
.product-rich-description :deep(li p) { margin-bottom: 5px; }
.product-rich-description :deep(> :first-child) { margin-top: 0; }
.product-rich-description :deep(> :last-child) { margin-bottom: 0; }
</style>
